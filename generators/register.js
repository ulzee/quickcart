
const yargs = require('yargs/yargs');
Promise = require('bluebird');
const co = require('co');
const puppeteer = require('puppeteer');
let args = yargs(process.argv).argv;
const fs = require('fs');
const Papa = require('papaparse');

let browser = null;

function* register(account) {
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
	if (args.proxy) {
		yield page.authenticate({
			username: args.proxy.name,
			password: args.proxy.pass,
		});
	}


}

function* main() {

	const raw = fs.readFileSync('assets/accounts.tsv', 'utf8');
	let accounts = Papa.parse(raw, { header: true }).data.filter(ent => ent.store == args.store);

	while (accounts.length) {
		const top = accounts[0];

		console.log(top.user);

		accounts.shift();
	}
}

co(main)
.then(console.log)
.catch(e => {
	console.log(e);
});
