const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

function loadMemberInfo(token, fleetId, callback) {
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
}

function loadFleet(token, fleetId, callback) {
	const options = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/fleet/' + fleetId,
		qs: { client_api: CONFIG.client_api_version, access_token: token }
	};
	
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ fleet: JSON.parse(body) });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}

function loadStarbase(token, callback) {
	const options = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/starbase/get',
		qs: { client_api: CONFIG.client_api_version, access_token: token }
	};

	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ starbase: JSON.parse(body) });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}

export function loadFleetData(token, fleetId, callback, errCallback) {
	loadMemberInfo(token, fleetId, function (respMemberInfo) {
		if (respMemberInfo.fleetData) {
			loadFleet(token, fleetId, function (respFleet) {
				if (respFleet.fleet) {
					loadStarbase(token, function (respStarbase) {
						if (respStarbase.starbase) {
							callback(respMemberInfo.fleetData, respFleet.fleet, respStarbase.starbase);
						}
						else {
							errCallback();
						}
					});
				}
				else {
					errCallback();
				}
			});
		}
		else {
			errCallback();
		}
	});
}
