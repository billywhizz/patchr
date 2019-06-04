const { patch } = require('../index')
const { createWriteStream } = require('fs')

function streamIt(stream, file) {
	return new Promise((ok, fail) => {
		stream.on('error', fail)
		stream.on('end', ok)
		stream.pipe(file)
	})
}

async function run([original, delta, out]) {
	const stream = await patch(original, delta)
	await streamIt(stream, createWriteStream(out))
	const { rss } = process.memoryUsage()
	console.log(rss)
}

run(process.argv.slice(2)).catch(err => console.error(err))
