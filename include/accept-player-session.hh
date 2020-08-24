
#ifndef GAMELIFT_IO_ACCEPT_PLAYER_SESSION_H_
#define GAMELIFT_IO_ACCEPT_PLAYER_SESSION_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the AcceptPlayerSession Protocol
 * Buffer object.
 *
 * This Protocol Buffer object is internal to the AWS GameLift service and is
 * only used to communicate when the [AcceptPlayerSession()] SDK method is
 * utilized.
 *
 * [AcceptPlayerSession()]:
 * https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html
 */
class AcceptPlayerSession
    : public WrappedMessage<pbuffer::AcceptPlayerSession> {
 public:
  /**
   * Initialize the AcceptPlayerSession class. This attaches the constructor to
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
   * Constructor for the AcceptPlayerSession.
   *
   * Initializes the ObjectWrap class as well as the internal
   * AcceptPlayerSession Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  AcceptPlayerSession(const Napi::CallbackInfo& info);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_ACCEPT_PLAYER_SESSION_H_
