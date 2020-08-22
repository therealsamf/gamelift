
#include "process-ready.hh"
// clang-format off
#include <string>

#include <google/protobuf/repeated_field.h>
#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::ProcessReady>;

Napi::Object ProcessReady::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(
      env, "ProcessReady",
      {
          InstanceAccessor(
              "port", &Message::GetValue<int, &pbuffer::ProcessReady::port>,
              &Message::SetValue<int, &pbuffer::ProcessReady::set_port>),
          InstanceAccessor(
              "maxConcurrentGameSessions",
              &Message::GetValue<
                  int, &pbuffer::ProcessReady::maxconcurrentgamesessions>,
              &Message::SetValue<
                  int, &pbuffer::ProcessReady::set_maxconcurrentgamesessions>),
          InstanceAccessor(
              "logPathsToUpload",
              &Message::GetArray<std::string,
                                 &pbuffer::ProcessReady::logpathstoupload>,
              &Message::SetArray<
                  std::string, &pbuffer::ProcessReady::add_logpathstoupload,
                  &pbuffer::ProcessReady::clear_logpathstoupload>),
          InstanceMethod("toString", &Message::ToString),
          InstanceMethod("fromString", &Message::FromString),
      });

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("ProcessReady", func);
  return exports;
}

ProcessReady::ProcessReady(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::ProcessReady>()) {}

};  // namespace gamelift
