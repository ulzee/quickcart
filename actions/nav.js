
banned = false;

module.exports = {
	errors: {
		Banned: new Error('IP is Banned'),
	},
	go: function*(page, url) {
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
		console.log(`[MAIN] Elapsed ${parseInt(elapsed)}s`);

		// TODO: check website loaded in time limit

		const ok = navOk && !banned;

		console.log(navOk, banned);

		return ok;
	}
}
