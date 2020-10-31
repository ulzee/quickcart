
module.exports = function (page, selectors) {
	return new Promise((yes, no) => {
		let resolved = false;

		selectors.map(sel => {
			setImmediate(() => {
				try {
					page.waitForSelector(sel)
					.then(() => {

						// if already resolved, stop
						if (resolved) return;

						resolved = true;
						yes(sel1);
					})
					.catch(no);
				}
				catch(e) {
					// will throw for sels which dont exist
					console.log('[MAIN] WARN - No selector:', sel);
				}
			});
		});

	});
}