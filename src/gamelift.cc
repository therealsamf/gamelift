
#include <napi.h>

#include "accept-player-session.hh"
#include "activate-game-session.hh"
#include "describe-player-sessions-request.hh"
#include "describe-player-sessions-response.hh"
#include "game-property.hh"
#include "game-session-activate.hh"
#include "game-session.hh"
#include "gamelift-response.hh"
#include "get-instance-certificate.hh"
#include "get-instance-certificate-response.hh"
#include "player-session.hh"
#include "process-ready.hh"
#include "update-game-session.hh"
#include "wrapped-message.hh"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  using namespace gamelift;
  InitializeJsonParseOptions();

  // Note: Order **absolutely matters here**. Since some objects use the
  // constructors of other objects, the dependent objects must be initialized
  // first!
  //
  // Fortunately, when you attempt to import this addon into a NodeJS script,
  // if this order is messed up (and there aren't any bugs in the C++ code),
  // errors are thrown.

  exports = AcceptPlayerSession::Init(env, exports);
  exports = GameProperty::Init(env, exports);
  // Depends on GameProperty
  exports = GameSession::Init(env, exports);
  exports = GameSessionActivate::Init(env, exports);
  exports = ActivateGameSession::Init(env, exports);
  exports = PlayerSession::Init(env, exports);
  exports = GameLiftResponse::Init(env, exports);
  exports = GetInstanceCertificate::Init(env, exports);
  exports = GetInstanceCertificateResponse::Init(env, exports);
  exports = DescribePlayerSessionsRequest::Init(env, exports);
  // Depends on PlayerSession
  exports = DescribePlayerSessionsResponse::Init(env, exports);
  exports = UpdateGameSession::Init(env, exports);
  exports = ProcessReady::Init(env, exports);

  return exports;
}

NODE_API_MODULE(gamelift, InitAll)
