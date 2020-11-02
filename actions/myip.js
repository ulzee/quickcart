
const nav = require('./nav');
const { sec } = require('../utils');

module.exports = function* myip(page) {
	yield nav.go(page, 'https://ifconfig.co/');
	yield page.waitForTimeout(3 * sec);
	yield page.waitForSelector('.ip');
	const myip = yield page.evaluate(() => document.querySelector('.ip').innerHTML);

	return myip;
}