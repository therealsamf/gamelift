
#include "get-instance-certificate-response.hh"
// clang-format off
#include <memory>
#include <string>

#include <napi.h>
#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::GetInstanceCertificateResponse>;

Napi::Object GetInstanceCertificateResponse::Init(Napi::Env env,
                                                  Napi::Object exports) {
  Napi::Function func = DefineClass(
      env, "GetInstanceCertificateResponse",
      {InstanceAccessor(
           "certificatePath",
           &Message::GetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::certificatepath>,
           &Message::SetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::set_certificatepath>),
       InstanceAccessor(
           "certificateChainPath",
           &Message::GetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::certificatechainpath>,
           &Message::SetValue<std::string,
                              &pbuffer::GetInstanceCertificateResponse::
                                  set_certificatechainpath>),
       InstanceAccessor(
           "privateKeyPath",
           &Message::GetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::privatekeypath>,
           &Message::SetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::set_privatekeypath>),
       InstanceAccessor(
           "hostName",
           &Message::GetValue<
               std::string, &pbuffer::GetInstanceCertificateResponse::hostname>,
           &Message::SetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::set_hostname>),
       InstanceAccessor(
           "rootCertificatePath",
           &Message::GetValue<
               std::string,
               &pbuffer::GetInstanceCertificateResponse::rootcertificatepath>,
           &Message::SetValue<std::string,
                              &pbuffer::GetInstanceCertificateResponse::
                                  set_rootcertificatepath>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("GetInstanceCertificateResponse", func);
  return exports;
}

GetInstanceCertificateResponse::GetInstanceCertificateResponse(
    const Napi::CallbackInfo& info)
    : Message(info,
              std::make_shared<pbuffer::GetInstanceCertificateResponse>()) {}

};  // namespace gamelift
