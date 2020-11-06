
const faker = require('faker');
const { nav, click, paste, sel } = require('../actions');

const sec = 1000;

module.exports = function* (page, {
	name, phone, user, pass, city, zip, address, address2,
	number, security, month, year, profile_index,
}) {

	yield nav.go(page, 'https://www.walmart.com/account/signup?tid=0&returnUrl=%2F');

	yield page.waitForSelector('#first-name-su');
	// const fakeName = faker.name.findName().split(' ');
	const [first, last] = name.split(' ');

	yield page.waitForTimeout(sec);
	yield page.type('#first-name-su', first, { delay: 50 });
	yield page.type('#last-name-su', last, { delay: 50 });
	yield page.type('#email-su', user, { delay: 50 });
	yield page.type('#password-su', pass, { delay: 50 });
	yield page.waitForTimeout(sec);
	yield click(page, '#su-newsletter');
	yield page.waitForTimeout(sec);
	yield click(page, 'button[data-automation-id="signup-submit-btn"]');

	yield page.waitForTimeout(5 * sec);

	// address
	yield nav.go(page, 'https://www.walmart.com/account/deliveryaddresses');

	yield page.waitForSelector('#firstName');
	yield page.waitForTimeout(sec);
	yield page.type('#firstName', first, { delay: 10 });
	yield page.type('#lastName', last, { delay: 10 });
	yield page.type('#addressLineOne', '11000 Weyburn Dr', { delay: 10 });
	yield page.type('#city', city, { delay: 10 });
	yield page.type('#phone', phone, { delay: 10 });
	yield page.select('#state', 'CA');
	yield page.type('#postalCode', zip, { delay: 10 });
	yield click(page, 'button[data-automation-id="address-form-submit"]');
	yield page.waitForTimeout(5 * sec);

	// payment
	yield nav.go(page, 'https://www.walmart.com/account/creditcards');

	yield page.waitForSelector('.add-credit-card');
	yield page.click('.add-credit-card');
	yield page.waitForTimeout(sec);

	yield page.type('#firstName', first, { delay: 10 });
	yield page.type('#lastName', last, { delay: 10 });
	yield page.type('#creditCard', number, { delay: 10});
	yield page.select('#month-chooser', month);
	yield page.select('#year-chooser', year);
	yield page.type('#cvv', security, { delay: 10});
	yield page.type('#phone', phone, { delay: 10 });
	yield page.waitForTimeout(sec);

	yield page.click('.save-btn');

	yield page.waitForTimeout(10 * sec);
}