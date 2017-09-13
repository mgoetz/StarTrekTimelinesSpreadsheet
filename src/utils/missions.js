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

function loadQuestData(completed, questCache, token, quest, callback) {
	if (completed)
	{
		var result = questCache.findOne({ id: quest.id });
		if (result) {
			quest.description = result.description;
			quest.challenges = result.challenges;
			quest.mastery_levels = result.mastery_levels;

			// For cadet challenges
			quest.cadet = result.cadet;
			quest.crew_requirement = result.crew_requirement;

			callback();
			return;
		}
	}

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
			
			quest.description = newQuest.description;
			quest.challenges = newQuest.challenges;
			quest.mastery_levels = newQuest.mastery_levels;

			// For cadet challenges
			quest.cadet = newQuest.cadet;
			quest.crew_requirement = newQuest.crew_requirement;

			if (completed) {
				questCache.insert({
					id: quest.id,
					description: quest.description,
					challenges: quest.challenges,
					mastery_levels: quest.mastery_levels,
					cadet: quest.cadet,
					crew_requirement: quest.crew_requirement
				});
			}
		}
		else
		{
			//TODO: Report error
		}

		callback();
	});
}

export function loadMissionData(dbCache, token, accepted_missions, dispute_histories, callback) {
	var mission_ids = accepted_missions.map(function (mission) { return mission.id; });

	// Add all the episodes' missions (if not cadet)
	if (dispute_histories) {
		dispute_histories.forEach(function (dispute) {
			mission_ids = mission_ids.concat(dispute.mission_ids);
		});
	}

	// Use the cache wherever possible
	// TODO: does DB ever change the stats of crew? If yes, we may need to ocasionally clear the cache - perhaps based on record's age
	var questCache = dbCache.getCollection('quests');
	if (!questCache) {
		questCache = dbCache.addCollection('quests');
	}

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
								loadQuestData(mission.stars_earned == mission.total_stars, questCache, token, quest, queue('quests'));
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
				else {
					// Could be one of the episodes
					if (dispute_histories) {
						dispute_histories.forEach(function (dispute) {
							if (dispute.mission_ids.includes(mission.id)) {
								if (!dispute.quests)
									dispute.quests = [];

								mission.quests.forEach(function (quest) {
									if ((!quest.locked) && quest.name && !dispute.quests.find(function (q) { return q.id == quest.id; })) {
										if (quest.quest_type == 'ConflictQuest') {
											loadQuestData(dispute.stars_earned == dispute.total_stars, questCache, token, quest, queue('quests'));
										}
										else {
											quest.description = 'Ship battle';
										}

										dispute.quests.push(quest);
									}
								});
							}
						});
					}
				}
			});

			queue.done('quests', function () {
				if (dispute_histories) {
					// Pretend the episodes (disputes) are missions too, to get them to show up
					dispute_histories.forEach(function (dispute) {
						var missionData = {
							id: dispute.mission_ids[0],
							episode_title: 'Episode ' + dispute.episode + ' : ' + dispute.name,
							description: 'Episode ' + dispute.episode,
							stars_earned: dispute.stars_earned,
							total_stars: dispute.total_stars,
							quests: dispute.quests
						};

						missions.push(missionData);
					});
				}

				callback({ missionList: missions });
			});
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}