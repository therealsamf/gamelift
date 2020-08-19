/**
 * Base class for the network interface.
 */

#ifndef GAMELIFT_IO_NETWORK_SESSION_H_
#define GAMELIFT_IO_NETWORK_SESSION_H_
#include <condition_variable>
#include <mutex>
#include <napi.h>
#include <uv.h>

class Network : public Napi::ObjectWrap<Network>
{
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    Network(const Napi::CallbackInfo &info);

    virtual void Finalize(Napi::Env env) override;

    /**
     * Synchronously connects the passed in socket.io-client socket object.
     * @param info
     */
    void PerformConnect(const Napi::CallbackInfo &info);

    /**
     * Callback for the 'connect' event that modifies the synchronization primitives
     * and allows the PerformConnect() method to return.
     * @param info
     */
    void ConnectCallback(const Napi::CallbackInfo& info);

private:
    uv_mutex_t mutex_;
    uv_cond_t condition_variable_;
    bool connect_finish_;
};

#endif // GAMELIFT_IO_NETWORK_SESSION_H_
