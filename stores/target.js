
const sec = 1000;
const utils = require('../utils');
const { nav, any, inp, sel, paste, click, traffic } = require('../actions');

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
		yield nav.bench(page, args.url, waitFor='div[data-test="product-price"]');
		yield page.waitForTimeout(sec);

		yield page.waitForSelector('#account');
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

		waitfor = traffic.match('v3/stores/nearby/');
		yield click(page, '#storeId-utilityNavBtn');
		yield waitfor;
		yield page.waitForTimeout(sec);

		yield page.type('#zipOrCityState', zipCode);
		yield page.waitForTimeout(sec);
		waitfor = traffic.match('v3/stores/nearby/');
		yield click(page, 'button[data-test="storeLocationSearch-button"]');
		yield waitfor;
		yield page.waitForTimeout(sec);
		yield page.evaluate(async ({ index }) => {
			return new Promise((yes) => {
				const block = document.querySelectorAll('div[class*="StoreIdSearchBlock__Spacing"]')[index+1];
				const setButton = block.querySelector('button[data-test="storeId-listItem-setStore"]');
				const confirmButton = block.querySelector('button[data-test="storeId-listItem-confirmStore"]');
				if (setButton) {
					setButton.click(() => {
						yes();
					});
				}
				else if (confirmButton) {
					confirmButton.click(() => {
						yes();
					});
				}
				else {
					yes();
				}
			});
		}, { index: parseInt(accountIndex) });
		yield page.waitForTimeout(3*sec);

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
		waitfor = traffic.match('redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1');
		yield nav.bench(page, url, waitFor='div[data-test="product-price"]');
		yield waitfor;
	},
	*standby(page, args) {
		let loaded = false;
		while(true) {
			try {
				yield page.waitForSelector('button[class*="styles__StyledButton"]', { timeout: 500 });
				break;
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

				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);

				waitfor = traffic.match('redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1');
				yield nav.bench(page, args.url, waitFor='div[data-test="product-price"]', retry=true);
				yield waitfor;
			}
		}
	},
	*checkout(page, args) {
		let {
			url,
			account: {
				security,
				number,
			},
			logid,
		} = args;

		log(url);

		//
		// Choose the first available purchase option

		waitfor = traffic.match('carts.target.com/web_checkouts/v1/cart_items');
		yield page.$$eval('button[class*="styles__StyledButton"]', ls => {
			const validButtons = ls.filter(el =>
				el.attributes['data-test'].value != 'scheduledDeliveryButton');

			// favor delivery option button
			if (validButtons.length >= 2) {
				validButtons[1].click();
			}
			else {
				validButtons[0].click();
			}
		});

		// wait for confirmation prompt then go to cart
		yield waitfor;

		// go straight to checkout
		waitfor = traffic.match('carts.target.com/web_checkouts/v1/pre_checkout');
		yield nav.go(page, 'https://www.target.com/co-review?precheckout=true');

		// proceed checkout
		yield page.waitForSelector('button[data-test="placeOrderButton"]');
		yield waitfor;

		if (yield page.$$eval('#creditCardInput-cardNumber', ls => ls.length)) {
			log('Card Number Check');
			yield page.waitForSelector('#creditCardInput-cardNumber', { timeout: 100 });
			yield page.type('#creditCardInput-cardNumber', number, { delay: 10 });
			yield page.click('button[data-test="verify-card-button"]');
			yield page.waitForTimeout(sec); // TODO: wait for traffic
		}

		// CVV may be optional
		if (yield page.$$eval('#creditCardInput-cvv', ls => ls.length)) {
			log('CVV Check');
			yield page.waitForSelector('#creditCardInput-cvv');
			yield page.type('#creditCardInput-cvv', security, { delay: 10 });
		}

		if (yield page.$$eval('button[data-test="save-and-continue-button"]', ls => ls.length)) {
			log('Save and continue');
			yield page.waitForSelector('button[data-test="save-and-continue-button"]');

			waitfor = traffic.match('carts.target.com/web_checkouts/v1/cart_views');
			yield page.click('button[data-test="save-and-continue-button"]');
			yield waitfor;

			// wait for a second call which refreshes the page
			yield traffic.match('carts.target.com/web_checkouts/v1/cart_views');
		}

		if (args.debug == undefined || args.debug == false) {
			log('Checking out');
			while (yield page.$$eval('button[data-test="placeOrderButton"]', ls => ls.length)) {
				yield click(page, 'button[data-test="placeOrderButton"]');
				yield page.waitForTimeout(sec);
			}
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}