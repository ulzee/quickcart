
const bodyParser = require('body-parser')
const express = require('express');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const registry = { entries: {} };
registry.keys = () => Object.keys(registry.entries);

app.post('/status', function (req, res) {

	const { body: { spawnid }} = req;

	if (!registry.entries[spawnid]) {
		registry.entries[spawnid] = req.body;
	}
	else {
		registry.entries[spawnid] = req.body;
	}

	res.send('Hello World');
});


// TODO: schedule deregister
// TODO: deregister

setInterval(() => {
	console.log(registry.keys().length);
	for (const ii in registry.keys()) {
		const obj = registry.entries[registry.keys()[ii]];
		console.log(`[${obj.spawnid}] ${obj.status} (up ${obj.uptime})`);
	}
}, 1000);

console.log('Listening: 8000');
app.listen(8000);
