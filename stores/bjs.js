
const sec = 1000;
const co = require('co');
const utils = require('../utils');
const { nav, any, click, traffic, watch } = require('../actions');
const { action } = require('@pm2/io');
const actions = require('../actions');

const domain = 'https://www.bjs.com';

const vendor = 'bestbuy';

module.exports = {
	vendor,
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		yield nav.bench(page, 'https://www.bjs.com/signIn', waitFor='.submitClass');



		yield page.waitForSelector('.submitClass');
		yield page.type('.form-control-email', user, { delay: 10 });
		yield page.type('.password', pass, { delay: 10 });
		yield page.waitForTimeout(sec);
		yield page.click('.checkbox-container input');
		yield page.waitForTimeout(sec);
		yield click(page, '.submitClass');

		yield page.waitForTimeout(5 * sec);
		yield page.waitForSelector('#searchTerm');


		yield nav.go(page, 'https://www.bjs.com/cart');
		try {
			yield page.waitForSelector('.continue-btn', { timeout: 5 * sec });
		}
		catch(e) {
			// remove everything from cart
			while(yield page.$$eval('.remove-link', ls => ls.length)) {
				yield page.click('.remove-link');
				yield page.waitForTimeout(3 * sec);
			}
		}
	},
	*visit(page, url) {
		yield nav.go(page, url);
	},
	*standby(page, args) {
		while(true) {
			yield page.waitForSelector('.add-to-cart-wrapper');

			const catEntryId = args.url.split('/').last();

			const itemList = [
				{
					catEntryId,
					partNumber: '',
					physicalStoreId: '0096',
					pickUpInStore: 'N',
					quantity: 1,
					serviceZipcode: '90024'
				}
			];

			log(`SKU: ${pageSKU}`);
			const added = yield actions.atc(page, {
				url: 'https://api.bjs.com/digital/live/api/v1.1/storeId/10201/shoppingCartItem',
				params: {
					headers: {
						"User-Agent": args.userAgent,
						"Accept": "application/json, text/plain, */*",
						"Accept-Language": "en-US,en;q=0.5",
						"Content-Type": "application/json; charset=UTF-8",
						"x-ibm-client-id": "7bf4a236-423b-4565-b221-3d51fbce1cbe",
						"DEFAULT_CLUB_ID": "0096"
					},
					referrer: args.url,
					body: JSON.stringify({
						URL: 'ViewMiniCart',
						activeChoice: '',
						catalogId: '',
						comment: '',
						errorView: '',
						isExpired: '',
						itemType: '',
						orderId: '.',
						purchaseFlow: '',
						itemList,
						itemsCheckInCartReq: [],
						qofferId: []
					}),
					method: 'POST',
				}
			}, res => {
				const { itemsAddResponse } = res.body;
				const [ result ] = itemsAddResponse;
				if (result.errors && result.errors.length) {
					return false
				}

				return true;
			});

			if (added) break;


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