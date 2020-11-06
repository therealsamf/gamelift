/**
 * @fileoverview Root level test suite for GameLift library.
 */

import * as childProcess from "child_process";
import * as path from "path";

import { GetInstanceCertificateResponse } from "@kontest/gamelift-pb";
import { assert, use } from "chai";
use(require("chai-as-promised"));

import * as gamelift from "../lib";
import {
  GameLiftCommonState,
  GameLiftServerState,
} from "../lib/gamelift-server-state";
import { NotInitializedError } from "../lib/exceptions";

describe("gamelift", function (): void {
  /**
   * @type childProcess.ChildProcess
   */
  let gameLiftLocalProcess: childProcess.ChildProcess = null;

  /**
   * Mocha.js hook function for starting up GameLiftLocal.
   *
   * This hook waits for the GameLiftLocal service to be started by monitoring its
   * STDOUT before finishing.
   * @param done - Mocha.js asynchronous hook done callback.
   */
  before((done: (error?: Error) => void): void => {
    // Takes a bit for the GameLiftLocal server to start
    this.timeout(3000);

    gameLiftLocalProcess = childProcess.spawn("java", [
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
  });

  /**
   * Mocha.js hook function for killing the GameLiftLocal process.
   */
  after(async function (): Promise<void> {
    this.timeout(60 * 1000);

    gameLiftLocalProcess.stdout.removeAllListeners();

    return await new Promise((resolve: () => void): void => {
      gameLiftLocalProcess.kill("SIGKILL");
      gameLiftLocalProcess.once("exit", () => resolve());
    });
  });

  afterEach(function (): void {
    // Conditionally grab the current GameLift server state singleton
    let instance: GameLiftServerState = null;
    try {
      instance = GameLiftServerState.getInstance() as GameLiftServerState;
    } catch (error) {
      if (!(error instanceof NotInitializedError)) {
        throw error;
      } else {
        instance = null;
      }
    }

    // If the singleton returned a valid stat then de-initialize it.
    if (instance) {
      const networking = instance.networking;

      if (networking && networking.connected()) {
        networking.socket.close();
      }

      // instance is a private member variable of GameLiftCommonState so ignore the
      // TypeScript complaint.
      // @ts-ignore
      GameLiftCommonState.instance = undefined;
    }
  });

  describe("getInstanceCertificate", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): PromiseLike<
      void
    > {
      return assert.isRejected(
        gamelift.getInstanceCertificate(),
        NotInitializedError
      );
    });

    it("Retrieves the location of the certificates", async function (): Promise<
      void
    > {
      await gamelift.initSdk();

      const expectedResult = GetInstanceCertificateResponse.create({
        certificatePath: path.resolve("gameLiftLocalCertificate.pem"),

        // NOTE: Even though GameLiftLocal creates a gameLiftLocalCertificateChain.pem
        // file, it doesn't utilize it in this field. It sets it to the certificate
        // path. I don't know enough about SSL/TLS certs to know if that's correct
        // behavior or not.
        certificateChainPath: path.resolve("gameLiftLocalCertificate.pem"),
        privateKeyPath: path.resolve("gameLiftLocalPrivateKey.pem"),
        hostName: "localhost",
        rootCertificatePath: path.resolve("gameLiftLocalRootCertificate.pem"),
      });

      await assert.becomes(gamelift.getInstanceCertificate(), expectedResult);
    });
  });

  describe("processReady", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): PromiseLike<
      void
    > {
      const processParameters = {
        port: null,
        onStartGameSession: null,
      };

      return assert.isRejected(
        gamelift.processReady(processParameters),
        NotInitializedError
      );
    });
  });
});
