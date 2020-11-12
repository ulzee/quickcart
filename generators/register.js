
const { proxy } = require('../utils');
const yargs = require('yargs/yargs');
Promise = require('bluebird');
const co = require('co');
const puppeteer = require('puppeteer');
let args = yargs(process.argv).argv;
const fs = require('fs');
const Papa = require('papaparse');
const { profile } = require('console');
global.log = console.log;
let browser = null;

function* main() {

	const raw = fs.readFileSync('assets/accounts.tsv', 'utf8');
	let accounts = Papa.parse(raw, { header: true }).data.filter(ent => ent.store == args.store);
	if (args.skip) {
		accounts = accounts.slice(args.skip);
	}


	let profile_index = 1;
	while (accounts.length) {
		const spec = accounts[0];
		if (profile_index > 1)
			spec.profile_index = profile_index;
		profile_index ++;

		console.log(`[${accounts.length}] ${spec.user}`);

		// args.proxy = proxy.list('lumi-excl.txt');

		try {

			browser = yield puppeteer.launch({
				headless: false,
				defaultViewport: {
					width: parseInt(1680 + (100 * Math.random() - 200)),
					height: parseInt(868 + (100 * Math.random() - 200))
				},
				args: [
					'--no-sandbox',
					'--disable-dev-shm-usage',
					args.proxy ? `--proxy-server=${args.proxy.url}` : '',
				],
			});

			const page = yield browser.newPage();
			if (args.proxy)
				yield page.authenticate({
					username: args.proxy.name,
					password: args.proxy.pass,
				});
			page.setRequestInterception(true);
			page.on('request', res => {
				const url = res.url();
				const assets = ['.jpg', '.png', '.gif', '.jpeg', '.svg', '/i/'];
				if (assets.some(one => url.includes(one))) {
					res.abort();
					return;
				}
				else {
					res.continue();
				}
			});

			const routine = require(`./${args.store}`);

			yield routine(page, spec);

			yield browser.close();

			accounts.shift();
		}
		catch(e) {
			console.log(e);
		}
	}
}

co(main)
.then(console.log)
.catch(e => {
	console.log(e);
});
