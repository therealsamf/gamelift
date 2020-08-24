/**
 * @fileoverview Exception types for GameLift
 */

/**
 * Error class meant to show the caller the API hasn't been initialized.
 * @internal
 */
export class NotInitializedError extends Error {
  /**
   * Construct the NotInitializedError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("GameLift API has not been initialized");
  }
}

/**
 * Error class meant to show the caller the GameLift server state hasn't been
 * initialized.
 *
 * @internal
 */
export class GameLiftServerNotInitializedError extends Error {
  /**
   * Construct the GameLiftServerNotInitializedError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("GameLift server has not been initialized");
  }
}

/**
 * Error class meant to show the caller the API has already been initialized.
 * @internal
 */
export class AlreadyInitializedError extends Error {
  /**
   * Construct the AlreadyInitializedError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("GameLift API has already been initialized");
  }
}

/**
 * Error class meant to show that the process isn't ready yet.
 *
 * Usually thrown when a method has been called that requires the process to
 * be ready and the internal processReadyFlag isn't set.
 *
 * @internal
 */
export class ProcessNotReadyError extends Error {
  /**
   * Construct the ProcessNotReadyError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("Process is not ready yet");
  }
}

/**
 * Error class meant to show that no game session has been scheduled.
 *
 * Usually thrown when calling the ActivateGameSession method **not** in the
 * OnStartGameSession event handler.
 *
 * @internal
 */
export class NoGameSessionError extends Error {
  /**
   * Construct the ProcessNotReadyError instance.
   *
   * Passes a pre-determined message back to the superclass
   * [`Error`](https://nodejs.org/api/errors.html#errors_class_error).
   *
   * @internal
   */
  constructor() {
    super("No game session is currently activating");
  }
}
