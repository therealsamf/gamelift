
#ifndef GAMELIFT_IO_PROCESS_READY_H_
#define GAMELIFT_IO_PROCESS_READY_H
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;
namespace gamelift {

class ProcessReady
    : public WrappedMessage<pbuffer::ProcessReady> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  ProcessReady(const Napi::CallbackInfo& info);

};

};  // namespace gamelift

#endif  // GAMELIFT_IO_PROCESS_READY_H
