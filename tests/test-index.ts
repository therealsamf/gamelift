/**
 * @fileoverview Root level test suite for GameLift library.
 *
 * These tests are more of an integration test for every user-exposed function of the
 * SDK.
 */

import * as childProcess from "child_process";
import * as path from "path";

import { GameLiftClient } from "@aws-sdk/client-gamelift-node/GameLiftClient";
import { _UnmarshalledGameSession } from "@aws-sdk/client-gamelift-node/types/_GameSession";
import {
  CreateGameSessionCommand,
  CreateGameSessionOutput,
} from "@aws-sdk/client-gamelift-node/commands/CreateGameSessionCommand";
import { CreatePlayerSessionCommand } from "@aws-sdk/client-gamelift-node/commands/CreatePlayerSessionCommand";
import {
  AttributeValue,
  BackfillMatchmakingRequest,
  DescribePlayerSessionsRequest,
  GameSession,
  GetInstanceCertificateResponse,
  StopMatchmakingRequest,
} from "@kontest/gamelift-pb";
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
      "GameLift_11_11_2020/GameLiftLocal-1.0.5/GameLiftLocal.jar",
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
    createTestForGameLiftLocal({
      title: "Connects to the local GameLift service",
      searchString: "client connected",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      _before: gamelift.initSdk,
      message: "GameLiftLocal never reported the process connecting",
    });
  });

  describe("processReady", function (): void {
    createTestForSdkInitializedError(
      gamelift.processReady.bind({}, { port: null, onStartGameSession: null })
    );

    createTestForGameLiftLocal({
      title:
        "Alerts to the GameLift service that the process is ready to receive a game session",
      searchString: "onProcessReady received",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      timeout: 3000,
      _before: async (): Promise<void> => {
        await gamelift.initSdk();

        // Stub the health checking, since it's not required in order to determine if
        // the request was successfully recieved by the GameLiftLocal process.
        sinon.stub(
          GameLiftServerState.getInstance() as GameLiftServerState,
          "healthCheck"
        );
        await gamelift.processReady({
          port: 2020,
          onStartGameSession: () => {},
        });
      },
    });

    const healthCheckSetup = async function (): Promise<void> {
      await gamelift.initSdk();

      const instance = GameLiftServerState.getInstance() as GameLiftServerState;
      // Update the healthcheck timeout to half a second
      GameLiftServerState.HEALTHCHECK_TIMEOUT = 500;

      const healthCheckSpy = sinon.spy(instance, "healthCheck");
      const onHealthCheck = sinon.stub().returns(Promise.resolve(true));

      await gamelift.processReady({
        port: 2020,
        onStartGameSession: () => {},
        onHealthCheck,
      });

      assert(healthCheckSpy.called, "health checking was never started");
    };

    createTestForGameLiftLocal({
      title: "Begins health checking",
      searchString: ["onReportHealth received", "with health status: healthy"],
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      _before: healthCheckSetup,
      _after: (): Promise<void> => {
        const instance = GameLiftServerState.getInstance() as GameLiftServerState;

        // TS ignore because hte _healthcheckTimeout is a private member variable
        // @ts-ignore
        clearInterval(instance._healthcheckTimeout);
        return Promise.resolve();
      },
    });
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

    // Setup function for creating a game and resolving once the game session activate
    // has been completed
    const activateGameSessionSetup = function (): Promise<void> {
      return new Promise<void>(
        async (resolve: () => void): Promise<void> => {
          const onStartGameSession = async (): Promise<void> => {
            await gamelift.activateGameSession();
            resolve();
          };

          await gamelift.initSdk();
          // Stub the health checking so it doesn't get in the way.
          sinon.stub(
            GameLiftServerState.getInstance() as GameLiftServerState,
            "healthCheck"
          );
          await gamelift.processReady({
            port: 2020,
            onStartGameSession,
          });

          await createGameSession();
        }
      );
    };

    createTestForGameLiftLocal({
      title:
        "Informs the GameLift service that the process is ready to receive player connections",
      searchString: "onGameSessionActivate received",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      _before: activateGameSessionSetup,
      _after: async (): Promise<void> => {
        await gamelift.processEnding();
      },
    });
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

    it("Retrieves the correct game session ID when a game session has been assigned to the process", async function (): Promise<
      void
    > {
      await gamelift.initSdk();

      // Stub the health checking because it can keep the NodeJS process from closing
      sinon.stub(
        GameLiftServerState.getInstance() as GameLiftServerState,
        "healthCheck"
      );
      await gamelift.processReady({
        port: 2020,
        onStartGameSession: () => {},
      });

      const response = await createGameSession();
      const gameSessionId = response.GameSession.GameSessionId;

      assert.strictEqual(gamelift.getGameSessionId(), gameSessionId);
    });
  });

  describe("acceptPlayerSession", function (): void {
    createTestForSdkInitializedError(gamelift.acceptPlayerSession.bind({}, ""));

    createTestForNoGameSessionError(gamelift.acceptPlayerSession.bind({}, ""));

    it("Alerts the caller that the player session ID was invalid if the GameLift service responds with an error", async function (): Promise<
      void
    > {
      await gamelift.initSdk();

      await new Promise(
        async (resolve: () => void): Promise<void> => {
          // Stub the health checking so it doesn't get in the way.
          sinon.stub(
            GameLiftServerState.getInstance() as GameLiftServerState,
            "healthCheck"
          );
          await gamelift.processReady({
            port: 2020,
            onStartGameSession: async (): Promise<void> => {
              await gamelift.activateGameSession();
              resolve();
            },
          });

          await createGameSession();
        }
      );

      return assert.isRejected(gamelift.acceptPlayerSession(""));
    });

    it("Correctly informs the GameLift service that the player session was accepted", async function (): Promise<
      void
    > {
      await gamelift.initSdk();

      const gameSession = await new Promise(
        async (resolve: (_gameSession: GameSession) => void): Promise<void> => {
          // Stub the health checking so it doesn't get in the way.
          sinon.stub(
            GameLiftServerState.getInstance() as GameLiftServerState,
            "healthCheck"
          );
          await gamelift.processReady({
            port: 2020,
            onStartGameSession: (gameSession: GameSession): void => {
              gamelift.activateGameSession().then(() => resolve(gameSession));
            },
          });

          await createGameSession();
        }
      );

      const gameLift = new GameLiftClient({
        // Address of the local GameLiftLocal service
        endpoint: "http://localhost:8080",
      });

      const playerId = "player-1";
      const command = new CreatePlayerSessionCommand({
        GameSessionId: gameSession.gameSessionId,
        PlayerId: playerId,
      });

      const response = await gameLift.send(command);
      return assert.isFulfilled(
        gamelift.acceptPlayerSession(response.PlayerSession.PlayerSessionId)
      );
    });
  });

  describe("describePlayerSessions", function (): void {
    createTestForSdkInitializedError(
      gamelift.describePlayerSessions.bind({}, null)
    );

    createTestForProcessNotReady(
      gamelift.describePlayerSessions.bind({}, null)
    );

    it("Is correctly received by the GameLift service", async function (): Promise<
      void
    > {
      await gamelift.initSdk();

      // Stub the health checking because it can keep the NodeJS process from closing
      sinon.stub(
        GameLiftServerState.getInstance() as GameLiftServerState,
        "healthCheck"
      );
      await new Promise((resolve: () => void): void => {
        gamelift
          .processReady({
            port: 2020,
            onStartGameSession: async (): Promise<void> => {
              await gamelift.activateGameSession();
              resolve();
            },
          })
          .then(createGameSession);
      });

      let gameSessionId: string =
        // @ts-ignore
        GameLiftServerState.getInstance().gameSessionId;

      try {
        // Sanity check
        assert.isNotEmpty(gameSessionId, "Invalid game session ID received");

        // Test that the describe player sessions request is responded to correctly with
        // an empty response object.
        // NOTE: This test is less about if the whole GameLift service works for this
        // request and more about if this library is able to complete the request
        // successfully.
        // TODO: At some point it may be worth it to create an even larger test that
        // creates many player sessions and tests the pagination of describing all of
        // them.
        const describePlayerSessionsRequest = new DescribePlayerSessionsRequest(
          {
            gameSessionId,
          }
        );
        const response = await gamelift.describePlayerSessions(
          describePlayerSessionsRequest
        );

        assert.isDefined(
          response.playerSessions,
          "'playerSessions' property on the DescribePlayerSessionsResponse message is undefined"
        );
        assert.isEmpty(response.playerSessions);
        assert.isDefined(
          response.nextToken,
          "'nextToken' is not defined for on the DescribePlayerSessionsResponse message"
        );
        assert.isEmpty(
          response.nextToken,
          "'nextToken' is not empty for empty game session"
        );
      } finally {
        await gamelift.processEnding();
      }
    });
  });

  describe("updatePlayerSessionCreationPolicy", function (): void {
    createTestForSdkInitializedError(
      gamelift.updatePlayerSessionCreationPolicy.bind({}, "ACCEPT_ALL")
    );

    createTestForNoGameSessionError(
      gamelift.updatePlayerSessionCreationPolicy.bind({}, "ACCEPT_ALL")
    );

    const updatePlayerSessionCreationPolicySetup = function (): Promise<void> {
      return new Promise<void>(
        async (resolve: () => void): Promise<void> => {
          await gamelift.initSdk();
          // Stub the health checking so it doesn't get in the way.
          sinon.stub(
            GameLiftServerState.getInstance() as GameLiftServerState,
            "healthCheck"
          );
          await gamelift.processReady({
            port: 2020,
            onStartGameSession: (): void => {
              gamelift.activateGameSession().then(() => resolve());
            },
          });

          await createGameSession();
        }
      ).then(
        (): Promise<void> =>
          gamelift.updatePlayerSessionCreationPolicy("DENY_ALL")
      );
    };

    createTestForGameLiftLocal({
      title:
        "Correctly serializes a Protocol Buffer request that can be properly received by the GameLift service",
      searchString: 'newPlayerSessionCreationPolicy: "DENY_ALL"',
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      _before: updatePlayerSessionCreationPolicySetup,
      _after: async (): Promise<void> => {
        await gamelift.processEnding();
      },
    });
  });

  describe("removePlayerSession", function (): void {
    createTestForSdkInitializedError(gamelift.removePlayerSession.bind({}, ""));

    createTestForProcessNotReady(gamelift.removePlayerSession.bind({}, ""));

    createTestForNoGameSessionError(gamelift.removePlayerSession.bind({}, ""));

    it("Correctly informs the GameLift service that the player session has been removed", async function (): Promise<
      void
    > {
      await gamelift.initSdk();

      const gameSession = await new Promise(
        async (resolve: (_gameSession: GameSession) => void): Promise<void> => {
          // Stub the health checking so it doesn't get in the way.
          sinon.stub(
            GameLiftServerState.getInstance() as GameLiftServerState,
            "healthCheck"
          );
          await gamelift.processReady({
            port: 2020,
            onStartGameSession: (gameSession: GameSession): void => {
              gamelift.activateGameSession().then(() => resolve(gameSession));
            },
          });

          await createGameSession();
        }
      );

      const gameLift = new GameLiftClient({
        // Address of the local GameLiftLocal service
        endpoint: "http://localhost:8080",
      });

      const playerId = "player-1";
      const command = new CreatePlayerSessionCommand({
        GameSessionId: gameSession.gameSessionId,
        PlayerId: playerId,
      });

      const response = await gameLift.send(command);
      await gamelift.acceptPlayerSession(
        response.PlayerSession.PlayerSessionId
      );

      return assert.isFulfilled(
        gamelift.removePlayerSession(response.PlayerSession.PlayerSessionId)
      );
    });
  });

  // StartMatchBackfill GameLift SDK request is not supported by GameLiftLocal
  //
  // The best this integration test can do is test that GameLiftLocal successfully
  // received the request.
  describe("startMatchBackfill", function (): void {
    createTestForSdkInitializedError(() => gamelift.startMatchBackfill(null));

    createTestForGameLiftLocal({
      title:
        "Successfully sends a request to the GameLift service to start backfilling the game session",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      searchString: "BackfillMatchmakingRequest received",
      _before: async (): Promise<void> => {
        await gamelift.initSdk();

        const gameSession = await new Promise<GameSession>(
          async (
            resolve: (gameSession: GameSession) => void
          ): Promise<void> => {
            // Stub the health checking so it doesn't get in the way.
            sinon.stub(
              GameLiftServerState.getInstance() as GameLiftServerState,
              "healthCheck"
            );
            await gamelift.processReady({
              port: 2020,
              onStartGameSession: (gameSession) => resolve(gameSession),
            });

            await createGameSession();
          }
        );

        // Example request data taken from:
        // https://docs.aws.amazon.com/gamelift/latest/developerguide/match-events.html
        const request = new BackfillMatchmakingRequest({
          gameSessionArn: gameSession.gameSessionId,
          matchmakingConfigurationArn:
            "arn:aws:gamelift:us-west-2:123456789012:matchmakingconfiguration/SampleConfiguration",
          players: [
            {
              playerId: "player-1",
              playerAttributes: {
                attribute: { N: 1, type: AttributeValue.NONE },
              },
            },
          ],
        });

        await gamelift.startMatchBackfill(request);
      },
      _after: () => gamelift.processEnding(),
    });
  });

  // StopMatchBackfill GameLift SDK request is not supported by GameLiftLocal.
  //
  // The best this integration test can do is test that GameLiftLocal successfully
  // received the request.
  describe("stopMatchBackfill", function (): void {
    createTestForSdkInitializedError(() =>
      gamelift.stopMatchBackfill(new StopMatchmakingRequest())
    );

    createTestForGameLiftLocal({
      title:
        "Successfully sends a request to the GameLift service to stop backfilling the game session",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      searchString: "StopMatchmakingRequest received",
      _before: async (): Promise<void> => {
        await gamelift.initSdk();

        const gameSession = await new Promise<GameSession>(
          async (
            resolve: (gameSession: GameSession) => void
          ): Promise<void> => {
            // Stub the health checking so it doesn't get in the way.
            sinon.stub(
              GameLiftServerState.getInstance() as GameLiftServerState,
              "healthCheck"
            );
            await gamelift.processReady({
              port: 2020,
              onStartGameSession: (gameSession) => resolve(gameSession),
            });

            await createGameSession();
          }
        );

        // Example request data taken from:
        // https://docs.aws.amazon.com/gamelift/latest/developerguide/match-events.html
        const request = new BackfillMatchmakingRequest({
          gameSessionArn: gameSession.gameSessionId,
          matchmakingConfigurationArn:
            "arn:aws:gamelift:us-west-2:123456789012:matchmakingconfiguration/SampleConfiguration",
          // @ts-ignore
          players: [{}],
        });
        const response = await gamelift.startMatchBackfill(request);

        const stopRequest = new StopMatchmakingRequest({
          gameSessionArn: gameSession.gameSessionId,
          matchmakingConfigurationArn:
            "arn:aws:gamelift:us-west-2:123456789012:matchmakingconfiguration/SampleConfiguration",
          ticketId: response.ticketId,
        });

        await gamelift.stopMatchBackfill(stopRequest);
      },
      _after: () => gamelift.processEnding(),
    });
  });

  describe("terminateGameSession", function (): void {
    createTestForSdkInitializedError(gamelift.terminateGameSession);

    createTestForNoGameSessionError(gamelift.terminateGameSession);

    // Setup function for creating a game and resolving once the game session has been
    // terminated.
    const terminateGameSessionSetup = async (): Promise<void> => {
      await gamelift.initSdk();

      await new Promise<GameSession>(
        async (resolve: () => void): Promise<void> => {
          // Stub the health checking so it doesn't get in the way.
          sinon.stub(
            GameLiftServerState.getInstance() as GameLiftServerState,
            "healthCheck"
          );
          await gamelift.processReady({
            port: 2020,
            onStartGameSession: () => resolve(),
          });

          await createGameSession();
        }
      );

      await gamelift.terminateGameSession();
    };

    createTestForGameLiftLocal({
      title:
        "Sends a terminate game session event to the GameLift process which is correctly received",
      searchString: "Handling game session terminate event",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      _before: terminateGameSessionSetup,
      _after: (): Promise<void> => gamelift.processEnding(),
    });
  });

  describe("getTerminationTime", function (): void {
    createTestForSdkInitializedError(
      // This callback is weird because I need to make sure it isn't invoked
      // immediately
      async (): Promise<number> => {
        return await Promise.resolve(gamelift.getTerminationTime());
      }
    );

    // I can't force the GameLiftLocal process to send the process termination message
    // to the gamelift library and cause the execution of the termination time to be
    // set. That will have to come from a more granular unit test where I mock out the
    // GameLiftLocal service.
    it.skip("Returns the termination time that was sent & set from the GameLift service", async function (): Promise<
      void
    > {});
  });

  describe("processEnding", function (): void {
    createTestForSdkInitializedError(gamelift.processEnding);

    createTestForGameLiftLocal({
      title:
        "Correctly informs the GameLift service that the process is ending",
      searchString: "onProcessEnding received",
      gameLiftLocalProcess: () => gameLiftLocalProcess,
      timeout: 3000,
      _before: async (): Promise<void> => {
        await gamelift.initSdk();

        // Stub the health checking, since it's not required in order to determine if
        // the request was successfully recieved by the GameLiftLocal process.
        sinon.stub(
          GameLiftServerState.getInstance() as GameLiftServerState,
          "healthCheck"
        );
        await gamelift.processReady({
          port: 2020,
          onStartGameSession: () => {},
        });
        await gamelift.processEnding();
      },
    });
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

      // This is stubbed because it doesn't affect the semantics around throwing the no
      // game session error at all.
      sinon.stub(instance as GameLiftServerState, "healthCheck");

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

/**
 * Options that should be passed to {@link createTestForGameLiftLocal}.
 */
interface IGameLiftLocalTestOptions {
  /**
   * Title of the test.
   */
  title: string;

  /**
   * String to search for in GameLiftLocal output.
   */
  searchString: string | string[];

  /**
   * Reference to the GameLiftLocal process.
   */
  gameLiftLocalProcess: () => childProcess.ChildProcess;

  /**
   * Number of milliseconds to wait until the test is considered a failure.
   */
  timeout?: number;

  /**
   * Function to execute before the promises.
   */
  _before?: () => Promise<void>;

  /**
   * Function to execute after the promises.
   */
  _after?: () => Promise<void>;

  /**
   * Message to indicate failure.
   */
  message?: string;
}

/**
 * Create a test case that looks for GameLiftLocal output.
 */
function createTestForGameLiftLocal({
  title,
  searchString,
  gameLiftLocalProcess: _gameLiftLocalProcess,
  timeout: _timeout,
  _before,
  _after,
  message,
}: IGameLiftLocalTestOptions): void {
  it(title, async function (): Promise<void> {
    let boundEventHandler: (data: Buffer) => void = null;
    const gameLiftLocalProcess = _gameLiftLocalProcess();
    // Default timeout to 3 seconds
    const timeout = _timeout || 3000;

    this.timeout(timeout);

    /**
     * Simple function that reads GameLiftLocal's STDOUT to determine if the SDK
     * connected successfully.
     * @param output - STDOUT
     */
    function readOutputData(resolve: () => void, data: Buffer): void {
      const output = data.toString("utf-8");

      if (
        Array.isArray(searchString) &&
        // Ensure that every string in the searchString array is included in the
        // output
        searchString.reduce(
          (previousValue: boolean, currentValue: string): boolean =>
            previousValue && output.includes(currentValue),
          true
        )
      ) {
        resolve();
      } else if (output.includes(searchString as string)) {
        resolve();
      }
    }

    const successPromise = new Promise((resolve: () => void): void => {
      boundEventHandler = readOutputData.bind({}, resolve);
      gameLiftLocalProcess.stdout.on("data", boundEventHandler);
    });

    const resultPromise = Promise.race([
      successPromise,
      new Promise(
        (_resolve: () => void, reject: (error?: Error) => void): void => {
          setTimeout(
            () => reject(new Error(`No string '${searchString}' was found`)),
            timeout
          );
        }
      ),
    ])
      .catch((error?: Error): Promise<Error> => Promise.resolve(error))
      .then(
        (error?: Error): Promise<void> => {
          gameLiftLocalProcess.stdout.off("data", boundEventHandler);

          return error ? Promise.reject(error) : Promise.resolve();
        }
      );

    await (_before ? _before() : Promise.resolve());

    const after = _after ? _after : () => Promise.resolve();
    return assert.isFulfilled(resultPromise, message).then(after, after);
  });
}

/**
 * Create a game session using a GameLift service client.
 *
 * @returns - Response from GameLiftLocal that contains the game session ID.
 */
function createGameSession(): Promise<CreateGameSessionOutput> {
  const gameLift = new GameLiftClient({
    // Address of the local GameLiftLocal service
    endpoint: "http://localhost:8080",
  });

  const command = new CreateGameSessionCommand({
    FleetId: "fleet-123",
    MaximumPlayerSessionCount: 2,
  });

  return gameLift.send(command);
}
