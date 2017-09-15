const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

import STTApi from '../api/STTApi.ts';

export function matchShips(ships, callback) {
	var newShips = [];
	STTApi.shipSchematics.forEach(function (schematic) {
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