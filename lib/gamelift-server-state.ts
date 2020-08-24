/**
 * @fileoverview Defines the singleton objects used for tracking &
 * communicating state changes between the process & GameLift AWS
 * service.
 */

import _debug from "debug";
import SocketIOClient from "socket.io-client";
import type { GameSession, UpdateGameSession } from "gamelift";

import {
  AlreadyInitializedError,
  GameLiftServerNotInitializedError,
  NoGameSessionError,
  NotInitializedError,
  ProcessNotReadyError,
} from "./exceptions";
import { Network, Ack } from "./network";
import type { LogParameters } from "./types";

const debug = _debug("gamelift.io:gamelift-server-state");

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
 */
type OnUpdateGameSessionCallback = (
  updateGameSession: UpdateGameSession
) => void;

/**
 * This data type contains the set of parameters sent to the GameLift service
 * in a {@link ProcessReady} call.
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
   * @return Static GameLiftCommonState instance.
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
   * @param instance
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
   * Create the Server state instance and set it as the singleton for the application.
   *
   * @internal
   * @return New GameLiftServerState instance.
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
   * @param processParameters
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
  public reportHealth(): void {
    // Create a timer promise that will timeout and send an unhealthy status if it
    // beats the actual health check.
    const timerPromise = new Promise<boolean>((resolve: () => void): void => {
      setTimeout(
        resolve.bind({}, false),
        GameLiftServerState.HEALTHCHECK_TIMEOUT
      );
    });

    debug("running health check");
    Promise.race<Promise<boolean>>([this.onHealthCheck(), timerPromise])
      .then(this.networking.reportHealth)
      .catch((error?: Error): void => {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        debug("error occurred during healthcheck");
        // log error
      });
  }

  public acceptPlayerSession(playerSessionId: string): void {}

  /**
   * Activate the current game session. This signals to the GameLift service
   * that the process is ready to handle incoming connections.
   *
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
  private networking: Network;

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
   * @param gameSession
   * @param ack
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
   * @param updateGameSession
   * @param ack
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

  public onTerminateSessionHandler(): void {}

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
