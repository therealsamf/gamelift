
#ifndef GAMELIFT_IO_GAME_SESSION_ACTIVATE_H_
#define GAMELIFT_IO_GAME_SESSION_ACTIVATE_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the GameSessionActivate Protocol
 * Buffer object.
 *
 * This Protocol Buffer object is internal to the AWS GameLift SDK and is
 * only used to communicate when the [ActivateGameSession()] SDK method is
 * utilized.
 *
 * [ActivateGameSession()]:
 * https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-activategamesession
 */
class GameSessionActivate
    : public WrappedMessage<pbuffer::GameSessionActivate> {
 public:
  /**
   * Initialize the GameSessionActivate class. This attaches the constructor to
   * the addon and allows objects to be instantiated from "Javascript-land".
   *
   * @param env Node-API environment
   * @param exports Node-API object for the exports of the C++ addon
   *
   * @return The exports object after the constructor for this object has been
   * attached.
   */
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  /**
   * Constructor for the GameSessionActivate.
   *
   * Initializes the ObjectWrap class as well as the internal
   * GameSessionActivate Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  GameSessionActivate(const Napi::CallbackInfo& info);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_GAME_SESSION_ACTIVATE_H_
