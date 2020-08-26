
#include "describe-player-sessions-request.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::DescribePlayerSessionsRequest>;

Napi::Object DescribePlayerSessionsRequest::Init(Napi::Env env,
                                                 Napi::Object exports) {
  void (Message::*set_player_session_status_filter)(const Napi::CallbackInfo&,
                                                    const Napi::Value&) =
      static_cast<void (Message::*)(const Napi::CallbackInfo&,
                                    const Napi::Value&)>(
          &DescribePlayerSessionsRequest::SetPlayerSessionStatusFilter);

  Napi::Function func = DefineClass(
      env, "DescribePlayerSessionsRequest",
      {InstanceAccessor(
           "gameSesssionId",
           &Message::GetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsRequest::gamesessionid>,
           &Message::SetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsRequest::set_gamesessionid>),
       InstanceAccessor(
           "limit",
           &Message::GetValue<int,
                              &pbuffer::DescribePlayerSessionsRequest::limit>,
           &Message::SetValue<
               int, &pbuffer::DescribePlayerSessionsRequest::set_limit>),
       InstanceAccessor(
           "nextToken",
           &Message::GetValue<
               std::string, &pbuffer::DescribePlayerSessionsRequest::nexttoken>,
           &Message::SetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsRequest::set_nexttoken>),
       InstanceAccessor(
           "playerId",
           &Message::GetValue<
               std::string, &pbuffer::DescribePlayerSessionsRequest::playerid>,
           &Message::SetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsRequest::set_playerid>),
       InstanceAccessor(
           "playerSessionId",
           &Message::GetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsRequest::playersessionid>,
           &Message::SetValue<
               std::string,
               &pbuffer::DescribePlayerSessionsRequest::set_playersessionid>),
       InstanceAccessor(
           "playerSessionStatusFilter",
           &Message::GetValue<std::string,
                              &pbuffer::DescribePlayerSessionsRequest::
                                  playersessionstatusfilter>,
           set_player_session_status_filter),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("DescribePlayerSessionsRequest", func);
  return exports;
}

DescribePlayerSessionsRequest::DescribePlayerSessionsRequest(
    const Napi::CallbackInfo& info)
    : Message(info,
              std::make_shared<pbuffer::DescribePlayerSessionsRequest>()) {}

void DescribePlayerSessionsRequest::SetPlayerSessionStatusFilter(
    const Napi::CallbackInfo& info, const Napi::Value& value) {
  Napi::Env env = info.Env();

  std::shared_ptr<pbuffer::DescribePlayerSessionsRequest> message =
      GetMessagePtr();

  if (!message) {
    Napi::Error::New(env, "message hasn't been initialized");
    return;
  }

  if (!CheckValue<std::string>(value)) {
    Napi::TypeError::New(env, "invalid type: expected string")
        .ThrowAsJavaScriptException();
    return;
  }

  std::string native_value = ConvertValue<std::string>(value);
  if (native_value != "RESERVED" && native_value != "ACTIVE" &&
      native_value != "COMPLETED" && native_value != "TIMEDOUT") {
    Napi::Error::New(env, "invalid value not from enumeration")
        .ThrowAsJavaScriptException();
    return;
  }

  message->set_playersessionstatusfilter(native_value);
}

};  // namespace gamelift
