
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
const loginButton = `#signinCheck .btn`;
// const cartlink = `.minicart-link`;
const gotocart = `.addtocartlink > a`;
// const gotocart = `.minicart-link`;
const log = utils.taglog('GSTOP');
global.log = log;

const vendor = 'GSTOP';

module.exports = {
	vendor: 'GSTOP',
	home: domain,
	*prime(page, args) {
		const { account: { user, pass } } = args;

		yield click(page, accountIcon, wait=1);
		log('Account');

		yield click(page, signin, wait=1);
		log('Signin');

		yield page.waitForSelector(emailInput);
		yield page.type(emailInput, user, { delay: 50 });
		yield page.type(passInput, pass, { delay: 50 });
		yield page.click(loginButton, wait=1);
		log('Email Pass');

		yield page.waitForSelector('#showAccountModal');
	},
	*checkout(page, args) {
		const {
			url,
			account: {
				security,
			}
		} = args;

		log(url);
		const navOk = yield nav.go(page, url);

		if (!navOk) {
			throw nav.errors.Banned;
			return;
		}

		// NOTE: there can be issues w limited items and adding duplicates to cart
		yield click(page, atc, options={visible: true});

		yield click(page, gotocart);

		yield click(page, '.checkout-btn');

		// NOTE: prefilled account, this is no longer needed
		// HOTFIX: confirm address if popup
		// function* acceptAddress() {
		// 	const el='.xav-address-btn[data-my-address="false"]';
		// 	while(true) {
		// 		yield page.waitForSelector(el, {
		// 			timeout: 10 * 60 * 1000 // 10 mins
		// 		}, { visible: true });
		// 		// it appeared, then click it
		// 		while (true) {
		// 			try {
		// 				yield page.click(el);
		// 				break;
		// 			}
		// 			catch(e) {
		// 				// console.log
		// 			}
		// 		}
		// 	}
		// }
		// co(acceptAddress).then(console.log).catch(console.log);

		yield click(page, '.submit-shipping');

		// // BILLING
		yield paste(page, '#saved-payment-security-code', security);
		// yield paste(page, '#billingFirstName', first);
		// yield paste(page, '#billingLastName', last);

		// yield paste(page, '#billingAddressOne', address);
		// yield paste(page, '#billingAddressTwo', address2);
		// yield sel(page, '#billingCountry', 'US');
		// yield sel(page, '#billingState', 'CA');
		// yield paste(page, '#billingAddressCity', city);
		// yield paste(page, '#billingZipCode', zip);
		// yield paste(page, '#phoneNumber', simplePhone);

		// yield paste(page, '#cardNumber', number);
		// yield sel(page, '#expirationMonth', parseInt(month));
		// yield sel(page, '#expirationYear', year);
		// yield click(page, '#saveCreditCard');
		// yield paste(page, '#securityCode', security);
		yield click(page, '.submit-payment');

		if (args.debug) {
			log('DEBUG (stopping before checkout)')
			yield page.waitForTimeout(100 * 1000);
			return;
		}

		// submit order
		// TODO: enable
		// yield click(page, '.place-order');

	},
}