import _debug from "debug";
import SocketIOClient from "socket.io-client";

import { Network } from "./network";
import type { GameSession } from "./game-session";
import type { LogParameters } from "./types";
import type { UpdateGameSession } from "./update-game-session";

const debug = _debug("gamelift.io:index");

/**
 * Error class meant to show the caller the API hasn't been initialized.
 * @internal
 */
class NotInitializedError extends Error {
  /**
   * Construct the NotInitializedError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("GameLift API has not been initialized");
  }
}

/**
 * Error class meant to show the caller the GameLift server state hasn't been
 * initialized.
 *
 * @internal
 */
class GameLiftServerNotInitializedError extends Error {
  /**
   * Construct the GameLiftServerNotInitializedError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("GameLift server has not been initialized");
  }
}

/**
 * Error class meant to show the caller the API has already been initialized.
 * @internal
 */
class AlreadyInitializedError extends Error {
  /**
   * Construct the AlreadyInitializedError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("GameLift API has already been initialized");
  }
}

/**
 * Common state methods for GameLift Server SDK state.
 *
 * @internal
 */
class GameLiftCommonState {
  /**
   * Retrieve the singleton server state instance.
   *
   * @internal
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
class GameLiftServerState extends GameLiftCommonState {
  /**
   * Constant string representing the location of the proxy which forwards requests to
   * the GameLift API service.
   *
   * @internal
   */
  public static LOCALHOST: string = "http://127.0.0.1:5757";

  /**
   * Constant denoting the amount of time to wait in-between health checks.
   *
   * @internal
   */
  public static HEALTHCHECK_TIMEOUT_SECONDS: number = 60;

  /**
   * Notifies the GameLift service that the process is ready to receive game sessions
   * after setting up the necessary callbacks.
   *
   * @internal
   * @param processParameters
   */
  public processReady(processParameters: ProcessParameters): void {
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

    this.networking.processReady(
      processParameters.port,
      processParameters.logParameters
    );
    this.healthCheck();
  }

  /**
   * Create the Server state instance and set it as the singleton for the application.
   *
   * @internal
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
   * Sets up a recurring loop to healthcheck the GameLift process.
   *
   * @internal
   */
  public healthCheck(): void {
    this._healthcheckTimeout = setInterval(
      this.reportHealth,
      GameLiftServerState.HEALTHCHECK_TIMEOUT_SECONDS
    );
  }

  /**
   * Determine the health of the process with the callback before reporting
   * it back to the GameLift service.
   *
   * @internal
   */
  public reportHealth(): void {
    const healthy = this.onHealthCheck();
    this.networking.reportHealth(healthy);
  }

  public acceptPlayerSession(playerSessionId: string): void {}

  /**
   * Initialize the internal networking interface.
   *
   * @internal
   */
  public async initializeNetworking(): Promise<void> {
    debug("initializing networking");
    const socket = SocketIOClient(GameLiftServerState.LOCALHOST, {
      autoConnect: false,
    });

    this.networking = new Network(socket);
    await this.networking.performConnect(socket);
  }

  /**
   * Simple health check function that will return true.
   *
   * @internal
   */
  public defaultHealthCheck(): boolean {
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
   * Reference to the user-defined callback for the "OnUpdateGameSession" event.
   *
   * @internal
   */
  private onUpdateGameSession?: OnUpdateGameSessionCallback;

  /**
   * Reference to the user-defined callback for the "OnProcessTerminate" event.
   *
   * @internal
   */
  private onProcessTerminate?: OnProcessTerminateCallback;

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
    return (
      this.networking !== undefined &&
      this.networking !== null &&
      this.networking.connected()
    );
  }
}

/**
 * Notify the GameLift service that a player with the specified player session ID has
 * connected to the server process and needs validation.
 *
 * GameLift verifies that the player session ID is valid—that is, that the player ID has
 * reserved a player slot in the game session. Once validated, GameLift changes the
 * status of the player slot from RESERVED to ACTIVE.
 *
 * @param playerSessionId Unique ID issued by the Amazon GameLift service in response
 *   to a call to the AWS SDK Amazon GameLift API action [CreatePlayerSession](https://docs.aws.amazon.com/gamelift/latest/apireference/API_CreatePlayerSession.html).
 *   The game client references this ID when connecting to the server process.
 *
 */
export function acceptPlayerSession(playerSessionId: string) {
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  serverState.acceptPlayerSession(playerSessionId);
}

/**
 * Notify the GameLift service that the server process has started a game session and
 * is now ready to receive player connections.
 *
 * This action should be called as part of the onStartGameSession() callback function,
 * after all game session initialization has been completed.
 */
export function activateGameSession() {}

/**
 * This data type is used to specify which player session(s) to retrieve. You can use
 * it as follows:
 *
 *  * Provide a PlayerSessionId to request a specific player session.
 *  * Provide a GameSessionId to request all player sessions in the specified game
 * session.
 *  * Provide a PlayerId to request all player sessions for the specified player.
 *
 * For large collections of player sessions, use the pagination parameters to retrieve
 * results in sequential blocks.
 */
interface DescribePlayerSessionsRequest {
  /**
   * Unique game session identifier.
   *
   * Use this parameter to request all player sessions for the specified game session.
   * Game session ID format is as follows: `arn:aws:gamelift:<region>::gamesession/fleet-<fleet ID>/<ID string>`.
   * The value of <ID string> is either a custom ID string or (if one was specified
   * when the game session was created) a generated string.
   */
  gameSessionId: string;

  limit: number;

  nextToken: string;
  playerId: string;
  playerSessionId: string;
  playerSessionStatusFilter: "RESERVED" | "ACTIVE" | "COMPLETED" | "TIMEDOUT";
}

/**
 * Retrieves player session data, including settings, session metadata, and player
 * data.
 *
 * Use this action to get information for a single player session, for all player
 * sessions in a game session, or for all player sessions associated with a single
 * player ID.
 *
 */
export function describePlayerSessions() {}
export function getGameSessionId() {}
export function getInstanceCertificate() {}
export function getSdkVersion() {}
export const getSDKVersion = getSdkVersion;
export function getTerminationTime() {}

/**
 * Initializes the GameLift SDK.
 *
 * This method should be called on launch, before any other GameLift-related
 * initialization occurs.
 */
export async function initSdk(): Promise<void> {
  debug("initializing SDK");
  const serverState = GameLiftServerState.createInstance();

  await serverState.initializeNetworking();
}

/**
 * See {@link initSdk}.
 */
export const initSDK = initSdk;

export function processEnding() {}

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
type OnHealthCheckCallback = () => boolean;

/**
 * Callback used for the "OnUpdateGameSession" event.
 */
type OnUpdateGameSessionCallback = (
  updateGameSession: UpdateGameSession
) => void;

/**
 * This data type contains the set of parameters sent to the GameLift service in a
 * {@link ProcessReady} call.
 */
interface ProcessParameters {
  /**
   * Port number the server listens on for new player connections.
   *
   * The value must fall into the port range configured for any fleet deploying this
   * game server build. This port number is included in game session and player session
   * objects, which game sessions use when connecting to a server process.
   */
  port: number;

  /**
   * Object with a list of directory paths to game session log files.
   */
  logParameters?: LogParameters;

  /**
   * Callback function that the GameLift service calls to activate a new game session.
   *
   * GameLift calls this function in response to the client request
   * [CreateGameSession](https://docs.aws.amazon.com/gamelift/latest/apireference/API_CreateGameSession.html).
   * The callback function passes a {@link GameSession} object.
   */
  onStartGameSession: OnStartGameSessionCallback;

  /**
   * Callback function that the GameLift service calls to force the server process to shut down.
   *
   * After calling this function, GameLift waits five minutes for the server process
   * to shut down and respond with a {@link processEnding} call. If no response is
   * received it shuts down the server process.
   */
  onProcessTerminate?: OnProcessTerminateCallback;

  /**
   * Callback function that the GameLift service calls to request a health status
   * report from the server process.
   *
   * GameLift calls this function every 60 seconds. After calling this function
   * GameLift waits 60 seconds for a response, and if none is received. records the
   * server process as unhealthy.
   */
  onHealthCheck?: OnHealthCheckCallback;

  /**
   * Name of callback function that the GameLift service calls to provide an updated
   * game session object.
   *
   * GameLift calls this function once a
   * [match backfill](https://docs.aws.amazon.com/gamelift/latest/developerguide/match-backfill.html)
   * request has been processed. It passes a {@link GameSession} object, a status
   * update (`updateReason`), and the match backfill ticket ID.
   */
  onUpdateGameSession?: OnUpdateGameSessionCallback;
}

/**
 * Notifies the GameLift service that the server process is ready to host game
 * sessions.
 *
 * This method should be called after successfully invoking {@link initSDK()} and
 * completing any setup tasks required before the server process can host a game
 * session.
 *
 * @param processParameters
 */
export function processReady(processParameters: ProcessParameters): void {
  const serverInstance = GameLiftCommonState.getInstance() as GameLiftServerState;

  serverInstance.processReady(processParameters);
}
export function processReadyAsync() {}
export function removePlayerSession() {}
export function startMatchBackfill() {}
export function stopMatchBackfill() {}
export function terminateGameSession() {}
export function updatePlayerSessionCreationPolicy() {}
