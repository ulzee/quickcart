
module.exports = function*(page, target, until) {
	while (true) {
		try {
			yield page.waitForSelector(until, { timeout: 100 });
			break;
		}
		catch(e) {
			try {
				yield page.waitForSelector(target, { timeout: 50, visible: true });
				yield page.click(target);
			}
			catch(e) {
				console.log(e);
				log('Not found: ' + target);
			}

			yield page.waitForTimeout(500);
		}
	}
}