
#ifndef GAMELIFT_IO_DESCRIBE_PLAYER_SESSIONS_REQUEST_H_
#define GAMELIFT_IO_DESCRIBE_PLAYER_SESSIONS_REQUEST_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the [DescribePlayerSessionsRequest] Protocol
 * Buffer object.
 *
 * [DescribePlayerSessionsRequest]:
 * https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-datatypes.html#integration-server-sdk-cpp-ref-dataypes-playersessions
 */
class DescribePlayerSessionsRequest
    : public WrappedMessage<pbuffer::DescribePlayerSessionsRequest> {
 public:
  /**
   * Initialize the DescribePlayerSessionsRequest class. This attaches the constructor to
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
   * Constructor for the DescribePlayerSessionsRequest.
   *
   * Initializes the ObjectWrap class as well as the internal
   * DescribePlayerSessionsRequest Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  DescribePlayerSessionsRequest(const Napi::CallbackInfo& info);

  /**
   * Mutator for the PlayerSessionStatusFilter.
   *
   * This is implemented as it's own method rather than using {@link SetValue}
   * in order to check the validity of the enumeration.
   *
   * @param info Node-API callback information
   * @param value Node-API value carrying a Javascript string to set as the
   * PlayerSessionStatusFilter.
   */
  void SetPlayerSessionStatusFilter(const Napi::CallbackInfo& info, const Napi::Value& value);

};

};  // namespace gamelift

#endif  // GAMELIFT_IO_DESCRIBE_PLAYER_SESSIONS_REQUEST_H_
