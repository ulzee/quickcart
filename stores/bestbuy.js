
const sec = 1000;
const co = require('co');
const utils = require('../utils');
const { nav, any, click, traffic, watch } = require('../actions');
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

		// wait for 5 mins to handle password reset
		yield page.waitForSelector('#gh-search-input', { timeout: 5 * 60 * sec});

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
		while(true) {
			yield page.waitForSelector('.product-data-value');

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

				// Add to cart was successful
				if (res.status < 300) return true;

				if (args.mode == 'watch') {
					// NOTE: this indicates the start of the queue
					//  Notifications should go out when this happens
					//  Disabled when running normally
					if (res.body.includes('CONSTRAINED_ITEM')) return true;
				}

				return false;
			});

			if (added) break;
			global.lastCheckTime = Date.now();


			let waitTime = utils.eta();
			if (args.wait) {
				waitTime = utils.eta(
					inSeconds=args.wait.inSeconds,
					rapid=args.wait.rapid,
					rapidWindow=args.wait.rapidWindow)
			}
			log('Waiting: ' + waitTime.toFixed(2));
			yield page.waitForTimeout(waitTime * sec);

			if (args.callback) yield args.callback();
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

		// at this stage, product was added to cart via API
		// waitfor = traffic.match('bestbuy.com/streams/v1/consume');
		// yield page.waitForSelector('.add-to-cart-button');
		// yield click(page, '.add-to-cart-button');

		function watchLoginPrompt() {
			page.waitForSelector('#fld-p1',  { timeout: 30 * 60 * sec })
			.then(() => page.type('#fld-p1', pass, { delay: 50 }))
			.then(() => page.waitForTimeout(100))
			.then(() => click(page, '.cia-form__controls__submit'))
			.catch(console.log);
		}

		yield waitfor;
		waitfor = traffic.match('bestbuy.com/pricing/v1/price/item?salesChannel');
		yield nav.go(page, 'https://www.bestbuy.com/checkout/r/fast-track');
		watchLoginPrompt();
		yield waitfor;

		// May encounter two-step checkout
		const appeared = yield any(page, ['.button--continue', '.button__fast-track']);

		// CVV input may be asked
		function* ccvFill() {
			const cardInput = yield page.evaluate(() =>
				document.querySelectorAll('#credit-card-cvv').length);
			log('Card input: ' + cardInput);
			if (cardInput) {
				yield page.waitForSelector('#credit-card-cvv');
				yield page.type('#credit-card-cvv', security);
			}
		}

		if (appeared == '.button--continue') {
			// Twostage checkout prompted
			yield page.click('.button--continue');
			yield page.waitForSelector('.button--place-order');
			yield ccvFill();

			if (args.debug == false || args.debug == undefined) {
				// submit order
				yield page.click('.button--place-order');
			}
		}
		else {
			// Fast track checkout
			yield page.waitForSelector('.button__fast-track');
			yield ccvFill();

			if (args.debug == false || args.debug == undefined) {
				// submit order
				yield click(page, '.button__fast-track')
			}
		}

		log('Done!');

		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}