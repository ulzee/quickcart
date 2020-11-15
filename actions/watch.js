
module.exports = function(page, sel) {
	global.log('Watching: ' + sel);

	page.waitForSelector(sel)
	.then(() => {
		return page.click(sel);
	})
	.then(() => {
		global.log('Encoutnered: ' + sel);
	})
	.catch(global.log);
}