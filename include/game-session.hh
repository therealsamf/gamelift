
#ifndef GAMELIFT_JS_GAME_SESSION_H_
#define GAMELIFT_JS_GAME_SESSION_H_

#include <napi.h>
#include <sdk.pb.h>

using namespace com::amazon::whitewater::auxproxy;

class GameSession : public Napi::ObjectWrap<GameSession> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    GameSession(const Napi::CallbackInfo& info);
    GameSession(const Napi::CallbackInfo& info, const pbuffer::GameSession& game_session);

private:
    pbuffer::GameSession game_session_;

    Napi::Value GetFleetId(const Napi::CallbackInfo& info);
    void SetFleetId(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetGameSessionId(const Napi::CallbackInfo& info);
    void SetGameSessionId(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetMaximumPlayerSessionCount(const Napi::CallbackInfo& info);
    void SetMaximumPlayerSessionCount(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetName(const Napi::CallbackInfo& info);
    void SetName(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetPort(const Napi::CallbackInfo& info);
    void SetPort(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetIpAddress(const Napi::CallbackInfo& info);
    void SetIpAddress(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetGameSessionData(const Napi::CallbackInfo& info);
    void SetGameSessionData(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetMatchmakerData(const Napi::CallbackInfo& info);
    void SetMatchmakerData(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetDnsName(const Napi::CallbackInfo& info);
    void SetDnsName(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetGameProperties(const Napi::CallbackInfo& info);
    void SetGameProperties(const Napi::CallbackInfo& info, const Napi::Value& value);

};

#endif // GAMELIFT_JS_GAME_SESSION_H_
