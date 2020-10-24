
const utils = require('./utils');
const Papa = require('papaparse');
const fs = require('fs');
const  { v4: uuid } = require('uuid');

const names = ['Ulzee An', 'Ulze An', 'Ulz An'];
const mail = 'limecart.me';
const desiredPerStore = 7; // further limited by payment method etc
const stores = ['TARGET', 'GSTOP', 'SEARS', 'KOHLS', 'WALMART', 'BESTBUY'];

let raw = fs.readFileSync('./assets/phones.tsv', 'utf8');
const phones = Papa.parse(raw, { header: true }).data;

raw = fs.readFileSync('./assets/cards.tsv', 'utf8');
const cards = Papa.parse(raw, { header: true }).data;

console.log('Phones:', phones.length);
console.log('Cards:', cards.length);
console.log('Desired:', desiredPerStore);
console.log('Stores:', stores);

let alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
let accounts = [];
const numCreate = Math.min(cards.length, phones.length);
stores.forEach(store => {
	names.forEach(name => {
		for (let ii = 0; ii < numCreate; ii ++) {

			const phrase = uuid().split('-')[0];
			const user = `${alph[ii]}.${phrase}@${mail}`;
			const pass = alph[ii] + '!' + uuid().split('-').slice(0, 2).join('');

			const base = {
				store,
				user,
				pass,
			};

			const withPhone = Object.assign(base, phones[ii]);
			withPhone.phone = utils.simplifyPhone(withPhone.phone);

			const withCard = Object.assign(withPhone, cards[ii]);

			const userInfo = withCard;

			userInfo.name = name; // set jigged name

			accounts.push(userInfo);
		}
	});
});

const rawSave = Papa.unparse(accounts, { delimiter: '\t' });

fs.writeFileSync('./assets/new-accounts.tsv', rawSave, 'utf8');