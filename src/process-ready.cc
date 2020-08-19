
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

Napi::Value ProcessReady::GetPort(const Napi::CallbackInfo& info) {
    const int& port = process_ready_.port();

    return Napi::Number::New(info.Env(), port);
}

void ProcessReady::SetPort(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsNumber()) {
        Napi::TypeError::New(info.Env(), "Integer expected").ThrowAsJavaScriptException();
    }

    Napi::Number port_value = value.As<Napi::Number>();
    process_ready_.set_port(port_value.Utf8Value());
}


Napi::Value ProcessReady::GetGameSessionId(const Napi::CallbackInfo& info) {
    const std::string& game_session_id = process_ready_.gamesessionid();

    return Napi::String::New(info.Env(), game_session_id);
}

void ProcessReady::SetGameSessionId(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsString()) {
        Napi::TypeError::New(info.Env(), "String expected").ThrowAsJavaScriptException();
    }

    Napi::String game_session_id_value = value.As<Napi::String>();
    process_ready_.set_gamesessionid(game_session_id_value.Utf8Value());
}

