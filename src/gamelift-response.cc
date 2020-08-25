
#include "gamelift-response.hh"
// clang-format off
#include <memory>
#include <stdint.h>
#include <string>

#include <napi.h>
#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::GameLiftResponse>;

Napi::Object GameLiftResponse::Init(Napi::Env env, Napi::Object exports) {
  // typedef Napi::Value (Message::*get_status)(const Napi::CallbackInfo&)

  Napi::Value (Message::*get_status)(const Napi::CallbackInfo&) =
      static_cast<Napi::Value (Message::*)(const Napi::CallbackInfo&)>(
          &GameLiftResponse::GetStatus);
  void (Message::*set_status)(const Napi::CallbackInfo&, const Napi::Value&) =
      static_cast<void (Message::*)(const Napi::CallbackInfo&, const Napi::Value&)>(
          &GameLiftResponse::SetStatus);

  Napi::Function func = DefineClass(
      env, "GameLiftResponse",
      {InstanceAccessor(
           "errorMessage",
           &Message::GetValue<std::string,
                              &pbuffer::GameLiftResponse::errormessage>,
           &Message::SetValue<std::string,
                              &pbuffer::GameLiftResponse::set_errormessage>),
       Napi::ObjectWrap<Message>::InstanceAccessor("status",
                                                   get_status, set_status),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("GameLiftResponse", func);
  return exports;
}

GameLiftResponse::GameLiftResponse(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::GameLiftResponse>()) {}

Napi::Value GameLiftResponse::GetStatus(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  std::shared_ptr<pbuffer::GameLiftResponse> gamelift_response =
      GetMessagePtr();
  if (!gamelift_response) {
    Napi::Error::New(env, "message hasn't been initialized");
    return env.Undefined();
  }

  const pbuffer::GameLiftResponse_Status& status = gamelift_response->status();
  std::string response_status;

  switch (status) {
    case pbuffer::GameLiftResponse::OK: {
      response_status = "OK";
      break;
    }
    case pbuffer::GameLiftResponse::ERROR_400: {
      response_status = "ERROR_400";
      break;
    }
    case pbuffer::GameLiftResponse::ERROR_500: {
      response_status = "ERROR_500";
      break;
    }
    default: {
      Napi::Error::New(env, "Internal Error: invalid status field received")
          .ThrowAsJavaScriptException();
      return env.Undefined();
    }
  }

  return ConvertNative<std::string>(env, std::move(response_status));
}

void GameLiftResponse::SetStatus(const Napi::CallbackInfo& info,
                                 const Napi::Value& value) {
  Napi::Env env = info.Env();

  std::shared_ptr<pbuffer::GameLiftResponse> message_ = GetMessagePtr();

  if (!message_) {
    Napi::Error::New(env, "message hasn't been initialized");
    return;
  }

  if (!CheckValue<std::string>(value)) {
    Napi::TypeError::New(env, "invalid type: expected string")
        .ThrowAsJavaScriptException();
    return;
  }

  std::string native_value = ConvertValue<std::string>(value);
  if (native_value == "OK") {
    message_->set_status(pbuffer::GameLiftResponse::OK);
  } else if (native_value == "ERROR_400") {
    message_->set_status(pbuffer::GameLiftResponse::ERROR_400);
  } else if (native_value == "ERROR_500") {
    message_->set_status(pbuffer::GameLiftResponse::ERROR_500);
  } else {
    Napi::Error::New(env, "invalid value not from enumeration")
        .ThrowAsJavaScriptException();
  }
}

};  // namespace gamelift
