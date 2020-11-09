
const sec = 1000;
const co = require('co');
const utils = require('../utils');
const { nav, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.bestbuy.com';

const vendor = 'BBUY';

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

function* setPickupStore(page, args) {

	const [accountIndex, batchID] = args.account.genid.split('_');
	const zipCode = batchID;

	yield nav.go(page, 'https://www.bestbuy.com/site/store-locator/');

	// choose a random location to reset
	yield page.waitForSelector('.zip-code-input');
	try {
		yield page.waitForSelector('.MicrosoftMap');
	}
	catch(e) {
		throw new nav.errors.Slow();
	}
	log('Map ready');
	yield page.waitForTimeout(5 * sec);
	yield page.type('.zip-code-input', '61801', { delay: 10 });
	yield page.click('.location-zip-code-form-content button');
	yield page.waitForSelector('.shop-location-map');
	yield page.waitForTimeout(5 * sec);

	yield page.evaluate(() => {
		const buttons = document.querySelectorAll('.make-this-your-store');
		return buttons[1].click();
	});
	yield page.waitForTimeout(5 * sec); // wait for change to apply

	// choose near target zip code
	yield paste(page, '.zip-code-input', '');
	yield page.type('.zip-code-input', zipCode, { delay: 10 });
	yield page.click('.location-zip-code-form-content button');
	yield page.waitForTimeout(5 * sec);

	yield page.waitForSelector('.make-this-your-store');
	yield page.evaluate(({ index }) => {
		const myStore = document.querySelectorAll('.make-this-your-store')[index];
		return myStore.click();
	}, { index: parseInt(accountIndex) });
	yield page.waitForTimeout(5 * sec); // wait for change to apply
}

function* shipInstead(page) {
	try {
		yield page.evaluate('.ispu-card__switch', { timeout: 50 });

		let switchText = yield page.$eval('.ispu-card__switch', el => el.textContent);

		while (switchText.includes('Ship')) {

			yield page.click('.ispu-card__switch');
			yield waitForSpinner(page);

			switchText = yield page.$eval('.ispu-card__switch', el => el.textContent);
		}
	}
	catch (e) {
		log('Switch text not found...');
		return;
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

		yield setPickupStore(page, args);
	},
	*visit(page, url) {
		yield nav.go(page, url);
		yield page.waitForSelector('.priceView-customer-price');
	},
	*standby(page, args) {
		yield page.waitForSelector('.fulfillment-add-to-cart-button');

		let loaded = false;
		while(!loaded) {
			const buttonText = yield page.$eval(
				'.add-to-cart-button',
				el => el.textContent, { timeout: 10 * sec });

			if (buttonText.includes('Cart')) {
				loaded = true;
				break;
			}
			else {
				log('OOS: ' + buttonText);
			}

			// TODO: wait until next interval (every 30 sec? on the dot :05:30, :06:00, etc...)
			const waitTime = utils.eta();
			log('Waiting: ' + waitTime.toFixed(2));
			yield page.waitForTimeout(waitTime * sec);
			yield nav.bench(page, args.url, waitFor='.fulfillment-add-to-cart-button', retry=true);
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

		yield page.waitForSelector('.add-to-cart-button');
		yield page.waitForSelector('.fulfillment-fulfillment-summary strong');

		yield click(page, '.add-to-cart-button');

		yield page.waitForSelector('.go-to-cart-button');
		yield nav.go(page, 'https://www.bestbuy.com/checkout/r/fast-track');

		try {
			// If this page doesn't load, the IP is blacklsited
			yield page.waitForSelector('.button__fast-track');
		}
		catch(e) {
			throw nav.errors.Banned();
		}

		yield waitForSpinner(page);

		// yield shipInstead(page);

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