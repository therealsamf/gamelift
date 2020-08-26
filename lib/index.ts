/**
 * @fileoverview Defines the main methods exposed for the GameLift Server SDK.
 */

import _debug from "debug";
import {
  DescribePlayerSessionsRequest,
  DescribePlayerSessionsResponse,
  GetInstanceCertificateResponse,
} from "gamelift";

import { NotInitializedError, ProcessNotReadyError } from "./exceptions";
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
 * Retrieves player session data, including settings, session metadata, and player
 * data.
 *
 * Use this action to get information for a single player session, for all player
 * sessions in a game session, or for all player sessions associated with a
 * single player ID.
 *
 * @param request Request that details what results to query on.
 *
 * @return Response object from the GameLift service.
 */
export async function describePlayerSessions(
  request: DescribePlayerSessionsRequest
): Promise<DescribePlayerSessionsResponse> {
  debug("attempting to describe player sessions according to given request");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  if (!serverState.processReady) {
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
 * @return Current game session ID.
 */
export function getGameSessionId(): string {
  debug("retrieving current game session ID");
  const serverState = <GameLiftServerState>GameLiftServerState.getInstance();

  if (!serverState) {
    throw new NotInitializedError();
  }

  if (!serverState.processReady) {
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
 * @return Object with the properties for setting up a TLS secured server.
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
 *
 */
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
