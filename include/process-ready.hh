
#ifndef GAMELIFT_JS_PROCESS_READY_H_
#define GAMELIFT_JS_PROCESS_READY_H
#include <napi.h>
#include <sdk.pb.h>

using namespace com::amazon::whitewater::auxproxy;

class ProcessReady : public Napi::ObjectWrap<ProcessReady> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ProcessReady(const Napi::CallbackInfo& info);
private:
    pbuffer::ProcessReady process_ready_;
};

#endif // GAMELIFT_JS_PROCESS_READY_H
