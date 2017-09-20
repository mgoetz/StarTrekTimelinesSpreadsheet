import STTApi from "./STTApi.ts";

export function loadGauntlet(): Promise<any> {
	return STTApi.executeGetRequest("gauntlet/status", {gauntlet_id: -1}).then((data: any) => {
		if (data.character && data.character.gauntlets) {
			return Promise.resolve(data.character.gauntlets[0]);
		} else {
			return Promise.reject("Invalid data for gauntlet!");
		}
	});
}

export function payToGetNewOpponents(gauntlet_id: number): Promise<any> {
	return STTApi.executePostRequest("gauntlet/refresh_opp_pool_and_revive_crew", { gauntlet_id: gauntlet_id, pay: true }).then((data: any) => {
		let currentGauntlet = null;
		let merits = null;
		if (data.message) {
			// TODO: insufficient funds
		}
		data.forEach((item: any) => {
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

export function playContest(gauntlet_id: number, crew_id: number, opponent_id: number, op_crew_id: number): Promise<any> {
	return STTApi.executePostRequest("gauntlet/execute_crew_contest", {
		gauntlet_id: gauntlet_id,
		crew_id: crew_id,
		opponent_id: opponent_id,
		op_crew_id: op_crew_id,
		boost: false
	}).then((data: any) => {
		let currentGauntlet = null;
		let contest = null;
		data.forEach((item: any) => {
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

export interface ICrewOdd {
    archetype_symbol: string;
    crew_id: number;
    crit_chance: number;
    used: number;
    max: number[];
    min: number[];
    iconUrl: string | undefined;
}

export interface IOpponentOdd {
    name: string;
    level: number;
    value: number;
    player_id: number;
    crew_id: number;
    archetype_symbol: string;
    crit_chance: number;
    iconUrl: string | undefined;
    max: number[];
    min: number[];
}

export interface IMatch {
    crewOdd: ICrewOdd;
    opponent: IOpponentOdd;
    chance: number;
}

export interface IGauntletRoundOdds {
    rank: number;
    consecutive_wins: number;
    crewOdds: ICrewOdd[];
    opponents: IOpponentOdd[];
    matches: IMatch[];
}

export function gauntletRoundOdds(currentGauntlet: any): IGauntletRoundOdds {
	let result: IGauntletRoundOdds = {
		rank: currentGauntlet.rank,
		consecutive_wins: currentGauntlet.consecutive_wins,
		crewOdds: [],
        opponents: [],
        matches: []
	};

	currentGauntlet.contest_data.selected_crew.forEach((crew: any) => {
		crew.iconUrl = '';

		if (!crew.disabled) {
			let crewOdd: ICrewOdd = {
				archetype_symbol: crew.archetype_symbol,
				crew_id: crew.crew_id,
				crit_chance: crew.crit_chance,
				used: crew.debuff / 4,
				max: [],
				min: [],
				iconUrl: ''
			};

			crew.skills.forEach((skillStats: any) => {
				if ((skillStats.skill == currentGauntlet.contest_data.primary_skill) || (skillStats.skill == currentGauntlet.contest_data.secondary_skill)) {
					crewOdd.max.push(skillStats.max);
					crewOdd.min.push(skillStats.min);
				}
			});

			result.crewOdds.push(crewOdd);
		}
	});

	currentGauntlet.opponents.forEach((opponent: any) => {
		let opponentOdd: IOpponentOdd = {
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

		opponent.crew_contest_data.crew[0].skills.forEach((skillStats: any) => {
			if ((skillStats.skill == currentGauntlet.contest_data.primary_skill) || (skillStats.skill == currentGauntlet.contest_data.secondary_skill)) {
				opponentOdd.max.push(skillStats.max);
				opponentOdd.min.push(skillStats.min);
			}
		});

		result.opponents.push(opponentOdd);
	});

	function roll(data: any, skillIndex: number): number {
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

	result.crewOdds.forEach((crewOdd: any) => {
		result.opponents.forEach((opponent: any) => {
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

	result.matches.sort((a: any, b: any) => {
		return b.chance - a.chance;
	});

	return result;
}

interface ISortedCrew {
	id: number;
	name: string;
	score: number;
}

interface Dictionary<T> {
    [key: string]: T;
}

interface IGauntletCrew {
	skills: Dictionary<number>;
	id: number;
	name: string;
	crit: number;
}

export interface IGauntletCrewSelection {
	best: Dictionary<string>;
	recommendations: Array<number>;
}

export function gauntletCrewSelection(currentGauntlet: any, roster: any): any {
	// TODO: magical numbers below; tune these (or get them as parameters for customization)
	let featuredSkillBonus: number = 1.1;
	let critBonusDivider: number = 3;

	const skillList = [
		'command_skill',
		'science_skill',
		'security_skill',
		'engineering_skill',
		'diplomacy_skill',
		'medicine_skill'];

	var gauntletCrew = roster.map((crew: any) => {
		let newCrew: IGauntletCrew = {
			id: crew.id,
			name: crew.name,
			crit: 5,
			skills: {}
		};

		skillList.forEach((skill: string) => {
			newCrew.skills[skill] = crew[skill].min + crew[skill].max;
		});

		newCrew.skills[currentGauntlet.contest_data.featured_skill] = newCrew.skills[currentGauntlet.contest_data.featured_skill] * featuredSkillBonus;

		currentGauntlet.contest_data.traits.forEach((trait: any) => {
			if (crew.rawTraits.includes(trait))
				newCrew.crit += currentGauntlet.contest_data.crit_chance_per_trait;
		});

		skillList.forEach((skill: string) => {
			newCrew.skills[skill] = newCrew.skills[skill] * (100 + newCrew.crit / critBonusDivider) / 100;
		});

		return newCrew;
	});

	let sortedCrew: ISortedCrew[] = [];

	function getScore(gauntletCrewItem: IGauntletCrew, maxSkill: any): number {
		var score = gauntletCrewItem.skills[maxSkill]; // double account for preferred skill
		skillList.forEach((skill : string) => {
			score += gauntletCrewItem.skills[skill];
		});

		return score;
	}

	let result: IGauntletCrewSelection = { best: {}, recommendations: [] };

	skillList.forEach((skill: any) => {
		gauntletCrew.sort((a: any, b: any) => {
			return b[skill] - a[skill];
		});
		result.best[skill] = gauntletCrew[0].name;

		// Get the first 2 in the final score sheet
		sortedCrew.push({ 'id': gauntletCrew[0].id, 'name': gauntletCrew[0].name, 'score': getScore(gauntletCrew[0], skill) });
		sortedCrew.push({ 'id': gauntletCrew[1].id, 'name': gauntletCrew[1].name, 'score': getScore(gauntletCrew[1], skill) });
	});

	sortedCrew.sort((a: any, b: any) => {
		return b.score - a.score;
	});

	// Remove duplicates
	let seen = new Set();
	sortedCrew = sortedCrew.filter((item: any) => {
		if (seen.has(item.id)) {
			return false;
		}
		else {
			seen.add(item.id);
			return true;
		}
	});

	// Get the first 5
	sortedCrew = sortedCrew.slice(0, 5);

	result.recommendations = sortedCrew.map(function (crew) { return crew.id });

	return result;
}