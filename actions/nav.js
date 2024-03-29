
const { sec } = require('../utils');

banned = false;

class BannedError extends Error {
	constructor(message='Banned') {
		super(message);
	}
}

class SlowError extends Error {
	constructor(message='Too Slow') {
		super(message);
	}
}

class BlacklistedError extends Error {
	constructor(message='Blacklisted IP') {
		super(message);
	}
}

function* go(page, url, timeout=5) {
	let t0 = new Date();
	let navOk = true;

	// NAV
	let res = null;
	try {
		res = yield page.goto(url, {
			waitUntil: 'domcontentloaded',
			timeout: timeout * sec,
		});
	}
	catch (e) {
		if (e.name == 'TimeoutError') {
			console.log('[MAIN] Timed out!');
		}
		else {
			console.log(e);
		}
	}

	let elapsed = (new Date() - t0) / 1000;
	console.log(`[NAV - GO] Elapsed ${parseInt(elapsed)}s`);

	// TODO: check website loaded in time limit

	const ok = navOk && !banned;

	if (!ok) {
		console.log({ navOk, banned })
		throw new BannedError();
	}

	return ok;
}

module.exports = {
	errors: {
		Banned: BannedError,
		Slow: SlowError,
		Blacklisted: BlacklistedError,
	},
	go,
	bench: function*(page, url, waitFor, retry=false, allowedLoadTime=10) {
		if (!waitFor) {
			throw new Error('Please choose a selector.');
		}

		// Page load time is not enough, we should also measure load of active els

		const timeUntilReady = new Date();
		const longWait = 60;
		const shortWait = 5;

		yield go(page, url, timeout=shortWait);
		while (true) {
			try {
				yield page.waitForSelector(waitFor, { timeout: allowedLoadTime * sec });
				break;
			}
			catch(e) {
				if (retry) {
					console.log('[NAV] Retrying...');
					yield go(page, url, timeout=longWait);
				}
				else {
					// Case: benchmark failed
					// selector was not ready at this time
					console.log('[NAV] Page is too slow!');
					throw new SlowError();
				}
			}
		}

		const elapsed = (new Date() - timeUntilReady) / sec;
		console.log('[NAV - BENCH] Page ready in:', elapsed);
	},
}
