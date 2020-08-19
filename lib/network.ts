/**
 * Interface to communication with the GameLift service.
 */

import SocketIOClient from "socket.io-client";
import _debug from "debug";

const debug = _debug("gamelift.io:network");

const LOCALHOST = "http://127.0.0.1:5757";

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
   * Construct Network object.
   *
   * Configures & connects the two given sockets for communcation with Gamelift.
   * @internal
   * @param inSocket
   */
  public constructor(socket: SocketIOClient.Socket) {
    this.socket = socket;

    this.configureClient(this.socket);
  }

  /**
   * Connect to the Gamelift service.
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
   * @param _name Unused name parameter.
   * @param data Raw data received from the socket.io client.
   * @param ack ACK function for alerting the GameLift service whether creation was
   *   successful.
   */
  private onStartGameSession(
    _name: string,
    data: string,
    ack: (response: boolean) => void
  ): void {}

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

  private socket: SocketIOClient.Socket;
}
