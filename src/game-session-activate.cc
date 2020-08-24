
#include "game-session-activate.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::GameSessionActivate>;

Napi::Object GameSessionActivate::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(
      env, "GameSessionActivate",
      {InstanceAccessor(
           "gameSessionId",
           &Message::GetValue<std::string,
                              &pbuffer::GameSessionActivate::gamesessionid>,
           &Message::SetValue<
               std::string, &pbuffer::GameSessionActivate::set_gamesessionid>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("GameSessionActivate", func);
  return exports;
}

GameSessionActivate::GameSessionActivate(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::GameSessionActivate>()) {}

};  // namespace gamelift
