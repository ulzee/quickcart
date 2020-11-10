
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.walmart.com';

const vendor = 'WALMART';

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		// give up on this IP if pages too slow
		yield page.waitForTimeout(5 * sec);
		yield nav.bench(page, 'https://www.walmart.com/account/login', waitFor='#email');
		yield page.waitForTimeout(5 * sec);

		// yield nav.go(page, 'https://login.target.com/gsp/static/v1/login/');

		yield page.waitForTimeout(5 * sec);
		yield page.type('#email', user, { delay: 10 });
		yield page.type('#password', pass, { delay: 10 });
		yield page.waitForTimeout(sec);

		yield page.click('button[data-automation-id="signin-submit-btn"]');
		yield page.waitForTimeout(5 * sec);

		//empty cart
		yield nav.go(page, 'https://www.walmart.com/cart');
		yield page.waitForSelector('.has-items');
		yield page.waitForTimeout(5 * sec);

		while(yield page.$$eval('button[data-automation-id="cart-item-remove"]', ls => ls.length)) {
			yield page.$eval('button[data-automation-id="cart-item-remove"]', el => el.click());
			yield page.waitForTimeout(2 * sec);
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='.price-characteristic');
		yield page.waitForSelector('.price-characteristic');
	},
	*standby(page, args) {
		while(true) {
			try {
				yield page.waitForSelector('.prod-ProductCTA--primary', { timeout: 10 });
				break;
			}
			catch(e) {
				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);
				yield nav.bench(page, args.url, waitFor='.price-characteristic', retry=true);
			}
		}
	},
	*checkout(page, args) {
		let {
			url,
			account: {
				security,
			},
			logid,
		} = args;

		log(url);


		// Choose the first available purchase option
		yield click(page, 'button[class*="prod-ProductCTA"]');

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('.checkoutBtn');

		yield nav.go(page, 'https://www.walmart.com/checkout');

		// proceed checkout
		yield click(page, 'button[data-automation-id="fulfillment-continue"]');

		yield click(page, 'button[data-automation-id="address-book-action-buttons-on-continue"]');

		yield page.waitForSelector('#cvv-confirm');
		yield page.type('#cvv-confirm', security, { delay: 10 });
		yield click(page, 'button[data-automation-id="submit-payment-cc"]');

		if (args.debug == undefined || args.debug == false) {
			yield click(page, '.auto-submit-place-order');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}