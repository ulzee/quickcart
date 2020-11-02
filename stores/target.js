
const sec = 1000;
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.target.com';

const vendor = 'TARGET';
const log = utils.taglog(vendor);
global.log = log;

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		// give up on this IP if pages too slow
		yield page.waitForTimeout(5 * sec);
		yield nav.bench(page, args.url, waitFor='div[data-test="product-price"]');
		yield page.waitForTimeout(5 * sec);

		// yield nav.go(page, 'https://login.target.com/gsp/static/v1/login/');

		// yield nav.go(page, domain);
		yield page.waitForSelector('#account');
		yield page.waitForTimeout(5 * sec);
		yield click(page, '#account')
		yield page.waitForTimeout(5 * sec);
		yield click(page, '#accountNav-signIn');

		yield page.waitForSelector('#username');
		yield page.waitForTimeout(5 * sec);
		yield page.type('#username', user, { delay: 10 });
		yield page.type('#password', pass, { delay: 10 });

		yield page.waitForTimeout(3 * sec);

		yield page.click('#login');
		yield page.waitForTimeout(5 * sec);
	},
	*visit(page, url) {
		yield nav.go(page, url);
	},
	*standby(page, url) {
		// TODO:
		// measure reload speed
		// sync reload with a fixed interval
		// detect add to cart is available
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



		// run out of stock check
		let oos = false;
		page.waitForSelector('div[data-test="outOfStockMessage"]')
		.then(() => {
			oos = true;
			log('OOS Message Detected...');
		})
		.catch(e => e);

		// click the first available atc button
		try {
			yield page.waitForSelector('button[data-test="orderPickupButton"]');
		}
		catch(e) {
			if (oos) {
				throw new Error('OUT OF STOCK!');
			}
			throw new Error('Pickup not available!');
		}
		yield page.click('button[data-test="orderPickupButton"]');

		// yield page.waitForSelector(30 * 60 * sec);

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('button[aria-label="close"]');
		yield page.waitForTimeout(sec);
		// yield nav.go(page, 'https://www.target.com/co-cart');

		// HOTFIX: go straight to checkout
		yield nav.go(page, 'https://www.target.com/co-review?precheckout=true');

		// proceed checkout
		// yield click(page, 'button[data-test="checkout-button"]', delay=1);
		yield page.waitForSelector('button[data-test="placeOrderButton"]');
		yield page.waitForTimeout(sec);

		// CVV may be optional
		const cvvinput = yield page.$('#creditCardInput-cvv');
		if (cvvinput) {
			yield page.type('#creditCardInput-cvv', security, { delay: 10 });
		}
		// yield page.waitForSelector('#creditCardInput-cvv');

		if (args.debug == undefined || args.debug == false) {
			yield click(page, 'button[data-test="placeOrderButton"]');
		}

		// checkout success
		log('Done!');
		console.log(args);
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}