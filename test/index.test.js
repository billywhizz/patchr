/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const should = require('should');

describe('index', () => {

	it('should require the native js module', async () => {
		delete require.cache[require.resolve('../index')]
		process.env.PATCHR_NATIVE = 'on'
		const { patch } = require('../index');
		const source = patch.toString()
		source.should.match(/async function patch/)
	});
	
	it('should require the native binding', async () => {
		delete require.cache[require.resolve('../index')]
		process.env.PATCHR_NATIVE = 'off'
		const { patch } = require('../index');
		const source = patch.toString()
		source.should.not.match(/async function patch/)
	});

	it('should fail to require the native binding and load the js one', async () => {
		delete require.cache[require.resolve('../index')]
		const originalProcess = global.process
		const process = Object.assign({}, originalProcess)
		process.platform = 'foo'
		global.process = process
		process.env.PATCHR_NATIVE = 'off'
		const { patch } = require('../index');
		global.process = originalProcess
		const source = patch.toString()
		source.should.match(/async function patch/)
	});

});
