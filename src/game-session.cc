/**
 * Protocol Buffer "proxy" for the UpdateGameSession message.
 */

#include "game-session.hh"
#include <string>

GameSession::GameSession(const Napi::CallbackInfo &info) : Napi::ObjectWrap<GameSession>(info), game_session_() {}

GameSession::GameSession(const Napi::CallbackInfo &info, const pbuffer::GameSession& game_session) : Napi::ObjectWrap<GameSession>(info) {
    game_session_.set_fleetid(game_session.fleetid());
    game_session_.set_gamesessionid(game_session.gamesessionid());
    game_session_.set_maxplayers(game_session_.maxplayers());
    game_session_.set_name(game_session.name());
    game_session_.set_port(game_session.port());
    game_session_.set_ipaddress(game_session.ipaddress());
    game_session_.set_gamesessiondata(game_session.gamesessiondata());
    game_session_.set_matchmakerdata(game_session.matchmakerdata());
    game_session_.set_dnsname(game_session.dnsname());

    // Loop through game properties
}
