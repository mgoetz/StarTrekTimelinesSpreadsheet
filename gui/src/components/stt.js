// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT HOLDERS OR ANYONE
// DISTRIBUTING THE SOFTWARE BE LIABLE FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
// OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Star Trek Timelines content and materials are trademarks and copyrights of Disruptor Beam: https://www.disruptorbeam.com/games/star-trek-timelines/
// I have no affiliation with Disruptor Beam or any of its partners.

// We need the request module for making the HTTP requests to retireve the data
var request = require('electron').remote.require('request');

// Use the json2csv module for generating a nice comma separated file out of the array without all the manual string concatenations
var json2csv = require('electron').remote.require('json2csv');

var fs= require('electron').remote.require('fs');

// If the regedit module is available, load it. We use the regedit module to retrieve the access token from registry
// on Windows machines that have the Steam Star Trek Timelines app installed
var regedit;
try { regedit = require('electron').remote.require('regedit'); } catch (err) { regedit = null; }

// If the exceljs module is available, load it. We can use it to generate richer output (workbook with multiple sheets and rich formats)
var Excel;
try { Excel = require('electron').remote.require('exceljs'); } catch (err) { Excel = null; }

const shell = require('electron').shell;

// Function attempts to retrieve the access token, either from registry or from the argument list
function getAccessToken(callback) {
	if (!options.accesstoken) {
		if (!regedit) {
			console.log('RegEdit module not found. Pass the access token as a parameter!');
			callback(null);
			return;
		}

		regedit.list('HKCU\\Software\\DisruptorBeam\\Star Trek', function (err, result) {
			if (!result) {
				console.log('Registry key not found! Make sure you installed the Steam app and logged in, or pass the access token as a parameter!');
				callback(null);
				return;
			}

			for (var prop in result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values) {
				if (prop.includes('access_token')) {
					var value = String.fromCharCode.apply(String, result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values[prop].value);

					// Clean up the string
					value = value.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/[\u0000-\u0019]+/g, "");
					var reg = JSON.parse(value);

					// We have the token, return
					callback(reg.token);
					return;
				}
			}

			if (!result) {
				console.log('Access token not found in the registry! Make sure you installed the Steam app and logged in, or pass the access token as a parameter!');
				callback(null);
				return;
			}
		});
	}
	else {
		callback(process.argv[2]);
	}
}

function queue(name) {
	queue.q[name]++ || (queue.q[name] = 1);
	return function (err) {
		if (err && queue.e[name]) queue.e[name](err);
		else if (err) throw err;
		process.nextTick(function () {
			queue.q[name]--;
			queue.check(name);
		});
	}
}
queue.__proto__ = {
	q: {},
	c: {},
	e: {},
	check: function (name) { queue.q[name] == 0 && queue.c[name](); },
	done: function (name, fn) { queue.c[name] = fn; },
	err: function (name, fn) { queue.e[name] = fn; }
}

var waiting = 3;

var player = null;
var config = null;
var allcrew = null;

function rosterFromCrew(rosterEntry, crew, trait_names) {
	rosterEntry.level = crew.level;
	rosterEntry.rarity = crew.rarity;
	rosterEntry.buyback = crew.in_buy_back_state;

	for (var skill in crew.skills) {
		rosterEntry[skill].core = crew.skills[skill].core;
		rosterEntry[skill].min = crew.skills[skill].range_min;
		rosterEntry[skill].max = crew.skills[skill].range_max;
	}

	rosterEntry.traits = crew.traits.concat(crew.traits_hidden).map(function (trait) { return trait_names[trait] ? trait_names[trait] : trait; }).join();
	rosterEntry.rawTraits = crew.traits;
}

export function matchCrew(crew_avatars, character, token, trait_names, callback) {
	function getDefaults(id) {
		var crew = crew_avatars.find(function (archetype) { return archetype.id === id; });
		return {
			id: crew.id, name: crew.name, short_name: crew.short_name, max_rarity: crew.max_rarity, symbol: crew.symbol,
			level: 0, rarity: 0, frozen: 0, buyback: false, traits: '', rawTraits: [], portrait: crew.portrait.file,
			command_skill: { 'core': 0, 'min': 0, 'max': 0 }, science_skill: { 'core': 0, 'min': 0, 'max': 0 },
			security_skill: { 'core': 0, 'min': 0, 'max': 0 }, engineering_skill: { 'core': 0, 'min': 0, 'max': 0 },
			diplomacy_skill: { 'core': 0, 'min': 0, 'max': 0 }, medicine_skill: { 'core': 0, 'min': 0, 'max': 0 }
		};
	}

	var roster = [];
	var rosterEntry = {};

	// Add all the crew in the active roster
	character.crew.forEach(function (crew) {
		rosterEntry = getDefaults(crew.archetype_id);
		rosterFromCrew(rosterEntry, crew, trait_names);
		roster.push(rosterEntry);
	});
	
	// Now add all the frozen crew
	character.stored_immortals.forEach(function (crew) {
		rosterEntry = getDefaults(crew.id);
		rosterEntry.frozen = crew.quantity;
		rosterEntry.level = 100;
		rosterEntry.rarity = rosterEntry.max_rarity;
		roster.push(rosterEntry);

		loadFrozen(rosterEntry, token, trait_names, queue('frozen'));
	});

	queue.done('frozen', function () {
		callback(roster);
	});
}

function loadFrozen(rosterEntry, token, trait_names, callback) {
	const reqOptions = {
		method: 'POST',
		uri: 'https://stt.disruptorbeam.com/stasis_vault/immortal_restore_info',
		qs: {
			symbol: rosterEntry.symbol,
			client_api: 7
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Bearer ' + new Buffer(token).toString('base64')
		}
	};

	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var crewJson = JSON.parse(body);

			rosterFromCrew(rosterEntry, crewJson.crew, trait_names);
		}
		callback();
	});
}

export function loadGauntlet(token, callback)
{
	const options = { method: 'GET', qs: { client_api: 7, access_token: token, gauntlet_id: -1 } };

	options.uri = 'https://stt.disruptorbeam.com/gauntlet/status';
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var gauntlet = JSON.parse(body);
			var currentGauntlet = gauntlet.character.gauntlets[0];
			callback({ gauntlet: currentGauntlet });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}

export function computeGauntlet(currentGauntlet, roster)
{
	// TODO: magical numbers below; tune these (or get them as parameters for customization)
	var featuredSkillBonus = 1.1;
	var critBonusDivider = 3;

	const skillList = [
		'command_skill',
		'science_skill',
		'security_skill',
		'engineering_skill',
		'diplomacy_skill',
		'medicine_skill'];

	var gauntletCrew = roster.map(function (crew) {
		var newCrew = { id: crew.id, name: crew.name, crit: 5 };

		skillList.forEach(function (skill) {
			newCrew[skill] = crew[skill].min + crew[skill].max;
		});

		newCrew[currentGauntlet.contest_data.featured_skill] = newCrew[currentGauntlet.contest_data.featured_skill] * featuredSkillBonus;

		currentGauntlet.contest_data.traits.forEach(function (trait) {
			if (crew.rawTraits.includes(trait))
				newCrew.crit += currentGauntlet.contest_data.crit_chance_per_trait;
		});

		skillList.forEach(function (skill) {
			newCrew[skill] = newCrew[skill] * (100 + newCrew.crit / critBonusDivider) / 100;
		});

		return newCrew;
	});

	var sortedCrew = [];

	function getScore(gauntletCrewItem, maxSkill) {
		var score = gauntletCrewItem[maxSkill]; // double account for preferred skill
		skillList.forEach(function (skill) {
			score += gauntletCrewItem[skill];
		});

		return score;
	}

	var result = { best: {}};

	skillList.forEach(function (skill) {
		gauntletCrew.sort(function (a, b) {
			return b[skill] - a[skill];
		});
		result.best[skill] = gauntletCrew[0].name;

		// Get the first 2 in the final score sheet
		sortedCrew.push({ 'id': gauntletCrew[0].id, 'name': gauntletCrew[0].name, 'score': getScore(gauntletCrew[0], skill) });
		sortedCrew.push({ 'id': gauntletCrew[1].id, 'name': gauntletCrew[1].name, 'score': getScore(gauntletCrew[1], skill) });
	});

	sortedCrew.sort(function (a, b) {
		return b.score - a.score;
	});

	// Remove duplicates
	var seen = {};
	sortedCrew = sortedCrew.filter(function (item) {
		return seen.hasOwnProperty(item.id) ? false : (seen[item.id] = true);
	});

	// Get the first 5
	sortedCrew = sortedCrew.slice(0, 5);

	result.recommendations = sortedCrew.map(function (crew) { return crew.id });

	return result;
}

export function matchShips(ships, accesstoken, callback)
{
	//TODO: Load all ship archetypes
	callback(ships);
}

// Function gets called when we're done downloading all the data we need
function finishedLoading(token) {
	if (options.gauntlet) {
		const options = { method: 'GET', qs: { client_api: 7, access_token: token, gauntlet_id: -1 } };

		options.uri = 'https://stt.disruptorbeam.com/gauntlet/status';
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var gauntlet = JSON.parse(body);

				var currentGauntlet = gauntlet.character.gauntlets[0];
				if (currentGauntlet.state != 'NONE') {
					console.log('It looks like you already started this gauntlet! Try to use this option before joining your next gauntlet');
					return;
				}

				console.log('Calculating best crew for next gauntlet, starting in ' + currentGauntlet.seconds_to_join / 60 + ' minutes...');
				console.log('Featured skill: ' + currentGauntlet.contest_data.featured_skill);
				console.log('Traits: ' + currentGauntlet.contest_data.traits.join());

				matchCrew(allcrew.crew_avatars, player.player.character, token, config.config.trait_names, function (roster) {

					// TODO: magical numbers below; tune these (or get them as parameters for customization)
					var featuredSkillBonus = 1.1;
					var critBonusDivider = 3;

					const skillList = [
						'command_skill',
						'science_skill',
						'security_skill',
						'engineering_skill',
						'diplomacy_skill',
						'medicine_skill'];

					var gauntletCrew = roster.map(function (crew) {
						var newCrew = { id: crew.id, name: crew.name, crit: 5 };

						skillList.forEach(function (skill) {
							newCrew[skill] = crew[skill].min + crew[skill].max;
						});

						newCrew[currentGauntlet.contest_data.featured_skill] = newCrew[currentGauntlet.contest_data.featured_skill] * featuredSkillBonus;

						currentGauntlet.contest_data.traits.forEach(function (trait) {
							if (crew.rawTraits.includes(trait))
								newCrew.crit += currentGauntlet.contest_data.crit_chance_per_trait;
						});

						skillList.forEach(function (skill) {
							newCrew[skill] = newCrew[skill] * (100 + newCrew.crit / critBonusDivider) / 100;
						});

						return newCrew;
					});

					var sortedCrew = [];

					function getScore(gauntletCrewItem, maxSkill) {
						score = gauntletCrewItem[maxSkill]; // double account for preferred skill
						skillList.forEach(function (skill) {
							score += gauntletCrewItem[skill];
						});

						return score;
					}

					skillList.forEach(function (skill) {
						gauntletCrew.sort(function (a, b) {
							return b[skill] - a[skill];
						});
						console.log('Best overall for ' + skill + ' : ' + gauntletCrew[0].name)

						// Get the first 2 in the final score sheet
						sortedCrew.push({ 'id': gauntletCrew[0].id, 'name': gauntletCrew[0].name, 'score': getScore(gauntletCrew[0], skill) });
						sortedCrew.push({ 'id': gauntletCrew[1].id, 'name': gauntletCrew[1].name, 'score': getScore(gauntletCrew[1], skill) });
					});

					sortedCrew.sort(function (a, b) {
						return b.score - a.score;
					});

					// Remove duplicates
					var seen = {};
					sortedCrew = sortedCrew.filter(function (item) {
						return seen.hasOwnProperty(item.id) ? false : (seen[item.id] = true);
					});

					// Get the first 5
					sortedCrew = sortedCrew.slice(0, 5);

					console.log('Based on the probabilistic algorithm my recommended selection is: ' + sortedCrew.map(function (crew) { return crew.name }).join(', '));
				});
			}
		});
	}
	else if (options.items) {
		// Return details about the items
		var fields = [
			{
				label: 'id',
				value: 'archetype_id'
			},
			'name',
			'quantity',
			'rarity',
			{
				label: 'type',
				value: function (row, field, data) {
					return row.icon.file.replace("/items", "").split("/")[1];
				}
			},
			{
				label: 'symbol',
				value: function (row, field, data) {
					return row.icon.file.replace("/items", "").split("/")[2];
				}
			},
			{
				label: 'details',
				value: 'flavor'
			}];

		var csv = json2csv({ data: player.player.character.items, fields: fields });
		console.log(csv);
	}
	else if (options.ships) {
		// Return details about the ships
		var fields = [
			{
				label: 'id',
				value: 'archetype_id'
			},
			'name',
			'level',
			'max_level',
			'rarity',
			'shields',
			'hull',
			'attack',
			'accuracy',
			'evasion'
		];

		var csv = json2csv({ data: player.player.character.ships, fields: fields });
		console.log(csv);
	}
	else {
		// Return details about the crew (default)
		matchCrew(allcrew.crew_avatars, player.player.character, token, config.config.trait_names, function (roster) {
			if (options.excel) {
				var workbook = new Excel.Workbook();
				var worksheet = workbook.addWorksheet('Crew stats');

				worksheet.columns = [
					{ header: 'id', key: 'id', width: 5 },
					{ header: 'name', key: 'name', width: 28 },
					{ header: 'short_name', key: 'short_name', width: 14 },
					{ header: 'rarity', key: 'rarity', width: 8 },
					{ header: 'max_rarity', key: 'max_rarity', width: 12 },
					{ header: 'level', key: 'level', width: 7 },
					{ header: 'frozen', key: 'frozen', width: 8 },
					{ header: 'command_skill.core', key: 'command_skill_core', width: 24 },
					{ header: 'command_skill.min', key: 'command_skill_min', width: 8 },
					{ header: 'command_skill.max', key: 'command_skill_max', width: 8 },
					{ header: 'diplomacy_skill.core', key: 'diplomacy_skill_core', width: 24 },
					{ header: 'diplomacy_skill.min', key: 'diplomacy_skill_min', width: 8 },
					{ header: 'diplomacy_skill.max', key: 'diplomacy_skill_max', width: 8 },
					{ header: 'science_skill.core', key: 'science_skill_core', width: 24 },
					{ header: 'science_skill.min', key: 'science_skill_min', width: 8 },
					{ header: 'science_skill.max', key: 'science_skill_max', width: 8 },
					{ header: 'security_skill.core', key: 'security_skill_core', width: 24 },
					{ header: 'security_skill.min', key: 'security_skill_min', width: 8 },
					{ header: 'security_skill.max', key: 'security_skill_max', width: 8 },
					{ header: 'engineering_skill.core', key: 'engineering_skill_core', width: 24 },
					{ header: 'engineering_skill.min', key: 'engineering_skill_min', width: 8 },
					{ header: 'engineering_skill.max', key: 'engineering_skill_max', width: 8 },
					{ header: 'medicine_skill.core', key: 'medicine_skill_core', width: 24 },
					{ header: 'medicine_skill.min', key: 'medicine_skill_min', width: 8 },
					{ header: 'medicine_skill.max', key: 'medicine_skill_max', width: 8 },
					{ header: 'buyback', key: 'buyback', width: 10, hidden: true },
					{ header: 'traits', key: 'traits', width: 40 }
				];

				worksheet.getRow(1).font = { bold: true };

				worksheet.autoFilter = 'A1:AA1';

				roster.forEach(function (crew) {
					worksheet.addRow({
						'id': crew.id,
						'name': crew.name,
						'short_name': crew.short_name,
						'max_rarity': crew.max_rarity,
						'rarity': crew.rarity,
						'level': crew.level,
						'frozen': crew.frozen,
						'buyback': crew.buyback,
						'command_skill_core': crew.command_skill.core,
						'command_skill_min': crew.command_skill.min,
						'command_skill_max': crew.command_skill.max,
						'diplomacy_skill_core': crew.diplomacy_skill.core,
						'diplomacy_skill_min': crew.diplomacy_skill.min,
						'diplomacy_skill_max': crew.diplomacy_skill.max,
						'science_skill_core': crew.science_skill.core,
						'science_skill_min': crew.science_skill.min,
						'science_skill_max': crew.science_skill.max,
						'security_skill_core': crew.security_skill.core,
						'security_skill_min': crew.security_skill.min,
						'security_skill_max': crew.security_skill.max,
						'engineering_skill_core': crew.engineering_skill.core,
						'engineering_skill_min': crew.engineering_skill.min,
						'engineering_skill_max': crew.engineering_skill.max,
						'medicine_skill_core': crew.medicine_skill.core,
						'medicine_skill_min': crew.medicine_skill.min,
						'medicine_skill_max': crew.medicine_skill.max,
						'traits': crew.traits
					});
				});

				var worksheetItems = workbook.addWorksheet('Item stats');

				worksheetItems.columns = [
					{ header: 'id', key: 'id', width: 5 },
					{ header: 'name', key: 'name', width: 42 },
					{ header: 'quantity', key: 'quantity', width: 10 },
					{ header: 'rarity', key: 'rarity', width: 10 },
					{ header: 'type', key: 'type', width: 14 },
					{ header: 'symbol', key: 'symbol', width: 58 },
					{ header: 'details', key: 'details', width: 70 }
				];

				worksheetItems.getRow(1).font = { bold: true };

				worksheetItems.autoFilter = 'A1:G1';

				player.player.character.items.forEach(function (item) {
					worksheetItems.addRow({
						'id': item.archetype_id,
						'name': item.name,
						'quantity': item.quantity,
						'rarity': item.rarity,
						'type': item.icon.file.replace("/items", "").split("/")[1],
						'symbol': item.icon.file.replace("/items", "").split("/")[2],
						'details': item.flavor
					});
				});

				var worksheetShips = workbook.addWorksheet('Ship stats');

				worksheetShips.columns = [
					{ header: 'id', key: 'id', width: 5 },
					{ header: 'name', key: 'name', width: 30 },
					{ header: 'level', key: 'level', width: 12 },
					{ header: 'max_level', key: 'max_level', width: 12 },
					{ header: 'rarity', key: 'rarity', width: 8 },
					{ header: 'shields', key: 'shields', width: 10 },
					{ header: 'hull', key: 'hull', width: 10 },
					{ header: 'attack', key: 'attack', width: 10 },
					{ header: 'accuracy', key: 'accuracy', width: 10 },
					{ header: 'evasion', key: 'evasion', width: 10 }
				];

				worksheetShips.getRow(1).font = { bold: true };

				worksheetShips.autoFilter = 'A1:J1';

				player.player.character.ships.forEach(function (ship) {
					worksheetShips.addRow({
						'id': ship.archetype_id,
						'name': ship.name,
						'level': ship.level,
						'max_level': ship.max_level,
						'rarity': ship.rarity,
						'shields': ship.shields,
						'hull': ship.hull,
						'attack': ship.attack,
						'accuracy': ship.accuracy,
						'evasion': ship.evasion
					});
				});

				workbook.xlsx.writeFile(options.excel)
					.then(function () {
						console.log('Done writing to ' + options.excel);
					});
			}
			else {

				var fields = ['id', 'name', 'short_name', 'max_rarity', 'rarity', 'level', 'frozen', 'buyback', 'command_skill.core', 'command_skill.min', 'command_skill.max', 'diplomacy_skill.core',
					'diplomacy_skill.min', 'diplomacy_skill.max', 'engineering_skill.core', 'engineering_skill.min', 'engineering_skill.max', 'medicine_skill.core', 'medicine_skill.min', 'medicine_skill.max',
					'science_skill.core', 'science_skill.min', 'science_skill.max', 'security_skill.core', 'security_skill.min', 'security_skill.max', 'traits'];

				var csv = json2csv({ data: roster, fields: fields });
				console.log(csv);
			}
		});
	}
}

export function exportCsv(roster, fileName)
{
	var fields = ['id', 'name', 'short_name', 'max_rarity', 'rarity', 'level', 'frozen', 'buyback', 'command_skill.core', 'command_skill.min', 'command_skill.max', 'diplomacy_skill.core',
		'diplomacy_skill.min', 'diplomacy_skill.max', 'engineering_skill.core', 'engineering_skill.min', 'engineering_skill.max', 'medicine_skill.core', 'medicine_skill.min', 'medicine_skill.max',
		'science_skill.core', 'science_skill.min', 'science_skill.max', 'security_skill.core', 'security_skill.min', 'security_skill.max', 'traits'];

	var csv = json2csv({ data: roster, fields: fields });

	fs.writeFile(fileName, csv, function (err) {
		shell.openItem(fileName);
	});
}

export function exportExcel(roster, itemList, shipList, fileName) {
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet('Crew stats');

	worksheet.columns = [
		{ header: 'id', key: 'id', width: 5 },
		{ header: 'name', key: 'name', width: 28 },
		{ header: 'short_name', key: 'short_name', width: 14 },
		{ header: 'rarity', key: 'rarity', width: 8 },
		{ header: 'max_rarity', key: 'max_rarity', width: 12 },
		{ header: 'level', key: 'level', width: 7 },
		{ header: 'frozen', key: 'frozen', width: 8 },
		{ header: 'command_skill.core', key: 'command_skill_core', width: 24 },
		{ header: 'command_skill.min', key: 'command_skill_min', width: 8 },
		{ header: 'command_skill.max', key: 'command_skill_max', width: 8 },
		{ header: 'diplomacy_skill.core', key: 'diplomacy_skill_core', width: 24 },
		{ header: 'diplomacy_skill.min', key: 'diplomacy_skill_min', width: 8 },
		{ header: 'diplomacy_skill.max', key: 'diplomacy_skill_max', width: 8 },
		{ header: 'science_skill.core', key: 'science_skill_core', width: 24 },
		{ header: 'science_skill.min', key: 'science_skill_min', width: 8 },
		{ header: 'science_skill.max', key: 'science_skill_max', width: 8 },
		{ header: 'security_skill.core', key: 'security_skill_core', width: 24 },
		{ header: 'security_skill.min', key: 'security_skill_min', width: 8 },
		{ header: 'security_skill.max', key: 'security_skill_max', width: 8 },
		{ header: 'engineering_skill.core', key: 'engineering_skill_core', width: 24 },
		{ header: 'engineering_skill.min', key: 'engineering_skill_min', width: 8 },
		{ header: 'engineering_skill.max', key: 'engineering_skill_max', width: 8 },
		{ header: 'medicine_skill.core', key: 'medicine_skill_core', width: 24 },
		{ header: 'medicine_skill.min', key: 'medicine_skill_min', width: 8 },
		{ header: 'medicine_skill.max', key: 'medicine_skill_max', width: 8 },
		{ header: 'buyback', key: 'buyback', width: 10, hidden: true },
		{ header: 'traits', key: 'traits', width: 40 }
	];

	worksheet.getRow(1).font = { bold: true };

	worksheet.autoFilter = 'A1:AA1';

	roster.forEach(function (crew) {
		worksheet.addRow({
			'id': crew.id,
			'name': crew.name,
			'short_name': crew.short_name,
			'max_rarity': crew.max_rarity,
			'rarity': crew.rarity,
			'level': crew.level,
			'frozen': crew.frozen,
			'buyback': crew.buyback,
			'command_skill_core': crew.command_skill.core,
			'command_skill_min': crew.command_skill.min,
			'command_skill_max': crew.command_skill.max,
			'diplomacy_skill_core': crew.diplomacy_skill.core,
			'diplomacy_skill_min': crew.diplomacy_skill.min,
			'diplomacy_skill_max': crew.diplomacy_skill.max,
			'science_skill_core': crew.science_skill.core,
			'science_skill_min': crew.science_skill.min,
			'science_skill_max': crew.science_skill.max,
			'security_skill_core': crew.security_skill.core,
			'security_skill_min': crew.security_skill.min,
			'security_skill_max': crew.security_skill.max,
			'engineering_skill_core': crew.engineering_skill.core,
			'engineering_skill_min': crew.engineering_skill.min,
			'engineering_skill_max': crew.engineering_skill.max,
			'medicine_skill_core': crew.medicine_skill.core,
			'medicine_skill_min': crew.medicine_skill.min,
			'medicine_skill_max': crew.medicine_skill.max,
			'traits': crew.traits
		});
	});

	var worksheetItems = workbook.addWorksheet('Item stats');

	worksheetItems.columns = [
		{ header: 'id', key: 'id', width: 5 },
		{ header: 'name', key: 'name', width: 42 },
		{ header: 'quantity', key: 'quantity', width: 10 },
		{ header: 'rarity', key: 'rarity', width: 10 },
		{ header: 'type', key: 'type', width: 14 },
		{ header: 'symbol', key: 'symbol', width: 58 },
		{ header: 'details', key: 'details', width: 70 }
	];

	worksheetItems.getRow(1).font = { bold: true };

	worksheetItems.autoFilter = 'A1:G1';

	itemList.forEach(function (item) {
		worksheetItems.addRow({
			'id': item.archetype_id,
			'name': item.name,
			'quantity': item.quantity,
			'rarity': item.rarity,
			'type': item.icon.file.replace("/items", "").split("/")[1],
			'symbol': item.icon.file.replace("/items", "").split("/")[2],
			'details': item.flavor
		});
	});

	var worksheetShips = workbook.addWorksheet('Ship stats');

	worksheetShips.columns = [
		{ header: 'id', key: 'id', width: 5 },
		{ header: 'name', key: 'name', width: 30 },
		{ header: 'level', key: 'level', width: 12 },
		{ header: 'max_level', key: 'max_level', width: 12 },
		{ header: 'rarity', key: 'rarity', width: 8 },
		{ header: 'shields', key: 'shields', width: 10 },
		{ header: 'hull', key: 'hull', width: 10 },
		{ header: 'attack', key: 'attack', width: 10 },
		{ header: 'accuracy', key: 'accuracy', width: 10 },
		{ header: 'evasion', key: 'evasion', width: 10 }
	];

	worksheetShips.getRow(1).font = { bold: true };

	worksheetShips.autoFilter = 'A1:J1';

	shipList.forEach(function (ship) {
		worksheetShips.addRow({
			'id': ship.archetype_id,
			'name': ship.name,
			'level': ship.level,
			'max_level': ship.max_level,
			'rarity': ship.rarity,
			'shields': ship.shields,
			'hull': ship.hull,
			'attack': ship.attack,
			'accuracy': ship.accuracy,
			'evasion': ship.evasion
		});
	});

	workbook.xlsx.writeFile(fileName)
		.then(function () {
			shell.openItem(fileName);
		});
}

export function loadStuff(token, callback)
{
	if (!token)
		return;

	const reqOptions = { method: 'GET', qs: { client_api: 7, access_token: token } };

	reqOptions.uri = 'https://stt.disruptorbeam.com/player';
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ player: JSON.parse(body) });
		}
		else
		{
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});

	reqOptions.uri = 'https://stt.disruptorbeam.com/config/platform';
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ config: JSON.parse(body) });
		}
		else
		{
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});

	reqOptions.uri = 'https://stt.disruptorbeam.com/character/get_avatar_crew_archetypes';
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ allcrew: JSON.parse(body) });
		}
		else
		{
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}

export function loadCrewImageUrl(crewName, crewId, callback)
{
	const reqOptions = {
		method: 'GET',
		uri: 'https://stt.wiki/w/api.php',
		qs: {
			action: 'query',
			titles: 'File:' + crewName,
			prop: 'imageinfo',
			iiprop: 'url|metadata',
			format: 'json'
		}
	};
	
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var imageInfo = JSON.parse(body);
			var url = '';

			try
			{
				url = imageInfo.query.pages[Object.keys(imageInfo.query.pages)[0]].imageinfo[0].url;
			}
			catch (e)
			{
				return;
			}

			callback(crewId, url);
		}
	});
}
