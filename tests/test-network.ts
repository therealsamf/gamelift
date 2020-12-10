/**
 * @fileoverview Unit test suite for network.ts
 */

import { GameLiftResponse } from "@kontest/gamelift-pb";
import { assert } from "chai";
import { Field, Message, Type } from "protobufjs/light";
import { spy, stub } from "sinon";
import SocketIOClient from "socket.io-client";

import { GameLiftServerState } from "../lib/gamelift-server-state";
import {
  HandlerFunctions,
  Network,
  NOOP,
  ServiceCallFailedError,
} from "../lib/network";

describe("network #unit", function () {
  const handlerFunctions: HandlerFunctions = {
    onStartGameSessionHandler: NOOP,
    onUpdateGameSessionHandler: NOOP,
    onTerminateSessionHandler: NOOP,
  };

  @Type.d("TestMessage")
  class TestMessage extends Message<TestMessage> {}

  describe("emit", function () {
    let socket;
    let network;

    beforeEach(function (): void {
      socket = SocketIOClient(GameLiftServerState.LOCALHOST, {
        autoConnect: false,
      });
      network = new Network(socket, handlerFunctions);
    });

    it("Throws an error if a response is expected but none is received", async function (): Promise<
      void
    > {
      stub(socket, "emit").callsFake(function (
        _event: string,
        _message: Uint8Array,
        callback: (success: boolean, response?: string) => void
      ): SocketIOClient.Socket {
        // Don't send back any response
        callback(true);
        return socket;
      });

      await assert.isRejected(
        network.emit(TestMessage.encode({}), TestMessage.$type, TestMessage),
        ServiceCallFailedError
      );
    });

    it("Parses responses as GameLiftResponse if success callback receives 'false'", async function (): Promise<
      void
    > {
      const parseSpy = spy(network, "parseJsonDataIntoMessage");
      const responseString = JSON.stringify({ errorMessage: "" });

      stub(socket, "emit").callsFake(function (
        _event: string,
        _message: Uint8Array,
        callback: (success: boolean, response?: string) => void
      ): SocketIOClient.Socket {
        // Send back false with a JSON string for GameLiftResponse
        callback(false, responseString);
        return socket;
      });

      await assert.isRejected(
        network.emit(TestMessage.encode({}), TestMessage.$type),
        ServiceCallFailedError
      );
      assert(parseSpy.calledWith(GameLiftResponse, responseString));
    });

    @Type.d("ResponseMessage")
    class ResponseMessage extends Message<ResponseMessage> {
      @Field.d(1, "string")
      public field: string;
    }

    it("Parses responses into the given message when defined", async function () {
      stub(socket, "emit").callsFake(function (
        _event: string,
        _message: Uint8Array,
        callback: (success: boolean, response?: string) => void
      ): SocketIOClient.Socket {
        // Send back a valid JSON message for ResponseMessage
        callback(true, JSON.stringify({ field: "" }));
        return socket;
      });

      await assert.becomes(
        network.emit(
          TestMessage.encode({}),
          TestMessage.$type,
          ResponseMessage
        ),
        ResponseMessage.create({ field: "" })
      );
    });

    it("Throws an error when the response message is defined but the response can't be coerced", async function () {
      stub(socket, "emit").callsFake(function (
        _event: string,
        _message: Uint8Array,
        callback: (success: boolean, response?: string) => void
      ): SocketIOClient.Socket {
        // Send back an invalid JSON message for ResponseMessage
        callback(true, JSON.stringify({ field: 0 }));
        return socket;
      });

      await assert.isRejected(
        network.emit(
          TestMessage.encode({}),
          TestMessage.$type,
          ResponseMessage
        ),
        ServiceCallFailedError
      );
    });
  });
});
