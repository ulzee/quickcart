
const utils = require('../utils');
const Papa = require('papaparse');
const fs = require('fs');
const  { v4: uuid } = require('uuid');
const { cachedDataVersionTag } = require('v8');

const names = ['Ulzee An'];
const mail = 'limecart.me';
const stores = [
	'target',
	// 'gamestop',
	// 'sears',
	// 'kohls',
	// 'walmart',
	// 'bestbuy'
];

// same address for everyone
// accounts per store = min(# phone numbers, # names x # payments)

let raw = fs.readFileSync('./assets/phones.tsv', 'utf8');
const phones = Papa.parse(raw, { header: true }).data;

raw = fs.readFileSync('./assets/cards.tsv', 'utf8');
const cards = Papa.parse(raw, { header: true }).data;

const maxCreate = 7;
const numCreate = Math.min(
	maxCreate,
	Math.min(cards.length, phones.length));

console.log('Phones:', phones.length);
console.log('Cards:', cards.length);
console.log('Stores:', stores);
console.log('Creating per store:', numCreate);

let alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
let accounts = [];
stores.forEach(store => {
	let create_index = 0;
	names.forEach(name => {
		cards.forEach(card => {

			if (create_index >= numCreate) {
				return;
			}

			const tag = alph[create_index];

			const phrase = uuid().split('-')[0];
			const user = `${tag}.${phrase}@${mail}`;
			const pass = tag + '!' + uuid().split('-').slice(0, 2).join('');

			const base = {
				store,
				user,
				pass,
			};

			const withPhone = Object.assign(base, phones[create_index]);
			withPhone.phone = utils.simplifyPhone(withPhone.phone);

			const withCard = Object.assign(withPhone, card);

			const userInfo = withCard;

			userInfo.name = name; // set jigged name

			accounts.push(userInfo);

			create_index ++;
		});
	});
});

const rawSave = Papa.unparse(accounts, { delimiter: '\t' });

fs.writeFileSync('./assets/new-accounts.tsv', rawSave, 'utf8');