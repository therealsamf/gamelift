
#ifndef GAMELIFT_IO_GAME_SESSION_H_
#define GAMELIFT_IO_GAME_SESSION_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;
namespace gamelift {

/**
 * Javascript compatible object wrapping the [GameSession] protocol buffer
 * object.
 *
 * [GameSession]:
 * https://docs.aws.amazon.com/gamelift/latest/apireference/API_GameSession.html
 */
class GameSession : public WrappedMessage<pbuffer::GameSession> {
 public:
  static Napi::FunctionReference*
      constructor; /**< Reference to the constructor for creating instances of
                        this object in "Javascript-land". */

  /**
   * Initialize the GameSession class. This attaches the constructor to the
   * addon and allows objects to be instantiated from "Javascript-land"
   *
   * @param env Node-API environment
   * @param exports Node-API object for the exports of the C++ addon
   *
   * @return The exports object after the constructor for this object has been
   * attached.
   */
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  /**
   * Constructor for the GameSession.
   *
   * Initializes the ObjectWrap class as well as the internal GameSession
   * Protocol Buffer object with its defaults for its fields.
   *
   * @param info Node-API callback information
   */
  GameSession(const Napi::CallbackInfo& info);
};

/**
 * Convert the given Node-API value to a Protocol Buffer GameSession object.
 *
 * Note: This does **not do any type checking** since it can't really
 * propagate back an error. Thus it's imperative that proper type checking be
 * done on the passed value before hand.
 *
 * @param value Node-API value to convert into string.
 *
 * @return Protocol Buffer object representing the value contained within the
 * given Node-API value.
 */
template <>
pbuffer::GameSession ConvertValue(const Napi::Value& value) {
  GameSession* game_session =
      Napi::ObjectWrap<GameSession>::Unwrap(value.As<Napi::Object>());

  return *game_session->message_;
}

/**
 * Convert the given GameSession Protocol Buffer object into a Node-API
 * compatible wrapped object.
 *
 * @param native Native Protocol Buffer object to convert.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
Napi::Value ConvertNative(Napi::Env& env, pbuffer::GameSession&& native,
                          Napi::FunctionReference* constructor) {
  if (!constructor) {
    Napi::Error::New(env, "Internal Error: null constructor during conversion");
    return env.Undefined();
  }

  Napi::Object object = constructor->New({});

  GameSession* game_session = Napi::ObjectWrap<GameSession>::Unwrap(object);
  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return env.Undefined();
  }

  game_session->message_ = std::make_shared<pbuffer::GameSession>(native);

  return object;
}

/**
 * Convert the given GameSession Protocol Buffer object into a Node-API
 * compatible wrapped object.
 *
 * @param native Native Protocol Buffer object to convert.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
bool CheckValue<pbuffer::GameSession>(const Napi::Value& value) {
  if (!value.IsObject()) {
    return false;
  }

  GameSession* game_session =
      Napi::ObjectWrap<GameSession>::Unwrap(value.As<Napi::Object>());
  if (value.Env().IsExceptionPending()) {
    // Don't clear the exception, since the calling code should take care
    // of it.
    return false;
  }

  return true;
}

};  // namespace gamelift

#endif  // GAMELIFT_IO_GAME_SESSION_H_
