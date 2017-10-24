#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>

#define MAX_BLOCK 1024 * 1024
#define MAGIC 0x72730236

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

int patch(char* source, char* patch, char* out) {
  mode_t mode = S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH;
	int r = 0;
	int sourcefd = open(source, O_RDONLY, mode);
	int patchfd = open(patch, O_RDONLY, mode);
	int outfd = open(out, O_TRUNC | O_CREAT | O_RDWR, mode);
	uint32_t maxblocksize = MAX_BLOCK;
	uint8_t* buffer = (uint8_t*)calloc(maxblocksize, 1);
	uint32_t magic = readnumber(patchfd, buffer, 4);
	if (magic != MAGIC) {
		fprintf(stderr, "bad magic number: %u\n", magic);
		return 1;
	}
	while(1) {
		uint32_t command = readnumber(patchfd, buffer, 1);
		if (command == 0) {
			break;
		} else if (command >= 0x41 && command <= 0x44) {
			uint32_t length = readnumber(patchfd, buffer, 1 << (command - 0x41));
			r = read(patchfd, buffer, length);
			if (r == -1) {
				fprintf(stderr, "bad read from patch file: %u\n", errno);
				return 3;
			}
			r = write(outfd, buffer, length);
		} else if (command >= 0x45 && command < 0x54) {
			command -= 0x45;
			uint32_t offset = readnumber(patchfd, buffer, 1 << (command / 4));
			uint32_t length = readnumber(patchfd, buffer, 1 << (command % 4));
      lseek(sourcefd, offset, SEEK_SET);
			r = read(sourcefd, buffer, length);
			if (r == -1) {
				fprintf(stderr, "bad read from source file: %u\n", errno);
				return 4;
			}
			r = write(outfd, buffer, length);
			if (r == -1) {
				fprintf(stderr, "bad write to output file: %u\n", errno);
				return 5;
			}
		} else {
			fprintf(stderr, "invalid command: %u\n", command);
			return 2;
		}
	}
	return 0;
} 
