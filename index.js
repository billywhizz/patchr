const fs = require('fs')
const { promisify } = require('util')

const exists = promisify(fs.exists)

let binding

try {
	binding = require(`./dist/${process.platform}.${process.arch}.node`) 
} catch(err) {}
if (binding) {
	const patch = promisify(binding.patch)
	module.exports = { patch: async (...args) => {
		const [ base, delta ] = args
		if (!(await exists(base))) throw new Error(`Missing Base File: ${base}`)
		if (!(await exists(delta))) throw new Error(`Missing Patch File: ${delta}`)
		await patch(...args)
	}}
} else {
	module.exports = require('./lib/patchr')
}
