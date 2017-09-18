const Excel = require('electron').remote.require('exceljs');

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

	return workbook.xlsx.writeFile(fileName).then(() => Promise.resolve(fileName));
}