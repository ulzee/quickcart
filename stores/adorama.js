
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, click } = require('../actions');
const actions = require('../actions');

const domain = 'https://www.adorama.com';

const vendor = 'ADORAMA';

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		// give up on this IP if pages too slow
		yield nav.bench(page, 'https://www.adorama.com/Als.Mvc/nspc/MyAccount', waitFor='#login-email');
		yield page.waitForTimeout(5 * sec);


		// yield nav.go(page, 'https://www.adorama.com/Als.Mvc/nspc/MyAccount');
		// yield page.waitForTimeout(5 * sec);
		yield page.type('#login-email', user, { delay: 10 });
		yield page.type('#login-pwd', pass, { delay: 10 });
		yield page.waitForTimeout(sec);

		yield page.click('.login-form button');
		yield page.waitForTimeout(5 * sec);
		page.waitForSelector('#searchinfo');

		//empty cart
		yield nav.go(page, 'https://www.adorama.com/als.mvc/cartview');
		yield page.waitForTimeout(5 * sec);

		if (yield page.$$eval('.cart-remove-me', ls => ls.length)) {
			yield page.$eval('.cart-remove-me', el => el.click());
			yield page.waitForTimeout(2 * sec);
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='.primary-info');
	},
	*standby(page, args) {

		while (true) {
			yield page.waitForSelector('.your-price');

			const SKU = yield page.$eval('.product-sku span', el => el.innerHTML);

			log(`SKU: ${SKU}`);
			const added = yield actions.atc(page, {
				url: 'https://www.adorama.com/api/user/order/addToCart',
				params: {
					headers: {
						"User-Agent": args.userAgent,
						"Accept": "application/json, text/javascript, */*; q=0.01",
						"Accept-Language": "en-US,en;q=0.5",
						"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
						"X-Requested-With": "XMLHttpRequest"
					},
					referrer: args.url,
					body: JSON.stringify({
						clientTimeStamp: Date.now(),
						cartItems: { [SKU]: { qty: '1' } },
						type: 'miniCart',
						isEmailPrice: false,
						pageType: 'productPage'
					}),
					method: 'POST',
				}
			}, res => {

				console.log(res);
				const obj = JSON.parse(res.body);

				if (obj.status == 'error') {
					if (obj.messages && obj.messages[0]) {
						log(obj.messages[0].text);
					}
					return false;
				}
				else {
					log(obj.status);
					return true;
				}
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
	*manual(page, args) {
		// wait for confirmation prompt then go to cart
		yield nav.go(page, 'https://www.adorama.com/als.mvc/nspc/revised');
		yield page.waitForSelector('label[for="payby-cc"]');
	},
	*checkout(page, args) {
		let {
			url,
			account: {
				security,
				number, month, year
			},
			logid,
		} = args;

		log(url);

		yield click(page, '.add-to-cart');

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('.popupHeader');
		yield nav.go(page, 'https://www.adorama.com/als.mvc/nspc/revised');
		yield page.waitForSelector('label[for="payby-cc"]');

		// proceed checkout
		yield click(page, 'label[for="payby-cc"]');

		yield page.type('#card-number', number, { delay: 1 });
		yield page.select('.aweform-input.sib1 select', month);
		yield page.select('.aweform-input.sib2 select', year);
		yield page.type('#card-cvc', security, { delay: 1 });
		yield click(page, '#billAsShipPlaceholder');

		if (args.debug == undefined || args.debug == false) {
			yield click(page, 'a[data-action="placeOrder"]');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}