const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

import STTApi from '../api/STTApi.ts';

function loadMemberInfo(fleetId, callback) {
	const reqOptions = {
		method: 'POST',
		uri: 'https://stt.disruptorbeam.com/fleet/complete_member_info',
		qs: {
			guild_id: fleetId,
			client_api: CONFIG.client_api_version
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer ' + new Buffer(STTApi.accessToken).toString('base64')
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

function loadFleet(fleetId, callback) {
	const options = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/fleet/' + fleetId,
		qs: { client_api: CONFIG.client_api_version, access_token: STTApi.accessToken }
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

function loadStarbase(callback) {
	const options = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/starbase/get',
		qs: { client_api: CONFIG.client_api_version, access_token: STTApi.accessToken }
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

export function loadFleetData(fleetId, callback, errCallback) {
	loadMemberInfo(fleetId, function (respMemberInfo) {
		if (respMemberInfo.fleetData) {
			loadFleet(fleetId, function (respFleet) {
				if (respFleet.fleet) {
					loadStarbase(function (respStarbase) {
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
