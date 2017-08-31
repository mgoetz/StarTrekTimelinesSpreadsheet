const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

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
	rosterEntry.rawTraits = crew.traits.concat(crew.traits_hidden);
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
	if (character.stored_immortals && character.stored_immortals.length > 0) {
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
	else {
		callback(roster);
	}
}

function loadFrozen(rosterEntry, token, trait_names, callback) {
	const reqOptions = {
		method: 'POST',
		uri: 'https://stt.disruptorbeam.com/stasis_vault/immortal_restore_info',
		qs: {
			symbol: rosterEntry.symbol,
			client_api: CONFIG.client_api_version
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