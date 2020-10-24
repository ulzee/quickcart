
const Moniker = require('moniker');
const { nav, click, paste, sel } = require('../actions');

module.exports = function* (page, {
	name, phone, user, pass, city, zip, address,
	number, security, month, year
}) {

	yield page.goto('https://www.gamestop.com');

	yield click(page, `.user > a`);

	yield click(page, `#createAccount`);

	yield page.waitForSelector('#registration-form-fname');

	const fakeName = Moniker.choose().split('-');
	const [first, last] = name.split(' ');

	yield paste(page, '#registration-form-fname', fakeName[0]);
	yield paste(page, '#registration-form-lname', fakeName[1]);

	yield paste(page, '#registration-form-email', user);
	yield paste(page, '#registration-form-password', pass);

	yield paste(page, '#registration-form-phone', phone);

	yield click(page, '.create-account-submit button');

	yield page.waitForSelector('.shopping-cart');

	yield page.waitForTimeout(2 * 1000);

	// address input
	yield nav.go(page, 'https://www.gamestop.com/address/add/');

	yield paste(page, '#title', 'home');
	yield paste(page, '#firstName', first);
	yield paste(page, '#lastName', last);

	yield sel(page, '#country', 'US');
	yield sel(page, '#state', 'CA');

	yield paste(page, '#address1', address);
	yield paste(page, '#city', city);
	yield paste(page, '#zipCode', zip);
	yield paste(page, '#phone', phone);

	yield click(page, '.btn-save');

	yield page.waitForTimeout(2 * 1000);


	// billing input
	yield nav.go(page, 'https://www.gamestop.com/payment/add/');

	yield page.type('#cardNumber', number, { delay: 50 });
	yield paste(page, '#month', parseInt(month));
	yield paste(page, '#year', year);

	// user input to captcha and save

	yield page.waitForSelector('.payment-card', { timeout: 4 * 60 * 1000 });
}