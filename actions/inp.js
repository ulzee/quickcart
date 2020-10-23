
function* typeUntilSuccess(page, elem, text, options) {
	let success = false;

	while (!success) {
		try {
			yield page.type(elem, text, options);
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
	yield typeUntilSuccess(page, elem, text, { delay: 1 });
}
