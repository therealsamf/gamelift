/**
 * @fileoverview Unit test suite for gamelift-server-state.ts
 */

import * as http from "http";

import {
  GetInstanceCertificate,
  GetInstanceCertificateResponse,
  ProcessEnding,
} from "@kontest/gamelift-pb";
import { spy } from "sinon";
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
    it("emits proper 'GetInstanceCertficate' message", async function (): Promise<
      void
    > {
      let socket: Socket;

      const responseFunction = (
        _message: ArrayBuffer,
        callback: (...args: any[]) => void
      ): void => {
        callback(true, "{}");
      };
      const responseSpy = spy(responseFunction);

      io.once("connection", function (_socket: Socket): void {
        socket = _socket;
        socket.once(GetInstanceCertificate.$type.fullName, responseSpy);
      });

      const serverState = new GameLiftServerState();
      const clientSocket = SocketIOClient(GameLiftServerState.LOCALHOST, {
        transports: ["websocket"],
        reconnection: false,
      });
      serverState.networking = new Network(clientSocket, serverState);
      await serverState.networking.performConnect(clientSocket);
      await assert.eventually.instanceOf(
        serverState.getInstanceCertificate(),
        GetInstanceCertificateResponse,
        "getInstanceCertificate() returned invalid type"
      );
    });

    it("throws an error if an invalid response is received", async function (): Promise<
      void
    > {
      let socket: Socket;

      const responseFunction = (
        _message: ArrayBuffer,
        callback: (...args: any[]) => void
      ): void => {
        callback(true, `{ "certificatePath": 0 }`);
      };
      const responseSpy = spy(responseFunction);

      io.once("connection", function (_socket: Socket): void {
        socket = _socket;
        socket.once(GetInstanceCertificate.$type.fullName, responseSpy);
      });

      const serverState = new GameLiftServerState();
      const clientSocket = SocketIOClient(GameLiftServerState.LOCALHOST, {
        transports: ["websocket"],
        reconnection: false,
      });
      serverState.networking = new Network(clientSocket, serverState);
      await serverState.networking.performConnect(clientSocket);
      await assert.isRejected(
        serverState.getInstanceCertificate(),
        ServiceCallFailedError,
      );
    });
  });

  describe("processReady()", function () {});

  describe("processEnding()", function () {
    it("emits proper 'ProcessEnding' message", async function (): Promise<
      void
    > {
      let socket: Socket;

      const responseFunction = (
        _message: ArrayBuffer,
        callback: (...args: any[]) => void
      ): void => {
        callback(
          true,
          JSON.stringify({
            status: 0,
            responseData: "",
          })
        );
      };
      const responseSpy = spy(responseFunction);

      io.once("connection", function (_socket: Socket): void {
        socket = _socket;
        socket.once(ProcessEnding.$type.fullName, responseSpy);
      });

      const serverState = new GameLiftServerState();
      const clientSocket = SocketIOClient(GameLiftServerState.LOCALHOST, {
        transports: ["websocket"],
        reconnection: false,
      });
      serverState.networking = new Network(clientSocket, serverState);
      await serverState.networking.performConnect(clientSocket);
      await serverState.processEnding();

      assert(
        responseSpy.calledOnce,
        `'${ProcessEnding.$type.name}' event was never emitted`
      );
      const firstCall = responseSpy.firstCall;
      const messageBuffer = firstCall.args[0];

      // Assert that the message buffer can be decoded into a ProcessEnding message
      ProcessEnding.decode(new Uint8Array(messageBuffer));
    });
  });

  describe("reportHealth()", function () {});

  describe("activateGameSession()", function () {});

  describe("updatePlayerSessionCreationPolicy()", function () {});

  describe("backfillMatchmaking()", function () {});

  describe("stopMatchmaking()", function () {});
});
