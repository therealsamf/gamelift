
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
    static Napi::Value Verify(const Napi::CallbackInfo& info);
    static Napi::Value Encode(const Napi::CallbackInfo& info);
    static Napi::Value Decode(const Napi::CallbackInfo& info);
    static Napi::Value Create(const Napi::CallbackInfo& info);
    static Napi::Value FromObject(const Napi::CallbackInfo& info);
    static Napi::Value ToObject(const Napi::CallbackInfo& info);

    pbuffer::ProcessReady process_ready_;
};

#endif // GAMELIFT_JS_PROCESS_READY_H
