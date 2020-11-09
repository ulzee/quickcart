
const { sec } = require('../utils');
const utils = require('../utils');
const { nav, any, inp, sel, paste, click } = require('../actions');

const domain = 'https://www.newegg.com';

const vendor = 'NEWEGG';

module.exports = {
	home: domain,
	*prime(page, args) {
		const {
			account: { user, pass },
		} = args;

		if (args.nologin) return;

		// give up on this IP if pages too slow
		yield nav.bench(page, domain, waitFor='#SearchBox2020');
		yield page.waitForTimeout(5 * sec);
		yield page.$$eval('.nav-complex a.nav-complex-inner', ls => ls[0].click());
		yield page.waitForTimeout(5 * sec);

		yield page.waitForSelector('#labeled-input-signEmail');
		yield page.waitForTimeout(sec);
		yield page.type('#labeled-input-signEmail', user);
		yield page.waitForTimeout(sec);
		yield page.click('#signInSubmit');
		yield page.waitForTimeout(30 * sec);

		yield page.waitForSelector('.header2020-search-box');
		yield page.waitForTimeout(5 * sec);

		//empty cart
		yield nav.go(page, 'https://secure.newegg.com/shop/cart');
		yield page.waitForTimeout(5 * sec);

		try {
			yield click(page, 'button[data-target="#Popup_Remove_All"]');
			yield click(page, '.modal-content .btn-primary');
			yield page.waitForTimeout(5 * sec);
		}
		catch(e) {
			log('Nothing to remove..');
		}
	},
	*visit(page, url) {
		yield nav.go(page, url);
		yield page.waitForSelector('.shipped-by-newegg');
	},
	*standby(page, args) {
		yield page.waitForSelector('.shipped-by-newegg');

		while (true) {

			try {
				yield page.waitForSelector('#ProductBuy .btn-primary', { timeout: 10 });
				break;
			}
			catch (e) {
				let oosText = yield page.$eval('#ProductBuy .btn-secondary', el => el ? el.textContent : null);

				log('OOS: ' + oosText);

				const waitTime = utils.eta();
				log('Waiting: ' + waitTime.toFixed(2));
				yield page.waitForTimeout(waitTime * sec);

				yield nav.bench(page, args.url, waitFor='.shipped-by-newegg', retry=true);
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

		yield click(page, '#ProductBuy .btn-primary');

		// wait for confirmation prompt then go to cart
		yield page.waitForSelector('.modal-content'); // TODO: wait for checkout to be enabled
		yield nav.go(page, 'https://secure.newegg.com/shop/cart?Submit=view');
		yield click(page, '.summary-actions .btn-primary');

		// newegg asks for number retype sometimes
		page.waitForSelector('.mask-cardnumber', { timeout: 5 * 60 * sec })
		.then(() => {
			return page.type('.mask-cardnumber', number);
		})
		.then(() => {
			return click(page, '.modal-content .btn-primary');
		})
		.catch(console.log);


		// In checkout window
		// NOTE: shipping methods may need to be reselected
		// yield click(page, '.checkout-step-action-done');
		// yield click(page, '.checkout-step-action-done');
		yield page.waitForSelector('input[placeholder="CVV2"]');
		yield page.type('input[placeholder="CVV2"]', security, { delay: 10 });

		if (args.debug == undefined || args.debug == false) {
			while (true) {
				const bgColor = yield page.$eval('#btnCreditCard', el => {
					const button = document.querySelector('#btnCreditCard');
					return getComputedStyle(button).backgroundColor;
				});

				if (bgColor == 'rgb(255, 163, 58)') {
					break;
				}
				else {
					yield page.waitForSelector(50);
				}
			}

			yield click(page, '#btnCreditCard');
		}

		// checkout success
		log('Done!');
		yield page.waitForTimeout(10 * sec);
		yield page.screenshot({path: `logs/ok_${logid}.png`});
		yield page.waitForTimeout(10 * sec);
	},
}