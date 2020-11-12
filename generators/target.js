
const faker = require('faker');
const { nav, click, paste, sel } = require('../actions');

const sec = 1000;

module.exports = function* (page, {
	name, phone, user, pass, city, zip, address, address2,
	number, security, month, year, profile_index,
}) {

	yield nav.go(page, 'https://target.com');
	yield page.waitForTimeout(5*sec);
	yield click(page, '#account')
	yield page.waitForTimeout(5*sec);
	yield click(page, '#accountNav-createAccount');
	yield page.waitForTimeout(5*sec);

	yield page.waitForSelector('#username');
	// const fakeName = faker.name.findName().split(' ');
	const [first, last] = name.split(' ');

	yield page.waitForTimeout(sec);
	yield page.type('#username', user, { delay: 50 });
	yield page.type('#firstname', first, { delay: 50 });
	yield page.type('#lastname', last, { delay: 50 });
	yield page.type('#phone', phone, { delay: 50 });
	yield page.type('#password', pass, { delay: 50 });
	yield page.waitForTimeout(sec);
	yield click(page, '#createAccount');

	yield click(page, '#notNowButton');
	yield click(page, '#circle-skip');

	// yield page.waitForTimeout(60 * 60 * sec);
	yield page.waitForSelector('.storyblockRiftRow');

	// address
	yield nav.go(page, 'https://www.target.com/account/addresses/new');

	yield page.waitForSelector('#firstName');
	yield page.waitForTimeout(sec);
	yield page.type('#firstName', first, { delay: 10 });
	yield page.type('#lastName', last, { delay: 10 });
	yield page.type('#addressLineOne', '11000 Weyburn Dr', { delay: 10 });
	yield page.waitForTimeout(3 * sec);
	yield page.click('.TypeaheadItemLink');
	yield page.waitForTimeout(3 * sec);
	// yield page.type('#zipCode', zip, { delay: 10 });
	// yield page.type('#cityName', city, { delay: 10 });
	// yield page.select('#stateSelect', 'CA');
	yield page.type('#phone', phone, { delay: 10 });
	yield page.click('label[for="defaultShipping"]');

	yield page.waitForTimeout(1 * sec);
	yield click(page, '#step-two-proceed-button');
	yield page.waitForTimeout(10 * sec);

	// payment
	yield nav.go(page, 'https://www.target.com/account/payments/new');

	yield page.waitForSelector('#cardNumber');
	yield page.type('#cardNumber', number, { delay: 10});
	yield page.type('#expiration', `${month}/${year.slice(2)}`, { delay: 10});
	yield page.type('#cardName', name, { delay: 10});
	yield page.click('#ToggleDefaultPayment');
	yield page.click('button[role="presentation"]');


	yield page.waitForTimeout(sec);
	yield page.click('#submitAddCreditCard');



	yield page.waitForTimeout(30 * sec);
}