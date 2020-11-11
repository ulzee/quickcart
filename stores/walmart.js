
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click, traffic } = require('../actions');
const exists = require('../actions/exists');

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

		log('Removing from cart');
		while(yield page.$$eval('button[data-automation-id="cart-item-remove"]', ls => ls.length)) {
			waitfor = traffic.match('walmart.com/api/v3/cart/:CRT/items');
			yield page.$eval('button[data-automation-id="cart-item-remove"]', el => el.click());
			yield waitfor
			yield page.waitForTimeout(sec);
		}
		log('Cart cleared');
	},
	*visit(page, url) {
		waitfor = traffic.match('/api/v2/collector/beacon'); // FIXME: beacon is unreliable
		yield nav.bench(page, url, waitFor='.price-characteristic');
		yield waitfor;
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


		// any of these bottom actions may be optional
		yield waitfor; // wait for spinners to finish
		yield page.waitForTimeout(sec);
		if (yield exists(page, 'button[data-automation-id="fulfillment-continue"]')) {
			log('Shipping confirm');
			waitfor = traffic.match('/api/v2/collector')
			yield click(page, 'button[data-automation-id="fulfillment-continue"]');
			yield waitfor;
			yield page.waitForTimeout(sec);
		}

		if (yield exists(page, 'button[data-automation-id="address-book-action-buttons-on-continue"]')) {
			log('Address confirm');
			// waitfor = traffic.match('/checkout-customer/:CID/credit-card');
			waitfor = traffic.match('/api/v2/collector')
			yield click(page, 'button[data-automation-id="address-book-action-buttons-on-continue"]');
			yield waitfor;
			yield page.waitForTimeout(sec);
		}

		if (yield exists(page, '#cvv-confirm')) {
			log('CVV Confirm');
			yield page.waitForSelector('#cvv-confirm');
			yield paste(page, '#cvv-confirm', security);

			yield page.waitForTimeout(1);
			waitfor = traffic.match('/api/v2/collector')
			yield click(page, 'button[data-automation-id="submit-payment-cc"]');
			yield waitfor;
			yield page.waitForTimeout(sec);
		}

		if (yield exists(page, '.fulfillment-opts-continue button')) {
			log('Confirm payment');
			waitfor = traffic.match('/api/v2/collector')
			yield click(page, '.fulfillment-opts-continue button');
			yield waitfor;
			yield page.waitForTimeout(sec);
		}

		if (args.debug == undefined || args.debug == false) {
			yield click(page, '.auto-submit-place-order');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(100 * sec);
	},
}