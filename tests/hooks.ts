/**
 * @fileoverview Defines [root hooks](https://mochajs.org/#defining-a-root-hook-plugin) for the test suite.
 */

import * as childProcess from "child_process";

/** @internal */
export const mochaHooks = {
  /**
   * @type childProcess.ChildProcess
   */
  gameLiftLocalProcess: null,

  /**
   * Mocha.js hook function for starting up GameLiftLocal.
   *
   * This hook waits for the GameLiftLocal service to be started by monitoring its
   * STDOUT before finishing.
   * @param done = Mocha.js asynchronous hook done callback.
   */
  beforeEach(done: (error?: Error) => void) {
    // Takes a bit for the GameLiftLocal server to start
    this.timeout(3000);

    const gameLiftLocalProcess = childProcess.spawn("java", [
      "-jar",
      "/usr/local/src/GameLift_09_17_2020/GameLiftLocal-1.0.5/GameLiftLocal.jar",
    ]);

    gameLiftLocalProcess.once("error", done);
    gameLiftLocalProcess.stdout.on("data", (data: string): void => {
      gameLiftLocalProcess.removeListener("error", done);
      if (data.includes("WebSocket Server started")) {
        done();
      }
    });

    this.gameLiftLocalProcess = gameLiftLocalProcess;
  },

  /**
   * Mocha.js hook function for killing the GameLiftLocal process.
   */
  afterEach() {
    this.gameLiftLocalProcess.stdout.removeAllListeners();
    (this.gameLiftLocalProcess as childProcess.ChildProcess).kill("SIGTERM");
  },
};
