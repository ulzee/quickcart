
const co = require('co');
const utils = require('../utils');
const nav = require('./nav');
const inp = require('./inp');
const sel = require('./sel');
const paste = require('./paste');
const click = require('./click');

const domain = 'https://www.gamestop.com';
// const ps5 = '/video-games/playstation-5/consoles/products/playstation-5/11108140.html?condition=New';
const ps4 = '/video-games/playstation-4/consoles/products/playstation-4-slim-black-1tb/10147719.html?rrec=true';
const atc = `.add-to-cart.btn.btn-primary`;
// const accountIcon = `a[href="#accountModal"]`;
const accountIcon = `.user > a`;
const signin = `#signIn`;
const emailInput = `#login-form-email`;
const passInput = `#login-form-password`;
const loginButton = `.btn.btn-block.btn-primary[type="submit"]`;
// const cartlink = `.minicart-link`;
const gotocart = `.addtocartlink > a`;
// const gotocart = `.minicart-link`;
const log = utils.taglog('GSTOP');
global.log = log;

module.exports = {
	home: domain,
	*prime(page, args) {
		const { email, pass } = args;

		yield click(page, accountIcon);
		log('Account');

		yield click(page, signin);
		log('Signin');

		yield page.waitForTimeout(1.5 * 1000);

		yield page.waitForSelector(emailInput);
		yield page.type(emailInput, email, { delay: 50 });
		yield page.type(passInput, pass, { delay: 50 });
		yield page.click(loginButton);
		log('Email Pass');

		yield page.waitForSelector('#showAccountModal');

	},
	*checkout(page, args) {
		const { url, paymentid, email, phoneid } = args;
		log(url);

		yield nav(page, url);

		// FIXME: issue with atc loading
		yield page.waitForTimeout(1.0 * 1000);
		yield click(page, atc);

		yield click(page, gotocart);

		yield click(page, '.checkout-btn');

		const {
			number, month, year, security,
			address, address2,
			city, zip,
			name
		} = utils.payinfo(paymentid);
		const {
			phone,
		} = utils.phone(parseInt(phoneid));
		const simplePhone = utils.simplifyPhone(phone);
		const { first, last } = utils.jigName(name);


		// NOTE: Shipping will be prefilled (takes too long)
		// // SHIPPING
		// yield sel(page, '#shippingCountry', 'United States');
		// yield sel(page, '#shippingState', 'California');
		// yield page.waitForTimeout(2.5 * 1000);
		// // HOTFIX: page does a dynamic load after country

		// yield paste(page, '.email', email);
		// yield paste(page, '#shippingFirstName', first);
		// yield paste(page, '#shippingLastName', last);

		// yield paste(page, '#shippingAddressOne', address);
		// yield paste(page, '#shippingAddressTwo', address2);
		// yield paste(page, '#shippingAddressCity', city);
		// yield paste(page, '#shippingZipCode', zip);
		// yield paste(page, '#shippingPhoneNumber', simplePhone);

		// HOTFIX: confirm address if popup
		function* acceptAddress() {
			const el='.xav-address-btn[data-my-address="true"]';
			while(true) {
				yield page.waitForSelector(el, {
					timeout: 10 * 60 * 1000 // 10 mins
				});
				// it appeared, then click it
				while (true) {
					try {
						yield page.click(el);
					}
					catch(e) {
						// console.log
					}
				}
			}
		}
		co(acceptAddress).then(console.log).catch(console.log);

		yield click(page, '.submit-shipping');

		// BILLING
		yield page.waitForTimeout(1 * 1000);
		yield click(page, '#addNewAddressbtn');

		yield paste(page, '#billingFirstName', first);
		yield paste(page, '#billingLastName', last);

		yield paste(page, '#billingAddressOne', address);
		yield paste(page, '#billingAddressTwo', address2);
		yield sel(page, '#billingCountry', 'United States');
		yield sel(page, '#billingState', 'California');
		yield paste(page, '#billingAddressCity', city);
		yield paste(page, '#billingZipCode', zip);
		yield paste(page, '#phoneNumber', simplePhone);

		yield paste(page, '#cardNumber', number);
		yield sel(page, '#expirationMonth', month);
		yield sel(page, '#expirationYear', year);
		yield paste(page, '#securityCode', security);

		yield page.waitForTimeout(10 * 1000);
	},
}