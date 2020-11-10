
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');
const reclick = require('../actions/reclick');

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

		const cookies = yield page.cookies();
		log('Cookies: ' + cookies.length);
		for (ind in cookies) {
			yield page.deleteCookie(cookies[ind]);
		}

		yield page.waitForTimeout(3 * sec);
		yield nav.bench(page, domain, waitFor='.myaccount-header');
		yield page.waitForTimeout(3 * sec);

		yield click(page, '.myaccount-header');
		yield page.waitForTimeout(sec);
		yield click(page, '.login-buttons .login');
		yield page.waitForTimeout(sec);
		yield page.waitForSelector('#user-input');
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
		while (true) {
			try {
				const buttonText = yield page.$eval('button[data-selenium="addToCartButton"]', el => el.textContent);

				if (buttonText.includes('Cart')) {
					break;
				}
			}
			catch (e) {
				log('OOS: ');

				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);

				yield nav.bench(page, args.url, waitFor='div[data-selenium="pricingPrice"]', retry=true);
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

		yield reclick(page,
			'button[data-selenium="addToCartButton"]',
			'a[data-selenium="itemLayerViewCartBtn"]');

		yield page.click('a[class*=viewCart_]');

		yield page.waitForSelector('.itemTTLprice');
		yield page.waitForSelector('.btn-begin-checkout');
		yield page.waitForTimeout(sec);
		yield click(page, '.btn-begin-checkout');

		yield page.waitForSelector('button[data-selenium="continueFromShipping"]', { visible: true });
		yield page.waitForTimeout(sec);
		yield click(page,'button[data-selenium="continueFromShipping"]');

		// proceed checkout
		yield page.waitForSelector('button[data-selenium="reviewOrderButton"]', { visible: true });
		// get the pay iframe
		const frame = page.frames().find(frame => frame.url().includes('payment.bh'));
		log(frame.url());
		yield frame.waitForSelector('.cc-input');
		yield paste(frame, '.cc-input', number);
		yield frame.select('select[name="ccExpMonth"]', month);
		yield frame.select('select[name="ccExpYear"]', year);
		yield paste(frame, 'input[name="ccCIDval"]', security);
		yield page.waitForTimeout(sec);
		yield click(page, 'button[data-selenium="reviewOrderButton"]');

		yield page.waitForSelector('.place-order');
		if (args.debug == undefined || args.debug == false) {
			while(yield page.$$eval('.place-order', ls => ls.length)) {
				try {
					yield page.click('.place-order');
					yield page.waitForTimeout(500);
				}
				catch(e) {
					console.log(e);
				}
			}
			log('Ordered!');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}