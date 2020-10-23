
module.exports = function*(page, url) {
	let t0 = new Date();
	let navOk = true;

	page.setDefaultNavigationTimeout(5 * 1000)

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

	// TODO: check banned status
	// TODO: check website loaded in time limit
	// NOTE: if there are issues, abandon proxy

	return navOk;
}
