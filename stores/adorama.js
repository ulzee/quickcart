
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.adorama.com';

const vendor = 'ADORAMA';
const log = utils.taglog(vendor);
global.log = log;

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		// give up on this IP if pages too slow
		yield nav.bench(page, 'https://www.adorama.com/so3005727.html', waitFor='.product-info-container');
		yield page.waitForTimeout(5 * sec);


		yield nav.go(page, 'https://www.adorama.com/Als.Mvc/nspc/MyAccount');
		yield page.waitForTimeout(5 * sec);
		yield page.type('#login-email', user, { delay: 10 });
		yield page.type('#login-pwd', pass, { delay: 10 });
		yield page.waitForTimeout(sec);

		yield page.click('.login-form button');
		yield page.waitForTimeout(5 * sec);
		page.waitForSelector('#searchinfo');

		//empty cart
		yield nav.go(page, 'https://www.adorama.com/als.mvc/cartview');
		yield page.waitForTimeout(5 * sec);

		if (yield page.$$eval('.cart-remove-me', ls => ls.length)) {
			yield page.$eval('.cart-remove-me', el => el.click());
			yield page.waitForTimeout(2 * sec);
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='.primary-info');
	},
	*standby(page, args) {
		yield page.waitForSelector('.add-to-cart');

		while (true) {
			const buttonText = yield page.$eval('.add-to-cart', el => el.textContent);

			if (buttonText.includes('Cart')) {
				break;
			}
			else {
				log('OOS: ' + buttonText);

				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);

				yield nav.bench(page, args.url, waitFor='.add-to-cart', retry=true);
			}
		}
	},
	*checkout(page, args) {
		let {
			url,
			account: {
				security,
				number, month, year
			},
			logid,
		} = args;

		log(url);

		yield click(page, '.add-to-cart');

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('.popupHeader');
		yield nav.go(page, 'https://www.adorama.com/als.mvc/nspc/revised');
		yield page.waitForSelector('label[for="payby-cc"]');

		// proceed checkout
		yield click(page, 'label[for="payby-cc"]');

		yield page.type('#card-number', number, { delay: 1 });
		yield page.select('.aweform-input.sib1 select', month);
		yield page.select('.aweform-input.sib2 select', year);
		yield page.type('#card-cvc', security, { delay: 1 });
		yield click(page, '#billAsShipPlaceholder');

		if (args.debug == undefined || args.debug == false) {
			yield click(page, 'a[data-action="placeOrder"]');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}