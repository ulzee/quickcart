
const { v4: uuid } = require('uuid');
const { proxyChoice, exe, userAgent } = require('./configs');
const io = require('@pm2/io')
const nav = require('./actions/nav');
const co = require('co');
const stores = require('./stores');
const actions = require('./actions');
const yargs = require('yargs/yargs');
const utils = require('./utils');
let args = yargs(process.argv).argv;

const SnsService = actions.sns.init();

const log = (msg) => {
	console.log(`[${args.store}]`, msg);
}
global.log = log;
log('initial');

args.account = utils.account(args.store, 0, lookup='assets/live-accounts.tsv');
log(args.account);

class EscapeError extends Error {
	constructor(message='Escaping Browsercontrol') {
		super(message);
	}
}

args.record = {
	spawnid: uuid().split('-')[0],
}

const appState = io.metric({
	name    : 'State',
});

global.STATE = appState;
const STATE = (to) => {
	console.log('[STATE] ' + to);
	global.STATE.set(to);
};
STATE('initial');

puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin());
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const vendor = stores[args.store];

let browser = null;
function* browserEntry() {

	const monitor = {
		w: 1024, h: 800 ,
		wd: 50, hd: 50,
	};

	STATE('launching browser');
	const dx = monitor.wd*parseInt(args.instance);
	const dy = monitor.hd*parseInt(args.instance) + 50;
	const pupConfigs = {
		headless: false,
		defaultViewport: {
			width: parseInt(1570 + (100 * Math.random() - 200)),
			height: parseInt(1254 + (100 * Math.random() - 200))
		},
		args: [
			'--incognito',
			'--no-sandbox',
			'--disable-web-security',
			'--disable-dev-shm-usage',
			'--disable-setuid-sandbox',
			`--window-size=${monitor.w},${monitor.h}`,
			`--window-position=${dx},${dy}`,
			'--disable-features=IsolateOrigins,site-per-process',
			'--shm-size=1gb',
		],
	}
	if (exe) {
		pupConfigs.executablePath = exe;
	}
	browser = yield puppeteer.launch(pupConfigs);

	STATE('opening page');
	const [page] = yield browser.pages();

	actions.pagesetup(page, args);
	actions.traffic.setup(page, args);

	console.log('[MAIN] Ready...');

	STATE('priming...');
	yield vendor.prime(page, args);



	// goto the product stie
	STATE('visit url');
	yield vendor.visit(page, args.url);



	STATE('standby: (null)');
	console.log('[MAIN] Entering standby...');

	const minHandle = yield actions.window.minimize(page);

	args.wait = {
		inSeconds: 20, // check every 20 seconds
		rapid: 1,
		rapidWindow: 0 // don't enable rapid reload
	}
	args.reload = {
		interval: 5 // seconds to refresh any login/api tokens
	}
	let lastRefresh = Date.now();
	args.callback = function*() {
		// reload every N minutes to keep login
		const mil = Date.now() - lastRefresh;
		const elapsedSec = mil / 1000;
		if (elapsedSec > args.reload.interval * 60) {
			log('Reloading...');
			yield vendor.visit(page, args.url);
			lastRefresh = Date.now();
		}
	}
	yield vendor.standby(page, args);



	STATE('INSTOCK');
	yield actions.sns.send(SnsService, `[${args.store}] ${args.item}:\n${args.url}`);
	yield actions.window.maximize(minHandle);

	STATE('Awating user');
	throw new EscapeError();
}


function main() {
	co(browserEntry).then(() => {
		console.log('[MAIN] Finished');
		console.log('[MAIN]', new Date());
	})
	.catch(e => {
		if (e instanceof EscapeError) {
			// do nothing
			STATE('HOLDING...');
		}
		else {
			console.log(e);
			STATE('ERROR');
			process.exit(1);
		}
	});
}

main();
