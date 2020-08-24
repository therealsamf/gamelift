
#include "accept-player-session.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::AcceptPlayerSession>;

Napi::Object AcceptPlayerSession::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(
      env, "AcceptPlayerSession",
      {InstanceAccessor(
           "playerSessionId",
           &Message::GetValue<std::string,
                              &pbuffer::AcceptPlayerSession::playersessionid>,
           &Message::SetValue<
               std::string,
               &pbuffer::AcceptPlayerSession::set_playersessionid>),
       InstanceAccessor(
           "gameSessionId",
           &Message::GetValue<std::string,
                              &pbuffer::AcceptPlayerSession::gamesessionid>,
           &Message::SetValue<
               std::string, &pbuffer::AcceptPlayerSession::set_gamesessionid>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("AcceptPlayerSession", func);
  return exports;
}

AcceptPlayerSession::AcceptPlayerSession(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::AcceptPlayerSession>()) {}

};  // namespace gamelift
