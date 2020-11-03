
const sec = 1000;
const co = require('co');
const utils = require('../utils');
const { nav, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.bestbuy.com';

const vendor = 'BBUY';
const log = utils.taglog(vendor);
global.log = log;

// function waitForShipStatus(page) {
// 	return new Promise((yes, no) => {

// 	});
// }

function* waitForSpinner(page) {
	// wait to see spinner
	let waiting = true;
	while (waiting) {
		const loading = yield page.evaluate(() => {
			return getComputedStyle(document.querySelector('.page-spinner'), ':after').visibility;
		});

		if (loading == 'visible') waiting = false;
		else yield page.waitForTimeout(50);
	}

	// wait for spinner to go away
	waiting = true;
	while (waiting) {
		const loading = yield page.evaluate(() => {
			return getComputedStyle(document.querySelector('.page-spinner'), ':after').visibility;
		});

		if (loading == 'hidden') waiting = false;
		else yield page.waitForTimeout(50);
	}
}

module.exports = {
	vendor,
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		yield nav.bench(page, 'https://www.bestbuy.com/identity/global/signin', waitFor='#fld-e');

		yield page.waitForSelector('#fld-e');
		yield page.type('#fld-e', user, { delay: 50 });
		yield page.type('#fld-p1', pass, { delay: 50 });

		yield page.waitForTimeout(1000);

		yield click(page, '.cia-form__controls__submit');

		yield page.waitForSelector('#gh-search-input');
	},
	*visit(page, url) {
		yield nav.go(page, url);
		yield page.waitForSelector('.priceView-customer-price');
	},
	*standby(page, url) {
		// TODO:
		// measure reload speed
		// sync reload with a fixed interval
		// detect add to cart is available
	},
	*checkout(page, args) {
		const {
			url,
			account: {
				security,
			},
			record: { logid },
		} = args;

		log(url);

		yield page.waitForSelector('.add-to-cart-button');
		yield page.waitForSelector('.fulfillment-fulfillment-summary strong');

		// yield waitForShipStatus(page);

		yield click(page, '.add-to-cart-button');

		yield page.waitForSelector('.go-to-cart-button');
		yield nav.go(page, 'https://www.bestbuy.com/checkout/r/fast-track');

		// yield page.waitForSelector('.change-store-link');
		// yield page.waitForSelector('.price-summary__total-value');
		// yield page.waitForSelector('.cart-item__image');
		// yield page.waitForTimeout(100);
		// yield click(page, '.checkout-buttons__checkout .btn-primary');

		yield page.waitForSelector('.button__fast-track');
		yield waitForSpinner(page);

		// CVV input may be asked
		const cardInput = yield page.evaluate(() =>
			document.querySelectorAll('#credit-card-cvv').length);
		log('Card input: ' + cardInput);
		if (cardInput) {
			yield page.waitForSelector('#credit-card-cvv');
			yield page.type('#credit-card-cvv', security);
		}

		if (args.debug == false || args.debug == undefined) {
			// submit order
			yield click(page, '.button__fast-track')
		}

		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}