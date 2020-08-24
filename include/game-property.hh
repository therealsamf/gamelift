
#ifndef GAMELIFT_IO_GAME_PROPERTY_H_
#define GAMELIFT_IO_GAME_PROPERTY_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;
namespace gamelift {

/**
 * Javascript compatible object wrapping the [GameProperty] protocol buffer
 * object.
 *
 * [GameProperty]: https://docs.aws.amazon.com/gamelift/latest/apireference/API_GameProperty.html
 */
class GameProperty : public WrappedMessage<pbuffer::GameProperty> {
 public:
  static Napi::FunctionReference*
      constructor; /**< Reference to the constructor for creating instances of
                      this object in "Javascript-land". */

  /**
   * Initialize the GameProperty class. This attaches the constructor to the
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
   * Constructor for the GameProperty.
   *
   * Initializes the ObjectWrap class as well as the internal GameProperty
   * Protocol Buffer object with its defaults for its fields.
   *
   * @param info Node-API callback information
   */
  GameProperty(const Napi::CallbackInfo& info);
};

/**
 * Convert the given Node-API value to a Protocol Buffer GameProperty object.
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
pbuffer::GameProperty ConvertValue(const Napi::Value& value) {
  GameProperty* game_property =
      Napi::ObjectWrap<GameProperty>::Unwrap(value.As<Napi::Object>());

  return *game_property->message_;
}

/**
 * Convert the given GameProperty Protocol Buffer object into a Node-API
 * compatible wrapped object.
 *
 * @param native Native Protocol Buffer object to convert.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
Napi::Value ConvertNative(Napi::Env& env, pbuffer::GameProperty&& native,
                          Napi::FunctionReference* constructor) {
  if (!constructor) {
    Napi::Error::New(env, "Internal Error: null constructor during conversion");
    return env.Undefined();
  }

  Napi::Object object = constructor->New({});

  GameProperty* game_property = Napi::ObjectWrap<GameProperty>::Unwrap(object);
  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return env.Undefined();
  }

  game_property->message_ = std::make_shared<pbuffer::GameProperty>(native);

  return object;
}

/**
 * Convert the given GameProperty Protocol Buffer object into a Node-API
 * compatible wrapped object.
 *
 * @param native Native Protocol Buffer object to convert.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
bool CheckValue<pbuffer::GameProperty>(const Napi::Value& value) {
  if (!value.IsObject()) {
    return false;
  }

  GameProperty* game_property =
      Napi::ObjectWrap<GameProperty>::Unwrap(value.As<Napi::Object>());
  if (value.Env().IsExceptionPending()) {
    return false;
  }

  return true;
}

};  // namespace gamelift

#endif  // GAMELIFT_IO_GAME_PROPERTY_H_
