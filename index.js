let binding
try {
	binding = require(`./dist/${process.platform}.${process.arch}.node`) 
} catch(err) {}
if (binding) {
	module.exports = binding
} else {
	modules.exports = require('./lib/patchr')
}
