const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

export function loadGauntlet(token, callback) {
	const options = { method: 'GET', qs: { client_api: CONFIG.client_api_version, access_token: token, gauntlet_id: -1 } };

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

export function computeGauntlet(currentGauntlet, roster) {
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

	var result = { best: {} };

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