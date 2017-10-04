const fs = require('electron').remote.require('fs');

import STTApi from 'sttapi';

const CONFIG = require('./config.js');

function pastebinPost(data, exportType) {
	return STTApi.networkHelper.post('https://ptpb.pw/', { 'c': data }, undefined, false).then((data) => {
		var match = /url: (.*)/g.exec(data);
		return Promise.resolve(match[1] + '.' + exportType);
	});
}

export function shareCrew(options) {
	if (options.shareMissions) {
		var allChallenges = [];

		STTApi.missions.forEach(function (mission) {
			mission.quests.forEach(function (quest) {
				if (quest.quest_type == 'ConflictQuest') {
					quest.challenges.forEach(function (challenge) {
						var entry = {
							missionname: mission.episode_title,
							questname: quest.name,
							challengename: challenge.name,
							roll: 0,
							goal_progress: quest.mastery_levels[0].progress.goal_progress + quest.mastery_levels[1].progress.goal_progress + quest.mastery_levels[2].progress.goal_progress,
							skill: challenge.skill,
							cadet: quest.cadet,
							crew_requirement: quest.crew_requirement ? quest.crew_requirement.description.replace(/<#([0-9A-F]{6})>/gi, '<span style="color:#$1">').replace(/<\/color>/g, '</span>') : '',
							traits: [],
							traitBonus: 0,
							lockedTraits: []
						};

						if (challenge.difficulty_by_mastery) {
							entry.roll += challenge.difficulty_by_mastery[2];
						}

						if (challenge.critical && challenge.critical.threshold) {
							entry.roll += challenge.critical.threshold;
						}

						if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
							challenge.trait_bonuses.forEach(function (traitBonus) {
								entry.traits.push(traitBonus.trait);
								entry.traitBonus = traitBonus.bonuses[2];
							});
						}

						entry.traits = entry.traits.map(function (trait) {
							return STTApi.getTraitName(trait);
						}).join(', ');

						if (challenge.locks && (challenge.locks.length > 0)) {
							challenge.locks.forEach(function (lock) {
								if (lock.trait) {
									entry.lockedTraits.push(lock.trait);
								}
							});
						}

						entry.lockedTraits = entry.lockedTraits.map(function (trait) {
							return STTApi.getTraitName(trait);
						}).join(', ');

						allChallenges.push(entry);
					});
				}
			});
		});

		return shareCrewInternal(options, allChallenges);
	}
	else
	{
		return shareCrewInternal(options, null);
	}
}

function sillyTemplatizer(html, options) {
	var re = /<%(.+?)%>/g,
		reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
		code = 'with(obj) { var r=[];\n',
		cursor = 0,
		result,
		match;
	var add = function (line, js) {
		js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
			(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
		return add;
	}
	while (match = re.exec(html)) {
		add(html.slice(cursor, match.index))(match[1], true);
		cursor = match.index + match[0].length;
	}
	add(html.substr(cursor, html.length - cursor));
	code = (code + 'return r.join(""); }').replace(/[\r\t\n]/g, ' ');
	try { result = new Function('obj', code).apply(options, [options]); }
	catch (err) { console.error("'" + err.message + "'", " in \n\nCode:\n", code, "\n"); }
	return result;
}

function shareCrewInternal(options, missionList) {
	var data = '';

	if (options.exportType == 'html') {
		var templateString = require('./exportTemplate.ttml');
		data = sillyTemplatizer(templateString,
			{
				options: options,
				roster:  STTApi.roster,
				missionList: missionList,
				skillRes: CONFIG.skillRes,
				template: options.htmlColorTheme,
				version: require('electron').remote.app.getVersion()
			});
	}
	else if (options.exportType == 'json') {
		data = JSON.stringify({
			title: options.title,
			description: options.description,
			created: {
				tool: 'Star Trek Timelines Spreadsheet Tool v' + require('electron').remote.app.getVersion(),
				url: 'https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet',
				when: (new Date())
			},
			crew: STTApi.roster,
			missions: missionList
		});
	}

	if (options.exportWhere == 'L') {
		return new Promise(function (resolve, reject) {
			fs.writeFile('export.' + options.exportType, data, function (err) {
				if (err) { reject(err); }
				else { resolve(); }
			});
		}).then(() => {
			return Promise.resolve('export.' + options.exportType);
			});
	}
	else {
		return pastebinPost(data, options.exportType);
	}
}