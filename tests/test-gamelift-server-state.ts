/**
 * @fileoverview Unit test suite for gamelift-server-state.ts
 */

import * as http from "http";
import * as os from "os";
import * as path from "path";

import { ProcessEnding } from "@kontest/gamelift-pb";
import { spy } from "sinon";
import { Server, Socket } from "socket.io";
import { assert } from "chai";

import { GameLiftServerState } from "../lib/gamelift-server-state";

describe("gamelift-server-state #unit", function () {
  let server = http.createServer();
  let io: Server = null;

  beforeEach(function (done: () => void) {
    io = new Server({ transports: ["websocket"] });
    io.attach(server);

    server.listen({ host: "localhost", port: 5757 }, done);
  });
  afterEach(function (done: (error?: Error) => void) {
    io.close(done);
  });

  describe("processEnding()", function () {
    it("emits proper 'ProcessEnding' message", async function (): Promise<
      void
    > {
      this.timeout(0);
      let socket: Socket;

      const responseFunction = (
        message: ArrayBuffer,
        callback: () => void
      ): void => {
        ProcessEnding.decode(new Uint8Array(message));
        callback();
      };
      const responseSpy = spy(responseFunction);

      io.once("connection", function (_socket: Socket): void {
        socket = _socket;
        socket.once(ProcessEnding.$type.fullName, responseSpy);
      });

      const serverState = GameLiftServerState.createInstance();
      await serverState.initializeNetworking();
      console.log("Networking initialized");
      await serverState.processEnding();

      assert(
        responseSpy.calledOnce,
        `'${ProcessEnding.$type.name}' event was never emitted`
      );
    });
  });
});
