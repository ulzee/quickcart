
const fs = require('fs');
const nav = require('./nav');

function getPath(url) {
	const content = url.split('//')[1];

	if (content && content.includes('/')) {
		const path = content.split('/').slice(1).join('/');
		if (path) {
			return path;
		}
	}

	return null;
}

module.exports = (page, args, blockAssets=['.jpg', '.png', '.gif', '.jpeg', '.svg', '/i/', 'image', 'webp']) => {

	page.setDefaultNavigationTimeout(5 * 1000)

	page.setCacheEnabled(true);

	// don't load any images that eat up bandwidth and time
	page.setRequestInterception(true);
	page.on('request', res => {
		if (res._interceptionHandled) {
			return;
		}

		const url = res.url();
		const path = getPath(url);
		if (path && blockAssets.some(one => path.includes(one))) {
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

		if (status >= 400) {
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