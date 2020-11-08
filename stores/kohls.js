
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.kohls.com';

const vendor = 'KOHLS';
const log = utils.taglog(vendor);
global.log = log;

// FIXME: ATC stuck
// FIXME: checkout in cart stuck

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		// give up on this IP if pages too slow
		yield nav.bench(page, 'https://www.kohls.com/myaccount/kohls_login.jsp', waitFor='#kiosk_loginEmail');
		yield page.waitForTimeout(5 * sec);

		yield page.waitForSelector('#kiosk_loginEmail');
		yield page.type('#kiosk_loginEmail', user, { delay: 10 });
		yield page.type('#kiosk_loginPassword', pass, { delay: 10 });
		yield page.waitForTimeout(sec);

		yield page.click('#Profilelogin');
		yield page.waitForTimeout(5 * sec);

		yield page.waitForSelector('.glidebfShopRail');

		//empty cart
		yield nav.go(page, 'https://www.kohls.com/checkout/shopping_cart.jsp');
		yield page.waitForTimeout(5 * sec);

		if (yield page.$$eval('.bag_remove_item', ls => ls.length)) {
			yield page.$eval('.bag_remove_item', el => el.click());
			yield page.waitForTimeout(5 * sec);
		}
	},
	*visit(page, url) {
		yield nav.bench(page, url, waitFor='.product-title');
	},
	*standby(page, args) {
		yield page.waitForSelector('.product-title');

		while (true) {

			try {
				yield page.waitForSelector('#addtobagID');
				break;
			}
			catch (e) {
				let oosText = yield page.$eval('.OOSprodNotAvail', el => el ? el.textContent : null);

				log('OOS: ' + oosText);

				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);

				yield nav.bench(page, args.url, waitFor='.product-title', retry=true);
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

		yield click(page, '#addtobagID');

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('.kas-newpb-viewbag-link_ghr'); // TODO: wait for checkout to be enabled
		yield nav.go(page, 'https://www.kohls.com/checkout/v2/checkout.jsp');

		yield click(page, '.button_continueToPayment');

		yield page.waitForSelector('.keyPlaceOrder');
		yield page.type('#payment_information_ccv', security);
		yield click(page, '.keyPlaceOrder');

		if (args.debug == undefined || args.debug == false) {
			yield click(page, '.button_tr_placeorder');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}