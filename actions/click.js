
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

module.exports = function* (page, elem, wait=-1) {
	global.log(elem);
	yield page.waitForSelector(elem);
	yield clickUntilSuccess(page, elem);

	if (wait != -1) {
		yield page.waitForTimeout(wait * 1000);
	}
}