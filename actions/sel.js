
function* selUntilSuccess(page, elem, text) {
	let success = false;

	while (!success) {
		try {
			yield page.select(elem, text);
			success = true;
		}
		catch (error) {
			if (error.toString().includes('not visible') ||
				error.toString().includes('No node found')) {
				yield page.waitForTimeout(1);
			}
			else {
				throw error;
			}
		}
	}
}

module.exports = function*(page, elem, text) {
	console.log(elem, text);
	yield selUntilSuccess(page, elem, text);
}
