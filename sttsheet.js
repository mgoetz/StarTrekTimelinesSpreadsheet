// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT HOLDERS OR ANYONE
// DISTRIBUTING THE SOFTWARE BE LIABLE FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
// OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Star Trek Timelines content and materials are trademarks and copyrights of Disruptor Beam: https://www.disruptorbeam.com/games/star-trek-timelines/
// I have no affiliation with Disruptor Beam or any of its partners.

// We need the request module for making the HTTP requests to retireve the data
var request = require('request');

// Use the json2csv module for generating a nice comma separated file out of the array without all the manual string concatenations
var json2csv = require('json2csv');

// Easier to parse command line arguments with this module
const commandLineArgs = require('command-line-args')

// If the regedit module is available, load it. We use the regedit module to retrieve the access token from registry
// on Windows machines that have the Steam Star Trek Timelines app installed
var regedit;
try
{
	regedit = require('regedit');
}
catch(err)
{
	regedit = null;
}

const optionDefinitions = [
	{ name: 'crew', alias: 'c', type: Boolean, defaultValue: true },
	{ name: 'items', alias: 'i', type: Boolean, defaultValue: false },
	{ name: 'ships', alias: 's', type: Boolean, defaultValue: false },
	{ name: 'gauntlet', alias: 'g', type: Boolean, defaultValue: false },
	{ name: 'accesstoken', type: String, defaultOption: true }
];

const options = commandLineArgs(optionDefinitions);

// Function attempts to retrieve the access token, either from registry or from the argument list
function getAccessToken(callback)
{
	if (!options.accesstoken)
	{
		if (!regedit)
		{
			console.log('RegEdit module not found. Pass the access token as a parameter!');
			callback(null);
			return;
		}

		regedit.list('HKCU\\Software\\DisruptorBeam\\Star Trek', function(err, result) {
			if (!result)
			{
				console.log('Registry key not found! Make sure you installed the Steam app and logged in, or pass the access token as a parameter!');
				callback(null);
				return;
			}

			for (var prop in result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values)
			{
				if (prop.includes('access_token'))
				{
					var value = String.fromCharCode.apply(String, result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values[prop].value);

					// Clean up the string
					value = value.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/[\u0000-\u0019]+/g,""); 
					var reg = JSON.parse(value);

					// We have the token, return
					callback(reg.token);
					return;
				}
			}

			if (!result)
			{
				console.log('Access token not found in the registry! Make sure you installed the Steam app and logged in, or pass the access token as a parameter!');
				callback(null);
				return;
			}
		});
	}
	else
	{
		callback(process.argv[2]);
	}
}

var waiting = 3;

var player = null;
var config = null;
var allcrew = null;

function matchCrew(crew_avatars, character, trait_names)
{
	function getDefaults(id)
	{
		var crew = crew_avatars.find(function (archetype) { return archetype.id === id; });
		return {
			id: crew.id, name: crew.name, short_name: crew.short_name, max_rarity: crew.max_rarity,
			level: 0, rarity: 0, frozen: 0, buyback: false, traits: '', rawTraits: [],
			command_skill: { 'core': 0, 'min': 0, 'max': 0 }, science_skill: { 'core': 0, 'min': 0, 'max': 0 },
			security_skill: { 'core': 0, 'min': 0, 'max': 0 }, engineering_skill: { 'core': 0, 'min': 0, 'max': 0 },
			diplomacy_skill: { 'core': 0, 'min': 0, 'max': 0 }, medicine_skill: { 'core': 0, 'min': 0, 'max': 0 }
		};
	}

	var roster = [];

	// Add all the crew in the active roster
	character.crew.forEach(function (crew)
	{
		rosterEntry = getDefaults(crew.archetype_id);
		rosterEntry.level = crew.level;
		rosterEntry.rarity = crew.rarity;
		rosterEntry.buyback = crew.in_buy_back_state;

		for (var skill in crew.skills)
		{
			rosterEntry[skill].core = crew.skills[skill].core;
			rosterEntry[skill].min = crew.skills[skill].range_min;
			rosterEntry[skill].max = crew.skills[skill].range_max;
		}

		rosterEntry.traits = crew.traits.concat(crew.traits_hidden).map(function (trait) { return trait_names[trait] ? trait_names[trait] : trait; }).join();
		rosterEntry.rawTraits = crew.traits;
		roster.push(rosterEntry);
	});

	// Now add all the frozen crew (note: for these, we don't actually get the stats)
	character.stored_immortals.forEach(function (crew) {
		rosterEntry = getDefaults(crew.id);
		rosterEntry.frozen = crew.quantity;
		rosterEntry.level = 100;
		rosterEntry.rarity = rosterEntry.max_rarity;
		roster.push(rosterEntry);
	});

	return roster;
}

// Function gets called when we're done downloading all the data we need
function finishedLoading(token)
{
	if (options.gauntlet)
	{
		const options = { method: 'GET', qs: { client_api: 7, access_token: token, gauntlet_id: -1 } };

		options.uri = 'https://stt.disruptorbeam.com/gauntlet/status';
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var gauntlet = JSON.parse(body);

				var currentGauntlet = gauntlet.character.gauntlets[0];
				if (currentGauntlet.state != 'NONE')
				{
					console.log('It looks like you already started this gauntlet! Try to use this option before joining your next gauntlet');
					return;
				}

				console.log('Calculating best crew for next gauntlet, starting in ' + currentGauntlet.seconds_to_join / 60 + ' minutes...');
				console.log('Featured skill: ' + currentGauntlet.contest_data.featured_skill);
				console.log('Traits: ' + currentGauntlet.contest_data.traits.join());

				var allItems = matchCrew(allcrew.crew_avatars, player.player.character, config.config.trait_names);

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

				var gauntletCrew = allItems.map(function (crew) {
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

				function getScore(gauntletCrewItem, maxSkill)
				{
					score = gauntletCrewItem[maxSkill]; // double account for preferred skill
					skillList.forEach(function (skill) {
						score += gauntletCrewItem[skill];
					});

					return score;
				}

				skillList.forEach(function (skill) {
					gauntletCrew.sort(function (a, b) {
						return b[skill] - a[skill];
					});
					console.log('Best overall for ' + skill + ' : ' + gauntletCrew[0].name)

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

				console.log('Based on the probabilistic algorithm my recommended selection is: ' + sortedCrew.map(function (crew) { return crew.name }).join(', '));
			}
		});
	}
	else if (options.items)
	{
		// Return details about the items
		var fields = [
			{
				label: 'id',
				value: 'archetype_id'
			},
			'name',
			'quantity',
			'rarity',
			{
				label: 'type',
				value: function (row, field, data) {
					return row.icon.file.replace("/items","").split("/")[1];
				}
			},
			{
				label: 'symbol',
				value: function (row, field, data) {
					return row.icon.file.replace("/items", "").split("/")[2];
				}
			},
			{
				label: 'details',
				value: 'flavor'
			}];

		var csv = json2csv({ data: player.player.character.items, fields: fields });
		console.log(csv);
	}
	else if (options.ships)
	{
		// Return details about the ships
		var fields = [
			{
				label: 'id',
				value: 'archetype_id'
			},
			'name',
			'level',
			'max_level',
			'rarity',
			'shields',
			'hull',
			'attack',
			'accuracy',
			'evasion'
			];

		var csv = json2csv({ data: player.player.character.ships, fields: fields });
		console.log(csv);
	}
	else
	{
		// Return details about the crew (default)
		var allItems = matchCrew(allcrew.crew_avatars, player.player.character, config.config.trait_names);

		var fields = ['id', 'name', 'short_name', 'max_rarity', 'rarity', 'level', 'frozen', 'buyback', 'command_skill.core', 'command_skill.min', 'command_skill.max', 'diplomacy_skill.core',
			'diplomacy_skill.min', 'diplomacy_skill.max', 'engineering_skill.core', 'engineering_skill.min', 'engineering_skill.max', 'medicine_skill.core', 'medicine_skill.min', 'medicine_skill.max',
			'science_skill.core', 'science_skill.min', 'science_skill.max', 'security_skill.core', 'security_skill.min', 'security_skill.max', 'traits'];

		var csv = json2csv({ data: allItems, fields: fields });
		console.log(csv);
	}
}

// main code of the tool
getAccessToken(function(token)
{
	if (!token)
		return;

	const options = { method: 'GET', qs: { client_api: 7, access_token: token } };

	options.uri = 'https://stt.disruptorbeam.com/player';
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			player = JSON.parse(body);
			if (--waiting == 0)
				finishedLoading(token);
		}
	});

	options.uri = 'https://stt.disruptorbeam.com/config/platform';
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			config = JSON.parse(body);
			if (--waiting == 0)
				finishedLoading(token);
		}
	});

	options.uri = 'https://stt.disruptorbeam.com/character/get_avatar_crew_archetypes';
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			allcrew = JSON.parse(body);
			if (--waiting == 0)
				finishedLoading(token);
		}
	});
});
