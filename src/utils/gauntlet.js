const CONFIG = require('./config.js');

import STTApi from '../../shared/api/STTApi.ts';

export function loadGauntlet() {
	return STTApi.executeGetRequest("gauntlet/status", {gauntlet_id: -1}).then((data) => {
		if (data.character && data.character.gauntlets) {
			return Promise.resolve(data.character.gauntlets[0]);
		} else {
			return Promise.reject("Invalid data for gauntlet!");
		}
	});
}

export function payToGetNewOpponents(gauntlet_id) {
	return STTApi.executePostRequest("gauntlet/refresh_opp_pool_and_revive_crew", { gauntlet_id: gauntlet_id, pay: true }).then((data) => {
		let currentGauntlet = null;
		let merits = null;
		if (data.message) {
			// TODO: insufficient funds
		}
		data.forEach(function (item) {
			if (item.character && item.character.gauntlets) {
				currentGauntlet = item.character.gauntlets[0];
			} else if (item.player && item.player.premium_earnable) {
				// TODO: this should update the global state in STTApi (in fact, these kind of updates can come in at any time and could be handled in the request api itself)
				merits = item.player.premium_earnable;
			}
		});

		if (currentGauntlet) {
			return Promise.resolve({ gauntlet: currentGauntlet, merits: merits });
		} else {
			return Promise.reject("Invalid data for gauntlet!");
		}
	});
}

export function playContest(gauntlet_id, crew_id, opponent_id, op_crew_id) {
	return STTApi.executePostRequest("gauntlet/execute_crew_contest", {
		gauntlet_id: gauntlet_id,
		crew_id: crew_id,
		opponent_id: opponent_id,
		op_crew_id: op_crew_id,
		boost: false
	}).then((data) => {
		let currentGauntlet = null;
		let contest = null;
		data.forEach(function (item) {
			if (item.character && item.character.gauntlets) {
				currentGauntlet = item.character.gauntlets[0];
			} else if (item.contest) {
				contest = item.contest;
			}
		});

		if (currentGauntlet && contest) {
			return Promise.resolve({ gauntlet: currentGauntlet, lastResult: contest });
		} else {
			return Promise.reject("Invalid data for gauntlet!");
		}
	});
}

export function gauntletRoundOdds(currentGauntlet) {
	var result = {
		rank: currentGauntlet.rank,
		consecutive_wins: currentGauntlet.consecutive_wins,
		crewOdds: [],
		opponents: []
	};

	currentGauntlet.contest_data.selected_crew.forEach(function(crew) {
		crew.iconUrl = '';

		if (!crew.disabled) {
			var crewOdd = {
				archetype_symbol: crew.archetype_symbol,
				crew_id: crew.crew_id,
				crit_chance: crew.crit_chance,
				used: crew.debuff / 4,
				max: [],
				min: [],
				iconUrl: ''
			};

			crew.skills.forEach(function(skillStats) {
				if ((skillStats.skill == currentGauntlet.contest_data.primary_skill) || (skillStats.skill == currentGauntlet.contest_data.secondary_skill)) {
					crewOdd.max.push(skillStats.max);
					crewOdd.min.push(skillStats.min);
				}
			});

			result.crewOdds.push(crewOdd);
		}
	});

	currentGauntlet.opponents.forEach(function(opponent) {
		var opponentOdd = {
			name: opponent.name,
			level: opponent.level,
			value: opponent.value,
			player_id: opponent.player_id,
			crew_id: opponent.crew_contest_data.crew[0].crew_id,
			archetype_symbol: opponent.crew_contest_data.crew[0].archetype_symbol,
			crit_chance: opponent.crew_contest_data.crew[0].crit_chance,
			iconUrl: '',
			max: [],
			min: []
		};

		opponent.crew_contest_data.crew[0].skills.forEach(function(skillStats) {
			if ((skillStats.skill == currentGauntlet.contest_data.primary_skill) || (skillStats.skill == currentGauntlet.contest_data.secondary_skill)) {
				opponentOdd.max.push(skillStats.max);
				opponentOdd.min.push(skillStats.min);
			}
		});

		result.opponents.push(opponentOdd);
	});

	function roll(data, skillIndex) {
		let max = (Math.random() < 0.5) ? 0 : 1;
		let min = (Math.random() < 0.5) ? 0 : 1;
		if (data.max.length >= skillIndex + 1)
		{
			max = data.max[skillIndex];
			min = data.min[skillIndex];
		}

		return (Math.floor((Math.random() * (max - min)) + min) * (Math.random() < (data.crit_chance / 100) ? 2 : 1));
	}

	result.matches = [];

	result.crewOdds.forEach(function (crewOdd) {
		result.opponents.forEach(function (opponent) {
			// TODO: this is silly; perhaps someone more statisitically-inclined can chime in with a proper probabilistic formula

			var simulatedRounds = 20000;
			var wins = 0;
			for (var i = 0; i < simulatedRounds; i++) {
				var totalCrew = roll(crewOdd, 0);
				totalCrew += roll(crewOdd, 0);
				totalCrew += roll(crewOdd, 0);
				totalCrew += roll(crewOdd, 1);
				totalCrew += roll(crewOdd, 1);
				totalCrew += roll(crewOdd, 1);

				var totalOpponent = roll(opponent, 0);
				totalOpponent += roll(opponent, 0);
				totalOpponent += roll(opponent, 0);
				totalOpponent += roll(opponent, 1);
				totalOpponent += roll(opponent, 1);
				totalOpponent += roll(opponent, 1);

				if (totalCrew > totalOpponent)
					wins++;
			}

			result.matches.push({
				crewOdd: crewOdd,
				opponent: opponent,
				chance: Math.floor((wins / simulatedRounds) * 100)
			});
		});
	});

	result.matches.sort(function (a, b) {
		return b.chance - a.chance;
	});

	return result;
}

export function gauntletCrewSelection(currentGauntlet, roster) {
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