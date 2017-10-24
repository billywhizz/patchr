#include <node.h>
#include "patchr.h"

namespace patchr {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Integer;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Patch(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = args.GetIsolate();
	String::Utf8Value utf8Source(args[0]);
	char* source = (*utf8Source);
	String::Utf8Value utf8Delta(args[1]);
	char* delta = (*utf8Delta);
	String::Utf8Value utf8Out(args[2]);
	char* out = (*utf8Out);
	int r = patch(source, delta, out);
	args.GetReturnValue().Set(Integer::New(isolate, r));
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "patch", Patch);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}