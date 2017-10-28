/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const fs = require('fs');
const should = require('should');
let patch
const path = require('path');
const { createWriteStream } = require('fs')

function sleep(ms = 0) {
    return new Promise(r => setTimeout(r, ms));
}

const fixtures = path.join(__dirname, '../fixtures');

let basePath;
let changedPath;
let patchPath;
let outPath;

function streamIt(stream, file) {
	return new Promise((ok, fail) => {
		stream.on('error', fail)
		file.on('finish', ok)
		stream.pipe(file)
	})
}

describe('patcher native', () => {

	before(done => {
		if (fs.existsSync(path.join(fixtures, 'newyork-new.pdf'))) {
			fs.unlinkSync(path.join(fixtures, 'newyork-new.pdf'));
		}
		delete require.cache[require.resolve('../index')]
		process.env.PATCHR_NATIVE = 'on'
		patch = require('../index').patch
		done();
	});

	after(done => {
		if (fs.existsSync(path.join(fixtures, 'newyork-new.pdf'))) {
			fs.unlinkSync(path.join(fixtures, 'newyork-new.pdf'));
		}
		done();
	});

	it('should successfully patch a file', async () => {

		basePath = path.join(fixtures, 'newyork.pdf');
		changedPath = path.join(fixtures, 'newyork-barcode.pdf');
		patchPath = path.join(fixtures, 'newyork.bin');
		outPath = path.join(fixtures, 'newyork-new.pdf');

		await patch(basePath, patchPath, outPath);

		const inFile = fs.readFileSync(changedPath);
		const outFile = fs.readFileSync(outPath);

		if (!inFile.equals(outFile)) {
			throw new Error('Buffers are not equal');
		}

	});

	it('should fail with invalid base path', async () => {
		try {
			basePath = path.join(fixtures, 'invalid.pdf');
			patchPath = path.join(fixtures, 'newyork.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Missing Base File: ${basePath}`);
		}
	});

	it('should fail with invalid patch path', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'invalid.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Missing Patch File: ${patchPath}`);
		}
	});

	it('should fail with a bad magic number', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'badmagic.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Bad Magic Number`);
		}
	});

	it('should fail with a bad command', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'badcommand.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Invalid Command`);
		}
	});

	it('should fail with a bad command using an output stream', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'badcommand.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			const file = createWriteStream(outPath)
			const stream = await patch(basePath, patchPath)
			await streamIt(stream, file)
		} catch (err) {
			err.message.should.equal(`Invalid Command`);
		}
	});

	it('should successfully patch a file using an output stream', async () => {

		basePath = path.join(fixtures, 'newyork.pdf');
		changedPath = path.join(fixtures, 'newyork-barcode.pdf');
		patchPath = path.join(fixtures, 'newyork.bin');
		outPath = path.join(fixtures, 'newyork-new.pdf');

		const file = createWriteStream(outPath)
		const stream = await patch(basePath, patchPath)
		await streamIt(stream, file)

		const inFile = fs.readFileSync(changedPath);
		const outFile = fs.readFileSync(outPath);

		if (!inFile.equals(outFile)) {
			throw new Error('Buffers are not equal');
		}

	});
	
});

describe('patcher bindings', () => {

	before(done => {
		if (fs.existsSync(path.join(fixtures, 'newyork-new.pdf'))) {
			fs.unlinkSync(path.join(fixtures, 'newyork-new.pdf'));
		}
		delete require.cache[require.resolve('../index')]
		process.env.PATCHR_NATIVE = 'off'
		patch = require('../index').patch
		done();
	});

	after(done => {
		if (fs.existsSync(path.join(fixtures, 'newyork-new.pdf'))) {
			fs.unlinkSync(path.join(fixtures, 'newyork-new.pdf'));
		}
		done();
	});

	it('should successfully patch a file', async () => {

		basePath = path.join(fixtures, 'newyork.pdf');
		changedPath = path.join(fixtures, 'newyork-barcode.pdf');
		patchPath = path.join(fixtures, 'newyork.bin');
		outPath = path.join(fixtures, 'newyork-new.pdf');

		await patch(basePath, patchPath, outPath);

		const inFile = fs.readFileSync(changedPath);
		const outFile = fs.readFileSync(outPath);

		if (!inFile.equals(outFile)) {
			throw new Error('Buffers are not equal');
		}

	});

	it('should fail with invalid base path', async () => {
		try {
			basePath = path.join(fixtures, 'invalid.pdf');
			patchPath = path.join(fixtures, 'newyork.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Missing Base File: ${basePath}`);
		}
	});

	it('should fail with invalid patch path', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'invalid.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Missing Patch File: ${patchPath}`);
		}
	});

	xit('should fail with a bad magic number', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'badmagic.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Bad Magic Number`);
		}
	});

	xit('should fail with a bad command', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'badcommand.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Invalid Command`);
		}
	});

	xit('should fail with a bad command using an output stream', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'badcommand.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			const file = createWriteStream(outPath)
			const stream = await patch(basePath, patchPath)
			await streamIt(stream, file)
		} catch (err) {
			err.message.should.equal(`Invalid Command`);
		}
	});

	xit('should successfully patch a file using an output stream', async () => {

		basePath = path.join(fixtures, 'newyork.pdf');
		changedPath = path.join(fixtures, 'newyork-barcode.pdf');
		patchPath = path.join(fixtures, 'newyork.bin');
		outPath = path.join(fixtures, 'newyork-new.pdf');

		const file = createWriteStream(outPath)
		const stream = await patch(basePath, patchPath)
		await streamIt(stream, file)

		const inFile = fs.readFileSync(changedPath);
		const outFile = fs.readFileSync(outPath);

		if (!inFile.equals(outFile)) {
			throw new Error('Buffers are not equal');
		}

	});

});
