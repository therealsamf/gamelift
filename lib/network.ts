/**
 * Interface to communication with the GameLift service.
 */

import type gamelift from "gamelift";
import bindings from "bindings";
import SocketIOClient from "socket.io-client";
import _debug from "debug";

import type { GameSession } from "./game-session";
import type { LogParameters, UpdateGameSession } from "./types";

const debug = _debug("gamelift.io:network");
const _gamelift = bindings("gamelift.node");

const NOOP = () => {};

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
  static RECONNECT_ATTEMPTS: number = 3;

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
   * @param socket
   */
  private onClose(socket: SocketIOClient.Socket): void {
    debug('socket "%s" disconnected', socket.id);
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
    const onStartGameSessionMessage: gamelift.OnStartGameSession = new _gamelift.OnStartGameSession();

    let success = false;
    try {
      success = onStartGameSessionMessage.fromString(data);
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

    const gameSession = onStartGameSessionMessage.gameSession;

    let _ack: Ack = ack || NOOP;
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
    _name: string,
    data: string,
    ack: (response: boolean) => void
  ): void {}

  /**
   * Handle the "OnTerminateProcess" event from the GameLift service.
   *
   * This will construct the TerminateProcessEvent object before passing it off to the
   * user-defined handler.
   *
   * @internal
   * @param _name Unused name parameter.
   * @param data Raw data received from the socket.io client.
   * @param ack ACK function for alerting the GameLift service whether creation was
   *   successful.
   */
  private onTerminateProcess(
    _name: string,
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

    const self = this;
    await new Promise(
      (resolve: () => void, reject: (error?: Error) => void): void => {
        self.socket.emit(
          "ProcessReady",
          processReadyMessage.toString(),
          (response: boolean): void => {
            if (!response) {
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
