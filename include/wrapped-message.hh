
/**
 * Utility class for simplifying the declaration of attributes for wrapped
 * native objects.
 */

#ifndef GAMELIFT_IO_WRAPPED_MESSAGE_
#define GAMELIFT_IO_WRAPPED_MESSAGE_

#include <functional>
#include <memory>
#include <type_traits>

#include <google/protobuf/message_lite.h>
#include <napi.h>

template<typename T, typename P>
class WrappedMessage : public Napi::ObjectWrap<T> {
public:
    static_assert(std::is_base_of<google::protobuf::MessageLite, P>::value);

    WrappedMessage(const Napi::CallbackInfo& info, const std::shared_ptr<P>& message_ptr);

    Napi::Value ToString(const Napi::CallbackInfo& info);
    Napi::Value FromString(const Napi::CallbackInfo& info);

protected:
    std::shared_ptr<P> message_;

    std::shared_ptr<P> GetMessagePtr();

    template<typename U, U(P::*get_callable)() const>
    Napi::Value GetValue(const Napi::CallbackInfo& info);

    template<typename U, void(P::*set_callable)(U)>
    void SetValue(const Napi::CallbackInfo& info, const Napi::Value& value);
};

template<typename T, typename P>
WrappedMessage<T, P>::WrappedMessage(const Napi::CallbackInfo& info, const std::shared_ptr<P>& message_ptr) : Napi::ObjectWrap<T>(info), message_(message_ptr) {}

template<typename T, typename P>
Napi::Value WrappedMessage<T, P>::ToString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!message_) {
        Napi::Error::New(env, "Message has not been initialized");
        return env.Undefined();
    }

    const std::string& message_string = message_->SerializeAsString();

    const Napi::String& message = Napi::String::New(info.Env(), message_string);

    if (info.Env().IsExceptionPending()) {
        info.Env().GetAndClearPendingException().ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }

    return message;
}

template<typename T, typename P>
Napi::Value WrappedMessage<T, P>::FromString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    const std::string& input_string = info[0].As<Napi::String>().Utf8Value();
    bool success = message_->ParseFromString(input_string);

    if (!success) {
        Napi::Error::New(env, "Malformed message").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    return Napi::Boolean::New(env, true);
}

template<typename T, typename P>
std::shared_ptr<P> WrappedMessage<T, P>::GetMessagePtr() {
    return std::static_pointer_cast<P>(message_);
}

template<typename T, typename P>
template<typename U, U(P::*get_callable)() const>
Napi::Value WrappedMessage<T, P>::GetValue(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    std::shared_ptr<P> message_ = GetMessagePtr();

    if (!message_) {
        Napi::Error::New(env, "message hasn't been initialized");
        return env.Undefined();
    }

    // Execute the getter
    const U& value = std::invoke(get_callable, *message_);

    Napi::Value return_value;
    if constexpr(std::is_same<U, int>::value) {
        return_value = Napi::Number::New(env, value);
    } else if constexpr(std::is_same<U, std::string>::value) {
        return_value = Napi::String::New(env, value);
    }

    if (env.IsExceptionPending()) {
        env.GetAndClearPendingException().ThrowAsJavaScriptException();
        return env.Undefined();
    }

    return return_value;
}

template<typename T, typename P>
template<typename U, void(P::*set_callable)(U)>
void WrappedMessage<T, P>::SetValue(const Napi::CallbackInfo& info, const Napi::Value& value) {
    Napi::Env env = info.Env();

    std::shared_ptr<P> message_ = GetMessagePtr();

    if (!message_) {
        Napi::Error::New(env, "message hasn't been initialized");
        return;
    }

    U native_value;

    if constexpr(std::is_same<U, int>::value) {
        native_value = value.As<Napi::Number>().Int32Value();
    }

    std::invoke(set_callable, *message_, native_value);
}

#endif // GAMELIFT_IO_WRAPPED_MESSAGE_
