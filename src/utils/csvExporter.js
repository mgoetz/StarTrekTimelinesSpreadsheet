const json2csv = require('json2csv');
const fs = require('fs');

// In plain browsers, to avoid using fs, we could do something like this: https://stackoverflow.com/a/18197511

export function exportCsv(roster, fileName) {
	var fields = ['id', 'name', 'short_name', 'max_rarity', 'rarity', 'level', 'frozen', 'buyback', 'command_skill.core', 'command_skill.min', 'command_skill.max', 'diplomacy_skill.core',
		'diplomacy_skill.min', 'diplomacy_skill.max', 'engineering_skill.core', 'engineering_skill.min', 'engineering_skill.max', 'medicine_skill.core', 'medicine_skill.min', 'medicine_skill.max',
		'science_skill.core', 'science_skill.min', 'science_skill.max', 'security_skill.core', 'security_skill.min', 'security_skill.max', 'traits'];

	var csv = json2csv({ data: roster, fields: fields });

	return new Promise(function (resolve, reject) {
		fs.writeFile(fileName, csv, function (err) {
			if (err) { reject(err); }
			else { resolve(fileName); }
		});
	});
}
