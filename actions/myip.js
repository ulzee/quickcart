
const nav = require('./nav');
const { sec } = require('../utils');

module.exports = function* myip(page) {
	const myip = yield page.evaluate(async () => {
		const getMyIP = () => new Promise((yes, no) => {
			const req = new XMLHttpRequest();
			req.open("GET", 'https://icanhazip.com', true);
			req.onreadystatechange = function(e) {
				if (req.responseText) {
					yes(req.responseText.trim(' \n\t'));
				}
			}
			req.send(null);
		});

		return await getMyIP();
	});

	return myip;
}