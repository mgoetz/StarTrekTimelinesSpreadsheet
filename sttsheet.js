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

// Function attempts to retrieve the access token, either from registry or from the argument list
function getAccessToken(callback)
{
	if (process.argv.length <= 2)
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

function matchCrew(crew_avatars, character)
{
	function getDefaults(id)
	{
		var crew = crew_avatars.find(function (archetype) { return archetype.id === id; });
		return {
			id: crew.id, name: crew.name, short_name: crew.short_name, max_rarity: crew.max_rarity,
			level: 0, rarity: 0, frozen: 0, buyback: false, traits: '',
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

		rosterEntry.traits = crew.traits.concat(crew.traits_hidden).join();
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
function finishedLoading()
{
	var allItems = matchCrew(allcrew.crew_avatars, player.player.character);

	var fields = ['id', 'name', 'short_name', 'max_rarity', 'rarity', 'level', 'frozen', 'buyback', 'command_skill.core', 'command_skill.min', 'command_skill.max', 'diplomacy_skill.core',
		'diplomacy_skill.min', 'diplomacy_skill.max', 'engineering_skill.core', 'engineering_skill.min', 'engineering_skill.max', 'medicine_skill.core', 'medicine_skill.min', 'medicine_skill.max',
		'science_skill.core', 'science_skill.min', 'science_skill.max', 'security_skill.core', 'security_skill.min', 'security_skill.max', 'traits'];

	var csv = json2csv({ data: allItems, fields: fields });
	console.log(csv);
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
				finishedLoading();
		}
	});

	options.uri = 'https://stt.disruptorbeam.com/config/platform';
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			config = JSON.parse(body);
			if (--waiting == 0)
				finishedLoading();
		}
	});

	options.uri = 'https://stt.disruptorbeam.com/character/get_avatar_crew_archetypes';
	request(options, function(error, response, body) {
		if (!error && response.statusCode == 200)
		{
			allcrew = JSON.parse(body);
			if (--waiting == 0)
				finishedLoading();
		}
	});
});
