
#include <napi.h>
#include "accept-player-session.hh"
#include "game-property.hh"
#include "game-session.hh"
#include "process-ready.hh"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  using namespace gamelift;

  exports = GameProperty::Init(env, exports);
  exports = GameSession::Init(env, exports);
  exports = ProcessReady::Init(env, exports);

  return AcceptPlayerSession::Init(env, exports);
}

NODE_API_MODULE(gamelift, InitAll)
