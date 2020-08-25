
#ifndef GAMELIFT_IO_PLAYER_SESSION_H_
#define GAMELIFT_IO_PLAYER_SESSION_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the [PlayerSession] Protocol
 * Buffer object.
 *
 * [PlayerSession]:
 * https://docs.aws.amazon.com/gamelift/latest/apireference/API_PlayerSession.html
 */
class PlayerSession : public WrappedMessage<pbuffer::PlayerSession> {
 public:
  /**
   * Initialize the PlayerSession class. This attaches the constructor to
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
   * Constructor for the PlayerSession.
   *
   * Initializes the ObjectWrap class as well as the internal
   * PlayerSession Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  PlayerSession(const Napi::CallbackInfo& info);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_PLAYER_SESSION_H_
