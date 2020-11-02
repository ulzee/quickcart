
const fs = require('fs');
const Papa = require('papaparse');

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
	blacklisted({ ip, proxy, add }, listfile='assets/blacklist.txt') {
		const raw = fs.readFileSync(listfile, 'utf8');
		const entries = raw.split('\n');

		if (add) {
			console.log('[BLACKLIST]', add);
			entries.push(add);
			fs.writeFileSync(listfile, entries.join('\n'), 'utf8');
			return;
		}

		console.log('[BLACKLIST] Checking against:', entries.length);
		if (ip && entries.includes(ip) || proxy && entries.includes(proxy)) {
			return true;
		}
		return false;
	},
	account(store, aid) {
		const raw = fs.readFileSync('assets/accounts.tsv', 'utf8');
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
	// monthDigit()
}