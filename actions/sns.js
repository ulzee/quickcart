
const { RestClient } = require('@signalwire/node')

module.exports = {
	init() {
		const client = new RestClient(
			'1c61f2b8-3848-4c98-9695-6159fe786744',
			'PT6e2667efdf87a90c5ae1de62401fa8203b7ecc381d831621',
			{ signalwireSpaceUrl: 'kiwi.signalwire.com' });
		return client;
	},
	*send(client, body) {
		return yield client.messages.create({
			from:'+12045408815',
			body,
			to:'+12173728973'
		});
	},
}