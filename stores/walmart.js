
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

		while(yield page.$$eval('button[data-automation-id="cart-item-remove"]', ls => ls.length)) {
			waitfor = traffic.match('walmart.com/cart/cart-electrode/api/logger/v2');
			yield page.$eval('button[data-automation-id="cart-item-remove"]', el => el.click());
			yield waitfor
			yield page.waitForTimeout(sec);
		}
	},
	*visit(page, url) {
		waitfor = traffic.match('walmart.com/p13n/v1/walmart/itempage/content');
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

		yield waitfor; // wait for spinners to finish

		// any of these bottom actions may be optional
		if (yield exists(page, 'button[data-automation-id="fulfillment-continue"]')) {
			yield click(page, 'button[data-automation-id="fulfillment-continue"]');
			yield page.waitForTimeout(sec);
		}

		if (yield exists(page, 'button[data-automation-id="address-book-action-buttons-on-continue"]')) {
			waitfor = traffic.match('walmart.com/api/checkout/v3/contract');
			yield click(page, 'button[data-automation-id="address-book-action-buttons-on-continue"]');
			yield waitfor;
		}

		if (yield exists(page, '#cvv-confirm')) {
			yield page.waitForSelector('#cvv-confirm');
			yield paste(page, '#cvv-confirm', security);

			yield page.waitForTimeout(100);
			waitfor = traffic.match('www.walmart.com/api/checkout/v3/contract/:PCID/payment');
			yield click(page, 'button[data-automation-id="submit-payment-cc"]');
			yield waitfor;
		}

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