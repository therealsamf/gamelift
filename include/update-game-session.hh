
#ifndef GAMELIFT_JS_UPDATE_GAME_SESSION_H_
#define GAMELIFT_JS_UPDATE_GAME_SESSION_H_

#include <napi.h>
#include <sdk.pb.h>

using namespace com::amazon::whitewater::auxproxy;

class UpdateGameSession : public Napi::ObjectWrap<UpdateGameSession> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    UpdateGameSession(const Napi::CallbackInfo& info);

private:
    pbuffer::UpdateGameSession update_game_session_;

    Napi::Value GetGameSession(const Napi::CallbackInfo& info);
    void SetGameSession(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetUpdateReason(const Napi::CallbackInfo& info);
    void SetUpdateReason(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetBackfillTicketId(const Napi::CallbackInfo& info);
    void SetBackfillTicketId(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value ToString(const Napi::CallbackInfo& info);
    Napi::Value FromString(const Napi::CallbackInfo& info);
};

#endif // GAMELIFT_JS_UPDATE_GAME_SESSION_H_
