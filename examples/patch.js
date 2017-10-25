const { patch } = require('../index')

patch(...process.argv.slice(2))
	.then(() => {
		const { rss } = process.memoryUsage()
		console.log(rss)
	})
	.catch(err => console.error(err))
