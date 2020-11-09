
const nav = require('./nav');
const { sec } = require('../utils');

class IPCheckFailed extends Error {
	constructor(message='Failed to fetch my IP.') {
		super(message);
	}
}

module.exports = {
	errors: {
		IPCheckFailed,
	},
	fetch: function* (page) {
		const myip = yield page.evaluate(async () => {
			const getMyIP = () => new Promise((yes, no) => {
				const req = new XMLHttpRequest();
				req.timeout = 3 * 1000;
				req.open("GET", 'https://icanhazip.com', true);
				req.onreadystatechange = function(e) {
					if (req.responseText) {
						yes(req.responseText.trim(' \n\t'));
					}
				}
				req.ontimeout = function(e) {
					yes(null);
				}
				req.send(null);
			});

			return await getMyIP();
		});

		if (!myip) {
			throw new IPCheckFailed();
		}

		return myip;
	}
}