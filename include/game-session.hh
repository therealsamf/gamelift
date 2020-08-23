
#ifndef GAMELIFT_JS_GAME_SESSION_H_
#define GAMELIFT_JS_GAME_SESSION_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;
namespace gamelift {

class GameSession : public WrappedMessage<pbuffer::GameSession> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  GameSession(const Napi::CallbackInfo& info);
};

};  // namespace gamelift

#endif  // GAMELIFT_JS_GAME_SESSION_H_
