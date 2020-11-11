
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
		yield nav.bench(page, url, waitFor='.SellerInfo-shipping-msg');
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
				yield nav.bench(page, args.url, waitFor='.SellerInfo-shipping-msg', retry=true);
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
		yield nav.go(page, 'https://www.walmart.com/checkout');


		function asyncButton(buttonName) {
			page.waitForSelector(buttonName, { visible: true, timeout: 10 * 60 * sec })
			.then(() => page.waitForTimeout(100))
			.then(() => page.click(buttonName))
			.then(() => log(buttonName))
			.then().catch(console.log);
		}

		asyncButton('button[data-automation-id="fulfillment-continue"]')
		asyncButton('button[data-automation-id="address-book-action-buttons-on-continue"]')
		asyncButton('.fulfillment-opts-continue button')
		asyncButton('button[data-automation-id="submit-payment-cc"]')

		page.waitForSelector('#cvv-confirm', { visible: true, timeout: 10 * 60 * sec })
		.then(() => page.waitForTimeout(100))
		.then(() => paste(page, '#cvv-confirm', security))
		.then(() => page.click('button[data-automation-id="submit-payment-cc"]', security))
		.then().catch(console.log);


		while(true) {
			try {
				yield page.waitForSelector('.auto-submit-place-order', { timeout: 100 });
				break;
			}
			catch(e) {
				// waiting for checkout button
			}
		}

		if (args.debug == false || args.debug == undefined) {
			// submit order
			yield click(page, '.auto-submit-place-order');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}