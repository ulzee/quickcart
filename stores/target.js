
const sec = 1000;
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.target.com';

const vendor = 'TARGET';

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

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

		yield page.waitForTimeout(sec);

		yield page.click('#login');
		yield page.waitForTimeout(5 * sec);

		yield nav.go(page, domain);
		yield page.waitForTimeout(5 * sec);

		// set Pickup store
		const [accountIndex, batchID] = args.account.genid.split('_');
		const zipCode = batchID;
		const index = 1;
		yield click(page, '#storeId-utilityNavBtn');
		yield page.waitForTimeout(sec);
		yield page.type('#zipOrCityState', zipCode);
		yield page.waitForTimeout(sec);
		yield click(page, 'button[data-test="storeLocationSearch-button"]');
		yield page.waitForTimeout(sec);
		yield page.evaluate(({ index }) => {
			const buttons = document.querySelectorAll('button[data-test="storeId-listItem-setStore"]');
			return buttons[index].click();
		}, { index: parseInt(accountIndex) });

		yield page.waitForTimeout(5 * sec);



		// empty cart
		yield nav.go(page, 'https://www.target.com/co-cart');
		yield page.waitForSelector('#search');
		yield page.waitForTimeout(3 * sec);
		try {
			yield page.waitForSelector('div[data-test="boxEmptyMsg"]');
		}
		catch (e) {
			while(true) {
				const remaining = yield $$eval('button[data-test="cartItem-deleteBtn"]', ls => {
					if (!ls.length) return 0;

					ls[0].click();

					return ls.length;
				});

				yield page.waitForTimeout(3 * sec);

				if (!remaining) {
					break;
				}
			}
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='div[data-test="product-price"]');
	},
	*standby(page, args) {
		yield page.waitForSelector('div[data-test="product-price"]');

		let loaded = false;
		while(!loaded) {
			// yield page.waitForSelector('div[data-test="storeFulfillmentAggregator"]');
			try {
				// there is a 10second wait to check if pickup becomes avail
				yield page.waitForSelector('button[class*="styles__StyledButton"]', { timeout: 10 * sec });
				loaded = true;
			}
			catch(e) {
				const outOfStockText = yield page.evaluate(() => {
					const cantBuy = document.querySelector('div[data-test="storeBlockNonBuyableMessages"]');
					if (cantBuy) {
						return cantBuy.textContent;
					}
					return null;
				});
				if (outOfStockText) {
					log('OOS: ' + outOfStockText);
				}

				// TODO: wait until next interval (every 30 sec? on the dot :05:30, :06:00, etc...)
				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);
				yield nav.bench(page, args.url, waitFor='div[data-test="product-price"]', retry=true);
			}
		}

		if (args.nologin) {
			throw new Error('No Login Test');
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


		// click the first available atc button
		// try {
		// 	yield page.waitForSelector('button[class*="styles__StyledButton"]');
		// }
		// catch(e) {
		// 	if (oos) {
		// 		throw new Error('OUT OF STOCK!');
		// 	}
		// 	throw new Error('Pickup not available!');
		// }

		// Choose the first available purchase option
		yield page.$$eval('button[class*="styles__StyledButton"]', ls => {
			const validButtons = ls.filter(el =>
				el.attributes['data-test'].value != 'scheduledDeliveryButton');

			if (validButtons.length) {
				validButtons[0].click();
			}
		});

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
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}