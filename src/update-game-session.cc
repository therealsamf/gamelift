/**
 * Protocol Buffer "proxy" for the UpdateGameSession message.
 */

#include "update-game-session.hh"

// clang-format off
#include <memory>
#include <string>

#include "game-session.hh"
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::UpdateGameSession>;

Napi::Object UpdateGameSession::Init(Napi::Env env, Napi::Object exports) {
  if (!GameSession::constructor) {
    Napi::Error::New(env,
                     "Internal Error: during initialization "
                     "'UpdateGameSession' received invalid "
                     "constructor for 'GameSession'")
        .ThrowAsJavaScriptException();
    return exports;
  }

  Napi::Function func = DefineClass(
      env, "UpdateGameSession",
      {InstanceAccessor(
           "gameSession",
           &Message::GetValue<pbuffer::GameSession,
                              &pbuffer::UpdateGameSession::gamesession>,
           &Message::SetValue<
               pbuffer::GameSession,
               &pbuffer::UpdateGameSession::set_allocated_gamesession>,
           napi_default, GameSession::constructor),
       InstanceAccessor(
           "updateReason",
           &Message::GetValue<std::string,
                              &pbuffer::UpdateGameSession::updatereason>,
           &Message::SetValue<std::string,
                              &pbuffer::UpdateGameSession::set_updatereason>),
       InstanceAccessor(
           "backfillTicketId",
           &Message::GetValue<std::string,
                              &pbuffer::UpdateGameSession::backfillticketid>,
           &Message::SetValue<
               std::string, &pbuffer::UpdateGameSession::set_backfillticketid>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("getTypeName", &Message::GetTypeName),
       InstanceMethod("fromJsonString", &Message::FromJsonString)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  env.SetInstanceData(constructor);

  exports.Set("UpdateGameSession", func);
  return exports;
}

UpdateGameSession::UpdateGameSession(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::UpdateGameSession>()) {}

void UpdateGameSession::SetUpdateReason(const Napi::CallbackInfo& info,
                                        const Napi::Value& value) {
  if (!value.IsString()) {
    Napi::TypeError::New(info.Env(), "String expected")
        .ThrowAsJavaScriptException();
    return;
  }

  const std::string& update_reason_string =
      value.As<Napi::String>().Utf8Value();

  bool valid = false;
  if (update_reason_string.compare("MATCHMAKING_DATA_UPDATED") == 0) {
    valid = true;
  } else if (update_reason_string.compare("BACKFILL_FAILED") == 0) {
    valid = true;
  } else if (update_reason_string.compare("BACKFILL_TIMED_OUT") == 0) {
    valid = true;
  } else if (update_reason_string.compare("BACKFILL_CANCELLED") == 0) {
    valid = true;
  }

  if (!valid) {
    Napi::TypeError::New(info.Env(), "Invalid 'updateReason'")
        .ThrowAsJavaScriptException();
    return;
  }

  std::shared_ptr<pbuffer::UpdateGameSession> update_game_session =
      GetMessagePtr();

  update_game_session->set_updatereason(update_reason_string);
}

};  // namespace gamelift
