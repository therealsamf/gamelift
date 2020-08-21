
#ifndef GAMELIFT_JS_PROCESS_READY_H_
#define GAMELIFT_JS_PROCESS_READY_H
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

class ProcessReady : public WrappedMessage<ProcessReady, pbuffer::ProcessReady> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ProcessReady(const Napi::CallbackInfo& info);
private:
    Napi::Value GetLogPathsToUpload(const Napi::CallbackInfo& info);
    void SetLogPathsToUpload(const Napi::CallbackInfo& info, const Napi::Value& value);

};

#endif // GAMELIFT_JS_PROCESS_READY_H
