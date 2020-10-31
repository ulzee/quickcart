
const sec = 1000;
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.target.com';

const log = utils.taglog(vendor);
global.log = log;

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		yield click(page, '#account')
		yield click(page, '#accountNav-signIn');

		yield page.waitForSelector('#username');
		yield page.type('#username', user, { delay: 10 });
		yield page.type('#password', pass, { delay: 10 });

		yield page.waitForSelector(3 * sec);

		yield page.click('#login');

		yield page.waitForSelector(5 * sec);
		yield page.waitForSelector('.storyblockRiftRow');
	},
	*visit(page, url) {
		yield nav.go(page, url);
		yield page.waitForSelector('div[data-test="product-price"]');
	},
	*standby(page, url) {
		// TODO:
		// measure reload speed
		// sync reload with a fixed interval
		// detect add to cart is available
	},
	*checkout(page, args) {
		let {
			url,
			account: {
				security,
			},
			record: { logid },
		} = args;

		log(url);

		const buttonSel = yield any(page, [
			'button[data-test="orderPickupButton"]',
			'button[data-test="shipToStoreButton"]'])
		log('Button: ' + buttonSel);
		yield page.click(buttonSel);

		yield page.waitForSelector('button[aria-label="close"]');
		yield click(page, '#cart');

		yield click(page, 'button[data-test="checkout-button"]');

		yield page.waitForSelector('#creditCardInput-cvv');
		yield page.waitForSelector('button[data-test="placeOrderButton"]');
		if (args.debug) {
			security == '000';
		}
		yield page.type('#creditCardInput-cvv', security, { delay: 10 });

		// checkout
		yield click(page, 'button[data-test="placeOrderButton"]');

		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}