
#ifndef GAMELIFT_IO_ACCEPT_PLAYER_SESSION_H_
#define GAMELIFT_IO_ACCEPT_PLAYER_SESSION_H_
#include <napi.h>
#include <sdk.pb.h>

using namespace com::amazon::whitewater::auxproxy;

class AcceptPlayerSession : public Napi::ObjectWrap<AcceptPlayerSession> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    AcceptPlayerSession(const Napi::CallbackInfo& info);
private:
    pbuffer::AcceptPlayerSession accept_player_session_;

    Napi::Value GetPlayerSessionId(const Napi::CallbackInfo& info);
    void SetPlayerSessionId(const Napi::CallbackInfo& info, const Napi::Value& value);

    Napi::Value GetGameSessionId(const Napi::CallbackInfo& info);
    void SetGameSessionId(const Napi::CallbackInfo& info, const Napi::Value& value);
};

#endif // GAMELIFT_IO_ACCEPT_PLAYER_SESSION_H_
