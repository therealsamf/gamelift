
#ifndef GAMELIFT_IO_DESCRIBE_PLAYER_SESSIONS_RESPONSE_H_
#define GAMELIFT_IO_DESCRIBE_PLAYER_SESSIONS_RESPONSE_H_
#include <napi.h>
#include <sdk.pb.h>

#include "wrapped-message.hh"

using namespace com::amazon::whitewater::auxproxy;

namespace gamelift {

/**
 * Javascript compatible object wrapping the DescribePlayerSessionsResponse
 * Protocol Buffer object.
 *
 * This Protocol Buffer object is internal and is only used to return results
 * from a when the [DescribePLayerSessionsRequest()] SDK method is utilized.
 *
 * [DescribePLayerSessionsRequest()]:
 * https://docs.aws.amazon.com/gamelift/latest/developerguide/integration-server-sdk-cpp-ref-actions.html#integration-server-sdk-cpp-ref-describeplayersessions
 */
class DescribePlayerSessionsResponse
    : public WrappedMessage<pbuffer::DescribePlayerSessionsResponse> {
 public:
  /**
   * Initialize the DescribePlayerSessionsResponse class. This attaches the constructor to
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
   * Constructor for the DescribePlayerSessionsResponse.
   *
   * Initializes the ObjectWrap class as well as the internal
   * DescribePlayerSessionsResponse Protocol Buffer object with its defaults for its
   * fields.
   *
   * @param info Node-API callback information
   */
  DescribePlayerSessionsResponse(const Napi::CallbackInfo& info);
};

};  // namespace gamelift

#endif  // GAMELIFT_IO_DESCRIBE_PLAYER_SESSIONS_RESPONSE_H_
