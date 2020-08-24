
#ifndef GAMELIFT_IO_UPDATE_GAME_SESSION_H_
#define GAMELIFT_IO_UPDATE_GAME_SESSION_H_

#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the UpdateGameSession protocol buffer
 * object.
 *
 * This Protocol Buffer object is internal to the AWS GameLift service and is
 * only used to communicate when the [UpdateGameSession()] service method is
 * utilized.
 *
 * [UpdateGameSession()]:
 * https://docs.aws.amazon.com/gamelift/latest/apireference/API_UpdateGameSession.html
 */
class UpdateGameSession : public WrappedMessage<pbuffer::UpdateGameSession> {
 public:
  /**
   * Initialize the UpdateGameSession class. This attaches the constructor to
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
   * Constructor for the UpdateGameSession.
   *
   * Initializes the ObjectWrap class as well as the internal
   * UpdateGameSession Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  UpdateGameSession(const Napi::CallbackInfo& info);

 private:
  /**
   * Set the value of the update reason field on the internal Protocol Buffer
   * object.
   *
   * Note: The generalized method on the WrappedMessage class isn't used here
   * because this method adds some value checking since this field is a string
   * enumeration.
   *
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   * @param value Node-API value carrying a Javascript value of type U to set
   * on the field in the internal Protocol Buffer object.
   */
  void SetUpdateReason(const Napi::CallbackInfo& info,
                       const Napi::Value& value);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_UPDATE_GAME_SESSION_H_
