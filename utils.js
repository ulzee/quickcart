
const fs = require('fs');
const Papa = require('papaparse');

Array.prototype.last=function(){
	if (!this.length) {
		return null;
	}
	return this[this.length - 1];
};

module.exports = {
	sec: 1000,
	mnt: 60 * 1000,
	taglog: (tag) => (msg) => console.log(`[${tag}] ${msg}`),
	payinfo(pid) {
		const raw = fs.readFileSync('assets/pay.tsv', 'utf8');
		const entries = Papa.parse(raw, { header: true }).data;

		const selected = entries.filter(obj => obj.id == pid);
		if (!selected.length) {
			throw new Error('Payment not found');
		}

		const [info] = selected;
		console.log(info);
		return info;
	},
	phone(nid) {
		const raw = fs.readFileSync('assets/phone.tsv', 'utf8');
		const entries = Papa.parse(raw, { header: true }).data;

		const selected = entries[nid];
		if (!selected) {
			throw new Error('Number not found');
		}

		console.log(selected);
		return selected;
	},
	blacklisted({ ip, proxy, add, store }, listfile='assets/blacklist.txt') {
		const raw = fs.readFileSync(listfile, 'utf8');
		const entries = raw.split('\n');

		if (add) {
			console.log('[BLACKLIST]', add);
			entries.push(`${store}\t${add}`);
			fs.writeFileSync(listfile, entries.join('\n'), 'utf8');
			return;
		}

		console.log('[BLACKLIST] Checking against:', entries.length);
		if (ip && entries.includes(`${store}\t${ip}`) || proxy && entries.includes(`${store}\t${proxy}`)) {
			return true;
		}
		return false;
	},
	account(store, aid, lookup='assets/accounts.tsv') {
		const raw = fs.readFileSync(lookup, 'utf8');
		const entries = Papa.parse(raw, { header: true })
			.data
			.filter(ent => ent.store == store);


		if (parseInt(aid) >= entries.length) {
			throw new Error('Account ID out of range');
		}

		return entries[parseInt(aid)];
	},
	proxy: {
		list(file, index=-1) {
			// zproxy.lum-superproxy.io:22225:lum-customer-hl_92ee4e2f-zone-zone2-ip-181.214.185.43:yy4ns5z5us5i
			const raw = fs.readFileSync(`./assets/${file}`, 'utf8');
			const lines = raw.split('\n');
			console.log(`[LUMI] Read ${lines.length} lines.`);

			if (index == -1) {
				index = parseInt(Math.random() * lines.length);
			}

			console.log(`[LUMI] Choosing ${index}`);

			const spec = lines[index];
			const [domain, port, name, pass] = spec.split(':');
			const url = `${domain}:${port}`

			console.log(`[LUMI] ${url}`);
			console.log(`[LUMI] ${name}`);
			console.log(`[LUMI] ${pass}`);

			return {
				url, name, pass,
				raw: spec,
			}
		},
	},
	jigName(name) {
		// TODO:
		const [first, last] = name.split(' ');
		return { first, last };
	},
	simplifyPhone(num) {
		['+', '(', ')', ' ', '-'].forEach(token => {
			while (num.includes(token)) {
				num = num.replace(token, '')
			}
		});
		if (num.length > 10) {
			num = num.slice(1);
		}
		return num;
	},
	eta(inSeconds=10, rapid=1, rapidDuration=5) {
		// interval in seconds

		const current = new Date();
		console.log(current);
		const sec = current.getTime() / 1000;
		const nextInterval = Math.ceil(sec / inSeconds) * inSeconds;
		let remainder = nextInterval - sec;

		const hr = 60 * 60
		const mini = 60
		const secUntilNextHour = Math.ceil(sec / hr) * hr - sec;
		const secUntilNextMinute = Math.ceil(sec / mini) * mini - sec;
		const secondsIntoMinute = sec - Math.floor(sec / mini) * mini;

		// if (secUntilNextHour > 60*50) {
		// 	// first 10 minutes of the hour, keep refreshing blindly
		// 	return rapid;
		// }

		if (secondsIntoMinute <= rapidDuration) {
			// first 5 seconds of the minute, keep refreshing blindly
			return rapid;
		}

		return remainder;
	},
	clearLaunchFile(store) {
		const fname = `logs/.${store}_launched`;
		if (fs.existsSync(fname)) {
			fs.unlinkSync(fname);
		}
	},
	createLaunchFile(store) {
		const fname = `logs/.${store}_launched`;
		fs.writeFileSync(fname, new Date(), 'utf8');
	},
	*sleepUntilLaunch(page, store, checkTimeout=50) {
		while (true) {
			try {
				const content = fs.readFileSync(`logs/.${store}_launched`, 'utf8');
				log(`Launched: ${store} (${content})`);
				break;
			}
			catch (e) {
				yield page.waitForTimeout(checkTimeout);
			}
		}
	}
}