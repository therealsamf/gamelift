
#include "describe-player-sessions-response.hh"
// clang-format off
#include <memory>
#include <string>

#include <napi.h>
#include <sdk.pb.h>

#include "player-session.hh"
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::DescribePlayerSessionsResponse>;

Napi::Object DescribePlayerSessionsResponse::Init(Napi::Env env,
                                                  Napi::Object exports) {
  if (!PlayerSession::constructor) {
    Napi::Error::New(env,
                     "Internal Error: during initialization "
                     "'DescribePlayerSessionsResponse' received invalid "
                     "constructor for 'PlayerSession'")
        .ThrowAsJavaScriptException();
    return exports;
  }

  Napi::Function func = DefineClass(
      env, "DescribePlayerSessionsResponse",
      {InstanceAccessor(
           "playerSessions",
           &Message::GetArray<
               pbuffer::PlayerSession,
               &pbuffer::DescribePlayerSessionsResponse::playersessions>,
           &Message::SetArray<
               pbuffer::PlayerSession,
               &pbuffer::DescribePlayerSessionsResponse::add_playersessions,
               &pbuffer::DescribePlayerSessionsResponse::clear_playersessions>,
           napi_default, PlayerSession::constructor),
       InstanceAccessor(
           "nextToken",
           &Message::GetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsResponse::nexttoken>,
           &Message::SetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsResponse::set_nexttoken>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("DescribePlayerSessionsResponse", func);
  return exports;
}

DescribePlayerSessionsResponse::DescribePlayerSessionsResponse(
    const Napi::CallbackInfo& info)
    : Message(info,
              std::make_shared<pbuffer::DescribePlayerSessionsResponse>()) {}

};  // namespace gamelift
