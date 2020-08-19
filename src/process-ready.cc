
#include "process-ready.hh"

Napi::Object ProcessReady::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "ProcessReady", {
        StaticMethod("verify", &ProcessReady::Verify),
        StaticMethod("encode", &ProcessReady::Encode),
        StaticMethod("decode", &ProcessReady::Decode),
        StaticMethod("create", &ProcessReady::Create),
        StaticMethod("fromObject", &ProcessReady::FromObject),
        StaticMethod("toObject", &ProcessReady::ToObject)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);


    exports.Set("ProcessReady", func);
    return exports;
}

ProcessReady::ProcessReady(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<ProcessReady>(info), process_ready_() {
}
