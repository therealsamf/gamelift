/**
 * Interface to communication with the GameLift service.
 */

import type {
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
  Message,
  GameLiftResponse,
  TerminateProcess,
  ProcessEnding,
} from "gamelift";
import bindings from "bindings";
import SocketIOClient from "socket.io-client";
import _debug from "debug";

import type { LogParameters } from "./types";

const debug = _debug("gamelift.io:network");
const _gamelift = bindings("gamelift.node");

/**
 * @hidden
 */
const NOOP = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

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
   * @param inSocket
   */
  public constructor(socket: SocketIOClient.Socket, handler: HandlerFunctions) {
    this.socket = socket;
    this.handler = handler;

    this.configureClient(this.socket);
  }

  /**
   * Connect to the Gamelift service.
   *
   * @internal
   * @param socket
   */
  public async performConnect(socket: SocketIOClient.Socket): Promise<void> {
    socket.connect();

    await new Promise(
      (resolve: () => void, reject: (error?: Error) => void): void => {
        socket.on("error", reject);
        socket.on("connect_error", reject);

        socket.once("connect", () => {
          debug('socket "%s" connected to GameLift service', socket.id);

          socket.off("error", reject);
          socket.off("connect_handler", reject);
          resolve();
        });
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
   * These handlers include both socket.io-specific events and the events used by
   *   Gamelift
   * @internal
   *
   * @param socket
   */
  private configureClient(socket: SocketIOClient.Socket): void {
    socket.on("disconnect", this.onClose.bind(this, socket));

    socket.io.reconnectionAttempts(Network.RECONNECT_ATTEMPTS);

    this.setupClientHandlers(socket);
  }

  /**
   * Attach the event handlers to the given socket.io client object.
   *
   * @internal
   * @param socket
   */
  private setupClientHandlers(socket): void {
    socket.on("StartGameSession", this.onStartGameSession.bind(this));
    socket.on("UpdateGameSession", this.onUpdateGameSession.bind(this));
    socket.on("TerminateProcess", this.onTerminateProcess.bind(this));
  }

  /**
   * Close handler for the socket.io client.
   *
   * Removes all event listeners from the socket object.
   *
   * @internal
   * @param socket
   */
  private onClose(socket: SocketIOClient.Socket): void {
    debug("socket disconnected");
    socket.off();
  }

  /**
   * Handle the "StartGameSession" event from the GameLift service.
   *
   * This will construct the GameSession object before passing it off to user-defined
   * handler.
   *
   * @internal
   * @param data Raw data received from the socket.io client.
   * @param ack ACK function for alerting the GameLift service whether creation was
   *   successful.
   */
  private onStartGameSession(data: string, ack?: Ack): void {
    debug("socket received 'OnStartGameSession' event");

    const activateGameSessionMessage: ActivateGameSession = new _gamelift.ActivateGameSession();

    if (!this.parseJsonDataIntoMessage(activateGameSessionMessage, data)) {
      return;
    }

    const gameSession = activateGameSessionMessage.gameSession;

    const _ack: Ack = ack || NOOP;
    this.handler.onStartGameSessionHandler(gameSession, _ack);
  }

  /**
   * Handle the "UpdateGameSession" event from the GameLift service.
   *
   * This will construct the UpdateGameSession object before passing it off to the
   * user-defined handler.
   *
   * @internal
   * @param _name Unused name parameter.
   * @param data Raw data received from the socket.io client.
   * @param ack ACK function for alerting the GameLift service whether creation was
   *   successful.
   */
  private onUpdateGameSession(
    data: string,
    ack?: (response: boolean) => void
  ): void {
    const updateGameSession: UpdateGameSession = new _gamelift.UpdateGameSession();

    if (!this.parseJsonDataIntoMessage(updateGameSession, data)) {
      return;
    }

    const _ack: Ack = ack || NOOP;
    this.handler.onUpdateGameSessionHandler(updateGameSession, _ack);
  }

  /**
   * Handle the "OnTerminateProcess" event from the GameLift service.
   *
   * This will retrieve the termination time in UNIX epoch seconds before
   * calling the handler.
   *
   * @internal
   * @param data Raw data received from the socket.io client.
   */
  private onTerminateProcess(data: string): void {
    const terminateProcessMessage: TerminateProcess = new _gamelift.TerminateProcess();

    if (!this.parseJsonDataIntoMessage(terminateProcessMessage, data)) {
      // If unable to determine the termination time then default value is now + 4.5 minutes
      terminateProcessMessage.terminationTime = Date.now() / 1000 + 4.5 * 60;
    }

    this.handler.onTerminateSessionHandler(
      terminateProcessMessage.terminationTime
    );
  }

  /**
   * Send the given health status to the GameLift service.
   *
   * @internal
   * @param healthy
   */
  public reportHealth(healthy: boolean): void {}

  /**
   * Send the message to the GameLift service that the process is ready for receiving
   * a game session.
   *
   * @internal
   * @param port Port number that informs the GameLift service which port it should be
   *   telling clients to connect to.
   * @param logParameters Log parameter object that allows the developer to determine
   *   which files the GameLift service preserves after the process has been destroyed.
   */
  public async processReady(
    port: number,
    logParameters?: LogParameters
  ): Promise<void> {
    const processReadyMessage: ProcessReady = new _gamelift.ProcessReady();
    processReadyMessage.port = port;

    if (logParameters) {
      processReadyMessage.logPathsToUpload = logParameters.logPaths || [];
    }

    await this.emit(processReadyMessage);
  }

  /**
   *
   * @param gameSessionId
   */
  public async processEnding(): Promise<void> {
    const processEndingMessage: ProcessEnding = new _gamelift.ProcessEnding();

    await this.emit(processEndingMessage);
  }

  /**
   * Send a message to notify the GameLift service that the game session has
   * been activated and is ready to receive player sessions.
   *
   * @internal
   * @param gameSessionId - Identifier for the game session.
   */
  public async activateGameSession(gameSessionId: string): Promise<void> {
    const gameSessionActivateMessage: GameSessionActivate = new _gamelift.GameSessionActivate();

    gameSessionActivateMessage.gameSessionId = gameSessionId;

    await this.emit(gameSessionActivateMessage);
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
    const acceptPlayerSessionMessage: AcceptPlayerSession = new _gamelift.AcceptPlayerSession();

    acceptPlayerSessionMessage.playerSessionId = playerSessionId;
    acceptPlayerSessionMessage.gameSessionId = gameSessionId;

    await this.emit(acceptPlayerSessionMessage);
  }

  /**
   * Request the GameLIft service to describe player sessions according to the
   * given request.
   *
   * @param request - [DescribePlayerSessionsRequest] to send to the GameLift service.
   *
   * @return Filled-out response message from GameLift service.
   *
   * [DescribePlayerSessionsRequest]: https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-datatypes.html
   */
  public async describePlayerSessions(
    request: DescribePlayerSessionsRequest
  ): Promise<DescribePlayerSessionsResponse> {
    const response: DescribePlayerSessionsResponse = new _gamelift.DescribePlayerSessionsResponse();

    await this.emit(request, response);
    return response;
  }

  /**
   * Request the location of the files for creating a TLS secured server.
   *
   * @return Object with the properties for setting up a TLS secured server.
   */
  public async getInstanceCertificate(): Promise<
    GetInstanceCertificateResponse
  > {
    const response: GetInstanceCertificateResponse = new _gamelift.GetInstanceCertificateResponse();
    const message: GetInstanceCertificate = new _gamelift.GetInstanceCertificate();

    await this.emit(message, response);

    return response;
  }

  /**
   * Use the socket to the message to the GameLift service.
   *
   * @internal
   * @param eventName Name of the event that's being emitted.
   * @param message Procotol Buffer object that's serialized and sent as data.
   */
  public async emit(
    message: Message,
    responseMessage?: Message
  ): Promise<void> {
    debug("sending '%s' emit to GameLift", message.getTypeName());

    await new Promise(
      (resolve: () => void, reject: (error?: Error) => void): void => {
        this.socket.emit(
          message.getTypeName(),
          message.toString(),
          (success: boolean, response?: string): void => {
            debug(
              `response received for '${message.getTypeName()}' event: (${success}, ${response})`
            );
            if (!success) {
              let message: string = undefined;
              const gameLiftResponseMessage: GameLiftResponse = new _gamelift.GameLiftResponse();
              if (
                response !== undefined &&
                response !== null &&
                this.parseJsonDataIntoMessage(gameLiftResponseMessage, response)
              ) {
                message = gameLiftResponseMessage.errorMessage;
              }

              reject(new ServiceCallFailedError(message));
            } else {
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
                if (!this.parseJsonDataIntoMessage(responseMessage, response)) {
                  reject(
                    new ServiceCallFailedError(
                      `unable to parse response into '${responseMessage.getTypeName()}' message`
                    )
                  );
                  return;
                }
                // At this point the response message has been populated.
              }
              resolve();
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
  private parseJsonDataIntoMessage(message: Message, data: string): boolean {
    let success = false;
    try {
      success = message.fromJsonString(Buffer.from(data));
    } catch (error) {
      debug(
        `error occurred while attempting to parse '${message.getTypeName()}' event message`
      );
      return false;
    }

    if (!success) {
      debug(`failed to parse '${message.getTypeName()}' event message data`);
      return false;
    }

    return true;
  }

  private socket: SocketIOClient.Socket;
}
