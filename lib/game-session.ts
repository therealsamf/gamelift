/**
 * Model for a game session
 */

/**
 * Set of key-value pairs that contain information about a game session.
 *
 * When included in a game session request, these properties communicate details to be
 * used when setting up the new game session. For example, a game property might
 * specify a game mode, level, or map. Game properties are passed to the game server
 * process when initiating a new game session. For more information, see
 * [the Amazon GameLift Developer Guide](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-sdk-client-api.html#gamelift-sdk-client-api-create).
 */
interface GameProperty {
  /**
   * The game property identifier.
   */
  key: string;

  /**
   * The game property value.
   */
  value: string;
}

/**
 * Properties describing a game session.
 *
 * A game session in `ACTIVE` status can host players. When a game session ends, its
 * status is set to `TERMINATED`.
 *
 * Once the session ends, the game session object is retained for 30 days. This means
 * you can reuse idempotency token values after this time. Game session logs are
 * retained for 14 days.
 */
interface GameSession {
  /**
   * Time stamp indicating when this data object was created. Format is a number
   * expressed in Unix time as milliseconds.
   */
  creationTime?: number;

  /**
   * A unique identifier for a player.
   *
   * This ID is used to enforce a resource protection policy (if one exists), that
   * limits the number of game sessions a player can create.
   */
  creatorId?: string;

  /**
   * Number of players currently in the game session.
   */
  currentPlayerSessionCount?: number;

  /**
   * DNS identifier assigned to the instance that is running the game session.
   *
   * Values have the following format:
   *
   *  * TLS-enabled fleets: `<unique identifier>.<region identifier>.amazongamelift.com`.
   *  * Non-TLS-enabled fleets: `ec2-<unique identifier>.compute.amazonaws.com.` (See
   * [Amazon EC2 Instance IP Addressing](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html#concepts-public-addresses))
   *
   * When connecting to a game session that is running on a TLS-enabled fleet, you must
   * use the DNS name, not the IP address.
   */
  dnsName?: string;

  /**
   * The Amazon Resource Name ([ARN](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html))
   * associated with the GameLift fleet that this game session is running on.
   */
  fleetArn?: string;

  /**
   * A unique identifier for a fleet that the game session is running on.
   */
  fleetId?: string;

  /**
   * Set of custom properties for a game session, formatted as key:value pairs. These
   * properties are passed to a game server process in the {@link GameSession} object
   * with a request to start a new game session (see
   * [Start a Game Session](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-sdk-server-api.html#gamelift-sdk-server-startsession)).
   *
   * You can search for active game sessions based on this custom data with
   * [SearchGameSessions](https://docs.aws.amazon.com/gamelift/latest/apireference/API_SearchGameSessions.html).
   */
  gameProperties?: GameProperty[];

  /**
   * Set of custom game session properties, formatted as a single string value.
   *
   * This data is passed to a game server process in the  {@link GameSession} object
   * with a request to start a new game session (see
   * [Start a Game Session](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-sdk-server-api.html#gamelift-sdk-server-startsession)).
   */
  gameSessionData?: string;

  /**
   * A unique identifier for the game session.
   *
   * A game session ARN has the following format:
   * `arn:aws:gamelift:<region>::gamesession/<fleet ID>/<custom ID string or idempotency token>`.
   */
  gameSessionId?: string;

  /**
   * IP address of the instance that is running the game session.
   *
   * When connecting to a Amazon GameLift game server, a client needs to reference an
   * IP address (or DNS name) and port number.
   */
  ipAddress?: string;

  /**
   * Information about the matchmaking process that was used to create the game
   * session.
   *
   * It is in JSON syntax, formatted as a string. In addition the matchmaking
   * configuration used, it contains data on all players assigned to the match,
   * including player attributes and team assignments. For more details on matchmaker
   * data, see
   * [Match Data](https://docs.aws.amazon.com/gamelift/latest/developerguide/match-server.html#match-server-data).
   * Matchmaker data is useful when requesting match backfills, and is updated
   * whenever new players are added during a successful backfill (see
   * [StartMatchBackfill](https://docs.aws.amazon.com/gamelift/latest/apireference/API_StartMatchBackfill.html)).
   */
  matchmakerData?: string;

  /**
   * The maximum number of players that can be connected simultaneously to the game
   * session.
   */
  maximumPlayerSessionCount?: number;

  /**
   * A descriptive label that is associated with a game session.
   *
   * Session names do not need to be unique.
   */
  name?: string;

  /**
   * Indicates whether or not the game session is accepting new players.
   */
  playerSessionCreationPolicy?: "ACCEPT_ALL" | "DENY_ALL";

  /**
   * Port number for the game session.
   *
   * To connect to a Amazon GameLift game server, an app needs both the IP address and
   * port number.
   */
  port?: number;

  /**
   * Current status of the game session.
   *
   * A game session must have an `ACTIVE` status to have player sessions.
   */
  status?: "ACTIVE" | "ACTIVATED" | "TERMINATING" | "TERMINATED" | "ERROR";

  /**
   * Provides additional information about game session status.
   *
   * `INTERRUPTED` indicates that the game session was hosted on a spot instance that
   * was reclaimed, causing the active game session to be terminated.
   */
  statusReason?: "INTERRUPTED";

  /**
   * Time stamp indicating when this data object was terminated. Format is a
   * number expressed in Unix time as milliseconds.
   */
  terminationTime?: number;
}
