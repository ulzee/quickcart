
module.exports = function* (page, selectors) {
	return yield Promise.race(selectors.map(match =>
		page.waitForSelector(match).then(() => match).catch()));
}