/**
 * @fileoverview Defines the main methods exposed for the GameLift Server SDK.
 */

import _debug from "debug";
import {
  BackfillMatchmakingRequest,
  BackfillMatchmakingResponse,
  DescribePlayerSessionsRequest,
  DescribePlayerSessionsResponse,
  GetInstanceCertificateResponse,
  StopMatchmakingRequest,
} from "@kontest/gamelift-pb";

import { NotInitializedError, ProcessNotReadyError } from "./exceptions";
import {
  GameLiftServerState,
  GameLiftCommonState,
  ProcessParameters,
} from "./gamelift-server-state";

/** @hidden */
const debug = _debug("gamelift:index");

/**
 * Notify the GameLift service that a player with the specified player session ID has
 * connected to the server process and needs validation.
 *
 * GameLift verifies that the player session ID is valid—that is, that the player ID has
 * reserved a player slot in the game session. Once validated, GameLift changes the
 * status of the player slot from RESERVED to ACTIVE.
 *
 * @param playerSessionId - Unique ID issued by the Amazon GameLift service in response
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
export async function activateGameSession(): Promise<void> {
  debug("activating the current game session");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.activateGameSession();
}

/**
 * Retrieves player session data, including settings, session metadata, and player
 * data.
 *
 * Use this action to get information for a single player session, for all player
 * sessions in a game session, or for all player sessions associated with a
 * single player ID.
 *
 * @param request - Request that details what results to query on.
 *
 * @returns Response object from the GameLift service.
 */
export async function describePlayerSessions(
  request: DescribePlayerSessionsRequest
): Promise<DescribePlayerSessionsResponse> {
  debug("attempting to describe player sessions according to given request");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!serverState.processReadyFlag) {
    throw new ProcessNotReadyError();
  }

  return await serverState.describePlayerSessions(request);
}

/**
 * Retrieves a unique identifier for the game session currently being hosted
 * by the server process, if the server process is active.
 *
 * The identifier is returned in ARN format:
 * `arn:aws:gamelift:<region>::gamesession/fleet-<fleet ID>/<ID string>`.
 *
 * @returns Current game session ID.
 */
export function getGameSessionId(): string {
  debug("retrieving current game session ID");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!serverState.processReadyFlag) {
    throw new ProcessNotReadyError();
  }

  return serverState.getGameSessionId();
}

/**
 * Retrieves the file location of a pem-encoded TLS certificate that is
 * associated with the fleet and its instances.
 *
 * This certificate is generated when a new fleet is created with the
 * certificate configuration set to GENERATED. Use this certificate to
 * establish a secure connection with a game client and to encrypt
 * client/server communication.
 *
 * @returns Object with the properties for setting up a TLS secured server.
 */
export async function getInstanceCertificate(): Promise<
  GetInstanceCertificateResponse
> {
  debug("querying for the filepaths for the TLS certs/keys");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  return await serverState.getInstanceCertificate();
}

/**
 * Returns the current version number of the SDK in use.
 */
export function getSdkVersion(): string {
  return GameLiftServerState.SDK_VERSION;
}

/** @hidden */
export const getSDKVersion = getSdkVersion;

/**
 * Returns the time that a server process is scheduled to be shut down, if a
 * termination time is available.
 *
 * A server process takes this action after receiving an
 * {@link ProcessParameters.onProcessTerminate | `onProcessTerminate()`}
 * callback from the GameLift service. A server process may be shut down for
 * several reasons: (1) process poor health, (2) when an instance is being
 * terminated during a scale-down event, or (3) when an instance is being
 * terminated due to a [spot instance interruption].
 *
 * [spot instance interruption]: https://docs.aws.amazon.com/gamelift/latest/developerguide/spot-tasks.html
 * [shutting down a server process]: https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-sdk-server-api.html#gamelift-sdk-server-terminate
 */
export function getTerminationTime(): number {
  debug("retrieving the termination time");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  return serverState.getTerminationTime();
}

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

/**
 * Notifies the GameLift service that the server process is shutting down.
 *
 * The application should exit with a 0 error code.
 */
export async function processEnding(): Promise<void> {
  debug("notifying GameLift of an ending process");

  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.processEnding();
}

/**
 * Notifies the GameLift service that the server process is ready to host game
 * sessions.
 *
 * This method should be called after successfully invoking {@link initSdk | `initSdk()`} and
 * completing any setup tasks required before the server process can host a game
 * session.
 *
 * @param processParameters - Port number & function callbacks in response to GameLift
 * events communicated to the application from the GameLift service.
 */
export async function processReady(
  processParameters: ProcessParameters
): Promise<void> {
  debug("retrieving server state to mark as ready");
  const serverState = GameLiftCommonState.getInstance() as GameLiftServerState;
  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.processReady(processParameters);
}

/**
 * Notifies the GameLift service that a player with the specified player
 * session ID has disconnected from the server process.
 *
 * In response, GameLift changes the player slot to available, which allows it
 * to be assigned to a new player.
 *
 * @param playerSessionId - Identifier of the player session to remove/disassociate
 * from the current game session.
 */
export async function removePlayerSession(
  playerSessionId: string
): Promise<void> {
  debug(`removing player session '${playerSessionId}'`);
  const serverState = GameLiftCommonState.getInstance() as GameLiftServerState;
  if (!serverState) {
    throw new NotInitializedError();
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!serverState.processReadyFlag) {
    throw new ProcessNotReadyError();
  }

  await serverState.removePlayerSession(playerSessionId);
}

/**
 * Sends a request to find new players for open slots in a game session created
 * with FlexMatch.
 *
 * See also the AWS SDK action
 * [StartMatchBackfill()](https://docs.aws.amazon.com/gamelift/latest/apireference/API_StartMatchBackfill.html).
 * With this action, match backfill requests can be initiated by a game server process
 * that is hosting the game session. Learn more about the FlexMatch backfill feature in
 * [Backfill Existing Games with FlexMatch](https://docs.aws.amazon.com/gamelift/latest/developerguide/match-backfill.html).
 *
 * This action is asynchronous. If new players are successfully matched, the
 * GameLift service delivers updated matchmaker data using the callback
 * function
 * {@link ProcessParameters.onUpdateGameSession | `onUpdateGameSession()`}.
 *
 * @param request - [`BackfillMatchmakingRequest`](https://docs.kontest.io/gamelift-pb/latest/classes/backfillmatchmakingrequest.html)
 * message that determines how/what gets backfilled with players. The message
 * communicates the following information:
 *  * A ticket ID to assign to the backfill request. This information is optional; if
 *    no ID is provided, GameLift will autogenerate one.
 *  * The matchmaker to send the request to. The full configuration ARN is required.
 *    This value can be acquired from the game session's matchmaker data.
 *  * The ID of the game session that is being backfilled. This be found with
 *    {@link getGameSessionId | `getGameSessionId()`}.
 *  * Available matchmaking data for the game session's current players.
 *
 * @returns - [`BackfillMatchmakingResponse`](https://docs.kontest.io/gamelift-pb/latest/classes/backfillmatchmakingresponse.html)
 * message with the ticket ID of the request. This ticket ID can be used in a call to
 * [DescribeMatchmaking()](https://docs.aws.amazon.com/gamelift/latest/apireference/API_DescribeMatchmaking.html)
 * or to {@link stopMatchBackfill | stop the backfill matchmaking request}.
 */
export async function startMatchBackfill(
  request: BackfillMatchmakingRequest
): Promise<BackfillMatchmakingResponse> {
  debug("sending 'StartMatchBackfill' request");
  const serverState = GameLiftCommonState.getInstance() as GameLiftServerState;

  if (!serverState) {
    throw new NotInitializedError();
  }

  return await serverState.backfillMatchmaking(request);
}

/**
 * Cancels an active match backfill request that was created with
 * {@link startMatchBackfill | `startMatchBackfill()`}.
 *
 * See also the AWS SDK action [`StopMatchmaking()`]. Learn more about the
 * FlexMatch backfill feature in [Backfill Existing Games with FlexMatch].
 *
 * @param request - [`StopMatchmakingRequest`] message that identifies the matchmaking
 * request to stop. See also [StopMatchBackfillRequest] from the AWS GameLift SDK.
 *
 * [`StopMatchmaking()`]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-stopmatchbackfill
 * [Backfill Existing Games with FlexMatch]: https://docs.aws.amazon.com/gamelift/latest/developerguide/match-backfill.html
 * [`StopMatchmakingRequest`]: https://docs.kontest.io/gamelift-pb/latest/classes/stopmatchmakingrequest.html
 * [StopMatchBackfillRequest]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-datatypes.html#integration-server-sdk-cpp-ref-dataypes-stopmatchbackfillrequest
 */
export async function stopMatchBackfill(
  request: StopMatchmakingRequest
): Promise<void> {
  debug(`sending 'StopMatchmakingRequest' for ticket: '${request.ticketId}'`);

  const serverState = GameLiftCommonState.getInstance() as GameLiftServerState;

  if (!serverState) {
    throw new NotInitializedError();
  }

  return await serverState.stopMatchmaking(request);
}

/**
 * Notifies the GameLift service that the server process has shut down the
 * game session.
 *
 * Since each server process hosts only one game session at a time, there's no
 * need to specify which session. This action should be called at the end of
 * the game session shutdown process.
 *
 * After calling this action, the server process can call
 * {@link processReady | `processReady()`} to signal its availability to host a new
 * game session. Alternatively, it can call {@link processEnding | `processEnding()`}
 * to shut down the server process and terminate the instance.
 */
export async function terminateGameSession(): Promise<void> {
  debug("terminating game session");
  const serverState = GameLiftCommonState.getInstance() as GameLiftServerState;
  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.terminateGameSession();
}

/**
 * Updates the current game session's ability to accept new player sessions.
 * A game session can be set to either accept or deny all new player sessions.
 * See also the AWS SDK action [UpdateGameSession()].
 *
 * [UpdateGameSession()]: https://docs.aws.amazon.com/gamelift/latest/apireference/API_UpdateGameSession.html
 *
 * @param newPlayerSessionPolicy - String value indicating whether the game session accepts new players.
 */
export async function updatePlayerSessionCreationPolicy(
  newPlayerSessionPolicy: "ACCEPT_ALL" | "DENY_ALL"
): Promise<void> {
  debug("updating player session creation policy");
  const serverState = GameLiftCommonState.getInstance() as GameLiftServerState;
  if (!serverState) {
    throw new NotInitializedError();
  }

  await serverState.updatePlayerSessionCreationPolicy(newPlayerSessionPolicy);
}
