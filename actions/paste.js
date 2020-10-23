
module.exports = function* paste(page, elem, text) {
	yield page.waitForSelector(elem);

	let success = false;
	while (!success) {
		try {
			yield page.evaluate((data) => {
				return document.querySelector(data.elem).value = data.text
			}, { elem, text });
			success = true;
		}
		catch (e) {
			// not ready yet?
			yield page.waitForTimeout(1);
		}
	}
}