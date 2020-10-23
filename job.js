

const co = require('co');
const http = require('http');
const puppeteer = require('puppeteer');
const actions = require('./actions');
const { proxy } = require('./utils');
const { app } = require('./actions');
const yargs = require('yargs/yargs');
const fs = require('fs');

const args = yargs(process.argv).argv;

app.instance();
args.record = app.record;

// launch greedy browser
// 1. get proxy
// 2. go to site
// 3. if site didnt make it, return to step 1
function* browserEntry() {

	const pspec = proxy.list('lumi.txt');

	const browser = yield puppeteer.launch({
		headless: false,
		defaultViewport: {
			width: parseInt(1680 + (100 * Math.random() - 200)),
			height: parseInt(868 + (100 * Math.random() - 200))
		},
		args: [
			'--no-sandbox',
			'--disable-dev-shm-usage',
			'--shm-size=1gb',
			args.proxy ? `--proxy-server=${pspec.url}` : '',
		],
	});


	// TODO:
	// check for load times

	const page = yield browser.newPage();
	if (args.proxy) {
		yield page.authenticate({
			username: pspec.name,
			password: pspec.pass,
		});
	}

	const logFile = `logs/${app.record.spawnid}.log`;
	page.setRequestInterception(true);
	fs.writeFileSync(logFile, '', 'utf8');
	page.setCacheEnabled(false);
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

		// fs.appendFileSync(logFile, `${url}\n`, 'utf8');
	});
	page.on('response', res => {
		const url = res.url();
		if (res.status() > 300) {
			fs.appendFileSync(logFile, `${res.status()}\t${url}\n`, 'utf8');
		}
	});

	// // log my ip according to web test
	// const ipv4 = yield actions.myip(page);
	// console.log(ipv4);

	console.log('[MAIN] Ready...');

	const action = actions[args.action]

	// homepage
	const navOk = yield actions.nav(page, action.home);
	if (!navOk) {
		yield browser.close();
		return setImmediate(main);
	}
	console.log('[MAIN] Nav...');

	// prime checkout
	yield action.prime(page, args);

	if (args.url) {
		// Immediate mode
		yield action.checkout(page, args);

		yield page.waitForTimeout(10 * 1000);
	}
	else {
		// Worker mode - waits for commands port 7000
		const packet = yield app.standby();
		yield action.checkout(page, packet);
	}

	yield browser.close();
}

function main() {
	co(browserEntry).then(() => {
		console.log('[MAIN] Finished');
		console.log('[MAIN]', new Date());
	})
	.catch(console.log);
}

main();
