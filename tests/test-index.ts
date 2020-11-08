/**
 * @fileoverview Root level test suite for GameLift library.
 *
 * These tests are more of an integration test for every user-exposed function of the
 * SDK.
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

  describe("initSdk", function (): void {
    /**
     * Test that the SDK connects to the GameLiftLocal instance.
     *
     * The assertion is determined to be satisfied by watching GameLiftLocal's process
     * output.
     */
    it("Connects to the local GameLift service", async function (): Promise<
      void
    > {
      let boundEventHandler: (data: Buffer) => void = null;

      /**
       * Simple function that reads GameLiftLocal's STDOUT to determine if the SDK
       * connected successfully.
       * @param output - STDOUT
       */
      function readOutputData(resolve: () => void, data: Buffer): void {
        const output = data.toString("utf-8");

        if (
          output.includes("client connected") &&
          output.includes(`${process.ppid}`)
        ) {
          resolve();
        }
      }

      const initializationPromise = new Promise((resolve: () => void): void => {
        boundEventHandler = readOutputData.bind({}, resolve);
        gameLiftLocalProcess.stdout.on("data", boundEventHandler);
      });

      const resultPromise = Promise.race([
        initializationPromise,
        new Promise((_resolve: () => void, reject: () => void): void => {
          setTimeout(reject, 3000);
        }),
      ])
        .catch((error?: Error): Promise<Error> => Promise.resolve(error))
        .then(
          (error?: Error): Promise<void> => {
            gameLiftLocalProcess.stdout.off("data", boundEventHandler);

            return error ? Promise.reject(error) : Promise.resolve();
          }
        );

      await gamelift.initSdk();
      return assert.isFulfilled(
        resultPromise,
        "GameLiftLocal never reported the process connecting"
      );
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

    it("Alerts to the GameLift service that the process is ready to receive a game session", function (): void {});

    it("Begins health checking", function (): void {});
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

  describe("activateGameSession", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'NoGameSessionError' if called before a game session has been assigned to the process", function (): void {});

    it("Informs the GameLift service that the process is ready to receive player connections", function (): void {});
  });

  describe("getGameSessionId", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'ProcessNotReady' error if the process hasn't informed the GameLift service that it's ready yet.", function (): void {});

    it("Throws 'NoGameSessionError' error if the process hasn't been assigned a game session yet", function (): void {});

    it("Retrieves the correct game session ID when a game session has been assigned to the process", function (): void {});
  });

  describe("acceptPlayerSession", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'NoGameSessionError' if called before a game session has been assigned to the process", function (): void {});

    it("Alerts the caller that the player session ID was invalid if the GameLift service responds with an error", function (): void {});

    it("It correctly informs the GameLift service that the player session was accepted", function (): void {});
  });

  describe("describePlayerSessions", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'ProcessNotReady' error if the process hasn't informed the GameLift service that it's ready yet.", function (): void {});

    it("Is correctly received by the GameLift service", function (): void {});
  });

  describe("updatePlayerSessionCreationPolicy", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'NoGameSessionError' if called before a game session has been assigned to the process", function (): void {});

    it("Correctly serializes a Protocol Buffer request that can be properly received by the GameLift service", function (): void {});
  });

  describe("removePlayerSession", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'ProcessNotReady' error if the process hasn't informed the GameLift service that it's ready yet.", function (): void {});

    it("Throws 'NoGameSessionError' if called before a game session has been assigned to the process", function (): void {});

    it("It correctly informs the GameLift service that the player session has been removed", function (): void {});
  });

  // describe("startMatchBackfill", function (): void {});
  // describe("stopMatchBackfill", function (): void {});

  describe("terminateGameSession", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Throws 'NoGameSessionError' if called before a game session has been assigned to the process", function (): void {});

    it("It sends a terminate game session event to the GameLift process which is correctly received", function(): void {});
  });

  describe("getTerminationTime", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Returns that terminatino time that was sent & set from the GameLift service", function(): void {});
  });

  describe("processEnding", function (): void {
    it("Throws 'NotInitializedError' if the SDK hasn't been initialized", function (): void {});

    it("Correctly informs the GameLift service that the process is ending", function(): void {});
  });
});
