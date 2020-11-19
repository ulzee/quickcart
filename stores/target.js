
const sec = 1000;
const utils = require('../utils');
const { nav, any, inp, sel, paste, atc, click, traffic } = require('../actions');

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

		function dismissPhone() {
			page.waitForSelector('#capturePhone', { timeout: 24 * 60 * 60 * sec, visible: true })
			.then(() => page.waitForTimeout(5*sec))
			.then(() => page.$eval('form[method="post"]', el => {
				console.log('here');
				console.log(el.nextSibling);
				el.nextSibling.click();
			}))
			.then(() => log('Dismissing Phone input...'))
			.catch();
		}
		dismissPhone();

		function dismissJoinCirlce() {
			page.waitForSelector('#circle-skip', { timeout: 24 * 60 * 60 * sec, visible: true })
			.then(() => page.click('#circle-skip'))
			.then(() => log('Skipping circle regist...'))
			.catch();
		}
		dismissJoinCirlce();

		yield page.waitForSelector('#account');
		yield click(page, '#account')
		yield page.waitForTimeout(5 * sec);
		yield click(page, '#accountNav-signIn');

		yield page.waitForSelector('#username');
		yield page.waitForTimeout(2 * sec);
		yield page.type('#username', user, { delay: 10 });
		yield page.type('#password', pass, { delay: 10 });

		yield page.waitForTimeout(sec);

		yield page.click('#login');
		yield page.waitForTimeout(10 * sec);

		yield nav.go(page, domain);
		yield page.waitForTimeout(5 * sec);

		// // set Pickup store
		// const [accountIndex, batchID] = args.account.genid.split('_');
		// const zipCode = batchID;

		// waitfor = traffic.match('v3/stores/nearby/');
		// yield click(page, '#storeId-utilityNavBtn');
		// yield waitfor;
		// yield page.waitForTimeout(sec);

		// yield page.type('#zipOrCityState', zipCode);
		// yield page.waitForTimeout(sec);
		// waitfor = traffic.match('v3/stores/nearby/');
		// yield click(page, 'button[data-test="storeLocationSearch-button"]');
		// yield waitfor;
		// yield page.waitForTimeout(sec);
		// yield page.evaluate(async ({ index }) => {
		// 	return new Promise((yes) => {
		// 		const block = document.querySelectorAll('div[class*="StoreIdSearchBlock__Spacing"]')[index+1];
		// 		const setButton = block.querySelector('button[data-test="storeId-listItem-setStore"]');
		// 		const confirmButton = block.querySelector('button[data-test="storeId-listItem-confirmStore"]');
		// 		if (setButton) {
		// 			setButton.click();
		// 		}
		// 		else if (confirmButton) {
		// 			confirmButton.click();
		// 		}
		// 		yes();
		// 	});
		// }, { index: parseInt(accountIndex) });
		// log('Store selected');
		// yield page.waitForTimeout(3*sec);

		// empty cart
		log('Emptying cart...');
		yield nav.go(page, 'https://www.target.com/co-cart');
		yield page.waitForSelector('#search');
		yield page.waitForTimeout(3 * sec);
		try {
			log('Waiting for empty cart...')
			yield page.waitForSelector('div[data-test="boxEmptyMsg"]', { timeout: 5 * sec });
		}
		catch (e) {
			log('Emptying cart...')
			while(true) {
				const remaining = yield page.$$eval('button[data-test="cartItem-deleteBtn"]', ls => {
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
		yield page.waitForTimeout(5 * sec);
	},
	*standby(page, args) {
		yield page.waitForSelector('div[data-test="product-price"]');

		while(true) {

			const apiKey = yield page.evaluate(() => {
				return window.__PRELOADED_STATE__.config.services.checkout.apiKey;
			});
			log('API Key: ' + apiKey);

			const TCIN = yield page.evaluate(() => {
				const tcinMapping = window.__PRELOADED_STATE__.selectedTcins;
				const statedTCIN = Object.keys(tcinMapping)[0];
				if (statedTCIN) {
					const selectedTCIN = tcinMapping[statedTCIN];
					return selectedTCIN;
				}
				else {
					// Fallback based on browser
					const parts = document.URL.split('-')
					return parts[parts.length - 1];
				}
			});
			log('TCIN: ' + TCIN);


			// NOTE: idk what channel_id does
			const added = yield atc(page, {
				url: `https://carts.target.com/web_checkouts/v1/cart_items?field_groups=CART%2CCART_ITEMS%2CSUMMARY&key=${apiKey}`,
				params: {
					headers: {
						"User-Agent": args.userAgent,
						"Accept": "application/json",
						"Accept-Language": "en-US,en;q=0.5",
						"Content-Type": "application/json",
						"cache-control": "no-cache",
						"pragma": "no-cache",
						"sec-fetch-dest": "empty",
						"sec-fetch-mode": "cors",
						"sec-fetch-site": "same-site",
						"x-application-name": "web",
					},
					referrer: args.url,
					body: JSON.stringify({
						cart_item: {
							item_channel_id: "10",
							quantity: 1,
							tcin: TCIN,
						},
						cart_type: "REGULAR",
						channel_id: "10",
						fulfillment: {
							fulfillment_test_mode: "grocery_opu_team_member_test"
						},
						shopping_context: "DIGITAL",
					}),
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
		let {
			url,
			account: {
				security,
				number,
			},
			logid,
		} = args;

		function dismissSurvey() {
			page.waitForSelector('#kplDeclineButton', { timeout: 24 * 60 * 60 * sec })
			.then(() => page.click('#kplDeclineButton'))
			.catch()
		}
		dismissSurvey();

		// waitfor = traffic.match('carts.target.com/web_checkouts/v1/cart_items');
		// yield page.$$eval('button[class*="styles__StyledButton"]', ls => {
		// 	const validButtons = ls.filter(el =>
		// 		el.attributes['data-test'].value != 'scheduledDeliveryButton');

		// 	// favor delivery option button
		// 	if (validButtons.length >= 2) {
		// 		validButtons[1].click();
		// 	}
		// 	else {
		// 		validButtons[0].click();
		// 	}
		// });

		// // wait for confirmation prompt then go to cart
		// yield waitfor;

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
			waitfor = traffic.match('target.com/checkout_payments/v1/credit_card_compare');
			yield page.click('button[data-test="verify-card-button"]');
			yield waitfor;
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
			waitfor = traffic.match('carts.target.com/web_checkouts/v1/cart_views');
			yield waitfor;
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