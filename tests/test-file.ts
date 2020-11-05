/**
 * @fileoverview Root level test suite for GameLift library.
 */

import * as path from "path";

import { GetInstanceCertificateResponse } from "@kontest/gamelift-pb";
import { assert, use } from "chai";
use(require("chai-as-promised"));

import * as gamelift from "../lib";
import { NotInitializedError } from "../lib/exceptions";

describe("gamelift", function (): void {
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
});
