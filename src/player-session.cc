
#include "player-session.hh"
// clang-format off
#include <memory>
#include <stdint.h>
#include <string>

#include <napi.h>
#include <sdk.pb.h>
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::PlayerSession>;

Napi::FunctionReference* PlayerSession::constructor = nullptr;

Napi::Object PlayerSession::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(
      env, "PlayerSession",
      {InstanceAccessor(
           "playerSessionId",
           &Message::GetValue<std::string,
                              &pbuffer::PlayerSession::playersessionid>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_playersessionid>),
       InstanceAccessor(
           "playerId",
           &Message::GetValue<std::string, &pbuffer::PlayerSession::playerid>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_playerid>),
       InstanceAccessor(
           "gameSessionId",
           &Message::GetValue<std::string,
                              &pbuffer::PlayerSession::gamesessionid>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_gamesessionid>),
       InstanceAccessor(
           "fleetId",
           &Message::GetValue<std::string, &pbuffer::PlayerSession::fleetid>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_fleetid>),
       InstanceAccessor(
           "ipAddress",
           &Message::GetValue<std::string, &pbuffer::PlayerSession::ipaddress>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_ipaddress>),
       InstanceAccessor(
           "status",
           &Message::GetValue<std::string, &pbuffer::PlayerSession::status>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_status>),
       InstanceAccessor(
           "creationTime",
           &Message::GetValue<int64_t, &pbuffer::PlayerSession::creationtime>,
           &Message::SetValue<int64_t, &pbuffer::PlayerSession::set_creationtime>),
        InstanceAccessor(
           "terminationTime",
           &Message::GetValue<int64_t, &pbuffer::PlayerSession::terminationtime>,
           &Message::SetValue<int64_t, &pbuffer::PlayerSession::set_terminationtime>),
       InstanceAccessor(
           "port", &Message::GetValue<int, &pbuffer::PlayerSession::port>,
           &Message::SetValue<int, &pbuffer::PlayerSession::set_port>),
       InstanceAccessor(
           "playerData",
           &Message::GetValue<std::string, &pbuffer::PlayerSession::playerdata>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_playerdata>),
       InstanceAccessor(
           "dnsName",
           &Message::GetValue<std::string, &pbuffer::PlayerSession::dnsname>,
           &Message::SetValue<std::string,
                              &pbuffer::PlayerSession::set_dnsname>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);
  PlayerSession::constructor = constructor;

  env.SetInstanceData(constructor);

  exports.Set("PlayerSession", func);
  return exports;
}

PlayerSession::PlayerSession(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::PlayerSession>()) {}

};  // namespace gamelift
