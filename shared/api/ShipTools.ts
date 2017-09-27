import STTApi from "./STTApi.ts";

export function matchShips(ships: any): Promise<any> {
	let newShips: any[] = [];
	STTApi.shipSchematics.forEach((schematic: any) => {
		let owned = ships.find((ship: any) => ship.name == schematic.ship.name);
		if (owned) {
			schematic.ship.level = owned.level;
			schematic.ship.id = owned.id;
		}
		else {
			schematic.ship.level = 0;
			schematic.ship.id = 0;
		}

		if (schematic.ship.traits) {
			schematic.ship.traitNames = schematic.ship.traits.concat(schematic.ship.traits_hidden).map((trait: any) => { return STTApi.getShipTraitName(trait); }).join();
		} else {
			schematic.ship.traitNames = '';
		}

		newShips.push(schematic.ship);
	});
	return Promise.resolve(newShips);
}