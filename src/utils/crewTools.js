const request = require('electron').remote.require('request');

const CONFIG = require('./config.js');

import STTApi from '../api/STTApi.ts';

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

function rosterFromCrew(rosterEntry, crew) {
	rosterEntry.level = crew.level;
	rosterEntry.rarity = crew.rarity;
	rosterEntry.buyback = crew.in_buy_back_state;

	for (var skill in crew.skills) {
		rosterEntry[skill].core = crew.skills[skill].core;
		rosterEntry[skill].min = crew.skills[skill].range_min;
		rosterEntry[skill].max = crew.skills[skill].range_max;
	}

	rosterEntry.ship_battle = crew.ship_battle;

	rosterEntry.equipment_slots = crew.equipment_slots;

	rosterEntry.equipment_slots.forEach(function (equipment) {
		equipment.have = false;
	});

	crew.equipment.forEach(function (equipment) {
		rosterEntry.equipment_slots[equipment[0]].have = true;
	});

	rosterEntry.traits = crew.traits.concat(crew.traits_hidden).map(function (trait) { return STTApi.getTraitName(trait); }).join();
	rosterEntry.rawTraits = crew.traits.concat(crew.traits_hidden);
}

export function matchCrew(dbCache, character, callback) {
	function getDefaults(id) {
		var crew = STTApi.getCrewAvatarById(id);
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
		rosterFromCrew(rosterEntry, crew);
		roster.push(rosterEntry);
	});

	// Now add all the frozen crew
	if (character.stored_immortals && character.stored_immortals.length > 0) {
		// Use the cache wherever possible
		// TODO: does DB ever change the stats of crew? If yes, we may need to ocasionally clear the cache - perhaps based on record's age
		var immortals = dbCache.getCollection('immortals');
		if (!immortals) {
			immortals = dbCache.addCollection('immortals');
		}

		character.stored_immortals.forEach(function (crew) {
			rosterEntry = getDefaults(crew.id);
			rosterEntry.frozen = crew.quantity;
			rosterEntry.level = 100;
			rosterEntry.rarity = rosterEntry.max_rarity;
			roster.push(rosterEntry);

			loadFrozen(immortals, rosterEntry, queue('frozen'));
		});

		queue.done('frozen', function () {
			callback(roster);
		});
	}
	else {
		callback(roster);
	}
}

export function getCrewIconFromCache(imageURLs, name) {
	var result = imageURLs.findOne({ fileName: name.split(' ').join('_') + '_Head.png' });
	if (result) {
		return result.url;
	}

	return '';
}

function loadFrozen(immortals, rosterEntry, callback) {
	var result = immortals.findOne({ symbol: rosterEntry.symbol });
	if (result) {
		rosterFromCrew(rosterEntry, result.crew);
		callback();
	}
	else {
		STTApi.loadFrozenCrew(rosterEntry.symbol, function (crew) {
			rosterFromCrew(rosterEntry, crew);
			
			immortals.insert({
				symbol: rosterEntry.symbol,
				crew: crew
			});
			callback();
		});
	}
}