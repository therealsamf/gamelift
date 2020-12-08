gamelift
===========

[![Build Status](https://travis-ci.org/therealsamf/gamelift.svg?branch=master)](https://travis-ci.org/therealsamf/gamelift)
[![codecov](https://codecov.io/gh/therealsamf/gamelift/branch/master/graph/badge.svg)](https://codecov.io/gh/therealsamf/gamelift)
[![Known Vulnerabilities](https://snyk.io/test/github/therealsamf/gamelift/badge.svg)](https://snyk.io/test/github/therealsamf/gamelift)


[AWS GameLift](https://aws.amazon.com/gamelift/) SDK implemented in [TypeScript](https://www.typescriptlang.org/) for [Node.js](https://nodejs.org/en/).

[API Documentation](https://docs.kontest.io/gamelift/latest/index.html)

# Installation

```terminal
npm install @kontest/gamelift
```

Or if you prefer [`yarn`](https://classic.yarnpkg.com/en/):

```terminal
yarn add @kontest/gamelift
```

# Getting Started

A barebones example of how to use this library is coming soon.

Also coming soon is an example of how to create [GameLift builds](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-build-cli-uploading.html) that uses this library and Node.js.

# Use case

This library enables a Node.js process to act as a GameLift compatible backend game server. Node.js is not a popular choice to implement realtime multiplayer servers because of the performance requirements of those games. However, it's still a valid use case for many multiplayer games and this library allows developers whom are more familiar with Node.js and web development the ability to use a managed service like GameLift without having to develop their backend server in C++ or Unity/Unreal Engine.

# Development

This library provides the interface for using [gamelift-pb](../gamelift-pb/) via [socket.io](https://socket.io/) in communication with the GameLift service.

## Alternatives

There is a [project](https://github.com/dplusic/GameLift-Nodejs-ServerSDK) that accomplishes the same goal that this one does. It is written in TypeScript and shares many similarities.

However, it relies on a handwritten [.proto](https://developers.google.com/protocol-buffers/docs/reference/proto3-spec) file which did not contain the level of control and documentation that I preferred.

It also is a closer emulation of the original SDK from C++/C# whereas with this library I took liberties in making the code more like a native TypeScript/JavaScript project.

This project is also heavily documented and doesn't rely solely on AWS's docs.

## Contributing

The following guide describes how to get setup for testing and working on the gamelift library.

**Requirements**

In order to successfully fix bugs or add new features to this library you will need to be able to run the test suite. The integration tests rely on [GameLiftLocal](https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-testing-local.html) and require that the JAR file be located at a certain filepath relative to the project's directory.

Currently the GameLift SDK version is [2020-11-11](https://docs.aws.amazon.com/gamelift/latest/developerguide/release-notes.html#release-notes-11112020) and the integration tests run the JAR file at the following path:

```
GameLift_11_11_2020/GameLiftLocal-1.0.5/GameLiftLocal.jar
```

You can get this file easily with [`wget`](https://www.gnu.org/software/wget/) and the following commands:

```terminal
$ wget https://gamelift-release.s3-us-west-2.amazonaws.com/GameLift_11_11_2020.zip
$ unzip GameLift_11_11_2020.zip
```

The rest of the development dependencies can be conveniently installed like any other NodeJS project:

```terminal
$ npm install
```

Or with [`yarn`](https://yarnpkg.com/)

```terminal
$ yarn install
```

### Testing

This project utilizes [Mocha.js](https://mochajs.org/) as its test runner. Simply run `npm test`.

The integration tests (in [*tests/test-index.ts*](https://github.com/therealsamf/gamelift/blob/362758d2a118d53d4847f680aa4679b4ade6838a/tests/test-index.ts)) will start a GameLiftLocal subprocess which binds to several ports. It takes a minute or two for these ports to become available again so running the integration tests in quick succession will usually result in the second invocation timing out during the integration test suite's `before` hook. This [Mocha.js hook](https://mochajs.org/#hooks) starts up the GameLiftLocal process using Java and attempts to attach to its ports and will retry when the process exits with EADDRINUSE errors.

### Linting

This project utilizes [`eslint`](https://eslint.org/) for code quality. The script to run to lint your changes is `npm run lint`.

### Formatting

[`prettier`](https://prettier.io/) is used for formatting TypeScript. `npm run prettier` will automatically format the source code.

### Generating documentation

To generate the user-visible documentation run `npm run docs`. The generated docs are stripped down and only include documentation for the public API.

To generate more developer-friendly documenation you can run `npm run docs:internal`. The previously mentioned stripped internal members are included in the output.
