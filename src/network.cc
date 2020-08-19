
#include "network.hh"
#include <functional>
#include <uv.h>

Napi::Object Network::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "Network", {InstanceMethod("performConnect", &Network::PerformConnect)});

    Napi::FunctionReference *constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("Network", func);
    return exports;
}

Network::Network(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<Network>(info), connect_finish_(false)
{
    if (uv_mutex_init(&mutex_) != 0)
    {
    }
    if (uv_cond_init(&condition_variable_) != 0)
    {
    }
}

void Network::Finalize(Napi::Env env)
{
    uv_mutex_init(&mutex_);
    uv_cond_destroy(&condition_variable_);
}

void Network::PerformConnect(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    // Assert that a valid object was passed in the method
    if (info.Length() <= 0 || !info[0].IsObject())
    {
        Napi::TypeError::New(env, "Object expected").ThrowAsJavaScriptException();
        return;
    }

    // Grab the object from the function arguments and save it in variable
    Napi::Object socket = info[0].As<Napi::Object>();

    // Assert that the object has a valid 'connect' method before saving it in variable
    if (!socket.Has("connect") || !socket.Get("connect").IsFunction())
    {
        Napi::TypeError::New(env, "connect is not a function").ThrowAsJavaScriptException();
        return;
    }
    Napi::Function connect = socket.Get("connect").As<Napi::Function>();

    // Assert that the object has a valid 'once' method before saving it in a variable
    if (!socket.Has("once"))
    {
        Napi::TypeError::New(env, "once is not a function").ThrowAsJavaScriptException();
        return;
    }
    Napi::Function once = socket.Get("once").As<Napi::Function>();

    // Create a "connect" string to use when calling 'once()'
    Napi::Value connect_string = Napi::String::New(env, "connect");

    // Create a bound Callable for the callback
    std::function<void(const Napi::CallbackInfo &)> connect_callback = std::bind(&Network::ConnectCallback, this, std::placeholders::_1);

    // Create a valid Javascript function callback to pass to 'once()'
    Napi::Function napi_connect_callback = Napi::Function::New(env, connect_callback);

    // Call the 'once()' method to attach our C++ callback to the 'connect' event
    once.Call(info.This(), {connect_string, napi_connect_callback});

    // Call the 'connect()' method to instruct the socket.io-client object to connect
    // to the server
    connect.Call(info.This(), {});

    // Block until the socket has connected
    uv_mutex_lock(&mutex_);
    while (!connect_finish_)
    {
        uv_cond_wait(&condition_variable_, &mutex_);
    }
    connect_finish_ = false;
    uv_mutex_unlock(&mutex_);
}

void Network::ConnectCallback(const Napi::CallbackInfo &info)
{
    uv_mutex_lock(&mutex_);
    uv_cond_broadcast(&condition_variable_);
    connect_finish_ = true;
    uv_mutex_unlock(&mutex_);
}
