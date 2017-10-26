#include <nan.h>
#include <node.h>
#include "patchr.h"

namespace patchr
{

using namespace v8;

inline std::string get(const v8::Local<v8::Value> &value)
{
	return std::string(*v8::String::Utf8Value(value));
}

class PatchWorker : public Nan::AsyncWorker
{
public:
	PatchWorker(Nan::Callback *callback, v8::Local<v8::Value> source, v8::Local<v8::Value> delta, v8::Local<v8::Value> out)
			: Nan::AsyncWorker(callback), source(get(source)), delta(get(delta)), out(get(out))
	{
	}

	~PatchWorker() {}

	void Execute()
	{
		ret = patch(source.c_str(), delta.c_str(), out.c_str());
		if (ret == 0)
			return;
		switch (ret)
		{
		case 1:
			SetErrorMessage("Bad Magic Number");
			break;
		case 2:
			SetErrorMessage("Invalid Command");
			break;
		case 3:
			SetErrorMessage("Bad Read From Patch File");
			break;
		case 4:
			SetErrorMessage("Bad Read From Source File");
			break;
		case 5:
			SetErrorMessage("Bad Write to Output File");
			break;
		}
	}

	void HandleOKCallback()
	{
		Nan::HandleScope scope;
		v8::Local<v8::Value> argv[] = {
				Nan::Null(),
				Nan::New<Number>(1)};
		callback->Call(2, argv);
	}

	void HandleErrorCallback()
	{
		Nan::HandleScope scope;
		v8::Local<v8::Value> argv[] = {
				Nan::Error(ErrorMessage())};
		callback->Call(1, argv);
	}

private:
	int ret;
	std::string source;
	std::string delta;
	std::string out;
};

NAN_METHOD(PatchSync)
{
	int ret = patch(get(info[0]).c_str(), get(info[1]).c_str(), get(info[2]).c_str());
	info.GetReturnValue().Set(ret);
}

NAN_METHOD(PatchAsync)
{
	Nan::Callback *callback = new Nan::Callback(info[3].As<Function>());
	Nan::AsyncQueueWorker(new PatchWorker(callback, info[0], info[1], info[2]));
}

NAN_MODULE_INIT(InitAll)
{
	Nan::Set(target, Nan::New<String>("patchSync").ToLocalChecked(),
					 Nan::GetFunction(Nan::New<v8::FunctionTemplate>(PatchSync)).ToLocalChecked());

	Nan::Set(target, Nan::New<String>("patch").ToLocalChecked(),
					 Nan::GetFunction(Nan::New<v8::FunctionTemplate>(PatchAsync)).ToLocalChecked());
}

NODE_MODULE(patchr, InitAll)
}
