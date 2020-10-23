
module.exports = function* myip(page) {
	yield page.goto('https://whatismyipaddress.com/');
	yield page.waitForSelector('#ipv4');
	const ipv4 = yield page.evaluate(() => {
		const el = document.querySelector('#ipv4 > a');
		if (el)
			return el.text;
		else
			return 'ipv6';
	})
	return ipv4;
}