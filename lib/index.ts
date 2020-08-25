/**
 * @fileoverview Defines the main methods exposed for the GameLift Server SDK.
 */

import _debug from "debug";

import { NotInitializedError } from "./exceptions";
import {
  GameLiftServerState,
  GameLiftCommonState,
  ProcessParameters,
} from "./gamelift-server-state";

/** @hidden */
const debug = _debug("gamelift.io:index");

/**
 * Notify the GameLift service that a player with the specified player session ID has
 * connected to the server process and needs validation.
 *
 * GameLift verifies that the player session ID is valid—that is, that the player ID has
 * reserved a player slot in the game session. Once validated, GameLift changes the
 * status of the player slot from RESERVED to ACTIVE.
 *
 * @param playerSessionId Unique ID issued by the Amazon GameLift service in response
 *   to a call to the AWS SDK Amazon GameLift API action
 *   [CreatePlayerSession]. The game client references this ID when connecting to the
 *   server process.
 *
 * [CreatePlayerSession]: https://docs.aws.amazon.com/gamelift/latest/apireference/API_CreatePlayerSession.html
 */
export async function acceptPlayerSession(
  playerSessionId: string
): Promise<void> {
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.acceptPlayerSession(playerSessionId);
}

/**
 * Notify the GameLift service that the server process has started a game session and
 * is now ready to receive player connections.
 *
 * This action should be called as part of the onStartGameSession() callback function,
 * after all game session initialization has been completed.
 */
export async function activateGameSession() {
  debug("activating the current game session");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.activateGameSession();
}

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
/** @hidden */
export const getSDKVersion = getSdkVersion;
export function getTerminationTime() {}

/**
 * Initializes the GameLift SDK.
 *
 * This method should be called on launch, before any other GameLift-related
 * logic occurs.
 */
export async function initSdk(): Promise<void> {
  debug("initializing SDK");
  const serverState = GameLiftServerState.createInstance();

  await serverState.initializeNetworking();
}

/**
 * See {@link initSdk}.
 * @hidden
 */
export const initSDK = initSdk;

export function processEnding() {}

/**
 * Notifies the GameLift service that the server process is ready to host game
 * sessions.
 *
 * This method should be called after successfully invoking {@link initSdk | `initSdk()`} and
 * completing any setup tasks required before the server process can host a game
 * session.
 *
 * @param processParameters
 */
export async function processReady(
  processParameters: ProcessParameters
): Promise<void> {
  const serverInstance = GameLiftCommonState.getInstance() as GameLiftServerState;

  await serverInstance.processReady(processParameters);
}
export function processReadyAsync() {}
export function removePlayerSession() {}
export function startMatchBackfill() {}
export function stopMatchBackfill() {}
export function terminateGameSession() {}
export function updatePlayerSessionCreationPolicy() {}
