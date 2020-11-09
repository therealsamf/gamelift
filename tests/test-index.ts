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
import sinon from "sinon";

import * as gamelift from "../lib";
import {
  GameLiftCommonState,
  GameLiftServerState,
} from "../lib/gamelift-server-state";
import {
  NoGameSessionError,
  NotInitializedError,
  ProcessNotReadyError,
} from "../lib/exceptions";

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

  afterEach(async function (): Promise<void> {
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
        await new Promise((resolve: () => void): void => {
          networking.socket.once("disconnect", resolve);
          networking.socket.close();
        });
      }

      // @ts-ignore
      if (instance._healthCheckTimeout) {
        // @ts-ignore
        clearInterval(instance._healthCheckTimeout);
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
    createTestForSdkInitializedError(
      gamelift.processReady.bind({}, { port: null, onStartGameSession: null })
    );

    it("Alerts to the GameLift service that the process is ready to receive a game session", function (): void {});

    it("Begins health checking", function (): void {});
  });

  describe("getInstanceCertificate", function (): void {
    createTestForSdkInitializedError(gamelift.getInstanceCertificate);

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
    createTestForSdkInitializedError(gamelift.activateGameSession);

    createTestForNoGameSessionError(gamelift.activateGameSession);

    it("Informs the GameLift service that the process is ready to receive player connections", function (): void {});
  });

  describe("getGameSessionId", function (): void {
    createTestForSdkInitializedError(
      async (): Promise<string> => {
        return await Promise.resolve(gamelift.getGameSessionId());
      }
    );

    createTestForNoGameSessionError(
      async (): Promise<string> => {
        return await Promise.resolve(gamelift.getGameSessionId());
      }
    );

    createTestForProcessNotReady(
      async (): Promise<string> => {
        return await Promise.resolve(gamelift.getGameSessionId());
      }
    );

    it("Retrieves the correct game session ID when a game session has been assigned to the process", function (): void {});
  });

  describe("acceptPlayerSession", function (): void {
    createTestForSdkInitializedError(gamelift.acceptPlayerSession.bind({}, ""));

    createTestForNoGameSessionError(gamelift.acceptPlayerSession.bind({}, ""));

    it("Alerts the caller that the player session ID was invalid if the GameLift service responds with an error", function (): void {});

    it("It correctly informs the GameLift service that the player session was accepted", function (): void {});
  });

  describe("describePlayerSessions", function (): void {
    createTestForSdkInitializedError(
      gamelift.describePlayerSessions.bind({}, null)
    );

    createTestForProcessNotReady(
      gamelift.describePlayerSessions.bind({}, null)
    );

    it("Is correctly received by the GameLift service", function (): void {});
  });

  describe("updatePlayerSessionCreationPolicy", function (): void {
    createTestForSdkInitializedError(
      gamelift.updatePlayerSessionCreationPolicy.bind({}, "ACCEPT_ALL")
    );

    createTestForNoGameSessionError(
      gamelift.updatePlayerSessionCreationPolicy.bind({}, "ACCEPT_ALL")
    );

    it("Correctly serializes a Protocol Buffer request that can be properly received by the GameLift service", function (): void {});
  });

  describe("removePlayerSession", function (): void {
    createTestForSdkInitializedError(gamelift.removePlayerSession.bind({}, ""));

    createTestForProcessNotReady(gamelift.removePlayerSession.bind({}, ""));

    createTestForNoGameSessionError(gamelift.removePlayerSession.bind({}, ""));

    it("It correctly informs the GameLift service that the player session has been removed", function (): void {});
  });

  // describe("startMatchBackfill", function (): void {});
  // describe("stopMatchBackfill", function (): void {});

  describe("terminateGameSession", function (): void {
    createTestForSdkInitializedError(gamelift.terminateGameSession);

    createTestForNoGameSessionError(gamelift.terminateGameSession);

    it("It sends a terminate game session event to the GameLift process which is correctly received", function (): void {});
  });

  describe("getTerminationTime", function (): void {
    createTestForSdkInitializedError(
      // This callback is weird because I need to make sure it isn't invoked
      // immediately
      async (): Promise<number> => {
        return await Promise.resolve(gamelift.getTerminationTime());
      }
    );

    it("Returns that termination time that was sent & set from the GameLift service", function (): void {});
  });

  describe("processEnding", function (): void {
    createTestForSdkInitializedError(gamelift.processEnding);

    it("Correctly informs the GameLift service that the process is ending", function (): void {});
  });
});

/**
 * Utility function for creating a test that the given promise-producing function
 * rejects with the `NotInitializedError`.
 *
 * This function reduces code duplication.
 * @param callable - Function that produce a promise that is rejected.
 */
function createTestForSdkInitializedError(
  callable: () => PromiseLike<any>
): void {
  return createTestForCatchError({
    errorType: NotInitializedError,
    testTitleSuffix: " if the SDK hasn't been initialized",
    callable,
  });
}

/**
 * Utility function for creating a test htat the given promise-producing function
 * rejects with `ProcessNotReadyError`.
 *
 * @param callable - Function that produces a promise taht should be rejected
 * `ProcessNotReadyError` lest the test fails.
 */
function createTestForProcessNotReady(callable: () => PromiseLike<any>): void {
  return createTestForCatchError({
    errorType: ProcessNotReadyError,
    testTitleSuffix:
      " error if the process hasn't informed the GameLift service that it's ready yet",
    callable,
    before: (): Promise<void> => {
      return gamelift.initSdk();
    },
  });
}

/**
 * Utility function for creating a test that the given promise-producing function
 * rejects with `NoGameSessionError`.
 *
 * This function reduces code duplication.
 * @param callable - Function that produces a promise that should be rejected with
 * the specified error.
 */
function createTestForNoGameSessionError(
  callable: () => PromiseLike<any>
): void {
  return createTestForCatchError({
    errorType: NoGameSessionError,
    testTitleSuffix: " if the process hasn't been assigned a game session yet",
    callable,
    before: async (): Promise<void> => {
      await gamelift.initSdk();

      const instance = GameLiftServerState.getInstance();

      // TS ignore line here because I'm pretty sure there's a bug in the typings for
      // sinon.
      // This is stubbed because it doesn't affect the semantics around throwing the no
      // game session error at all.
      // @ts-ignore
      sinon.stub(instance, "healthCheck");

      return gamelift.processReady({
        port: 2020,
        onStartGameSession: () => {},
      });
    },
  });
}

/**
 * Custom error class definition that allows me to pass any subclass definitions of
 * `Error` that have a different construtor signature from the original.
 */
interface CustomErrorConstructor {
  new (): Error;
}

/**
 * Defines the options used for creating tests for catching errors.
 */
interface ICreateTestForCatchErrorOptions {
  /**
   * Error class that should be thrown.
   */
  errorType: CustomErrorConstructor;

  /**
   * Suffix to append to the test title
   */
  testTitleSuffix?: string;

  /**
   * Function that returns a promise that should be rejecting with the specified error.
   */
  callable: () => PromiseLike<any>;

  /**
   * "Hook" that is run before the assertion is made.
   *
   * Should be use for any setup or anything like that.
   */
  before?: () => PromiseLike<any>;
}

/**
 * Utility function for generating test cases that watch for an error to be thrown.
 *
 * This function is meant to reduce the amount of code duplication since many of the
 * user-facing functions need to ensure that they throw the proper errors when called
 * incorrectly but I don't want to have to re-write the same test a dozen times.
 */
function createTestForCatchError({
  errorType,
  testTitleSuffix,
  callable,
  before,
}: ICreateTestForCatchErrorOptions) {
  it(`Throws '${errorType.name}'${testTitleSuffix}`, async function (): Promise<
    void
  > {
    await (before ? before() : Promise.resolve());

    return assert.isRejected(callable(), errorType);
  });
}
