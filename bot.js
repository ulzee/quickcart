

const nav = require('./actions/nav');
const co = require('co');
const puppeteer = require('puppeteer');
const stores = require('./stores');
const actions = require('./actions');
const { proxy, sec } = require('./utils');
const { app, pagesetup } = require('./actions');
const yargs = require('yargs/yargs');
const fs = require('fs');
const utils = require('./utils');
let args = yargs(process.argv).argv;

const vendor = stores[args.store];
const pspec = proxy.list('lumi-rotate.txt');
app.instance();
args.record = app.record;
args.account = utils.account(args.store, args.accountid);
args.proxy = pspec;
args.logid = `${args.store}_${args.record.spawnid}_${args.accountid}`;
console.log(args.account);

// launch greedy browser
// 1. get proxy
// 2. go to site
// 3. if site didnt make it, return to step 1
let browser = null;
let page = null;
function* browserEntry() {

	browser = yield puppeteer.launch({
		headless: false,
		defaultViewport: {
			width: parseInt(1570 + (100 * Math.random() - 200)),
			height: parseInt(1254 + (100 * Math.random() - 200))
		},
		args: [
			'--no-sandbox',
			'--disable-dev-shm-usage',
			args.proxy ? `--proxy-server=${args.proxy.url}` : '',
		],
	});

	page = yield browser.newPage();
	if (args.proxy) {
		yield page.authenticate({
			username: args.proxy.name,
			password: args.proxy.pass,
		});
	}

	// add listeners etc...
	pagesetup(page, args);

	console.log('[MAIN] Ready...');

	// verify my IP
	const myip = yield actions.myip(page);
	args.myip = myip;
	console.log('[MY IP]:', myip);

	if (utils.blacklisted({ ip: myip })) {
		throw new actions.nav.errors.Blacklisted();
	}

	// homepage
	yield actions.nav.go(page, vendor.home);

	console.log('[MAIN] Nav...');

	// preload as much as possible
	yield vendor.prime(page, args);

	// goto the product stie
	yield vendor.visit(page, args.url);

	// wait until product is ready
	// TODO: logic differs for each store

	// Checkout logic
	yield vendor.checkout(page, args);

	// Closing out
	yield page.waitForTimeout(10 * 1000);
	yield browser.close();
}

function main() {
	co(browserEntry).then(() => {
		console.log('[MAIN] Finished');
		console.log('[MAIN]', new Date());
	})
	.catch(e => {
		const retry = e instanceof nav.errors.Banned
			|| e instanceof nav.errors.Slow
			|| e instanceof nav.errors.Blacklisted;

		const blacklist = e instanceof nav.errors.Banned
			|| e instanceof nav.errors.Slow;

		if (blacklist) {
			utils.blacklisted({ add: args.myip });
		}

		if (retry) {
			console.log(e);
			console.log('[MAIN] RETRYING');

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
			if (browser) {
				page.screenshot({path: `logs/er_${args.logid}.png`})
				.then(() => browser.close())
				.then(() => console.log('[MAIN] Errord out'))
				.catch(console.log);
			}
		}
	});
}

main();
