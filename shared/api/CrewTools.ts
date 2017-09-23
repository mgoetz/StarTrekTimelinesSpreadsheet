import STTApi from "./STTApi.ts";

function rosterFromCrew(rosterEntry: any, crew: any): void {
	rosterEntry.level = crew.level;
	rosterEntry.rarity = crew.rarity;
	rosterEntry.buyback = crew.in_buy_back_state;
	rosterEntry.crew_id = crew.id;
	rosterEntry.active_id = crew.active_id;

	for (var skill in crew.skills) {
		rosterEntry[skill].core = crew.skills[skill].core;
		rosterEntry[skill].min = crew.skills[skill].range_min;
		rosterEntry[skill].max = crew.skills[skill].range_max;
	}

	rosterEntry.command_skill_core = rosterEntry.command_skill.core;
	rosterEntry.science_skill_core = rosterEntry.science_skill.core;
	rosterEntry.security_skill_core = rosterEntry.security_skill.core;
	rosterEntry.engineering_skill_core = rosterEntry.engineering_skill.core;
	rosterEntry.diplomacy_skill_core = rosterEntry.diplomacy_skill.core;
	rosterEntry.medicine_skill_core = rosterEntry.medicine_skill.core;

	rosterEntry.ship_battle = crew.ship_battle;

	rosterEntry.equipment_slots = crew.equipment_slots;

	rosterEntry.equipment_slots.forEach((equipment: any) => {
		equipment.have = false;
	});

	crew.equipment.forEach((equipment: any) => {
		rosterEntry.equipment_slots[equipment[0]].have = true;
	});

	rosterEntry.traits = crew.traits.concat(crew.traits_hidden).map((trait: any) => { return STTApi.getTraitName(trait); }).join();
	rosterEntry.rawTraits = crew.traits.concat(crew.traits_hidden);

	// Replace "nonhuman" with "alien" to make the search easier
	let nh = rosterEntry.rawTraits.indexOf('nonhuman');
	if (nh > -1) {
		rosterEntry.rawTraits.splice(nh,1);
		rosterEntry.rawTraits.push('alien');
	}
}

export function matchCrew(character: any): Promise<any> {
	function getDefaults(id: number): any {
		var crew = STTApi.getCrewAvatarById(id);
		return {
			id: crew.id, name: crew.name, short_name: crew.short_name, max_rarity: crew.max_rarity, symbol: crew.symbol,
			level: 0, rarity: 0, frozen: 0, buyback: false, traits: '', rawTraits: [], portrait: crew.portrait.file,
			command_skill: { 'core': 0, 'min': 0, 'max': 0 }, science_skill: { 'core': 0, 'min': 0, 'max': 0 },
			security_skill: { 'core': 0, 'min': 0, 'max': 0 }, engineering_skill: { 'core': 0, 'min': 0, 'max': 0 },
			diplomacy_skill: { 'core': 0, 'min': 0, 'max': 0 }, medicine_skill: { 'core': 0, 'min': 0, 'max': 0 }
		};
	}

	let roster: any[] = [];
	let rosterEntry: any = {};

	// Add all the crew in the active roster
	character.crew.forEach((crew: any) => {
		rosterEntry = getDefaults(crew.archetype_id);
		rosterFromCrew(rosterEntry, crew);
		roster.push(rosterEntry);
	});

	// Now add all the frozen crew
	if (character.stored_immortals && character.stored_immortals.length > 0) {
		// Use the cache wherever possible
		// TODO: does DB ever change the stats of crew? If yes, we may need to ocasionally clear the cache - perhaps based on record's age
		let frozenPromises: Promise<any>[] = [];

		character.stored_immortals.forEach((crew: any) => {
			rosterEntry = getDefaults(crew.id);
			rosterEntry.frozen = crew.quantity;
			rosterEntry.level = 100;
			rosterEntry.rarity = rosterEntry.max_rarity;
			roster.push(rosterEntry);

			frozenPromises.push(loadFrozen(rosterEntry));
		});

		return Promise.all(frozenPromises).then(() => {
			return Promise.resolve(roster);
		});
	}
	else {
		return Promise.resolve(roster);
	}
}

function loadFrozen(rosterEntry: any): Promise<void> {
	return STTApi.immortals.where('symbol').equals(rosterEntry.symbol).first((entry: any) => {
		if (entry) {
			//console.info('Found ' + rosterEntry.symbol + ' in the immortalized crew cache');
			rosterFromCrew(rosterEntry, entry.crew);
			return Promise.resolve();
		} else {
			return STTApi.loadFrozenCrew(rosterEntry.symbol).then((crew: any) => {
				rosterFromCrew(rosterEntry, crew);

				return STTApi.immortals.put({
					symbol: rosterEntry.symbol,
					crew: crew
				}).then(() => {
					return Promise.resolve();
				});
			});
		}
	});
}