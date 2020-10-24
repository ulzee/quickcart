
const { click, paste } = require('../actions');

module.exports = function* (page, { name, phone, user, pass }) {

	yield page.goto('https://www.gamestop.com');

	yield click(page, `.user > a`);

	yield click(page, `#createAccount`);

	yield page.waitForSelector('#registration-form-fname');

	const [first, last] = name.split(' ');

	yield paste(page, '#registration-form-fname', first);
	yield paste(page, '#registration-form-lname', last);

	yield paste(page, '#registration-form-email', user);
	yield paste(page, '#registration-form-password', pass);

	yield paste(page, '#registration-form-phone', phone);

	// wait for user input to register

	yield page.waitForSelector('.shopping-cart');
}