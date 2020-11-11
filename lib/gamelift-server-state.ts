/**
 * @fileoverview Defines the singleton objects used for tracking &
 * communicating state changes between the process & GameLift AWS
 * service.
 */

import _debug from "debug";
import SocketIOClient from "socket.io-client";
import type {
  DescribePlayerSessionsRequest,
  GameSession,
  UpdateGameSession,
  DescribePlayerSessionsResponse,
  GetInstanceCertificateResponse,
  BackfillMatchmakingRequest,
  BackfillMatchmakingResponse,
  StopMatchmakingRequest,
} from "@kontest/gamelift-pb";

import {
  AlreadyInitializedError,
  GameLiftServerNotInitializedError,
  NoGameSessionError,
  NotInitializedError,
  ProcessNotReadyError,
} from "./exceptions";
import { Network, Ack } from "./network";
import type { LogParameters } from "./types";

/** @hidden */
const debug = _debug("gamelift:gamelift-server-state");

/**
 * Callback necessary for the "OnStartGameSession" event.
 *
 * @internal
 */
type OnStartGameSessionCallback = (gameSession: GameSession) => void;

/**
 * Callback for the "OnProcessTerminate" event.
 *
 * @internal
 */
type OnProcessTerminateCallback = () => void;

/**
 * Callback used for the "OnHealthCheck" event.
 *
 * @internal
 */
type OnHealthCheckCallback = () => Promise<boolean>;

/**
 * Callback used for the "OnUpdateGameSession" event.
 *
 * @internal
 */
type OnUpdateGameSessionCallback = (
  updateGameSession: UpdateGameSession
) => void;

/**
 * This data type contains the set of parameters sent to the GameLift service
 * in a {@link processReady | `processReady()`} call.
 */
export interface ProcessParameters {
  /**
   * Port number the server listens on for new player connections.
   *
   * The value must fall into the port range configured for any fleet deploying
   * this game server build. This port number is included in game session and
   * player session objects, which game sessions use when connecting to a
   * server process.
   */
  port: number;

  /**
   * Object with a list of directory paths to game session log files.
   */
  logParameters?: LogParameters;

  /**
   * Callback function that the GameLift service calls to activate a new game
   * session.
   *
   * GameLift calls this function in response to the client request
   * [CreateGameSession]. The callback function passes a {@link GameSession}
   * object.
   *
   * [CreateGameSession]: https://docs.aws.amazon.com/gamelift/latest/apireference/API_CreateGameSession.html
   */
  onStartGameSession: OnStartGameSessionCallback;

  /**
   * Callback function that the GameLift service calls to force the server
   * process to shut down.
   *
   * After calling this function, GameLift waits five minutes for the server
   * process to shut down and respond with a {@link processEnding} call. If no
   * response is received it shuts down the server process.
   */
  onProcessTerminate?: OnProcessTerminateCallback;

  /**
   * Callback function that the GameLift service calls to request a health
   * status report from the server process.
   *
   * GameLift calls this function every 60 seconds. After calling this function
   * GameLift waits 60 seconds for a response, and if none is received. records
   * the server process as unhealthy.
   */
  onHealthCheck?: OnHealthCheckCallback;

  /**
   * Name of callback function that the GameLift service calls to provide an
   * updated game session object.
   *
   * GameLift calls this function once a [match backfill] request has been
   * processed. It passes a {@link GameSession} object, a status update
   * (`updateReason`), and the match backfill ticket ID.
   *
   * [match backfill]: https://docs.aws.amazon.com/gamelift/latest/developerguide/match-backfill.html
   */
  onUpdateGameSession?: OnUpdateGameSessionCallback;
}

/**
 * Common state methods for GameLift Server SDK state.
 *
 * @internal
 */
export class GameLiftCommonState {
  /**
   * Retrieve the singleton server state instance.
   *
   * @internal
   * @returns Static GameLiftCommonState instance.
   */
  public static getInstance(): GameLiftCommonState {
    if (!GameLiftCommonState.instance) {
      throw new NotInitializedError();
    }
    return GameLiftCommonState.instance;
  }

  /**
   * Set the singleton server state instance.
   *
   * @internal
   * @param instance - GameLift server state instance.
   */
  public static setInstance(instance: GameLiftCommonState): void {
    if (GameLiftCommonState.instance) {
      throw new AlreadyInitializedError();
    }
    GameLiftCommonState.instance = instance;
  }

  /**
   * Singleton server state instance.
   *
   * @internal
   */
  private static instance: GameLiftCommonState;
}

/**
 * GameLift Server SDK state.
 *
 * @internal
 */
export class GameLiftServerState extends GameLiftCommonState {
  /**
   * Constant string representing the location of the proxy which forwards requests to
   * the GameLift API service.
   *
   * @internal
   */
  public static LOCALHOST = "http://127.0.0.1:5757";

  /**
   * Constant that determines the version of the GameLift SDK version we're using to
   * communicate with the GameLift service.
   *
   * @internal
   */
  public static SDK_VERSION = "3.4.0";

  /**
   * Constant denoting the amount of time to wait in-between health checks.
   *
   * @internal
   */
  public static HEALTHCHECK_TIMEOUT: number = 60 * 1000;

  /**
   * Identifier of the game session this process is currently running.
   *
   * @internal
   */
  private gameSessionId: string;

  /**
   * Accessor for the {@link gameSessionId}.
   *
   * @internal
   * @returns Value of the `gameSessionId` if it's set.
   */
  public getGameSessionId(): string {
    if (!this.gameSessionId) {
      throw new NoGameSessionError();
    }

    return this.gameSessionId;
  }

  /**
   * Timestamp as a UNIX epock denoting the termination time
   *
   * @internal
   */
  private terminationTime: number;

  /**
   * Accessor for the {@link terminationTime}.
   *
   * @internal
   * @returns UNIX epoch representing the termination time for the process to
   * be shut down.
   */
  public getTerminationTime(): number {
    return this.terminationTime;
  }

  /**
   * Send a message to the GameLift service asking for the TLS certicates/keys.
   *
   * @returns Object with the properties for setting up a TLS secured server.
   */
  public async getInstanceCertificate(): Promise<
    GetInstanceCertificateResponse
  > {
    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    return this.networking.getInstanceCertificate();
  }

  /**
   * Create the Server state instance and set it as the singleton for the application.
   *
   * @internal
   * @returns New GameLiftServerState instance.
   */
  public static createInstance(): GameLiftServerState {
    debug("creating GameLiftServerState instance");
    let instance;
    try {
      instance = GameLiftServerState.getInstance();
    } catch (error) {
      // If we got some other error then re-throw
      if (!(error instanceof NotInitializedError)) {
        throw error;
      }
    }
    if (instance) {
      throw new AlreadyInitializedError();
    }

    const newState = new GameLiftServerState();
    this.setInstance(newState);

    return newState;
  }

  /**
   * Notifies the GameLift service that the process is ready to receive game sessions
   * after setting up the necessary callbacks.
   *
   * @internal
   * @param processParameters - Parameters that define code flow once the GameLift
   * server begins interacting with the process.
   */
  public async processReady(
    processParameters: ProcessParameters
  ): Promise<void> {
    debug("readying the server state");
    this.processReadyFlag = true;

    this.onStartGameSession = processParameters.onStartGameSession;
    this.onUpdateGameSession = processParameters.onUpdateGameSession;
    this.onProcessTerminate = processParameters.onProcessTerminate;

    this.onHealthCheck =
      processParameters.onHealthCheck || this.defaultHealthCheck;

    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    await this.networking.processReady(
      processParameters.port,
      processParameters.logParameters
    );

    this.healthCheck();
  }

  /**
   * Begin the process shutdown sequence before notifying the GameLift service.
   *
   * @internal
   */
  public async processEnding(): Promise<void> {
    debug("reverting process ready");
    this.processReadyFlag = false;

    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    await this.networking.processEnding();
  }

  /**
   * Sets up a recurring loop to healthcheck the GameLift process.
   *
   * @internal
   */
  public healthCheck(): void {
    this._healthcheckTimeout = setInterval(async () => {
      if (this.processReadyFlag) {
        await this.reportHealth();
      } else {
        clearInterval(this._healthcheckTimeout);
      }
    }, GameLiftServerState.HEALTHCHECK_TIMEOUT);
  }

  /**
   * Determine the health of the process with the callback before reporting
   * it back to the GameLift service.
   *
   * @internal
   */
  public reportHealth(): Promise<void> {
    let timer: NodeJS.Timeout = null;

    // Create a timer promise that will timeout and send an unhealthy status if it
    // beats the actual health check.
    const timerPromise = new Promise<boolean>(
      (resolve: (healthy: boolean) => void): void => {
        timer = setTimeout(
          () => resolve(false),
          GameLiftServerState.HEALTHCHECK_TIMEOUT
        );
      }
    );

    debug("running health check");
    return Promise.race<Promise<boolean>>([this.onHealthCheck(), timerPromise])
      .then((healthy: boolean) => this.networking.reportHealth(healthy))
      .catch((error?: Error): void => {
        debug(`error occurred during healthcheck: ${error}`);
      })
      .then(() => clearTimeout(timer));
  }

  /**
   * Activate the current game session. This signals to the GameLift service
   * that the process is ready to handle incoming connections.
   *
   * @internal
   */
  public async activateGameSession(): Promise<void> {
    debug("activating current game session: '%s'", this.gameSessionId);

    if (!this.processReadyFlag) {
      throw new ProcessNotReadyError();
    }

    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    if (!this.gameSessionId) {
      throw new NoGameSessionError();
    }

    await this.networking.activateGameSession(this.gameSessionId);
  }

  /**
   * Terminate the currently running game session.
   *
   * This allows the process to be allocated another game session.
   */
  public async terminateGameSession(): Promise<void> {
    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    if (!this.gameSessionId) {
      throw new NoGameSessionError();
    }

    await this.networking.terminateGameSession(this.gameSessionId);
  }

  /**
   * Accept the player session by the given identifier.
   *
   * @internal
   */
  public async acceptPlayerSession(playerSessionId: string): Promise<void> {
    debug("accepting player session '%s'", playerSessionId);

    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    if (!this.gameSessionId) {
      throw new NoGameSessionError();
    }

    await this.networking.acceptPlayerSession(
      playerSessionId,
      this.gameSessionId
    );
  }

  /**
   * Remove the player session from the game session so that it can be
   * utilized by another player.
   *
   * @param playerSessionId - Denotes the player session to remove
   * @internal
   */
  public async removePlayerSession(playerSessionId: string): Promise<void> {
    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    if (!this.gameSessionId) {
      throw new NoGameSessionError();
    }

    await this.networking.removePlayerSession(
      playerSessionId,
      this.gameSessionId
    );
  }

  /**
   * Retrieve a list of player sessions from GameLift service according to the given request
   *
   * @internal
   * @param request - Details the parameter for the search of player sessions.
   *
   * @returns Result of the API call from GameLift service.
   */
  public async describePlayerSessions(
    request: DescribePlayerSessionsRequest
  ): Promise<DescribePlayerSessionsResponse> {
    debug("initiating DescribePlayerSessionsRequest");

    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    return await this.networking.describePlayerSessions(request);
  }

  /**
   * Update the player session creation policy for the game session.
   *
   * Effectively communicates to the GameLift service to stop giving it more
   * players.
   *
   * @internal
   * @param newPlayerSessionCreationPolicy - New policy which allows or denies
   * new player sessions.
   */
  public async updatePlayerSessionCreationPolicy(
    newPlayerSessionCreationPolicy: "ACCEPT_ALL" | "DENY_ALL"
  ): Promise<void> {
    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    if (!this.gameSessionId) {
      throw new NoGameSessionError();
    }

    await this.networking.updatePlayerSessionCreationPolicy(
      this.gameSessionId,
      newPlayerSessionCreationPolicy
    );
  }

  /**
   * Instruct the GameLift service to begin backfilling this game session with more
   * players with FlexMatch.
   *
   * @internal
   * @param request - Backfill matchmaking request to send to the GameLift service.
   * @returns [`BackfillMatchmakingResponse`] with the ticket ID for the FlexMatch
   * backfill matchmaking request.
   *
   * [`BackfillMatchmakingResponse`]: https://docs.kontest.io/gamelift-pb/latest/classes/backfillmatchmakingresponse.html
   */
  public async backfillMatchmaking(
    request: BackfillMatchmakingRequest
  ): Promise<BackfillMatchmakingResponse> {
    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    return await this.networking.backfillMatchmaking(request);
  }

  /**
   * Send message to the GameLift service to stop the matchmaking request in the given
   * request.
   *
   * @internal
   * @param request - [`StopMatchmakingRequest`] message used to identify the backfill
   * matchmaking request to stop.
   *
   * [`StopMatchmakingRequest`]: https://docs.kontest.io/gamelift-pb/latest/classes/stopmatchmakingrequest.html
   */
  public async stopMatchmaking(request: StopMatchmakingRequest): Promise<void> {
    if (!this.assertNetworkInitialized()) {
      throw new GameLiftServerNotInitializedError();
    }

    return await this.networking.stopMatchmaking(request);
  }

  /**
   * Initialize the internal networking interface.
   *
   * @internal
   */
  public async initializeNetworking(): Promise<void> {
    debug("initializing networking");
    const socket = SocketIOClient(GameLiftServerState.LOCALHOST, {
      autoConnect: false,
      query: {
        pID: process.ppid,
        sdkVersion: GameLiftServerState.SDK_VERSION,
        sdkLanguage: "Cpp",
      },
      transports: ["websocket"],
    });

    this.networking = new Network(socket, this);
    await this.networking.performConnect(socket);
  }

  /**
   * Simple health check function that will return true.
   *
   * @internal
   */
  public async defaultHealthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Networking member field. Used for communicating with the GameLift service.
   *
   * @internal
   */
  public networking: Network;

  /**
   * Internal flag denoting the process is ready.
   *
   * @internal
   */
  private processReadyFlag: boolean;

  /**
   * Reference to the user-defined callback for the "OnStartGameSession" event.
   *
   * @internal
   */
  private onStartGameSession: OnStartGameSessionCallback;

  /**
   * Internal listener for the "OnStartGameSession" event.
   *
   * Performs some error checking before calling the user-defined handler for the
   * event.
   *
   * @internal
   * @param gameSession - Game session instance received from the GameLift service.
   * @param ack - Acknowledge function to communicate with the GameLift service if the
   * starting of the game session was successful.
   */
  public onStartGameSessionHandler(gameSession: GameSession, ack: Ack): void {
    if (!this.processReadyFlag) {
      ack(false);
    }

    this.gameSessionId = gameSession.gameSessionId;
    debug(
      "processing 'OnStartGameSession' event for session '%s'",
      this.gameSessionId
    );

    this.onStartGameSession(gameSession);
    ack(true);
  }

  /**
   * Reference to the user-defined callback for the "OnUpdateGameSession" event.
   *
   * @internal
   */
  private onUpdateGameSession?: OnUpdateGameSessionCallback;

  /**
   * Internal listener for the "OnUpdateGameSession" event.
   *
   * Performs some error checking before calling the user-defined handler for the
   * event.
   *
   * @internal
   * @param updateGameSession - Update game session message received from the GameLift
   * service.
   * @param ack - Acknowledgement function to communicate with the GameLift service if
   * the event has handled successfully.
   */
  public onUpdateGameSessionHandler(
    updateGameSession: UpdateGameSession,
    ack: Ack
  ): void {
    if (!this.processReadyFlag) {
      ack(false);
    }

    if (this.onUpdateGameSession) {
      this.onUpdateGameSession(updateGameSession);
    }
    ack(true);
  }

  /**
   * Reference to the user-defined callback for the "OnProcessTerminate" event.
   *
   * @internal
   */
  private onProcessTerminate?: OnProcessTerminateCallback;

  /**
   * Handler for the the "OnTerminateProcess" event from GameLift service.
   *
   * @param terminationTime - timestamp denoting the termination time.
   */
  public onTerminateSessionHandler(terminationTime: number): void {
    //If processReady was never invoked, the callback for processTerminate is
    // null.
    if (!this.processReadyFlag) {
      return;
    }
    this.terminationTime = terminationTime;

    if (this.onProcessTerminate) {
      this.onProcessTerminate();
    }
  }

  /**
   * Reference to the callback for the "OnHealthCheck" event.
   *
   * Notice that this callback will fallback to the default at
   * {@link GameLiftServerState.defaultHealthCheck}.
   *
   * @internal
   */
  private onHealthCheck: OnHealthCheckCallback;

  /**
   * Internal reference to the
   * [Timeout](https://nodejs.org/api/timers.html#timers_class_timeout)
   * object created for the health check loop.
   *
   * @internal
   */
  private _healthcheckTimeout: NodeJS.Timeout;

  /**
   * Simple predicate to determine if the {@link GameLiftServerState.networking}
   * interface has been initialized yet.
   *
   * @internal
   */
  private assertNetworkInitialized(): boolean {
    debug("asserting that the network has been initialized");
    return (
      this.networking !== undefined &&
      this.networking !== null &&
      this.networking.connected()
    );
  }
}
