/**
 * @fileoverview Declaration file for the types from C++ addon.
 */

declare module 'gamelift' {
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
    public toString(): string;


    /**
     * Parse the given string to fill out the message's fields.
     *
     * @internal
     * @param value
     */
    public fromString(value: string): boolean;
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

}
