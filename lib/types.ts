/**
 * Type interfaces used throughout the gamelift.io library.
 */

/**
 * This data type is used to identify which files generated during a game session that
 * you want GameLift to upload and store once the game session ends.
 *
 * This information is communicated to the GameLift service in a {@link ProcessReady} call.
 */
export interface LogParameters {
  /**
   * Directory paths to game server log files that you want GameLift to store for
   * future access.
   *
   * These files are generated during each game session. File paths and names are
   * defined in your game server and stored in the root game build directory. For
   * example, if your game build stores game session logs in a path like
   * `MyGame\sessionlogs\`, then the log path would be `c:\game\MyGame\sessionLogs` (on
   * a Windows instance) or `/local/game/MyGame/sessionLogs` (on a Linux instance).
   */
  logPaths?: string[];
}
