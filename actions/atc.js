
module.exports = function*(page, blob, success) {

	global.log(`Dispatching ATC action...`);

	blob.params.mode = 'cors';
	blob.credentials = 'include';

	const res = yield page.evaluate(async ({ url, params }) => {
		const res = await fetch(url, params);

		const text = await res.text();

		return {
			ok: res.ok,
			status: res.status,
			body: text,
		};
	}, blob);

	if (res && success(res)) {
		global.log(`ATC Success - ${res.status}`);
		return true;
	}

	if (res) {
		global.log(`ATC Failed - ${res.status} (${res.body})`);
	}
	else {
		global.log(`ATC Failed - No Response`);
	}

	return false;
}