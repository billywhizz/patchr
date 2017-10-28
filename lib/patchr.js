const fs = require('fs')
const { promisify } = require('util')
const { Readable } = require('stream')

const read = promisify(fs.read)
const write = promisify(fs.write)
const openFile = promisify(fs.open)
const closeFile = promisify(fs.close)
const exists = promisify(fs.exists)

const MAGIC = 0x72730236

async function patch(base, delta, out) {
	if (!(await exists(base))) throw new Error(`Missing Base File: ${base}`)
	if (!(await exists(delta))) throw new Error(`Missing Patch File: ${delta}`)

	async function readBytes(fd, nbytes, position) {
		const buffer = new Buffer(nbytes)
		const { bytesRead } = await read(fd, buffer, 0, nbytes, position)
		return buffer.slice(0, bytesRead)
	}
	
	async function readInt(fd, len) {
		if (len === 1) return (await readBytes(fd, len)).readUInt8()
		if (len === 2) return (await readBytes(fd, len)).readUInt16BE()
		return (await readBytes(fd, len)).readUInt32BE()
	}
	
	async function readNext() {
		command = await readInt(patchFd, 1)
		if (command === 0) {
			this.push(null)
			await closeFile(patchFd)
			await closeFile(baseFd)
		} else if (command >= 0x41 && command <= 0x44) {
			length = await readInt(patchFd, 1 << (command - 0x41))
			this.push(await readBytes(patchFd, length))
		} else if (command >= 0x45 && command <= 0x54) {
			command -= 0x45
			offset = await readInt(patchFd, 1 << Math.floor(command / 4))
			length = await readInt(patchFd, 1 << (command % 4))
			this.push(await readBytes(baseFd, length, offset))
		} else {
			this.emit('error', new Error(`Invalid command: ${command.toString(16)}`))
		}
	}

	const patchFd = await openFile(delta, 'r')
	const baseFd = await openFile(base, 'r')

	let command = 0
	let length = 0
	let offset = 0

	const magic = await readInt(patchFd, 4)
	if (magic != MAGIC) throw new Error('Invalid delta file magic')

	if (out) {
		const outFd = await openFile(out, 'w')
		while (true) {
			command = await readInt(patchFd, 1)
			if (command === 0) {
				break;
			} else if (command >= 0x41 && command <= 0x44) {
				length = await readInt(patchFd, 1 << (command - 0x41))
				await write(outFd, await readBytes(patchFd, length))
			} else if (command >= 0x45 && command <= 0x54) {
				command -= 0x45
				offset = await readInt(patchFd, 1 << Math.floor(command / 4))
				length = await readInt(patchFd, 1 << (command % 4))
				await write(outFd, await readBytes(baseFd, length, offset))
			} else {
				throw new Error(`Invalid command: ${command.toString(16)}`)
			}
		}
	} else {
		return new Readable({ read: readNext })
	}
}

module.exports = { patch }
