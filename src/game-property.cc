
#include "game-property.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::GameProperty>;

Napi::FunctionReference* GameProperty::constructor = nullptr;

Napi::Object GameProperty::Init(Napi::Env env, Napi::Object exports) {
  Napi::FunctionReference* constructor = new Napi::FunctionReference();

  Napi::Function func = DefineClass(
      env, "GameProperty",
      {InstanceAccessor(
           "key", &Message::GetValue<std::string, &pbuffer::GameProperty::key>,
           &Message::SetValue<std::string, &pbuffer::GameProperty::set_key>),
       InstanceAccessor(
           "value",
           &Message::GetValue<std::string, &pbuffer::GameProperty::value>,
           &Message::SetValue<std::string, &pbuffer::GameProperty::set_value>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  *constructor = Napi::Persistent(func);
  GameProperty::constructor = constructor;

  env.SetInstanceData(constructor);

  exports.Set("GameProperty", func);
  return exports;
}

GameProperty::GameProperty(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::GameProperty>()) {}

};  // namespace gamelift
