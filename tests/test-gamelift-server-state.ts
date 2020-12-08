/**
 * @fileoverview Unit test suite for gamelift-server-state.ts
 */

import * as http from "http";

import {
  AcceptPlayerSession,
  BackfillMatchmakingRequest,
  DescribePlayerSessionsRequest,
  GameSessionActivate,
  GameSessionTerminate,
  GetInstanceCertificate,
  ProcessEnding,
  ProcessReady,
  RemovePlayerSession,
  ReportHealth,
  StopMatchmakingRequest,
  UpdatePlayerSessionCreationPolicy,
} from "@kontest/gamelift-pb";
import { Message } from "protobufjs";
import { spy, stub } from "sinon";
import type { SinonSpy } from "sinon";
import Server from "socket.io";
import SocketIOClient from "socket.io-client";
import type { Server as SocketIOServer, Socket } from "socket.io";
import { assert } from "chai";

import { ServiceCallFailedError } from "../lib";
import { GameLiftServerState } from "../lib/gamelift-server-state";
import { Network } from "../lib/network";

describe("gamelift-server-state #unit", function () {
  let server: http.Server = null;
  let io: SocketIOServer = null;

  beforeEach(function (done: () => void) {
    server = http.createServer();
    io = new Server(server, { transports: ["websocket"] });

    server.listen({ host: "localhost", port: 5757 }, done);
  });
  afterEach(function (done: (error?: Error) => void) {
    io.close(done);
  });

  describe("getInstanceCertificate()", function () {
    createTestForProperResponse({
      message: GetInstanceCertificate,
      testMethod: "getInstanceCertificate",
      testArgs: [],
      io: () => io,
    });

    createTestForInvalidResponse({
      message: GetInstanceCertificate,
      testMethod: "getInstanceCertificate",
      testArgs: [],
      io: () => io,
      response: {
        certificatePath: 0,
      },
    });
  });

  describe("processReady()", function () {
    createTestForProperResponse({
      message: ProcessReady,
      testMethod: "processReady",
      testArgs: [
        {
          port: 1000,
          onStartGameSession: () => {},
        },
      ],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        stub(serverState, "healthCheck");
      },
    });
  });

  describe("processEnding()", function () {
    createTestForProperResponse({
      message: ProcessEnding,
      testMethod: "processEnding",
      testArgs: [],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
    });
  });

  describe("reportHealth()", function () {
    createTestForProperResponse({
      message: ReportHealth,
      testMethod: "reportHealth",
      testArgs: [],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        serverState.onHealthCheck = () => Promise.resolve(true);
      },
    });
  });

  describe("activateGameSession()", function () {
    createTestForProperResponse({
      message: GameSessionActivate,
      testMethod: "activateGameSession",
      testArgs: [],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        // @ts-ignore
        serverState.processReadyFlag = true;
        // @ts-ignore
        serverState.gameSessionId = "1";
      },
    });
  });

  describe("terminateGameSession", function () {
    createTestForProperResponse({
      message: GameSessionTerminate,
      testMethod: "terminateGameSession",
      testArgs: [],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        // @ts-ignore
        serverState.gameSessionId = "1";
      },
    });
  });

  describe("acceptPlayerSession", function () {
    createTestForProperResponse({
      message: AcceptPlayerSession,
      testMethod: "acceptPlayerSession",
      testArgs: [""],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        // @ts-ignore
        serverState.gameSessionId = "1";
      },
    });
  });

  describe("removePlayerSession", function () {
    createTestForProperResponse({
      message: RemovePlayerSession,
      testMethod: "removePlayerSession",
      testArgs: [""],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        // @ts-ignore
        serverState.gameSessionId = "1";
      },
    });
  });

  describe("describePlayerSessions", function () {
    createTestForProperResponse({
      message: DescribePlayerSessionsRequest,
      testMethod: "describePlayerSessions",
      testArgs: [
        DescribePlayerSessionsRequest.create(
          {}
        ) as DescribePlayerSessionsRequest,
      ],
      io: () => io,
    });

    createTestForInvalidResponse({
      message: DescribePlayerSessionsRequest,
      testMethod: "describePlayerSessions",
      testArgs: [
        DescribePlayerSessionsRequest.create(
          {}
        ) as DescribePlayerSessionsRequest,
      ],
      io: () => io,
      response: {
        nextToken: 0,
      },
    });
  });

  describe("updatePlayerSessionCreationPolicy()", function () {
    createTestForProperResponse({
      message: UpdatePlayerSessionCreationPolicy,
      testMethod: "updatePlayerSessionCreationPolicy",
      testArgs: ["ACCEPT_ALL"],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
      setupFunction: (serverState: GameLiftServerState) => {
        // @ts-ignore
        serverState.gameSessionId = "1";
      },
    });
  });

  describe("backfillMatchmaking()", function () {
    createTestForProperResponse({
      message: BackfillMatchmakingRequest,
      testMethod: "backfillMatchmaking",
      testArgs: [
        BackfillMatchmakingRequest.create({}) as BackfillMatchmakingRequest,
      ],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
    });

    createTestForInvalidResponse({
      message: BackfillMatchmakingRequest,
      testMethod: "backfillMatchmaking",
      testArgs: [
        BackfillMatchmakingRequest.create({}) as BackfillMatchmakingRequest,
      ],
      io: () => io,
      response: {
        ticketId: 0,
      },
    });
  });

  describe("stopMatchmaking()", function () {
    createTestForProperResponse({
      message: StopMatchmakingRequest,
      testMethod: "stopMatchmaking",
      testArgs: [StopMatchmakingRequest.create({}) as StopMatchmakingRequest],
      io: () => io,
      response: {
        status: 0,
        responseData: "",
      },
    });
  });
});

/**
 * Type alias for every string that maps to a method that returns a promise in
 * {@link GameLiftServerState}.
 */
type GameLiftServerStatePromises = {
  [K in keyof GameLiftServerState]: GameLiftServerState[K] extends (
    ...args: any[]
  ) => PromiseLike<any>
    ? K
    : never;
}[keyof GameLiftServerState];

/**
 * Type alias for every potential set of arguments for the methods named in
 * {@link GameLiftServerStatePromises}
 */
type GameLiftServerStatePromisesArgs<
  K extends GameLiftServerStatePromises
> = Parameters<GameLiftServerState[K]>;

/**
 * Options for creating a test that verifies the proper message is emitted.
 */
interface IProperResponseTestOptions<K extends GameLiftServerStatePromises> {
  /**
   * Protobufjs message class.
   */
  message: typeof Message;

  /**
   * Method that gets invoked which should lead to the message being sent.
   */
  testMethod: K;

  /**
   * Arguments for the test method.
   */
  testArgs: GameLiftServerStatePromisesArgs<K>;

  /**
   * Response that the fake server should give to the gamelift library on receipt of
   * the message.
   */
  response?: Record<string, unknown>;

  /**
   * Fake server instance.
   */
  io: () => SocketIOServer;

  /**
   * Setup function
   */
  setupFunction?: (serverState: GameLiftServerState) => void;
}

/**
 * Utilty function for creating test cases for particular messages being emitted from
 * certain methods.
 * @param options - Options particular for a single test case.
 */
function createTestForProperResponse<K extends GameLiftServerStatePromises>({
  message,
  response,
  ...options
}: IProperResponseTestOptions<K>): void {
  it(`emits proper '${message.$type.name}' message`, async function (): Promise<
    void
  > {
    const _response = response || {};
    const responseFunction = (
      _messageBuffer: ArrayBuffer,
      callback: (...args: any[]) => void
    ): void => {
      callback(true, JSON.stringify(_response));
    };
    const responseSpy = spy(responseFunction);

    await testForGameLiftMessage({
      message,
      response,
      responseSpy,
      ...options,
    });
    assert(
      responseSpy.calledOnce,
      `'${message.$type.name}' event was never emitted`
    );
    const firstCall = responseSpy.firstCall;
    const messageBuffer = firstCall.args[0];

    // Assert that the message buffer can be decoded the proper message
    message.decode(new Uint8Array(messageBuffer));
  });
}

/**
 * Utilty function for creating test cases for {@link GameLiftServerState} methods
 * throw errors when the response received is invalid.
 * @param options - Options particular for a single test case.
 */
function createTestForInvalidResponse<K extends GameLiftServerStatePromises>({
  message,
  response,
  ...options
}: IProperResponseTestOptions<K>): void {
  it("throws an error if an invalid response is received", async function (): Promise<
    void
  > {
    const _response = response || {};

    const responseFunction = (
      _messageBuffer: ArrayBuffer,
      callback: (...args: any[]) => void
    ): void => {
      callback(true, JSON.stringify(_response));
    };
    const responseSpy = spy(responseFunction);

    await assert.isRejected(
      testForGameLiftMessage({
        message,
        response,
        responseSpy,
        ...options,
      }),
      ServiceCallFailedError
    );

    assert(
      responseSpy.calledOnce,
      `'${message.$type.name}' event was never emitted`
    );
    const firstCall = responseSpy.firstCall;
    const messageBuffer = firstCall.args[0];
    message.decode(new Uint8Array(messageBuffer));
  });
}

/**
 * Setup the server state before calling the given method to test its functionality.
 * @param options
 */
async function testForGameLiftMessage<K extends GameLiftServerStatePromises>({
  message,
  testMethod,
  testArgs,
  io,
  setupFunction,
  responseSpy,
}: IProperResponseTestOptions<K> & {
  responseSpy?: SinonSpy<[ArrayBuffer, (...args: any[]) => void], void>;
}) {
  let socket: Socket;

  io().once("connection", function (_socket: Socket): void {
    socket = _socket;
    socket.once(message.$type.fullName, responseSpy);
  });

  const serverState = new GameLiftServerState();
  const clientSocket = SocketIOClient(GameLiftServerState.LOCALHOST, {
    transports: ["websocket"],
    reconnection: false,
  });
  serverState.networking = new Network(clientSocket, serverState);
  await serverState.networking.performConnect(clientSocket);

  if (setupFunction) {
    setupFunction(serverState);
  }

  await serverState[testMethod].apply(serverState, testArgs);
}
