const { patch } = require('./index')

patch(...process.argv.slice(2))
const { rss } = process.memoryUsage()
console.log(rss)