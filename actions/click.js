
function* clickUntilSuccess(page, elem) {
	let success = false;

	while (!success) {
		try {
			yield page.click(elem);
			success = true;
		}
		catch (error) {
			if (error.toString().includes('not visible')) {
				yield page.waitForTimeout(1);
			}
			else {
				throw error;
			}
		}
	}
}

module.exports = function* (page, elem, wait=-1, check=false, options={ visible: true }) {
	global.log(elem);

	if (check) {
		// allows passing on clicking elems that are not shown
		// NOTE: only use when we know for sure it's optional
		const exists = yield page.evaluate((data) => {
			return  !!document.querySelector(data.elem);
		}, { elem });

		if (!exists)
			return;
	}

	yield page.waitForSelector(elem, options);
	yield clickUntilSuccess(page, elem);

	if (wait != -1) {
		yield page.waitForTimeout(wait * 1000);
	}
}