#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>

#include <nan.h>
#include <node.h>

#define MAX_BLOCK 1024 * 1024
#define MAGIC 0x72730236

namespace patchr
{

using namespace v8;

uv_loop_t* loop;

inline uint16_t readuint16(uint8_t* b) {
  return ((b[0] << 8) + b[1]);
}

inline uint32_t readuint32(uint8_t* b) {
  return ((b[0] << 24) + (b[1] << 16) + (b[2] << 8) + b[3]);
}

inline uint32_t readnumber(int fd, uint8_t* b, uint8_t bytes) {
	int r = read(fd, b, bytes);
	if (r != bytes) return 0;
	if (bytes == 1) {
		return b[0];
	} else if (bytes == 2) {
		return readuint16(b);
	} else if (bytes == 4) {
		return readuint32(b);
	}
	return 0;
}

void open_cb(uv_fs_t* req) {
	uv_fs_req_cleanup(req);
}

int patch(const char* source, const char* patch, const char* out) {
	mode_t mode = S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH;
	int r = 0;

	uv_fs_t source_req;
	r = uv_fs_open(loop, &source_req, source, O_RDONLY, S_IRUSR, open_cb);

	int sourcefd = open(source, O_RDONLY, mode);
	int patchfd = open(patch, O_RDONLY, mode);
	int outfd = open(out, O_TRUNC | O_CREAT | O_RDWR, mode);
	uint32_t maxblocksize = MAX_BLOCK;
	uint8_t* buffer = (uint8_t*)calloc(maxblocksize, 1);
	uint32_t magic = readnumber(patchfd, buffer, 4);
	if (magic != MAGIC) {
		r = close(sourcefd);
		r = close(patchfd);
		r = close(outfd);
		return 1;
	}
	while(1) {
		uint32_t command = readnumber(patchfd, buffer, 1);
		if (command == 0) {
			break;
		} else if (command >= 0x41 && command <= 0x44) {
			uint32_t length = readnumber(patchfd, buffer, 1 << (command - 0x41));
			if(length > maxblocksize) {
				buffer = (uint8_t*)realloc(buffer, length);
				maxblocksize = length;
			}
			r = read(patchfd, buffer, length);
			if (r == -1) {
				r = close(sourcefd);
				r = close(patchfd);
				r = close(outfd);
				return 3;
			}
			r = write(outfd, buffer, length);
		} else if (command >= 0x45 && command < 0x54) {
			command -= 0x45;
			uint32_t offset = readnumber(patchfd, buffer, 1 << (command / 4));
			uint32_t length = readnumber(patchfd, buffer, 1 << (command % 4));
      lseek(sourcefd, offset, SEEK_SET);
			if(length > maxblocksize) {
				uint8_t* b = (uint8_t*)realloc(buffer, length);
				if (!b) free(buffer);
				return 999;
				maxblocksize = length;
			}
			r = read(sourcefd, buffer, length);
			if (r == -1) {
				r = close(sourcefd);
				r = close(patchfd);
				r = close(outfd);
				return 4;
			}
			r = write(outfd, buffer, length);
			if (r == -1) {
				r = close(sourcefd);
				r = close(patchfd);
				r = close(outfd);
				return 5;
			}
		} else {
			r = close(sourcefd);
			r = close(patchfd);
			r = close(outfd);
			return 2;
		}
	}
	r = close(sourcefd);
	r = close(patchfd);
	r = close(outfd);
	return 0;
} 

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
	loop = uv_default_loop();
	Nan::Set(target, Nan::New<String>("patchSync").ToLocalChecked(),
					 Nan::GetFunction(Nan::New<v8::FunctionTemplate>(PatchSync)).ToLocalChecked());

	Nan::Set(target, Nan::New<String>("patch").ToLocalChecked(),
					 Nan::GetFunction(Nan::New<v8::FunctionTemplate>(PatchAsync)).ToLocalChecked());
}

NODE_MODULE(patchr, InitAll)
}
