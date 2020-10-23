
// function* selUntilSuccess(page, elem, text) {
// 	let success = false;

// 	while (!success) {
// 		try {
// 			yield page.select(elem, text);
// 			success = true;
// 		}
// 		catch (error) {
// 			if (error.toString().includes('not visible') ||
// 				error.toString().includes('No node found')) {
// 				yield page.waitForTimeout(1);
// 			}
// 			else {
// 				throw error;
// 			}
// 		}
// 	}
// }

module.exports = function*(page, elem, value) {
	yield page.waitForSelector(elem);
	yield page.evaluate(data => {
		return document.querySelector(data.elem).value = data.value;
	}, { elem, value })
}
