/**
 * Interface to communication with the GameLift service.
 */

import type gamelift from "gamelift";
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
  constructor() {
    super("GameLift service call failed");
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
  onStartGameSessionHandler: (
    gameSession: gamelift.GameSession,
    ack: Ack
  ) => void;
  onUpdateGameSessionHandler: (
    updateGameSession: gamelift.UpdateGameSession,
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
  private onStartGameSession(data: Buffer, ack?: Ack): void {
    debug("socket received 'OnStartGameSession' event");

    const activateGameSessionMessage: gamelift.ActivateGameSession = new _gamelift.ActivateGameSession();

    let success = false;
    try {
      success = activateGameSessionMessage.fromJsonString(Buffer.from(data));
    } catch (error) {
      debug(
        "error occurred while attempting to parse 'OnStartGameSession' event message"
      );
      return;
    }

    if (!success) {
      debug("failed to parse 'OnStartGameSession' event message data");
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
    data: Buffer,
    ack?: (response: boolean) => void
  ): void {
    const updateGameSession: gamelift.UpdateGameSession = new _gamelift.UpdateGameSession();

    let success = false;
    try {
      success = updateGameSession.fromString(data);
    } catch (error) {
      debug(
        "error occurred while attempting to parse 'OnUpdateGameSession' event message"
      );
      return;
    }

    if (!success) {
      debug("failed to parse 'OnUpdateGameSession' event message data");
      return;
    }

    const _ack: Ack = ack || NOOP;
    this.handler.onUpdateGameSessionHandler(updateGameSession, _ack);
  }

  /**
   * Handle the "OnTerminateProcess" event from the GameLift service.
   *
   * This will construct the TerminateProcessEvent object before passing it off to the
   * user-defined handler.
   *
   * @internal
   * @param data Raw data received from the socket.io client.
   * @param ack ACK function for alerting the GameLift service whether creation was
   *   successful.
   */
  private onTerminateProcess(
    data: string,
    ack: (response: boolean) => void
  ): void {}

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
    const processReadyMessage: gamelift.ProcessReady = new _gamelift.ProcessReady();
    processReadyMessage.port = port;

    if (logParameters) {
      processReadyMessage.logPathsToUpload = logParameters.logPaths || [];
    }

    await this.emit(processReadyMessage);
  }

  /**
   * Send a message to notify the GameLift service that the game session has
   * been activated and is ready to receive player sessions.
   *
   *
   */
  public async activateGameSession(gameSessionId: string): Promise<void> {
    const gameSessionActivateMessage: gamelift.GameSessionActivate = new _gamelift.GameSessionActivate();

    gameSessionActivateMessage.gameSessionId = gameSessionId;

    await this.emit(gameSessionActivateMessage);
  }

  /**
   * Use the socket to the message to the GameLift service.
   *
   * @internal
   * @param eventName Name of the event that's being emitted.
   * @param message Procotol Buffer object that's serialized and sent as data.
   */
  public async emit(message: gamelift.Message): Promise<void> {
    debug("sending '%s' emit to GameLift", message.getTypeName());

    await new Promise(
      (resolve: () => void, reject: (error?: Error) => void): void => {
        this.socket.emit(
          message.getTypeName(),
          message.toString(),
          (success: boolean, response?: string): void => {
            debug(
              "response received for '%s' event: (%s, %s)",
              message.getTypeName(),
              success,
              response
            );
            if (!success) {
              // TODO: Parse the response and give an actually useful error
              // that was received from GameLift service.
              reject(new ServiceCallFailedError());
            } else {
              resolve();
            }
          }
        );
      }
    );
  }

  private socket: SocketIOClient.Socket;
}
