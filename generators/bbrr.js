
const puppeteer = require('puppeteer');
const yargs = require('yargs/yargs');
const args = yargs(process.argv).argv;
const Papa = require('papaparse');
const fs = require('fs');
const co = require('co');
const { nav, any, click, traffic, watch } = require('../actions');
const { sec } = require('../utils');

global.log = console.log;

function* main() {

	const raw = fs.readFileSync('assets/accounts.tsv', 'utf8');
	let accounts = Papa.parse(raw, { header: true })
		.data.filter(ent => ent.store == args.store);
	if (args.skip) {
		accounts = accounts.slice(args.skip);
	}

	console.log('Accounts:', accounts.length);



	for (const ii in accounts) {
		const info = accounts[ii];
		console.log(info);

		const browser = yield puppeteer.launch({
			headless: false,
			defaultViewport: {
				width: parseInt(1680 + (100 * Math.random() - 200)),
				height: parseInt(868 + (100 * Math.random() - 200))
			},
			args: [
			],
		});

		const page = yield browser.newPage();

		yield nav.go(page, 'https://www.bestbuy.com/identity/global/signin');

		yield page.reload();

		yield page.waitForSelector('#fld-e');
		yield page.type('#fld-e', info.user, { delay: 50 });
		yield page.type('#fld-p1', info.pass, { delay: 50 });

		yield page.waitForTimeout(1000);

		yield click(page, '.cia-form__controls__submit');

		yield page.waitForSelector('#gh-search-input', { timeout: 30 * 60 * sec });

		console.log('Success!');
		yield page.waitForTimeout(5 * sec);

		const cookies = yield page.cookies();
		log('Cookies: ' + cookies.length);
		for (ind in cookies) {
			yield page.deleteCookie(cookies[ind]);
		}


		yield page.close();
		yield browser.close();
	}

}

co(main)
.then(console.log)
.catch(e => {
	console.log(e);
});
