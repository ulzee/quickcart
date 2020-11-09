
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.bhphotovideo.com';

const vendor = 'BNH';

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		// give up on this IP if pages too slow
		yield nav.bench(page, domain, waitFor='.myaccount-header');
		yield page.waitForTimeout(5 * sec);

		yield click(page, '.myaccount-header');
		yield page.waitForTimeout(sec);
		yield click(page, '.login');
		yield page.waitForTimeout(5 * sec);
		yield page.type('#user-input', user, { delay: 10 });
		yield page.type('#password-input', pass, { delay: 10 });
		yield page.waitForTimeout(sec);

		yield page.click('.lf-primaryBtn');
		yield page.waitForTimeout(5 * sec);

		//empty cart
		yield nav.go(page, 'https://www.bhphotovideo.com/find/cart.jsp');
		yield page.waitForTimeout(5 * sec);

		if (yield page.$$eval('.remove-item', ls => ls.length)) {
			yield page.$eval('.remove-item', el => el.click());
			yield page.waitForTimeout(5 * sec);
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='div[data-selenium="pricingPrice"]');
	},
	*standby(page, args) {
		yield page.waitForSelector('button[data-selenium="addToCartButton"]');

		while (true) {
			const buttonText = yield page.$eval('button[data-selenium="addToCartButton"]', el => el.textContent);

			if (buttonText.includes('Cart')) {
				break;
			}
			else {
				log('OOS: ' + buttonText);

				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);

				yield nav.bench(page, args.url, waitFor='button[data-selenium="addToCartButton"]', retry=true);
			}
		}
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

		yield click(page, 'button[data-selenium="addToCartButton"]');

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('a[class*=viewCart_]'); // TODO: wait for checkout to be enabled
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