
#include "process-ready.hh"

#include <string>
#include <vector>

#include <google/protobuf/repeated_field.h>

Napi::Object ProcessReady::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "ProcessReady", {
        InstanceAccessor("port", &ProcessReady::GetPort, &ProcessReady::SetPort),
        InstanceAccessor("logPathsToUpload", &ProcessReady::GetLogPathsToUpload, &ProcessReady::SetLogPathsToUpload),
        InstanceMethod("toString", &ProcessReady::ToString),
        InstanceMethod("fromString", &ProcessReady::FromString),
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);


    exports.Set("ProcessReady", func);
    return exports;
}

ProcessReady::ProcessReady(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<ProcessReady>(info), process_ready_() {
}

Napi::Value ProcessReady::GetPort(const Napi::CallbackInfo& info) {
    const int& port = process_ready_.port();

    return Napi::Number::New(info.Env(), port);
}

void ProcessReady::SetPort(const Napi::CallbackInfo& info, const Napi::Value& value) {
    if (!value.IsNumber()) {
        Napi::TypeError::New(info.Env(), "Integer expected").ThrowAsJavaScriptException();
    }

    Napi::Number port_value = value.As<Napi::Number>();
    process_ready_.set_port(port_value.Int32Value());
}


Napi::Value ProcessReady::GetLogPathsToUpload(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array log_paths_to_upload_array = Napi::Array::New(env);
    if (env.IsExceptionPending()) {
        env.GetAndClearPendingException().ThrowAsJavaScriptException();
        return env.Undefined();
    }

    const google::protobuf::RepeatedPtrField<std::string>& log_paths = process_ready_.logpathstoupload();
    google::protobuf::RepeatedPtrField<std::string>::const_iterator it = log_paths.begin();

    unsigned int index = 0;
    for (; it != log_paths.end(); ++it) {
        const std::string& native_log_path_string = *it;
        Napi::String log_path_string = Napi::String::New(env, native_log_path_string);
        if (env.IsExceptionPending()) {
            env.GetAndClearPendingException().ThrowAsJavaScriptException();
            return env.Undefined();
        }

        if (log_path_string.IsUndefined() || log_path_string.IsNull()) {
            Napi::Error::New(env, "Unable to properly convert native string").ThrowAsJavaScriptException();
            return env.Undefined();
        }

        log_paths_to_upload_array.Set(index++, log_path_string);
    }

    return log_paths_to_upload_array;
}

void ProcessReady::SetLogPathsToUpload(const Napi::CallbackInfo& info, const Napi::Value& value) {
    Napi::Env env = info.Env();

    if (!value.IsObject()) {
        Napi::TypeError::New(env, "Object expected").ThrowAsJavaScriptException();
    }
    const Napi::Array& array = value.As<Napi::Array>();

    unsigned int array_size = array.Length();
    if (env.IsExceptionPending()) {
        env.GetAndClearPendingException().ThrowAsJavaScriptException();
        return;
    }

    std::vector<std::string> log_paths;
    for (unsigned int i = 0; i < array_size; ++i) {
        Napi::Value array_value = array.Get(i);
        if (!array_value.IsString()) {
            Napi::TypeError::New(info.Env(), "Found non-string type in array").ThrowAsJavaScriptException();
            return;
        }

        const std::string& log_path = array_value.As<Napi::String>().Utf8Value();
        log_paths.push_back(log_path);
    }

    // Only after successfully grabbing every value off of the array do we clear the
    // internal value
    process_ready_.clear_logpathstoupload();
    for (std::vector<std::string>::iterator it = log_paths.begin(); it != log_paths.end(); ++it) {
        process_ready_.add_logpathstoupload(*it);
    }
}

Napi::Value ProcessReady::ToString(const Napi::CallbackInfo& info) {
    const std::string& process_ready_string = process_ready_.SerializeAsString();
    Napi::String process_ready = Napi::String::New(info.Env(), process_ready_string);

    if (info.Env().IsExceptionPending()) {
        info.Env().GetAndClearPendingException().ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }

    return process_ready;
}

Napi::Value ProcessReady::FromString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    const std::string& input_string = info[0].As<Napi::String>().Utf8Value();
    bool success = process_ready_.ParseFromString(input_string);

    if (!success) {
        Napi::Error::New(env, "Malformed message").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    return Napi::Boolean::New(env, true);
}
