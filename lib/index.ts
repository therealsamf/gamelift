import _debug from "debug";
import SocketIOClient from "socket.io-client";

import { Network } from "./network";

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
   * Create the Server state instance and set it as the singleton for the application.
   *
   * @internal
   */
  public static createInstance(): GameLiftServerState {
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

  private networking: Network;
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
export function processReady() {}
export function processReadyAsync() {}
export function removePlayerSession() {}
export function startMatchBackfill() {}
export function stopMatchBackfill() {}
export function terminateGameSession() {}
export function updatePlayerSessionCreationPolicy() {}
