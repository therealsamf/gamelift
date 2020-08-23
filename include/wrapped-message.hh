
/**
 * Utility class for simplifying the declaration of attributes for wrapped
 * native objects.
 */

#ifndef GAMELIFT_IO_WRAPPED_MESSAGE_
#define GAMELIFT_IO_WRAPPED_MESSAGE_

#include <google/protobuf/message_lite.h>
#include <napi.h>

#include <functional>
#include <memory>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

namespace gamelift {

/**
 * Convert the given Node-API value to it's native equivalent.
 *
 * Note that this is an unspecialized function template **declaration** and
 * thus it's a compile-time error if this template is instantiated. One of the
 * specializations for this function template should be used instead.
 *
 * @tparam U Type of the native value to be converted to.
 * @param value Node-API value to convert into the native type.
 *
 * @return U value the given templated native type.
 */
template <typename U>
static U ConvertValue(const Napi::Value &value);

/**
 * Convert the given native value to it's Node-API equivalent.
 *
 * Note that this is an unspecialized function template **declaration** and
 * thus it's a compile-time error if this template is instantiated. One of the
 * specializations for this function template should be used instead.
 *
 * @tparam U Type of the native value.
 * @param env Node-API environment to instantiate new Node-API variables.
 * @param native Native value to convert into Node-API value.
 *
 * @return Node-API compatible value.
 */
template <typename U>
static Napi::Value ConvertNative(
    Napi::Env &env, U &&native, Napi::FunctionReference *constructor = nullptr);

/**
 * Base class for Protocol Buffer objects wrapped by Node-API
 *
 * @tparam P Protocol Buffer type that's being wrapped.
 */
template <typename P>
class WrappedMessage : public Napi::ObjectWrap<WrappedMessage<P>> {
 public:
  // Assert that the template argument correctly inherits from MessageLite
  static_assert(std::is_base_of<google::protobuf::MessageLite, P>::value);

  template <typename U>
  friend U ConvertValue(const Napi::Value &value);

  template <typename U>
  friend Napi::Value ConvertNative(Napi::Env &env, U &&native,
                                   Napi::FunctionReference *constructor);

  /**
   * Construct the WrappedMessage object.
   *
   * Shouldn't really be called from user-code.
   *
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   */
  WrappedMessage(const Napi::CallbackInfo &info);

  /**
   * Construct the WrappedMessage object with an exising pointer to the
   * Protocol Buffer object.
   *
   * Shouldn't really be called from user-code.
   *
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   * @param message_ptr Shared pointer to an existing object of the Protocol
   * Buffer object type from the template argument P.
   */
  WrappedMessage(const Napi::CallbackInfo &info,
                 const std::shared_ptr<P> &message_ptr);

  /**
   * Compute the wire format for the internal protocol buffer object.
   *
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   *
   * @return Node-API compatible string with the bytes serialized from the
   * Protocol Buffer object.
   */
  Napi::Value ToString(const Napi::CallbackInfo &info);

  /**
   * Fill-in the internal Protocol Buffer object with the pass NodeJS string
   * argument.
   *
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   *
   * @return Node-API compatible boolean, determining if the operation was
   * successful or not.
   */
  Napi::Value FromString(const Napi::CallbackInfo &info);

 private:
  std::shared_ptr<P> message_; /**< Internal pointer to the underlying Protocol
                                  Buffer object. */

 protected:
  /**
   * Retrieve the pointer to the internal Protocol Buffer object.
   *
   * @return Shared pointer pointing to internal Protocol Buffer object.
   */
  std::shared_ptr<P> GetMessagePtr();

  /**
   * Retrieve the value of a field on the internal Protocol Buffer object.
   *
   * @tparam U Type of the field.
   * @tparam get_callable Callable for the internal Protocol Buffer object
   * for getting the value of the field.
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   *
   * @return Node-API compatible variable with it's value set to the field
   * retrieved from the internal Protocol Buffer object.
   */
  template <typename U, auto (P::*get_callable)() const>
  Napi::Value GetValue(const Napi::CallbackInfo &info);

  /**
   * Set the value of a field on the internal Protocol Buffer object.
   *
   * @tparam U Type of the field.
   * @tparam set_callable Callable for the internal Protocol Buffer object
   * for setting the value of the field.
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   * @param value Node-API value carrying a Javascript value of type U to set
   * on the field in the internal Protocol Buffer object.
   */
  template <typename U, void (P::*set_callable)(U &&)>
  void SetValue(const Napi::CallbackInfo &info, const Napi::Value &value);

  // TODO: Figure out why I have to define two different template functions
  // where with the different signatures for the set_callable non-type template
  // parameter.

  /**
   * Set the value of a field on the internal Protocol Buffer object.
   *
   * @tparam U Type of the field.
   * @tparam set_callable Callable for the internal Protocol Buffer object
   * for setting the value of the field.
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   * @param value Node-API value carrying a Javascript value of type U to set
   * on the field in the internal Protocol Buffer object.
   */
  template <typename U, void (P::*set_callable)(U)>
  void SetValue(const Napi::CallbackInfo &info, const Napi::Value &value);

  /**
   * Retrieve the contents of a repeated field on the internal Protocol Buffer
   * object.
   *
   * @tparam U Type of the repeated field.
   * @tparam get_array_callable Callable for the internal Protocol Buffer
   * object for retrieving the RepeatedFieldPtr object.
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   *
   * @return Node-API compatible array with the values set to those found in
   * the internal Protocol Buffer object.
   */
  template <typename U, auto (P::*get_array_callable)() const>
  Napi::Value GetArray(const Napi::CallbackInfo &info);

  /**
   * Set the contents of a repeated field on the internal Protocol Buffer
   * object.
   *
   * @tparam U Type of the repeated field.
   * @tparam add_to_array_callable Callable for the internal Protocol Buffer
   * object for adding the the repeated field.
   * @tparam clear_array_callable Callback for the internal Protocol Buffer
   * object for clearing the repeated field.
   * @param info Node-API callback information since this function is wrapped
   * in Node-API.
   * @param value Node-API value carrying a Javascript array with values of
   * type U to emplace in the internal Protocol Buffer's object repeated field.
   */
  template <typename U, U *(P::*add_to_array_callable)(),
            void (P::*clear_array_callable)()>
  void SetArray(const Napi::CallbackInfo &info, const Napi::Value &value);
};

/**
 * Convert the given Node-API value to an integer.
 *
 * @param value Node-API value to convert into integer.
 *
 * @return Native integer representing the value contained within the given
 * Node-API value.
 */
template <>
int ConvertValue(const Napi::Value &value) {
  return value.As<Napi::Number>().Int32Value();
}

/**
 * Convert the given Node-API value to a string.
 *
 * @param value Node-API value to convert into string.
 *
 * @return Native string representing the value contained within the given
 * Node-API value.
 */
template <>
std::string ConvertValue(const Napi::Value &value) {
  return value.As<Napi::String>().Utf8Value();
}

/**
 * Convert the given Node-API value to a boolean.
 *
 * @param value Node-API value to convert into string.
 *
 * @return Native string representing the value contained within the given
 * Node-API value.
 */
template <>
bool ConvertValue(const Napi::Value &value) {
  return value.As<Napi::Boolean>().Value();
}

/**
 * Convert the given integer into a Javascript-compatible variable.
 *
 * @param native Native integer to converting.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
Napi::Value ConvertNative(Napi::Env &env, int &&native,
                          Napi::FunctionReference *constructor) {
  Napi::Value return_value = Napi::Number::New(env, native);

  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return env.Undefined();
  }

  return return_value;
}

/**
 * Convert the given string into a Javascript-compatible variable.
 *
 * @param native Native string to converting.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
Napi::Value ConvertNative(Napi::Env &env, std::string &&native,
                          Napi::FunctionReference *constructor) {
  Napi::Value return_value = Napi::String::New(env, native);

  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return env.Undefined();
  }

  return return_value;
}

/**
 * Convert the given boolean into a Javascript-compatible variable.
 *
 * @param native Native string to converting.
 *
 * @return Node-API value that can be used from Javascript.
 */
template <>
Napi::Value ConvertNative(Napi::Env &env, bool &&native,
                          Napi::FunctionReference *constructor) {
  Napi::Value return_value = Napi::Boolean::New(env, native);

  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return env.Undefined();
  }

  return return_value;
}

/**
 * Check if the given Node-API value is the type of the template parameter.
 *
 * Note that this is an unspecialized function template **declaration** and
 * thus it's a compile-time error if this template is instantiated. One of the
 * specializations for this function template should be used instead.
 *
 * @tparam U Type of the native value to check for.
 * @param value Node-API value to check type
 *
 * @return Boolean determining if the given Node-API value corresponds to the
 * given template parameter.
 */
template <typename U>
static bool CheckValue(const Napi::Value &value);

template <>
bool CheckValue<int>(const Napi::Value &value) {
  return value.IsNumber();
}

template <>
bool CheckValue<std::string>(const Napi::Value &value) {
  return value.IsString();
}

template <>
bool CheckValue<bool>(const Napi::Value &value) {
  return value.IsBoolean();
}

template <typename P>
WrappedMessage<P>::WrappedMessage(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<WrappedMessage<P>>(info),
      message_(std::make_shared<P>()) {}

template <typename P>
WrappedMessage<P>::WrappedMessage(const Napi::CallbackInfo &info,
                                  const std::shared_ptr<P> &message_ptr)
    : Napi::ObjectWrap<WrappedMessage<P>>(info), message_(message_ptr) {}

template <typename P>
Napi::Value WrappedMessage<P>::ToString(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (!message_) {
    Napi::Error::New(env, "Message has not been initialized");
    return env.Undefined();
  }

  const std::string &message_string = message_->SerializeAsString();

  const Napi::String &message = Napi::String::New(info.Env(), message_string);

  if (info.Env().IsExceptionPending()) {
    info.Env().GetAndClearPendingException().ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }

  return message;
}

template <typename P>
Napi::Value WrappedMessage<P>::FromString(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  const std::string &input_string = info[0].As<Napi::String>().Utf8Value();
  bool success = message_->ParseFromString(input_string);

  if (!success) {
    Napi::Error::New(env, "Malformed message").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }

  return Napi::Boolean::New(env, true);
}

template <typename P>
std::shared_ptr<P> WrappedMessage<P>::GetMessagePtr() {
  return std::static_pointer_cast<P>(message_);
}

template <typename P>
template <typename U, auto (P::*get_callable)() const>
Napi::Value WrappedMessage<P>::GetValue(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  std::shared_ptr<P> message_ = GetMessagePtr();

  if (!message_) {
    Napi::Error::New(env, "message hasn't been initialized");
    return env.Undefined();
  }

  // Execute the getter
  U value = std::invoke(get_callable, *message_);

  return ConvertNative<U>(env, std::move(value),
                          static_cast<Napi::FunctionReference *>(info.Data()));
}

template <typename P>
template <typename U, void (P::*set_callable)(U &&)>
void WrappedMessage<P>::SetValue(const Napi::CallbackInfo &info,
                                 const Napi::Value &value) {
  Napi::Env env = info.Env();

  std::shared_ptr<P> message_ = GetMessagePtr();

  if (!message_) {
    Napi::Error::New(env, "message hasn't been initialized");
    return;
  }

  U native_value = ConvertValue<U>(value);

  std::invoke(set_callable, *message_, std::forward<U>(native_value));
}

template <typename P>
template <typename U, void (P::*set_callable)(U)>
void WrappedMessage<P>::SetValue(const Napi::CallbackInfo &info,
                                 const Napi::Value &value) {
  Napi::Env env = info.Env();

  std::shared_ptr<P> message_ = GetMessagePtr();

  if (!message_) {
    Napi::Error::New(env, "message hasn't been initialized");
    return;
  }

  U native_value = ConvertValue<U>(value);

  std::invoke(set_callable, *message_, std::forward<U>(native_value));
}

template <typename P>
template <typename U, auto (P::*get_array_callable)() const>
Napi::Value WrappedMessage<P>::GetArray(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  std::shared_ptr<P> message_ = GetMessagePtr();

  const ::google::protobuf::RepeatedPtrField<U> &repeated_field =
      std::invoke(get_array_callable, *message_);

  if (!message_) {
    Napi::Error::New(env, "message hasn't been initialized");
    return env.Undefined();
  }

  Napi::Array array = Napi::Array::New(env);
  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return env.Undefined();
  }

  typename google::protobuf::RepeatedPtrField<U>::const_iterator it =
      repeated_field.begin();

  unsigned int index = 0;
  for (; it != repeated_field.end(); ++it) {
    U native_value = *it;

    Napi::Value value =
        ConvertNative<U>(env, std::move(native_value),
                         static_cast<Napi::FunctionReference *>(info.Data()));

    array.Set(index++, value);
  }

  return array;
}

template <typename P>
template <typename U, U *(P::*add_to_array_callable)(),
          void (P::*clear_array_callable)()>
void WrappedMessage<P>::SetArray(const Napi::CallbackInfo &info,
                                 const Napi::Value &value) {
  Napi::Env env = info.Env();

  // Ensure that the passed value is at least an object...
  // TODO: Is there a way to ensure Array here? (Array.isArray())
  if (!value.IsObject()) {
    Napi::TypeError::New(env, "object expected").ThrowAsJavaScriptException();
    return;
  }

  // Retrieve & check the underlying Protocol buffer message pointer
  std::shared_ptr<P> message_ = GetMessagePtr();
  if (!message_) {
    Napi::Error::New(env, "message hasn't been initialized");
    return;
  }

  // Convert the given argument to a NodeJS array and error-check
  const Napi::Array &array = value.As<Napi::Array>();
  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException().ThrowAsJavaScriptException();
    return;
  }

  // Retrieve the length of the array
  unsigned int array_size = array.Length();

  // Grab all the values out of the NodeJS array and put them into native vector
  typename std::vector<U> vector;
  for (unsigned int i = 0; i < array_size; ++i) {
    Napi::Value array_value = array.Get(i);

    if (!CheckValue<U>(array_value)) {
      Napi::TypeError::New(env, "found invalid type in array")
          .ThrowAsJavaScriptException();
      return;
    }

    vector.push_back(ConvertValue<U>(array_value));
  }

  // Clear out the array on the underlying Protocol Buffer object
  std::invoke(clear_array_callable, *message_);

  // Add all the values we placed in the vector to the Protocol Buffer object
  for (auto it = vector.begin(); it != vector.end(); ++it) {
    U *native_array_value = std::invoke(add_to_array_callable, *message_);
    *native_array_value = *it;
  }
}

};  // namespace gamelift

#endif  // GAMELIFT_IO_WRAPPED_MESSAGE_
