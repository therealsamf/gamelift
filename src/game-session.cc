
#include "game-session.hh"
// clang-format off
#include <memory>
#include <string>

#include <sdk.pb.h>

#include "game-property.hh"
// clang-format on

namespace gamelift {

using namespace com::amazon::whitewater::auxproxy;
using Message = WrappedMessage<pbuffer::GameSession>;

Napi::FunctionReference* GameSession::constructor = nullptr;

Napi::Object GameSession::Init(Napi::Env env, Napi::Object exports) {
  if (!GameProperty::constructor) {
    Napi::Error::New(
        env,
        "Internal Error: during initialization 'GameSession' received invalid "
        "constructor for 'GameProperty'")
        .ThrowAsJavaScriptException();
    return exports;
  }

  Napi::Function func = DefineClass(
      env, "GameSession",
      {InstanceAccessor(
           "gameProperties",
           &Message::GetArray<pbuffer::GameProperty,
                              &pbuffer::GameSession::gameproperties>,
           &Message::SetArray<pbuffer::GameProperty,
                              &pbuffer::GameSession::add_gameproperties,
                              &pbuffer::GameSession::clear_gameproperties>,
           napi_default, GameProperty::constructor),
       InstanceAccessor(
           "gameSessionId",
           &Message::GetValue<std::string,
                              &pbuffer::GameSession::gamesessionid>,
           &Message::SetValue<std::string,
                              &pbuffer::GameSession::set_gamesessionid>),
       InstanceAccessor(
           "fleetId",
           &Message::GetValue<std::string, &pbuffer::GameSession::fleetid>,
           &Message::SetValue<std::string, &pbuffer::GameSession::set_fleetid>),
       InstanceAccessor(
           "name", &Message::GetValue<std::string, &pbuffer::GameSession::name>,
           &Message::SetValue<std::string, &pbuffer::GameSession::set_name>),
       InstanceAccessor(
           "ipAddress",
           &Message::GetValue<std::string, &pbuffer::GameSession::ipaddress>,
           &Message::SetValue<std::string,
                              &pbuffer::GameSession::set_ipaddress>),
       InstanceAccessor(
           "gameSessionData",
           &Message::GetValue<std::string,
                              &pbuffer::GameSession::gamesessiondata>,
           &Message::SetValue<std::string,
                              &pbuffer::GameSession::set_gamesessiondata>),
       InstanceAccessor(
           "matchMakerData",
           &Message::GetValue<std::string,
                              &pbuffer::GameSession::matchmakerdata>,
           &Message::SetValue<std::string,
                              &pbuffer::GameSession::set_matchmakerdata>),
       InstanceAccessor(
           "dnsName",
           &Message::GetValue<std::string, &pbuffer::GameSession::dnsname>,
           &Message::SetValue<std::string, &pbuffer::GameSession::set_dnsname>),
       InstanceAccessor(
           "maxPlayers",
           &Message::GetValue<int, &pbuffer::GameSession::maxplayers>,
           &Message::SetValue<int, &pbuffer::GameSession::set_maxplayers>),
       InstanceAccessor(
           "joinable",
           &Message::GetValue<bool, &pbuffer::GameSession::joinable>,
           &Message::SetValue<bool, &pbuffer::GameSession::set_joinable>),
       InstanceAccessor(
           "port", &Message::GetValue<int, &pbuffer::GameSession::port>,
           &Message::SetValue<int, &pbuffer::GameSession::set_port>),
       InstanceMethod("toString", &Message::ToString),
       InstanceMethod("fromString", &Message::FromString),
       InstanceMethod("fromJsonString", &Message::FromJsonString),
       InstanceMethod("getTypeName", &Message::GetTypeName)});

  Napi::FunctionReference* constructor = new Napi::FunctionReference();
  *constructor = Napi::Persistent(func);

  // Set the static member constructor variable so that other classes can
  // instantiate this one in "Javascript-land".
  GameSession::constructor = constructor;

  env.SetInstanceData(constructor);

  exports.Set("GameSession", func);
  return exports;
}

GameSession::GameSession(const Napi::CallbackInfo& info)
    : Message(info, std::make_shared<pbuffer::GameSession>()) {}

};  // namespace gamelift
