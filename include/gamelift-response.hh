
#ifndef GAMELIFT_IO_GAMELIFT_RESPONSE_STATUS_H_
#define GAMELIFT_IO_GAMELIFT_RESPONSE_STATUS_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the GameLiftResponse Protocol
 * Buffer object.
 */
class GameLiftResponse : public WrappedMessage<pbuffer::GameLiftResponse> {
 public:
  /**
   * Initialize the GameLiftResponse class. This attaches the constructor to
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
   * Constructor for the GameLiftResponse.
   *
   * Initializes the ObjectWrap class as well as the internal
   * GameLiftResponse Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  GameLiftResponse(const Napi::CallbackInfo& info);

private:
  /**
   * Accessor for the `status` field.
   *
   * This is implemented as a nested type/enumeration in the protocol buffer,
   * but is exposed as a string to Javascript.
   *
   * @param info Node-API callback information
   *
   * @return Javascript-compatible string for the `status` field.
   */
  Napi::Value GetStatus(const Napi::CallbackInfo& info);

  /**
   * Mutator for the `status` field.
   *
   * This is implemented as a nested type/enumeration in the protocol buffer,
   * but is exposed as a string to Javascript.
   *
   * @param info Node-API callback information
   * @param value Node-API string value to set as the status.
   */
  void SetStatus(const Napi::CallbackInfo& info, const Napi::Value& value);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_GAMELIFT_RESPONSE_STATUS_H_
