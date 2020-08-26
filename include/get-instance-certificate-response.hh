
#ifndef GAMELIFT_IO_GET_INSTANCE_CERTIFICATE_RESPONSE_H_
#define GAMELIFT_IO_GET_INSTANCE_CERTIFICATE_RESPONSE_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the GetInstanceCertificateResponse Protocol
 * Buffer object.
 *
 * This is the response received from the GameLift service when the SDK method
 * [GetInstanceCertificate()] is utilized.
 *
 * [GetInstanceCertificate()]:
 * https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-getinstancecertificate
 */
class GetInstanceCertificateResponse
    : public WrappedMessage<pbuffer::GetInstanceCertificateResponse> {
 public:
  /**
   * Initialize the GetInstanceCertificateResponse class. This attaches the constructor to
   * the addon and allows objects to be instantiated from "Javascript-land".
   *
   * @param env Node-API environment
   * @param exports Node-API object for the exports of the C++ addon
   *
   * @return The exports object after the constructor for this object has been
   * attached.
   */
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  /**
   * Constructor for the GetInstanceCertificateResponse.
   *
   * Initializes the ObjectWrap class as well as the internal
   * GetInstanceCertificateResponse Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  GetInstanceCertificateResponse(const Napi::CallbackInfo& info);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_GET_INSTANCE_CERTIFICATE_RESPONSE_H_
