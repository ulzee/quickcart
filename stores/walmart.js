
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click, traffic } = require('../actions');

const domain = 'https://www.walmart.com';

const vendor = 'WALMART';

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		waitfor = traffic.match('beacon.walmart.com');
		yield nav.bench(page, 'https://www.walmart.com/account/login', waitFor='#email');
		yield waitfor;

		yield page.type('#email', user, { delay: 10 });
		yield page.type('#password', pass, { delay: 10 });

		yield page.click('button[data-automation-id="signin-submit-btn"]');
		yield page.waitForSelector('.nav-wplus-container');
		yield page.waitForTimeout(sec);

		//empty cart
		yield nav.go(page, 'https://www.walmart.com/cart');
		yield page.waitForSelector('.has-items');
		yield page.waitForTimeout(5 * sec);

		while(yield page.$$eval('button[data-automation-id="cart-item-remove"]', ls => ls.length)) {
			waitfor = traffic.match('walmart.com/cart/cart-electrode/api/logger/v2');
			yield page.$eval('button[data-automation-id="cart-item-remove"]', el => el.click());
			yield waitfor
			yield page.waitForTimeout(sec);
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='.price-characteristic');
		yield page.waitForSelector('.price-characteristic');
	},
	*standby(page, args) {
		// FIXME: sometimes ATC doesnt appear for a while (find the atc resolve traffic)
		while(true) {
			try {
				yield page.waitForSelector('.prod-ProductCTA--primary', { timeout: 0.5*sec });
				break;
			}
			catch(e) {
				console.log(e);
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
		waitfor = traffic.match('b.wal.co/beacon.js');
		yield click(page, 'button[class*="prod-ProductCTA"]');

		// Go to checkout page
		yield waitfor; // wait for cart add confirmation
		waitfor = traffic.match('walmart.com/checkout.prefetch');
		yield nav.go(page, 'https://www.walmart.com/checkout');

		yield waitfor; // wait for spinners to finish
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