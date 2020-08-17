

class InitSdkOutcome {

}

class GameLiftCommonState {
  public static getInstance(): GameLiftCommonState {
    if (!GameLiftCommonState.instance) {

    }
    return GameLiftCommonState.instance;
  }
  public static setInstance(instance: GameLiftCommonState): void {
    GameLiftCommonState.instance = instance;
  }

  private static instance: GameLiftCommonState;
}

class GameLiftServerState {
  public static createInstance(): InitSdkOutcome {
    const newState = new GameLiftServerState();

    return new InitSdkOutcome();
  }
}

export function initSdk() {

}
export const initSDK = initSdk;
