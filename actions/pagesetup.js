
const fs = require('fs');
const nav = require('./nav');

module.exports = (page, args) => {

	page.setDefaultNavigationTimeout(5 * 1000)

	page.setCacheEnabled(false);

	// don't load any images that eat up bandwidth and time
	page.setRequestInterception(true);
	page.on('request', res => {
		const url = res.url();
		const assets = ['.jpg', '.png', '.gif', '.jpeg', '.svg', '/i/'];
		if (assets.some(one => url.includes(one))) {
			res.abort();
			return;
		}
		else {
			res.continue();
		}
	});

	// Log any responses that look bad (ban status etc)
	const logFile = `logs/${args.record.spawnid}.log`;
	fs.writeFileSync(logFile, '', 'utf8');
	page.on('response', res => {
		const url = res.url();
		const status = res.status();

		if (status > 300) {
			fs.appendFileSync(logFile, `${status}\t${url}\n`, 'utf8');
		}

		if (!banned) {
			// check if not already in shutdown after being banned

			if ([401, 403, 405, 501, 504].includes(status)) {
				// save this proxy info to a blacklist

				// FIXME: this doesnt catch dynamic bans (i.e. during login etc)

				banned = true;
			}
		}
	});

}