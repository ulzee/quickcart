

const nav = require('./actions/nav');
const co = require('co');
const puppeteer = require('puppeteer');
const stores = require('./stores');
const actions = require('./actions');
const { proxy } = require('./utils');
const { app, pagesetup } = require('./actions');
const yargs = require('yargs/yargs');
const fs = require('fs');
const utils = require('./utils');
let args = yargs(process.argv).argv;

const vendor = stores[args.store];
const pspec = proxy.list('lumi-excl.txt');
app.instance();
args.record = app.record;
args.account = utils.account(args.store, args.accountid);
args.proxy = pspec;
console.log(args.account);

// launch greedy browser
// 1. get proxy
// 2. go to site
// 3. if site didnt make it, return to step 1
let browser = null;
function* browserEntry() {

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

	// add listeners etc...
	pagesetup(page, args);

	console.log('[MAIN] Ready...');

	// homepage
	const navOk = yield actions.nav.go(page, vendor.home);
	if (!navOk) {
		throw nav.errors.Banned;
		return;
	}

	console.log('[MAIN] Nav...');

	// prime checkout
	yield vendor.prime(page, args);

	if (args.url) {
		// Immediate mode
		yield vendor.checkout(page, args);

		yield page.waitForTimeout(10 * 1000);
	}
	else {
		// Worker mode - waits for commands port 7000
		const packet = yield app.standby();
		yield vendor.checkout(page, packet);
	}

	yield browser.close();
}

function main() {
	co(browserEntry).then(() => {
		console.log('[MAIN] Finished');
		console.log('[MAIN]', new Date());
	})
	.catch(e => {
		if (e.name == nav.errors.Banned.name) {
			console.log('[MAIN] RETRYING');

			const blacklistFile = `assets/blacklist.txt`;
			fs.appendFileSync(blacklistFile, `${args.proxy.raw}\n`, 'utf8');

			if (browser) {
				browser.close()
				.then(() => setImmediate(main))
				.catch(console.log);
			}
			else {
				setImmediate(main);
			}
		}
		else {
			console.log(e);
		}
	});
}

main();
