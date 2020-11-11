
module.exports = function* (page, sel) {
	return yield page.$$eval(sel, ls => ls.length > 0);
}