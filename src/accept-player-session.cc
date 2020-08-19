
#include "accept-player-session.hh"

#include <string>

Napi::Object AcceptPlayerSession::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "AcceptPlayerSession", {
        InstanceAccessor("playerSessionId", &AcceptPlayerSession::GetPlayerSessionId, &AcceptPlayerSession::SetPlayerSessionId),
        InstanceAccessor("gameSessionId", &AcceptPlayerSession::GetGameSessionId, &AcceptPlayerSession::SetGameSessionId)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);


    exports.Set("AcceptPlayerSession", func);
    return exports;
}

AcceptPlayerSession::AcceptPlayerSession(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<AcceptPlayerSession>(info), accept_player_session_() {
}

Napi::Value AcceptPlayerSession::GetPlayerSessionId(const Napi::CallbackInfo& info) {
    const std::string& player_session_id = accept_player_session_.playersessionid();

    return Napi::String::New(info.Env(), player_session_id);
}

void AcceptPlayerSession::SetPlayerSessionId(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsString()) {
        Napi::TypeError::New(info.Env(), "String expected").ThrowAsJavaScriptException();
    }

    Napi::String player_session_id_value = value.As<Napi::String>();
    accept_player_session_.set_playersessionid(player_session_id_value.Utf8Value());
}


Napi::Value AcceptPlayerSession::GetGameSessionId(const Napi::CallbackInfo& info) {
    const std::string& game_session_id = accept_player_session_.gamesessionid();

    return Napi::String::New(info.Env(), game_session_id);
}

void AcceptPlayerSession::SetGameSessionId(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsString()) {
        Napi::TypeError::New(info.Env(), "String expected").ThrowAsJavaScriptException();
    }

    Napi::String game_session_id_value = value.As<Napi::String>();
    accept_player_session_.set_gamesessionid(game_session_id_value.Utf8Value());
}

