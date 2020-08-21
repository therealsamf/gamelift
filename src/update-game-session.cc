/**
 * Protocol Buffer "proxy" for the UpdateGameSession message.
 */

#include "update-game-session.hh"

#include <string>

#include "game-session.hh"

Napi::Object UpdateGameSession::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "UpdateGameSession", {
        InstanceAccessor("gameSession", &UpdateGameSession::GetGameSession, &UpdateGameSession::SetGameSession),
        InstanceAccessor("updateReason", &UpdateGameSession::GetUpdateReason, &UpdateGameSession::SetUpdateReason),
        InstanceAccessor("backfillTicketId", &UpdateGameSession::GetBackfillTicketId, &UpdateGameSession::SetBackfillTicketId),
        InstanceMethod("toString", &UpdateGameSession::ToString),
        InstanceMethod("fromString", &UpdateGameSession::FromString),
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);


    exports.Set("UpdateGameSession", func);
    return exports;
}

UpdateGameSession::UpdateGameSession(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<UpdateGameSession>(info), update_game_session_() {
}

Napi::Value UpdateGameSession::GetGameSession(const Napi::CallbackInfo& info) {
    bool gameSessionExists = update_game_session_.has_gamesession();

    if (!gameSessionExists) {
        return info.Env().Undefined();
    }

    const pbuffer::GameSession& game_session = update_game_session_.gamesession();
    GameSession game_session_obj(info, game_session);

    Napi::Value game_session_value = game_session_obj.Value();
    return game_session_value;
}

void UpdateGameSession::SetGameSession(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsObject()) {
        Napi::TypeError::New(info.Env(), "Object expected").ThrowAsJavaScriptException();
        return;
    }

    update_game_session_.clear_gamesession();
    pbuffer::GameSession* new_game_session = new pbuffer::GameSession();


    update_game_session_.set_allocated_gamesession(new_game_session);
}

Napi::Value UpdateGameSession::GetUpdateReason(const Napi::CallbackInfo& info) {
    const std::string& update_reason_string = update_game_session_.updatereason();
    Napi::String update_reason = Napi::String::New(info.Env(), update_reason_string);

    if (info.Env().IsExceptionPending()) {
        info.Env().GetAndClearPendingException().ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }

    return update_reason;
}

void UpdateGameSession::SetUpdateReason(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsString()) {
        Napi::TypeError::New(info.Env(), "String expected").ThrowAsJavaScriptException();
        return;
    }

    const std::string& update_reason_string = value.As<Napi::String>().Utf8Value();

    bool valid = false;
    if (update_reason_string.compare("MATCHMAKING_DATA_UPDATED") == 0) {
        valid = true;
    } else if (update_reason_string.compare("BACKFILL_FAILED") == 0) {
        valid = true;
    } else if (update_reason_string.compare("BACKFILL_TIMED_OUT")  == 0) {
        valid = true;
    } else if (update_reason_string.compare("BACKFILL_CANCELLED") == 0) {
        valid = true;
    }

    if (!valid) {
        Napi::TypeError::New(info.Env(), "Invalid 'updateReason'").ThrowAsJavaScriptException();
        return;
    }

    update_game_session_.set_updatereason(update_reason_string);
}

Napi::Value UpdateGameSession::GetBackfillTicketId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    const std::string& backfill_ticket_id = update_game_session_.backfillticketid();

    const Napi::Value& return_value = Napi::String::New(info.Env(), backfill_ticket_id);
    if (env.IsExceptionPending()) {
        env.GetAndClearPendingException().ThrowAsJavaScriptException();
        return env.Undefined();
    }

    return return_value;
}

void UpdateGameSession::SetBackfillTicketId(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsString()) {
        Napi::TypeError::New(info.Env(), "String expected").ThrowAsJavaScriptException();
    }

    Napi::String backfill_ticket_id_value = value.As<Napi::String>();
    update_game_session_.set_backfillticketid(backfill_ticket_id_value.Utf8Value());
}

Napi::Value UpdateGameSession::ToString(const Napi::CallbackInfo& info) {
    const std::string& update_game_session_string = update_game_session_.SerializeAsString();
    Napi::String update_game_session = Napi::String::New(info.Env(), update_game_session_string);

    if (info.Env().IsExceptionPending()) {
        info.Env().GetAndClearPendingException().ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }

    return update_game_session;
}

Napi::Value UpdateGameSession::FromString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    const std::string& input_string = info[0].As<Napi::String>().Utf8Value();
    bool success = update_game_session_.ParseFromString(input_string);

    if (!success) {
        Napi::Error::New(env, "Malformed message").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    return Napi::Boolean::New(env, true);
}
