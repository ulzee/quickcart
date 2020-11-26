
const Discord = require('discord.js');

module.exports = {
	*init(args) {
		const client = new Discord.Client();

		const inst ={
			client,
			*send(msg) {
				const channel = client.channels.cache.get('711752403686522904');
				return yield channel.send(msg);
			},
		};

		client.on('message', msg => {
			if (msg.content == 'L') {
				let reply = 'initial state';
				if (global.lastCheckTime) {
					const secAgo = (Date.now() - global.lastCheckTime) / 1000;
					reply = `[${args.store} - ${args.item}]: ${secAgo.toFixed(1)}s ago`;
				}
				const channel = client.channels.cache.get('711752403686522904');
				channel.send(reply)
				.then(() => console.log(reply))
				.then(console.log);
			}
		});

		return new Promise((yes) => {
			client.on('ready', () => {
				yes(inst);
			});

			client.login('Nzc5ODA0ODIzMzM1NjAwMTU4.X7l31Q.D5y-2a2_83e0wIN_l5r1_2Rm9Uw');
		});
	},
	*close(instance) {
		return yield instance.client.destroy();
	},
	// *send(client, msg) {
	// 	const channel = client.channels.cache.get('711752403686522904');
	// 	return yield channel.send(msg);
	// }
}
