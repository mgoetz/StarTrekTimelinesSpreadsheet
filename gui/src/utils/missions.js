const request = require('electron').remote.require('request');
const CONFIG = require('./config.js');

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

function loadQuestData(token, quest, callback) {
	const reqOptions = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/quest/conflict_info',
		qs: {
			client_api: CONFIG.client_api_version,
			access_token: token,
			id: quest.id
		}
	};

	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var newQuest = JSON.parse(body);

			//TODO: Is there a better way to copy this without rewriting the original ref?
			quest.description = newQuest.description;
			quest.challenges = newQuest.challenges;
			quest.mastery_levels = newQuest.mastery_levels;
		}
		else
		{
			//TODO: Report error
		}

		callback();
	});
}

export function loadMissionData(token, accepted_missions, callback) {
	var mission_ids = accepted_missions.map(function (mission) { return mission.id; });

	const reqOptions = {
		method: 'GET',
		uri: 'https://stt.disruptorbeam.com/mission/info',
		qs: {
			client_api: CONFIG.client_api_version,
			access_token: token,
			ids: mission_ids
		},
		qsStringifyOptions: { arrayFormat: 'brackets' }
	};

	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var missions = [];

			JSON.parse(body).character.accepted_missions.forEach(function (mission) {
				if (mission.episode_title != null) {
					var missionData = {
						id: mission.id,
						episode_title: mission.episode_title,
						description: mission.description,
						stars_earned: mission.stars_earned,
						total_stars: mission.total_stars,
						quests: []
					};

					mission.quests.forEach(function (quest) {
						if ((!quest.locked) && quest.name) {
							if (quest.quest_type == 'ConflictQuest')
							{
								loadQuestData(token, quest, queue('quests'));
							}
							else
							{
								quest.description = 'Ship battle';
							}

							missionData.quests.push(quest);
						}
					});

					missions.push(missionData);
				}
			});

			queue.done('quests', function () {
				callback({ missionList: missions });
			});
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}
/*
// Get details for each quest:

//https://stt.disruptorbeam.com/quest/conflict_info?id=221&client_api=8&access_token=186414c8-43bd-47be-b7c2-56fd03dc46e0

data.description

data.name

masteryBasic = data.mastery_levels[0]; //1, 2
masteryBasic.energy_cost
masteryBasic.progress.goal_progress - masteryBasic.progress.goals

if (masteryElite.locked) // the critical value will be for mastery 2 only

data.challenges.forEach(function (challenge) {
	challenge.name
	challenge.skill // "science_skill"
	challenge.difficulty_by_mastery // [114, 234, 515]
	challenge.trait_bonuses // [{trait: "hologram", bonuses: [27, 55, 122]}]
	challenge.critical.threshold // 149
});*/