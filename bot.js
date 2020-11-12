
const { stealthMode, proxyChoice, monitor } = require('./configs');
const io = require('@pm2/io')
const nav = require('./actions/nav');
const co = require('co');
const stores = require('./stores');
const actions = require('./actions');
const { proxy, sec } = require('./utils');
const { app, pagesetup } = require('./actions');
const yargs = require('yargs/yargs');
const fs = require('fs');
const utils = require('./utils');
let args = yargs(process.argv).argv;

const isMaster = args.accountid == '0';

let puppeteer = require('puppeteer');
if (stealthMode[args.store]) {
	puppeteer = require('puppeteer-extra');
	const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
	puppeteer.use(AdblockerPlugin());
	const StealthPlugin = require('puppeteer-extra-plugin-stealth');
	puppeteer.use(StealthPlugin());
}

app.instance();
args.record = app.record;
args.account = utils.account(args.store, args.accountid);
args.logid = `${args.store}_${args.record.spawnid}_${args.accountid}`;
console.log('[MAIN] ID:', args.record.spawnid);
console.log(args.account);
console.log('[MAIN] Debug: ' + args.debug);


const appState = io.metric({
	name    : 'State',
});

global.STATE = appState;
const STATE = (to) => {
	console.log('[STATE] ' + to);
	global.STATE.set(to);
};
STATE('initial');

const log = (msg) => {
	console.log(`[${args.store}]`, msg);
}
global.log = log;
log('initial');

// launch greedy browser
// 1. get proxy
// 2. go to site
// 3. if site didnt make it, return to step 1
let browser = null;
let page = null;
function* browserEntry() {

	const vendor = stores[args.store];

	// allocate a proxy for every additional bots
	if (!isMaster) {
		console.log('[MAIN] Using proxy');
		const proxyList = proxyChoice[args.store];
		const pspec = proxyList ? proxy.list(proxyList) : null;
		args.proxy = pspec;
	}

	if (isMaster) {
		// clear in-stock record file watched by slaves
		utils.clearLaunchFile(args.store);
	}

	// const headlessMode = args.debug == undefined || !args.debug ? true : false;
	// console.log('[MAIN] Headless:', headlessMode)
	STATE('launching browser');
	const dx = monitor.wd*monitor.col[args.store]+ 20*parseInt(args.accountid);
	const dy = monitor.hd*parseInt(args.accountid) + 20*(1+monitor.col[args.store]);
	const pupConfigs = {
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
			`--window-position=${dx},${dy}`,
		],
	}
	if (configs.exe) {
		pupConfigs.executablePath = configs.exe;
	}
	browser = yield puppeteer.launch(pupConfigs);

	STATE('opening page');
	page = yield browser.newPage();
	if (args.proxy) {
		yield page.authenticate({
			username: args.proxy.name,
			password: args.proxy.pass,
		});
	}
	yield page.goto('about:blank');
	yield page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36');
	console.log(yield browser.userAgent());

	// add listeners etc...
	pagesetup(page, args);
	actions.traffic.setup(page, args);

	console.log('[MAIN] Ready...');

	// verify my IP
	STATE('IP check');
	// const myip = yield actions.myip.fetch(page);
	// args.myip = myip;
	// console.log('[MY IP]:', myip);
	// if (utils.blacklisted({ ip: myip, store: args.store })) {
	// 	throw new actions.nav.errors.Blacklisted();
	// }

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
	// NOTE: disabling master-slave signalling
	if (!isMaster) {
		STATE('standby: waiting for master');
		yield utils.sleepUntilLaunch(page, args.store);
		yield vendor.visit(page, args.url); // reload page
	}
	yield vendor.standby(page, args);

	// Checkout logic
	STATE('checking out...');
	if (isMaster) {
		// create in-stock record so that slaves can proceed
		utils.createLaunchFile(args.store);
	}
	yield vendor.checkout(page, args);

	// Closing out
	STATE('OK');
	yield page.waitForTimeout(10 * 1000);
	yield page.close();
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
			|| e instanceof nav.errors.Blacklisted
			|| e instanceof actions.myip.errors.IPCheckFailed;

		const blacklist = e instanceof nav.errors.Banned
			|| e instanceof nav.errors.Slow;

		if (args.proxy && blacklist) {
			utils.blacklisted({ add: args.myip, store: args.store });
		}

		if (retry) {
			STATE('RETRYING: ' + e);
			console.log(e);
			console.log('[MAIN] RETRYING');

			if (browser) {
				page.close()
				.then(() => browser.close())
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
				.then(() => page.close())
				.then(() => browser.close())
				.then(() => console.log('[MAIN] Errord out'))
				.catch(console.log);
			}

			throw e;
		}
	});
}

main();
