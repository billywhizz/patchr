const { patch } = require('../index')
const path = require('path')

const fixtures = path.join(__dirname, '../fixtures')

async function spawn() {
	const start = Date.now()
	console.log('running')
	await patch(path.join(fixtures, 'newyork.pdf'), path.join(fixtures, 'newyork.bin'), path.join(fixtures, 'newyork-new.pdf'))
	console.log(Date.now() - start)
}

async function run(t = 1) {
	await Promise.all(Array(t).fill(spawn).map(f => f()))
	const { rss } = process.memoryUsage()
	console.log(Math.floor(rss / (1024 * 1024)))
}

run(parseInt(process.argv[2] || '1')).catch(err => console.error(err))