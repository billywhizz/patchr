const { patch } = require('../lib/patchr')
const { createWriteStream } = require('fs')
//const MemoryStream = require('memory-stream')
const { Writable } = require('stream')
const { inherits } = require('util')

function DevNull (opts) {
	if (!(this instanceof DevNull)) return new DevNull(opts)
	opts = opts || {}
	Writable.call(this, opts)
}

DevNull.prototype._write = function (chunk, encoding, cb) {
	setImmediate(cb)
}

inherits(DevNull, Writable);

function toFile(fn, stream) {
	//const ms = new MemoryStream()
	const devnull = new DevNull()
	devnull.on('finish', () => {
		console.log('done');
	})
	return new Promise((ok, fail) => {
		stream.on('end', ok)
		stream.on('error', fail)
		stream.pipe(devnull)
		//stream.pipe(ms)
		//ms.pipe(createWriteStream(fn))
		//stream.pipe(createWriteStream(fn))
	})
}

async function run([original, delta, out]) {
	const start = Date.now()
	await toFile(out, await patch(original, delta))
	return Date.now() - start
}

async function main(i = 1) {
	const results = await Promise.all(Array(i).fill().map(x => run(process.argv.slice(2))))
	console.dir(results)
}

main(parseInt(process.argv[5] || '1', 10)).catch(err => console.error(err))
