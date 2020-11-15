
const sec = 1000;
const co = require('co');
const utils = require('../utils');
const { nav, click, traffic, watch } = require('../actions');
const { action } = require('@pm2/io');
const actions = require('../actions');

const domain = 'https://www.bestbuy.com';

const vendor = 'bestbuy';

module.exports = {
	vendor,
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		yield nav.bench(page, 'https://www.bestbuy.com/identity/global/signin', waitFor='#fld-e');

		yield page.waitForSelector('#fld-e');
		yield page.type('#fld-e', user, { delay: 50 });
		yield page.type('#fld-p1', pass, { delay: 50 });

		yield page.waitForTimeout(1000);

		yield click(page, '.cia-form__controls__submit');

		yield page.waitForSelector('#gh-search-input');

		// remove everything from cart
		yield nav.go(page, 'https://www.bestbuy.com/cart');
		yield page.waitForTimeout(5 * sec);
		while(yield page.$$eval('.cart-item__remove', ls => ls.length)) {
			yield page.click('.cart-item__remove');
			yield page.waitForTimeout(3 * sec);
		}

		// yield setPickupStore(page, args);
	},
	*visit(page, url) {
		waitfor = traffic.match('bestbuy.com/api/tcfb/model.json');
		yield nav.go(page, url);
		yield waitfor;
	},
	*standby(page, args) {
		yield page.waitForSelector('.product-data-value');

		while(true) {
			const pageSKU = yield page.$eval(
				'.sku .product-data-value',
				el => el.textContent.trim(' \t\n'));

			log(`SKU: ${pageSKU}`);
			const added = yield actions.atc(page, {
				url: 'https://www.bestbuy.com/cart/api/v1/addToCart',
				params: {
					headers: {
						"User-Agent": args.userAgent,
						"Accept": "application/json",
						"Accept-Language": "en-US,en;q=0.5",
						"Content-Type": "application/json; charset=UTF-8"
					},
					referrer: args.url,
					body: JSON.stringify({ items: [{skuId: pageSKU }]}),
					method: 'POST',
				}
			}, res => {
				return res.status < 300;
			});

			if (added) break;

			const waitTime = utils.eta();
			log('Waiting: ' + waitTime.toFixed(2));
			yield page.waitForTimeout(waitTime * sec);
		}
	},
	*checkout(page, args) {
		const {
			url,
			account: {
				security,
			},
			logid,
		} = args;

		log(url);

		waitfor = traffic.match('bestbuy.com/streams/v1/consume');
		yield page.waitForSelector('.add-to-cart-button');
		yield click(page, '.add-to-cart-button');

		yield waitfor;
		waitfor = traffic.match('bestbuy.com/pricing/v1/price/item?salesChannel');
		yield nav.go(page, 'https://www.bestbuy.com/checkout/r/fast-track');
		yield waitfor;

		// May encounter two-step checkout
		watch('.button--continue');

		yield page.waitForSelector('.button__fast-track');

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

		log('Done!');

		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}