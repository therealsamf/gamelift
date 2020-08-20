
#include <napi.h>
#include "accept-player-session.hh"
#include "process-ready.hh"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports = ProcessReady::Init(env, exports);
  return AcceptPlayerSession::Init(env, exports);
}

NODE_API_MODULE(gamelift, InitAll)
