const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

import STTApi from '../api/STTApi.ts';

export function matchShips(ships, callback) {
	const options = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/ship_schematic',
		qs: { client_api: CONFIG.client_api_version, access_token: STTApi.accessToken }
	};

	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var ship_schematic = JSON.parse(body);

			var newShips = [];
			ship_schematic.schematics.forEach(function (schematic) {
				var owned = ships.find(function (ship) { return ship.name == schematic.ship.name; });
				if (owned) {
					schematic.ship.level = owned.level;
				}
				else {
					schematic.ship.level = 0;
				}

				newShips.push(schematic.ship);
			});
			callback(newShips);
		}
		else {
			//callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});

	
}