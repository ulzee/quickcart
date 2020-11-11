
const sec = 1000;
const co = require('co');
const utils = require('../utils');
const { nav, inp, sel, paste, click, traffic } = require('../actions');

const domain = 'https://www.bestbuy.com';

const vendor = 'bestbuy';

function* setPickupStore(page, args) {

	const [accountIndex, batchID] = args.account.genid.split('_');
	const zipCode = batchID;

	waitfor = traffic.match('www.bing.com/maps/geotfe/comp/stl');
	yield nav.go(page, 'https://www.bestbuy.com/site/store-locator/');
	yield waitfor;
	log('Map ready');

	// choose near target zip code
	waitfor = traffic.match('www.bestbuy.com/location/v1/US/zipcode');
	yield page.type('.zip-code-input', zipCode, { delay: 10 });
	yield page.click('.location-zip-code-form-content button');
	yield waitfor;

	yield page.waitForSelector('.make-this-your-store');
	yield page.waitForTimeout(3*sec);
	waitfor = traffic.match('www.bestbuy.com/api/tcfb/model.json');
	const storeSet = yield page.evaluate(async ({ index }) => {
		const myStore = document.querySelectorAll('.store')[index];

		if (!myStore.classList.contains('store-selected')) {
			const button = myStore.querySelector('.make-this-your-store');
			button.click();
			return true;
		}
		else {
			return false;
		}
	}, { index: parseInt(accountIndex) });
	log('Store was set: ' + storeSet);
	if (storeSet) {
		yield waitfor;
	}
	yield page.waitForTimeout(sec); // wait for change to apply
}

function* shipInstead(page) {
	try {
		while (true) {
			const switchText = yield page.$eval('.ispu-card__switch', el => el.textContent);

			if (switchText.includes('Shipping')) {
				log(switchText);
				waitfor = traffic.match('bestbuy.com/pricing/v1/price/item?salesChannel');
				yield page.click('.ispu-card__switch');
				yield waitfor;
			}
			else {
				// all set, shipping selected
				break;
			}
		}
	}
	catch(e) {
		console.log('Switching:', e);
		// just move on
	}
}

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

		yield setPickupStore(page, args);
	},
	*visit(page, url) {
		waitfor = traffic.match('bestbuy.com/api/tcfb/model.json');
		yield nav.go(page, url);
		yield waitfor;
	},
	*standby(page, args) {
		yield page.waitForSelector('.fulfillment-add-to-cart-button');

		let loaded = false;
		while(!loaded) {
			const buttonText = yield page.$eval(
				'.add-to-cart-button',
				el => el.textContent, { timeout: sec });

			if (buttonText.includes('Cart')) {
				loaded = true;
				break;
			}
			else {
				log('OOS: ' + buttonText);
			}

			const waitTime = utils.eta();
			log('Waiting: ' + waitTime.toFixed(2));
			yield page.waitForTimeout(waitTime * sec);

			// will throw and start over if page is reloading way too slow
			waitfor = traffic.match('bestbuy.com/api/tcfb/model.json');
			yield nav.bench(page, args.url, waitFor='.fulfillment-add-to-cart-button');
			yield waitfor;
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

		try {
			// If this page doesn't load, the IP is blacklsited
			yield page.waitForSelector('.button__fast-track');
		}
		catch(e) {
			throw nav.errors.Banned();
		}

		yield waitfor;
		// yield shipInstead(page); // NOTE: this takes way too much time

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