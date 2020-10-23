
const config = require('../config');
const { v4: uuid } = require('uuid');
const co = require('co');
const bodyParser = require('body-parser')
const express = require('express');
const axios = require('axios').default;

function readableTimeSince(start, now) {
	const seconds = parseInt((now - start)/1000);
	if (seconds < 60) {
		return `${seconds}s`;
	}
	else {
		const minutes = parseInt(seconds / 60);
		if (minutes < 60) {
			return `${minutes}m`;
		}
		else {
			const hours = parseInt(minutes / 60);
			return `${hours}h`;
		}
	}
}

const creation = new Date();
const spawnid = uuid().split('-')[0];

const record = {
	spawnid,
	creation,
};

function* ping(status) {
	record.status = status;
	record.send = new Date();
	record.uptime = readableTimeSince(record.creation, new Date());
	const pack = Object.assign({}, record);
	yield axios.post(`http://${config.visor}/status`, pack);
}

let app = null;

const commands = [];

module.exports = {
	record,
	instance() {
		app = express();
		app.use(bodyParser.urlencoded({ extended: false }));
		app.use(bodyParser.json());

		app.post('/cmd', function (req, res) {
			// queues an command for a given time
			const { time, url } = req.body;
			commands.push(req.body);
		});

		// launch server in bg
		setImmediate(() => app.listen(7000));

		// launch pinging
		var status = 'launched';
		setInterval(() => {
			co(ping, status).then(() => {

			})
			.catch(console.log);
		}, 500);

		return app;
	},
	standby() {
		return new Promise((yes, no) => {
			const show = setInterval(() => {
				console.log(commands.length);
			}, 500);
			const wait = setInterval(() => {
				if (commands.length) {
					const cmd = commands.pop(0);
					yes(cmd);
					clearInterval(wait);
					clearInterval(show);
				}
			}, 5);
		});
	},
};
