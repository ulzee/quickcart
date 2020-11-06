

var io = require('@pm2/io')
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


const proxyChoice = {
	bestbuy: 'lumi-excl.txt',
	target: 'lumi-excl.txt',
	walmart: 'lumi-excl.txt',
}

const monitor = {
	w: 500, h: 600 ,
	row: {
		bestbuy: 0,
		target: 1,
		walmart: 2,
	}
};

const vendor = stores[args.store];
const pspec = proxy.list(proxyChoice[args.store]);
app.instance();
args.record = app.record;
args.account = utils.account(args.store, args.accountid);
args.proxy = pspec;
args.logid = `${args.store}_${args.record.spawnid}_${args.accountid}`;
console.log('[MAIN] ID:', args.record.spawnid);
console.log(args.account);
console.log('[MAIN] Debug:', args.debug);



const appState = io.metric({
	name    : 'State',
});
global.STATE = appState;
const STATE = (to) => {
	console.log('[STATE] ' + to);
	global.STATE.set(to);
};
STATE('initial');

// launch greedy browser
// 1. get proxy
// 2. go to site
// 3. if site didnt make it, return to step 1
let browser = null;
let page = null;
function* browserEntry() {

	// const headlessMode = args.debug == undefined || !args.debug ? true : false;
	// console.log('[MAIN] Headless:', headlessMode)
	STATE('launching browser');
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
			`--window-size=${monitor.w},${monitor.h}`,
			`--window-position=${monitor.w*args.accountid},${monitor.h*monitor.row[args.store]}`,
		],
	});

	STATE('opening page');
	page = yield browser.newPage();
	console.log(yield browser.userAgent());
	if (args.proxy) {
		yield page.authenticate({
			username: args.proxy.name,
			password: args.proxy.pass,
		});
	}
	yield page.goto('about:blank');

	// add listeners etc...
	pagesetup(page, args);

	console.log('[MAIN] Ready...');

	// verify my IP
	STATE('IP check');
	const myip = yield actions.myip(page);
	args.myip = myip;
	console.log('[MY IP]:', myip);


	if (utils.blacklisted({ ip: myip })) {
		throw new actions.nav.errors.Blacklisted();
	}

	// homepage
	STATE('homepage');
	yield actions.nav.go(page, vendor.home);

	console.log('[MAIN] Nav...');

	// preload as much as possible
	STATE('priming...');
	yield vendor.prime(page, args);

	// goto the product stie
	STATE('visit url');
	yield vendor.visit(page, args.url);

	// wait until product is ready
	STATE('standby: (null)');
	console.log('[MAIN] Entering standby...');
	yield vendor.standby(page, args);

	// Checkout logic
	STATE('checking out...');
	yield vendor.checkout(page, args);

	// Closing out
	STATE('OK');
	yield page.waitForTimeout(10 * 1000);
	yield browser.close();
}

function main() {
	co(browserEntry).then(() => {
		console.log('[MAIN] Finished');
		console.log('[MAIN]', new Date());
	})
	.catch(e => {
		STATE('ERR: ' + e);
		const retry = e instanceof nav.errors.Banned
			|| e instanceof nav.errors.Slow
			|| e instanceof nav.errors.Blacklisted;

		const blacklist = e instanceof nav.errors.Banned
			|| e instanceof nav.errors.Slow;

		if (blacklist) {
			utils.blacklisted({ add: args.myip });
		}

		if (retry) {
			STATE('RETRYING: ' + e);
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
			STATE('FATAL ERR: ' + e);

			const logFile = `logs/${args.record.spawnid}.log`;
			fs.appendFileSync(logFile, e, 'utf8');

			if (browser) {
				page.screenshot({path: `logs/er_${args.logid}.png`})
				.then(() => browser.close())
				.then(() => console.log('[MAIN] Errord out'))
				.catch(console.log);
			}

			throw e;
		}
	});
}

main();
