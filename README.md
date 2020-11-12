gamelift
===========

[![Build Status](https://travis-ci.org/therealsamf/gamelift.svg?branch=master)](https://travis-ci.org/therealsamf/gamelift)
[![codecov](https://codecov.io/gh/therealsamf/gamelift/branch/master/graph/badge.svg)](https://codecov.io/gh/therealsamf/gamelift)
[![Known Vulnerabilities](https://snyk.io/test/github/therealsamf/gamelift/badge.svg)](https://snyk.io/test/github/therealsamf/gamelift)


[AWS GameLift](https://aws.amazon.com/gamelift/) SDK implemented in [TypeScript](https://www.typescriptlang.org/) for [Node.js](https://nodejs.org/en/).

[API Documentation](https://docs.kontest.io/gamelift/latest/index.html)

# Getting Started

Coming soon...

Also coming soon is an example of how to create [GameLift builds](https://docs.aws.amazon.com/gamelift/latest/developerguide/gamelift-build-cli-uploading.html) that uses this library and Node.js.

# Development

This library provides the interface for using [gamelift-pb](../gamelift-pb/) via [socket.io](https://socket.io/) in communication with the GameLift service.

## Motivation

There is a [project](https://github.com/dplusic/GameLift-Nodejs-ServerSDK) that accomplishes the same goal that this one does. It's written in TypeScript and shares many similarities.

However it relies on a handwritten [.proto](https://developers.google.com/protocol-buffers/docs/reference/proto3-spec) file which didn't contain the level of control and documentation that I preferred.

It also is a closer emulation of the original SDK from C++/C# whereas with this library I took some liberties with making the code more like a native TypeScript/JavaScript project.

Finally, this project is heavily documented and doesn't rely on AWS's docs. This is a necessity when learning how to deploy and write code for a multiplayer game that utilizes a service like AWS GameLift. And this being a TypeScript project, the targeted developer audience who will find this library useful are those who'd like to write a multiplayer game that can deploy at the scale of AWS GameLift without having to dive into writing a C++ server or implement their server code using one of the plugins for Unity or Unreal Engine.

## Contributing

The following guide describes how to get setup for testing and working on the gamelift library.

**Requirements**

In order to successfully fix bugs or add new features to this library you'll need to be able to run the test suite. The integration tests rely on [GameLiftLocal](https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-testing-local.html) and require that the JAR file be located at a certain filepath relative to the project's directory.

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

This will run the `pretest` script first which should build the C++ addon used in the tests with `cmake-js`. `mocha` will then run the test suite defined in TypeScript files found in *tests* directory.

### Linting

This project utilizes [`eslint`](https://eslint.org/) for code quality. The script to run to lint your changes is `npm run lint`.

### Formatting

[`prettier`](https://prettier.io/) is used for formatting TypeScript. `npm run prettier` will automatically format the source code.

### Generating documentation

To generate the user-visible documentation run `npm run docs`. The generated docs are stripped down and only include documentation for the public API.

To generate more developer-friendly documenation you can run `npm run docs:internal`. The previously mentioned stripped internal members are included in the output.

