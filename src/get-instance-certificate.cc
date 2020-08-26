
#include "get-instance-certificate.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::GetInstanceCertificate>;

Napi::Object GetInstanceCertificate::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(
      env, "GetInstanceCertificate",
      {
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("GetInstanceCertificate", func);
  return exports;
}

GetInstanceCertificate::GetInstanceCertificate(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::GetInstanceCertificate>()) {}

};  // namespace gamelift
