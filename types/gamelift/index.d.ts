/**
 * @fileoverview Declaration file for the types from C++ addon.
 */

declare module "gamelift" {
  /**
   * Common shared message class for Protocol Buffer objects.
   *
   * @internal
   */
  class Message {
    /**
     * Serialize the message to the Protocol Buffer wire format.
     *
     * @internal
     */
    public toString(): Buffer;

    /**
     * Parse the given data to fill out the message's fields.
     *
     * @internal
     * @param value
     */
    public fromString(value: Buffer): boolean;

    /**
     * Parse the given JSON-formatted data to fill out the message's fields.
     *
     * @internal
     * @param value
     */
    public fromJsonString(value: Buffer): boolean;

    /**
     * Retrieve the type name for this individual message.
     *
     * This is used when emitting the messages as events from Socket.io.
     *
     * @internal
     */
    public getTypeName(): string;
  }

  /**
   * Protocol Buffer message to signal to the GameLift service that the process is
   * ready to host a game session.
   *
   * @internal
   */
  export class ProcessReady extends Message {
    /**
     * Port that should be given to client connections wanting to connect to
     * the process.
     *
     * @internal
     */
    public port: number;

    /**
     * List of filepaths that signals which files GameLift should capture and store.
     *
     * @internal
     */
    public logPathsToUpload: string[];
  }

  /**
   * Set of key-value pairs that contain information about a game session.
   *
   * When included in a game session request, these properties communicate details to
   * be used when setting up the new game session. For example, a game property might
   * specify a game mode, level, or map. Game properties are passed to the game server
   * process when initiating a new game session. For more information, see
   * [the Amazon GameLift Developer Guide's section on creating game sessions].
   *
   * [the Amazon GameLift Developer Guide's section on creating game sessions]: https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-sdk-client-api.html#gamelift-sdk-client-api-create
   */
  export class GameProperty extends Message {
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
  export class GameSession extends Message {
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

  /**
   * Properties describing a player session.
   *
   * layer session objects are created either by creating a player session for
   * a specific game session, or as part of a game session placement. A player
   * session represents either a player reservation for a game session (status
   * `RESERVED`) or actual player activity in a game session (status `ACTIVE`).
   * A player session object (including player data) is automatically passed to
   * a game session when the player connects to the game session and is
   * validated.
   *
   * When a player disconnects, the player session status changes to
   * `COMPLETED`. Once the session ends, the player session object is retained
   * for 30 days and then removed.
   *
   * @internal
   */
  export class PlayerSession extends Message {
    /**
     * Time stamp indicating when this data object was created. Format is a
     * number expressed in Unix time as milliseconds.
     *
     * @internal
     */
    public creationTime: number;

    /**
     * DNS identifier assigned to the instance that is running the game
     * session. Values have the following format:
     *
     * * TLS-enabled fleets:
     * `<unique identifier>.<region identifier>.amazongamelift.com`.
     * * Non-TLS-enabled fleets:
     * `ec2-<unique identifier>.compute.amazonaws.com`. (See
     * [Amazon EC2 Instance IP Addressing].)
     *
     * When connecting to a game session that is running on a TLS-enabled
     * fleet, you must use the DNS name, not the IP address.
     *
     * [Amazon EC2 Instance IP Addressing]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html#concepts-public-addresses
     *
     * @internal
     */
    public dnsName: string;

    /**
     * A unique identifier for a fleet that the player's game session is
     * running on.
     *
     * @internal
     */
    public fleetId: string;

    /**
     * A unique identifier for the game session that the player session is
     * connected to.
     *
     * @internal
     */
    public gameSessionId: string;

    /**
     * IP address of the instance that is running the game session. When
     * connecting to a Amazon GameLift game server, a client needs to
     * reference an IP address (or {@link dnsName | DNS name}) and port number.
     *
     * @internal
     */
    public ipAddress: string;

    /**
     * Developer-defined information related to a player. Amazon GameLift does
     * not use this data, so it can be formatted as needed for use in the game.
     *
     * @internal
     */
    public playerData: string;

    /**
     * A unique identifier for a player that is associated with this player
     * session.
     *
     * @internal
     */
    public playerId: string;

    /**
     * A unique identifier for a player session.
     *
     * @internal
     */
    public playerSessionId: string;

    /**
     * Port number for the game session. To connect to a Amazon GameLift server
     * process, an app needs both the IP address and port number.
     *
     * @internal
     */
    public port: number;

    /**
     * Current status of the player session.
     *
     * Possible player session statuses include the following:
     *
     *  * **RESERVED**: The player session request has been received, but the
     * player has not yet connected to the server process and/or been validated.
     *  * **ACTIVE**: The player has been validated by the server process and
     * is currently connected.
     *  * **COMPLETED**: The player connection has been dropped.
     *  * **TIMEDOUT**: A player session request was received, but the player
     * did not connect and/or was not validated within the timeout limit
     * (60 seconds).
     *
     * @internal
     */
    public status: "RESERVED" | "ACTIVE" | "COMPLETED" | "TIMEDOUT";

    /**
     * Time stamp indicating when this data object was terminated. Format is a
     * number expressed in Unix time as milliseconds.
     *
     * @internal
     */
    public terminationTime: number;

  }

  /**
   * Message from the GameLift server SDK to the GameLift service that the process has
   * received the game session, activated/initialized it, and is ready to receive
   * player sessions.
   *
   * See [ActivateGameSession()] for more details.
   *
   * [ActivateGameSession()]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-activategamesession
   *
   * @internal
   */
  export class GameSessionActivate extends Message {
    /**
     * Identifier for the game session that's been activated
     *
     * @internal
     */
    public gameSessionId: string;
  }

  /**
   * Message from the GameLift server SDK to the GameLift service that the
   * given player is attempting to connect to the game.
   *
   * @internal
   */
  export class AcceptPlayerSession extends Message {
    /**
     * Identifier for the game session the player is attempting to join.
     *
     * @internal
     */
    public gameSessionId: string;

    /**
     * Identifier for the player session that's attempting to join the game.
     *
     * @internal
     */
    public playerSessionId: string;
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
   *
   */
  export class DescribePlayerSessionsRequest extends Message {
    /**
     * Unique game session identifier.
     *
     * Use this parameter to request all player sessions for the specified
     * game session. Game session ID format is as follows:
     * `arn:aws:gamelift:<region>::gamesession/fleet-<fleet ID>/<ID string>`.
     * The value of <ID string> is either a custom ID string or (if one was
     * specified when the game session was created) a generated string.
     */
    gameSessionId: string;

    /**
     * Maximum number of results to return.
     *
     * Use this parameter with
     * {@link nextToken | `nextToken`} to get results as a set of sequential
     * pages. If a player session ID is specified, this parameter is ignored.
     */
    limit: number;

    /**
     * Token indicating the start of the next sequential page of results.
     *
     * Use the token that is returned with a previous call to this action. To
     * specify the start of the result set, do not specify a value. If a player
     * session ID is specified, this parameter is ignored.
     */
    nextToken: string;

    /**
     * Unique identifier for a player.
     *
     * Player IDs are defined by the developer. See [Generating Player IDs].
     *
     * [Generating Player IDs]: https://docs.aws.amazon.com/gamelift/latest/developerguide/player-sessions-player-identifiers.html
     */
    playerId: string;

    /**
     * Unique identifier for a player session.
     */
    playerSessionId: string;

    /**
     * Player session status to filter results on.
     *
     * Possible player session statuses include the following:
     *
     *  * RESERVED – The player session request has been received, but the
     * player has not yet connected to the server process and/or been
     * validated.
     *  * ACTIVE – The player has been validated by the server process and is
     * currently connected.
     *  * COMPLETED – The player connection has been dropped.
     *  * TIMEDOUT – A player session request was received, but the player did
     * not connect and/or was not validated within the time-out limit (60 seconds).
     */
    playerSessionStatusFilter: "RESERVED" | "ACTIVE" | "COMPLETED" | "TIMEDOUT";
  }

  /**
   * Response from the GameLift service for a [DescribePlayerSessionsRequest].
   *
   * [DescribePlayerSessionsRequest]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-describeplayersessions
   */
  export class DescribePlayerSessionsResponse extends Message {
    /**
     * Token that indicates where to resume retrieving results on the next
     * call to this action. If no token is returned, these results represent
     * the end of the list.
     */
    nextToken?: string;

    /**
     * A collection of objects containing properties for each player session
     * that matches the request.
     */
    playerSessions: PlayerSession[];
  }

  type MessageNoJson = Omit<Message, "fromJsonString">;

  /**
   * Message for retrieving the locations of certicates & keys to setup a TLS session.
   *
   * For more information see [GetInstanceCertificate()].
   *
   * [GetInstanceCertificate()]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-getinstancecertificate
   *
   * @internal
   */
  export class GetInstanceCertificate extends Message {
  }

  /**
   * GameLift service response with the locations of the files necessary to
   * setup a TLS secured server.
   *
   * For more information see [GetInstanceCertificate()].
   *
   * [GetInstanceCertificate()]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-getinstancecertificate
   *
   */
  export class GetInstanceCertificateResponse extends Message {
    /**
     * Filepath to the TLS certificate.
     */
    public certificatePath: string;

    /**
     * Filepath to the TLS certificate chain.
     */
    public certificateChainPath: string;

    /**
     * Filepath to the private key for the TLS certificate.
     */
    public privateKeyPath: string;

    /**
     * Hostname the certificate has been issued for.
     */
    public hostName: string;

    /**
     * Filepath to the root certificate.
     */
    public rootCertificatePath: string;

  }

  /**
   * Message from the GameLift service that game session has been updated.
   *
   * This message occurs when the [UpdateGameSession API] is utilized and is
   * thus propagated back to the GameLift client process.
   *
   * [UpdatedGameSession API]: https://docs.aws.amazon.com/gamelift/latest/apireference/API_UpdateGameSession.html
   *
   */
  export class UpdateGameSession extends Message {
    /**
     * New {@link GameSession} property carrying all the new fields.
     */
    public gameSession: GameSession;

    /**
     * Optional string describing the reason for the update.
     */
    public updateReason?:
      | "MATCHMAKING_DATA_UPDATED"
      | "BACKFILL_FAILED"
      | "BACKFILL_TIMED_OUT"
      | "BACKFILL_CANCELLED";

    /**
     * Ticket ID for the MatchBackfill request.
     */
    public backfillTicketId: string;
  }

  /**
   * Generic response from the GameLift service. Used to determine if an SDK
   * method was in error.
   *
   * @internal
   */
  export class GameLiftResponse extends Message {
    /**
     * Status code of the SDK request.
     *
     * @internal
     */
    public status: "OK" | "ERROR_400" | "ERROR_500";

    /**
     * Message for the response. Usually used to describe an error if one
     * occurred.
     *
     * @internal
     */
    public errorMessage: string;
  }

  /**
   * @internal
   */
  export class ActivateGameSession extends Message {
    public gameSession: GameSession;
  }
}
