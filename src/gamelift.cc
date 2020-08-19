
#include <napi.h>
#include "accept-player-session.hh"
#include "network.hh"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports = Network::Init(env, exports);
  return AcceptPlayerSession::Init(env, exports);
}

NODE_API_MODULE(gamelift, InitAll)
