/**
 * Interface to communication with the GameLift service.
 */

import {
  GetInstanceCertificateResponse,
  GetInstanceCertificate,
  GameSession,
  UpdateGameSession,
  ActivateGameSession,
  ProcessReady,
  GameSessionActivate,
  AcceptPlayerSession,
  DescribePlayerSessionsRequest,
  DescribePlayerSessionsResponse,
  GameLiftResponse,
  TerminateProcess,
  ProcessEnding,
  GameSessionTerminate,
  UpdatePlayerSessionCreationPolicy,
  ReportHealth,
  RemovePlayerSession,
  BackfillMatchmakingRequest,
  BackfillMatchmakingResponse,
  StopMatchmakingRequest,
} from "@kontest/gamelift-pb";
import _debug from "debug";
import { Message, Writer, Type } from "protobufjs";
import { Socket } from "socket.io-client";

import type { LogParameters } from "./types";

/** @hidden */
const debug = _debug("gamelift:network");

/**
 * @hidden
 */
const NOOP = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

/**
 * Error class denoting an RPC to the GameLift service failed.
 *
 * @internal
 */
class ServiceCallFailedError extends Error {
  constructor(message?: string) {
    const prefix = "GameLift service call failed";
    if (!message) super(prefix);
    else {
      super(`${prefix}: '${message}'`);
    }
  }
}

/**
 * Type alias for socket.io ACK function
 *
 * @internal
 */
export type Ack = (response: boolean) => void;

/**
 * Interface describing the handlers required for specific events from the GameLift
 * service.
 *
 * @internal
 */
export interface HandlerFunctions {
  onStartGameSessionHandler: (gameSession: GameSession, ack: Ack) => void;
  onUpdateGameSessionHandler: (
    updateGameSession: UpdateGameSession,
    ack: Ack
  ) => void;
  onTerminateSessionHandler: (terminationTime: number) => void;
}

/**
 * Interface class for communicating with the Gamelift service
 * @internal
 */
export class Network {
  /**
   * Number of times to attempt to reconnect to the local proxy that communicates with
   * the Gamelift service. Passed to socket.io's client's engine.io Manager objects.
   * @internal
   */
  static RECONNECT_ATTEMPTS = 3;

  /**
   * Internal reference to the object with the handler functions for specific GameLift
   * service messages.
   *
   * @internal
   */
  private handler: HandlerFunctions;

  /**
   * Construct Network object.
   *
   * Configures & connects the two given sockets for communcation with Gamelift.
   * @internal
   * @param socket - [Socket.io client] socket object for communicating with the
   * GameLift service.
   * @param handler - Reference to the event handler for various events sent from the
   * GameLift service.
   *
   * [Socket.io client]: https://socket.io/docs/v3/client-api/#Socket
   */
  public constructor(socket: Socket, handler: HandlerFunctions) {
    this.socket = socket;
    this.handler = handler;

    this.configureClient(this.socket);
  }

  /**
   * Connect to the Gamelift service.
   *
   * @internal
   * @param socket - Socket.io client socket to connect to the GameLift service.
   */
  public async performConnect(socket: Socket): Promise<void> {

    await new Promise(
      (resolve: () => void, reject: (error?: Error) => void): void => {
        socket.on("error", reject);
        socket.on("connect_error", reject);


        socket.once("connect", () => {
          debug(`socket '${socket.id}' connected to GameLift service`);

          socket.off("error", reject);
          socket.off("connect_handler", reject);
          resolve();
        });

        socket.connect();
        debug("waiting for 'connect' event");
      }
    );
  }

  /**
   * Retrieve the status of the socket's connection.
   *
   * @internal
   */
  public connected(): boolean {
    return this.socket && this.socket.connected;
  }

  /**
   * Attach event handlers to the given socket.io client socket object.
   *
   * These handlers include both socket.io specific events and the events used by
   *   Gamelift
   * @internal
   * @param socket - [Socket.io client] socket object
   *
   * [Socket.io client]: https://socket.io/docs/v3/client-api/#Socket
   */
  private configureClient(socket: Socket): void {
    socket.on("disconnect", this.onClose.bind(this, socket) as () => void);

    socket.io.reconnectionAttempts(Network.RECONNECT_ATTEMPTS);

    this.setupClientHandlers(socket);
  }

  /**
   * Attach the event handlers to the given socket.io client object.
   *
   * @internal
   * @param socket - [Socket.io client] socket object for communicating with the
   * GameLift service.
   */
  private setupClientHandlers(socket: Socket): void {
    socket.on("StartGameSession", this.onStartGameSession);
    socket.on("UpdateGameSession", this.onUpdateGameSession);
    socket.on("TerminateProcess", this.onTerminateProcess);
  }

  /**
   * Close handler for the socket.io client.
   *
   * Removes all event listeners from the socket object.
   *
   * @internal
   * @param socket - [Socket.io client] socket object for communicating with the
   * GameLift service.
   */
  private onClose = (socket: Socket): void => {
    debug("socket disconnected");
    socket.off();
  };

  /**
   * Handle the "StartGameSession" event from the GameLift service.
   *
   * This will construct the GameSession object before passing it off to user-defined
   * handler.
   *
   * @internal
   * @param data - Raw data received from the socket.io client.
   * @param ack - ACK function for alerting the GameLift service whether creation was
   * successful.
   */
  private onStartGameSession = (data: string, ack?: Ack): void => {
    debug("socket received 'OnStartGameSession' event");

    const activateGameSessionMessage = this.parseJsonDataIntoMessage<
      ActivateGameSession
    >(ActivateGameSession, data);

    const gameSession = activateGameSessionMessage.gameSession;

    const _ack: Ack = ack || NOOP;
    this.handler.onStartGameSessionHandler(gameSession, _ack);
  };

  /**
   * Handle the "UpdateGameSession" event from the GameLift service.
   *
   * This will construct the UpdateGameSession object before passing it off to the
   * user-defined handler.
   *
   * @internal
   * @param _name - Unused name parameter.
   * @param data - Raw data received from the socket.io client.
   * @param ack - ACK function for alerting the GameLift service whether creation was
   *   successful.
   */
  private onUpdateGameSession = (
    data: string,
    ack?: (response: boolean) => void
  ): void => {
    const updateGameSession = this.parseJsonDataIntoMessage<UpdateGameSession>(
      UpdateGameSession,
      data
    );

    const _ack: Ack = ack || NOOP;
    this.handler.onUpdateGameSessionHandler(updateGameSession, _ack);
  };

  /**
   * Handle the "OnTerminateProcess" event from the GameLift service.
   *
   * This will retrieve the termination time in UNIX epoch seconds before
   * calling the handler.
   *
   * @internal
   * @param data - Raw data received from the socket.io client.
   */
  private onTerminateProcess = (data: string): void => {
    let terminateProcessMessage: TerminateProcess = null;

    try {
      terminateProcessMessage = this.parseJsonDataIntoMessage<TerminateProcess>(
        TerminateProcess,
        data
      );
    } catch (error) {
      debug(
        "setting default termination time due to parsing error of a 'TerminateProcess' message"
      );
      terminateProcessMessage = new TerminateProcess();
      // If unable to determine the termination time then default value is now + 4.5 minutes
      terminateProcessMessage.terminationTime = Date.now() / 1000 + 4.5 * 60;
    }

    this.handler.onTerminateSessionHandler(
      terminateProcessMessage.terminationTime
    );
  };

  /**
   * Send the given health status to the GameLift service.
   *
   * @internal
   * @param healthy - Boolean for healthy or not.
   */
  public async reportHealth(healthy: boolean): Promise<void> {
    const reportHealthMessage = new ReportHealth();
    reportHealthMessage.healthStatus = healthy;

    await this.emit(
      ReportHealth.encode(reportHealthMessage),
      ReportHealth.$type
    );
  }

  /**
   * Send the message to the GameLift service that the process is ready for receiving
   * a game session.
   *
   * @internal
   * @param port - Port number that informs the GameLift service which port it should
   * be telling clients to connect to.
   * @param logParameters - Log parameter object that allows the developer to determine
   *   which files the GameLift service preserves after the process has been destroyed.
   */
  public async processReady(
    port: number,
    logParameters?: LogParameters
  ): Promise<void> {
    const processReadyMessage = new ProcessReady();
    processReadyMessage.port = port;

    if (logParameters) {
      processReadyMessage.logPathsToUpload = logParameters.logPaths || [];
    }

    await this.emit(
      ProcessReady.encode(processReadyMessage),
      ProcessReady.$type
    );
  }

  /**
   * Notifies the GameLift service that the process is shutting down.
   *
   * @internal
   */
  public async processEnding(): Promise<void> {
    const processEndingMessage = new ProcessEnding();

    await this.emit(
      ProcessEnding.encode(processEndingMessage),
      ProcessEnding.$type
    );
  }

  /**
   * Send a message to notify the GameLift service that the game session has
   * been activated and is ready to receive player sessions.
   *
   * @internal
   * @param gameSessionId - Identifier for the game session.
   */
  public async activateGameSession(gameSessionId: string): Promise<void> {
    const gameSessionActivateMessage = new GameSessionActivate();

    gameSessionActivateMessage.gameSessionId = gameSessionId;

    await this.emit(
      GameSessionActivate.encode(gameSessionActivateMessage),
      GameSessionActivate.$type
    );
  }

  /**
   * Send a message to notify the GameLift service that the game session has
   * been terminate and is ready to be allocated again.
   *
   * @internal
   * @param gameSessionId - Identifier for the game session.
   */
  public async terminateGameSession(gameSessionId: string): Promise<void> {
    const gameSessionTerminateMessage = new GameSessionTerminate();

    gameSessionTerminateMessage.gameSessionId = gameSessionId;

    await this.emit(
      GameSessionTerminate.encode(gameSessionTerminateMessage),
      GameSessionTerminate.$type
    );
  }

  /**
   * Notify the GameLift service that the given player session ID has been
   * joined the game.
   *
   * @internal
   * @param playerSessionId - Identifier for the player session that's
   * attempting to be accepted.
   * @param gameSessionId - Identifier for the current game session that the
   * player session is attempting to join.
   */
  public async acceptPlayerSession(
    playerSessionId: string,
    gameSessionId: string
  ): Promise<void> {
    const acceptPlayerSessionMessage = new AcceptPlayerSession();

    acceptPlayerSessionMessage.playerSessionId = playerSessionId;
    acceptPlayerSessionMessage.gameSessionId = gameSessionId;

    await this.emit(
      AcceptPlayerSession.encode(acceptPlayerSessionMessage),
      AcceptPlayerSession.$type
    );
  }

  /**
   * Notify the GameLift service the specified player has left the game and
   * their spot is open for new players.
   *
   * @internal
   * @param playerSessionId - Identifier for the player session to remove from the game
   * session.
   * @param gameSessionId - Identifier for the particular game session that the player
   * session is being removed from.
   */
  public async removePlayerSession(
    playerSessionId: string,
    gameSessionId: string
  ): Promise<void> {
    const removePlayerSessionMessage = new RemovePlayerSession();

    removePlayerSessionMessage.playerSessionId = playerSessionId;
    removePlayerSessionMessage.gameSessionId = gameSessionId;

    await this.emit(
      RemovePlayerSession.encode(removePlayerSessionMessage),
      RemovePlayerSession.$type
    );
  }

  /**
   * Request the GameLIft service to describe player sessions according to the
   * given request.
   *
   * @internal
   * @param request - [DescribePlayerSessionsRequest] to send to the GameLift service.
   *
   * @returns Filled-out response message from GameLift service.
   *
   * [DescribePlayerSessionsRequest]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-datatypes.html
   */
  public async describePlayerSessions(
    request: DescribePlayerSessionsRequest
  ): Promise<DescribePlayerSessionsResponse> {
    return this.emit<DescribePlayerSessionsResponse>(
      DescribePlayerSessionsRequest.encode(request),
      DescribePlayerSessionsRequest.$type,
      DescribePlayerSessionsResponse
    );
  }

  /**
   * Send message to the GameLift service that updates the player session
   * creation policy.
   *
   * For more information look at [`UpdatePlayerSessionCreationPolicy()`].
   *
   * [`UpdatePlayerSessionCreationPolicy()`]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-updateplayersessioncreationpolicy
   * @internal
   * @param gameSessionId - Game session to update the policy for.
   * @param newPlayerSessionCreationPolicy - New policy for the specified game session.
   */
  public async updatePlayerSessionCreationPolicy(
    gameSessionId: string,
    newPlayerSessionCreationPolicy: "ACCEPT_ALL" | "DENY_ALL"
  ): Promise<void> {
    const updatePlayerSessionCreationPolicyMessage = new UpdatePlayerSessionCreationPolicy();

    updatePlayerSessionCreationPolicyMessage.gameSessionId = gameSessionId;
    updatePlayerSessionCreationPolicyMessage.newPlayerSessionCreationPolicy = newPlayerSessionCreationPolicy;

    await this.emit(
      UpdatePlayerSessionCreationPolicy.encode(
        updatePlayerSessionCreationPolicyMessage
      ),
      UpdatePlayerSessionCreationPolicy.$type
    );
  }

  /**
   * Send the given
   * [`BackfillMatchmakingRequest`](https://docs.kontest.io/gamelift-pb/latest/classes/backfillmatchmakingrequest.html)
   * to the GameLift service.
   *
   * @param request - `BackfillMatchmakingRequest` that notifies the GameLift service
   * to find more players for the match.
   * @returns [`BackfillMatchmakingResponse`] message with the ticket ID for the request.
   *
   * [`BackfillMatchmakingResponse`]: https://docs.kontest.io/gamelift-pb/latest/classes/backfillmatchmakingresponse.html
   */
  public async backfillMatchmaking(
    request: BackfillMatchmakingRequest
  ): Promise<BackfillMatchmakingResponse> {
    const response = await this.emit<BackfillMatchmakingResponse>(
      BackfillMatchmakingRequest.encode(request),
      BackfillMatchmakingRequest.$type,
      BackfillMatchmakingResponse
    );

    return response;
  }

  /**
   * Instruct the GameLift service to stop matchmaking in the ticket given by the
   * request.
   *
   * @param request - [`StopMatchmakingRequest`] that identifies the matchmaking
   * request to stop.
   *
   * [`StopMatchmakingRequest`]: https://docs.kontest.io/gamelift-pb/latest/classes/stopmatchmakingrequest.html
   */
  public async stopMatchmaking(request: StopMatchmakingRequest): Promise<void> {
    await this.emit(
      StopMatchmakingRequest.encode(request),
      StopMatchmakingRequest.$type
    );
  }

  /**
   * Request the location of the files for creating a TLS secured server.
   *
   * @returns Object with the properties for setting up a TLS secured server.
   */
  public async getInstanceCertificate(): Promise<
    GetInstanceCertificateResponse
  > {
    const message = new GetInstanceCertificate();

    return this.emit<GetInstanceCertificateResponse>(
      GetInstanceCertificate.encode(message),
      GetInstanceCertificate.$type,
      GetInstanceCertificateResponse
    );
  }

  /**
   * Use the socket to the message to the GameLift service.
   *
   * @internal
   * @param eventName - Name of the event that's being emitted.
   * @param message - Procotol Buffer object that's serialized and sent as data.
   * @param responseMessage - Optional parameter that determines how to deserialize
   * the response, if applicable.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public async emit<T extends Message<T> = Message<object>>(
    messageWriter: Writer,
    messageType: Type,
    responseMessage?: typeof Message
  ): Promise<T> {
    debug(`sending '${messageType.name}' emit to GameLift`);

    return new Promise<T>(
      (resolve: (value?: T) => void, reject: (error?: Error) => void): void => {
        this.socket.emit(
          messageType.fullName,
          messageWriter.finish(),
          (success: boolean, response?: string): void => {
            debug(
              `response received for '${messageType.name}' event: (${success}, ${response})`
            );
            if (!success) {
              let message: string = undefined;
              const gameliftResponse = this.parseJsonDataIntoMessage<
                GameLiftResponse
              >(GameLiftResponse, response);

              if (response !== undefined && response !== null) {
                message = gameliftResponse.errorMessage;
              }

              reject(new ServiceCallFailedError(message));
              return;
            }

            // This emitted request is meant for a response, so fill it in
            // before resolving the promise.
            if (responseMessage) {
              // If GameLift was supposed to send a response but none was sent throw error
              if (!response) {
                reject(new ServiceCallFailedError("no response received"));
                return;
              }

              // GameLift response isn't valid for the given responseMessage
              // type
              let responseResult: T = null;
              try {
                responseResult = this.parseJsonDataIntoMessage<T>(
                  responseMessage,
                  response
                );
              } catch (error) {
                reject(
                  new ServiceCallFailedError(
                    `unable to parse response into '${responseMessage.$type.name}' message: ${error}`
                  )
                );
                return;
              }
              resolve(responseResult);
            } else {
              resolve(null);
            }
          }
        );
      }
    );
  }

  /**
   * Parse the given data into the message with error checking.
   *
   * @param message - Message object whose fields will be filled in.
   * @param data - JSON formatted data to fill the fields of the message.
   */
  private parseJsonDataIntoMessage<T extends Message<T>>(
    message: typeof Message,
    data: string
  ): T {
    let result: Message<T> = null;

    try {
      result = message.fromObject(JSON.parse(data));
    } catch (error) {
      // Special case. The response received from GameLift is just the ticket ID
      // without JSON object.
      if (message === BackfillMatchmakingResponse) {
        return message.fromObject({
          ticketId: data,
        }) as T;
      }

      debug(
        `error occurred while attempting to parse '${message.$type.name}' event message`
      );
      return null;
    }

    if (!result) {
      debug(`failed to parse '${message.$type.name}' event message data`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return result;
  }

  public socket: Socket;
}
