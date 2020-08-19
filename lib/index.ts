
import SocketIOClient from 'socket.io-client';

class InitSdkOutcome {

}

class GameLiftCommonState {
  public static getInstance(): GameLiftCommonState {
    if (!GameLiftCommonState.instance) {

    }
    return GameLiftCommonState.instance;
  }
  public static setInstance(instance: GameLiftCommonState): void {
    GameLiftCommonState.instance = instance;
  }

  private static instance: GameLiftCommonState;
}

class GameLiftServerState extends GameLiftCommonState {
  public static LOCALHOST: string = "http://127.0.0.1:5757";

  public static createInstance(): InitSdkOutcome {
    const newState = new GameLiftServerState();

    return new InitSdkOutcome();
  }

  public acceptPlayerSession(playerSessionId: string): void {

  }

  public initializeNetworking(): void {
    this.socket = SocketIOClient(GameLiftServerState.LOCALHOST);
  }

  private socket: SocketIOClient.Socket;

}

class NotInitializedError extends Error {

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
export function activateGameSession() {

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
export function describePlayerSessions() {

}
export function getGameSessionId() {

}
export function getInstanceCertificate() {

}
export function getSdkVersion() {

}
export const getSDKVersion =getSdkVersion;
export function getTerminationTime() {

}
export function initSdk() {

}
export const initSDK = initSdk;

export function processEnding() {

}
export function processReady() {

}
export function processReadyAsync() {

}
export function removePlayerSession() {

}
export function startMatchBackfill() {

}
export function stopMatchBackfill() {

}
export function terminateGameSession() {

}
export function updatePlayerSessionCreationPolicy() {

}