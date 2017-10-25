/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const fs = require('fs');
const should = require('should');
const { patch } = require('../index');
const path = require('path');

const fixtures = path.join(__dirname, '../fixtures');

let basePath;
let changedPath;
let patchPath;
let outPath;

describe('patcher', () => {
	before(done => {
		if (fs.existsSync(path.join(fixtures, 'newyork-new.pdf'))) {
			fs.unlinkSync(path.join(fixtures, 'newyork-new.pdf'));
		}
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
	it('should faily with invalid base path', async () => {
		try {
			basePath = path.join(fixtures, 'invalid.pdf');
			patchPath = path.join(fixtures, 'newyork.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Missing Base File: ${basePath}`);
		}
	});
	it('should faily with invalid patch path', async () => {
		try {
			basePath = path.join(fixtures, 'newyork.pdf');
			patchPath = path.join(fixtures, 'invalid.bin');
			outPath = path.join(fixtures, 'newyork-new.pdf');
			await patch(basePath, patchPath, outPath);
		} catch (err) {
			err.message.should.equal(`Missing Patch File: ${patchPath}`);
		}
	});

});
