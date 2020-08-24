
#include "activate-game-session.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>

#include "game-session.hh"
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::ActivateGameSession>;

Napi::Object ActivateGameSession::Init(Napi::Env env, Napi::Object exports) {
  if (!GameSession::constructor) {
    Napi::Error::New(env,
                     "Internal Error: during initialization "
                     "'ActivateGameSession' received invalid "
                     "constructor for 'GameSession'")
        .ThrowAsJavaScriptException();
    return exports;
  }

  Napi::Function func = DefineClass(
      env, "ActivateGameSession",
      {InstanceAccessor(
           "gameSession",
           &Message::GetValue<pbuffer::GameSession,
                              &pbuffer::ActivateGameSession::gamesession>,
           &Message::SetValue<
               pbuffer::GameSession,
               &pbuffer::ActivateGameSession::set_allocated_gamesession>,
           napi_default, GameSession::constructor),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("ActivateGameSession", func);
  return exports;
}

ActivateGameSession::ActivateGameSession(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::ActivateGameSession>()) {}

};  // namespace gamelift
