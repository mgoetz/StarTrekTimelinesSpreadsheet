const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

export function loadFleet(token, fleetId, callback) {
	const reqOptions = {
		method: 'POST',
		uri: 'https://stt.disruptorbeam.com/fleet/complete_member_info',
		qs: {
			guild_id: fleetId,
			client_api: CONFIG.client_api_version
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer ' + new Buffer(token).toString('base64')
		}
	};

	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ fleetData: JSON.parse(body) });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});

	// TODO: also load these:
	// GET https://stt.disruptorbeam.com/fleet/{fleetId}?client_api=8&access_token=
	// GET https://stt.disruptorbeam.com/starbase/get?client_api=8&access_token=
}
