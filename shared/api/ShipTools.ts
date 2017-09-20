import STTApi from "./STTApi.ts";

export function matchShips(ships: any): Promise<any> {
	let newShips: any[] = [];
	STTApi.shipSchematics.forEach((schematic: any) => {
		let owned = ships.find((ship: any) => ship.name == schematic.ship.name);
		if (owned) {
			schematic.ship.level = owned.level;
		}
		else {
			schematic.ship.level = 0;
		}

		newShips.push(schematic.ship);
	});
	return Promise.resolve(newShips);
}