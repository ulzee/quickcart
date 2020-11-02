
const { sec } = require('../utils');

banned = false;

class BannedError extends Error {
	constructor(message) {
		super(message);
	}
}

class SlowError extends Error {
	constructor(message) {
		super(message);
	}
}

class BlacklistedError extends Error {
	constructor(message) {
		super(message);
	}
}

function* go(page, url) {
	let t0 = new Date();
	let navOk = true;

	// NAV
	let res = null;
	try {
		res = yield page.goto(url, {
			waitUntil: 'domcontentloaded',
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
	bench: function*(page, url, waitFor, allowedLoadTime=7) {
		if (!waitFor) {
			throw new Error('Please choose a selector.');
		}

		// Page load time is not enough, we should also measure load of active els
		const timeUntilReady = new Date();
		yield go(page, url);
		try {
			yield page.waitForSelector(waitFor, { timeout: allowedLoadTime * sec });
		}
		catch(e) {
			// selector was not ready at this time
			throw new SlowError();
		}

		const elapsed = (new Date() - timeUntilReady) / sec;
		console.log('[NAV - BENCH] Page ready in:', elapsed);
	},
}
