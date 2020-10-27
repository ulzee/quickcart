
const faker = require('faker');
const { nav, click, paste, sel } = require('../actions');

global.log = console.log;

module.exports = function* (page, {
	name, phone, user, pass, city, zip, address, address2,
	number, security, month, year, profile_index,
}) {

	yield nav.go(page, 'https://www.bestbuy.com/identity/global/signin');
	// yield page.waitForSelector('#fld-e');
	// yield page.type('#fld-e', 'ul1994@gmail.com');
	// yield page.type('#fld-p1', 'Ulzeean1!!');
	// yield click(page, `.cia-form__controls__submit`);
	yield click(page, `.cia-signin__create--content a`);

	const fakeName = faker.name.findName().split(' ');
	const [first, last] = name.split(' ');

	yield page.waitForSelector('#firstName');
	yield page.waitForTimeout(3 * 1000);
	yield page.type('#firstName', fakeName[0], { delay: 50 });
	yield page.type('#lastName', fakeName[1], { delay: 50 });
	yield page.type('#email', user, { delay: 50 });
	yield page.type('#fld-p1', pass, { delay: 50 });
	yield page.type('#reenterPassword', pass, { delay: 50 });
	yield page.type('#phone', phone, { delay: 50 });
	yield click(page, '.cia-form__controls__submit');

	yield page.waitForTimeout(5 * 1000);

	// address
	yield nav.go(page, 'https://www.bestbuy.com/profile/c/address/shipping');

	yield click(page, '.addresses-address-list-page__add-address');

	yield page.type('#firstName-id', first, { delay: 10 });
	yield page.type('#lastName-id', last, { delay: 10 });
	yield page.type('#addressLine1-id', address, { delay: 10 });
	yield page.type('#city-id', city, { delay: 10 });
	yield page.select('#state-id', 'CA');
	yield page.type('#postalCode-id', zip, { delay: 10 });
	yield page.type('#phoneNumber-id', phone, { delay: 10 });

	yield page.waitForTimeout(5 * 1000);

	yield click(page, '.addresses-address-form-page__submit-button');

	// payment
	yield nav.go(page, 'https://www.bestbuy.com/profile/c/billinginfo/cc/');

	yield click(page, '.pf-credit-card-list__add-payment-method-card');

	yield page.type('#cardNumber-id', number, { delay: 10 });
	yield page.select('#expirationMonth-id', month);
	yield page.select('#expirationYear-id', year);

	yield page.type('#firstName-id', first, { delay: 10 });
	yield page.type('#lastName-id', last, { delay: 10 });
	yield page.type('#addressLine1-id', address, { delay: 10 });
	yield page.type('#addressLine2-id', address2, { delay: 10 });
	yield page.type('#city-id', city, { delay: 10 });
	yield page.select('#state-id', 'CA');
	yield page.type('#zip-id', zip, { delay: 10 });
	yield page.type('#phone-id', phone, { delay: 10 });

	yield page.waitForTimeout(5 * 1000);

	yield click(page, '.pf-add-update-form__submit-button');

	yield page.waitForTimeout(5 * 1000);

	if (profile_index != undefined) {
		yield nav.go(page, 'https://www.bestbuy.com/site/store-locator/');

		yield page.waitForTimeout(5 * 1000);

		yield click(page, `.store:nth-child(${1+profile_index}) .make-this-your-store`);
	}

	yield page.waitForTimeout(30 * 1000);
}