

module.exports = {
	setup(page, args) {
		global.resolveList = {};

		page.on('response', res => {
			for (key in global.resolveList) {
				const item = global.resolveList[key];
				if (item.active) {
					if (res.url().includes(item.match)) {
						item.active = false;
						item.yes(res);
						global.log('Traffic: ' + item.match);
						global.log('       : ' + res.url());
					}
				}
			}
		});
	},
	match(partUrl) {
		return new Promise((yes, no) => {
			global.resolveList[partUrl] = {
				match: partUrl,
				active: true,
				yes,
			};
		});
	}
}