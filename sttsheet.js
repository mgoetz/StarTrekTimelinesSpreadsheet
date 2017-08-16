// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE COPYRIGHT HOLDERS OR ANYONE
// DISTRIBUTING THE SOFTWARE BE LIABLE FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
// OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Star Trek Timelines content and materials are trademarks and copyrights of Disruptor Beam: https://www.disruptorbeam.com/games/star-trek-timelines/
// I have no affiliation with Disruptor Beam or any of its partners.

var regedit = require('regedit')
var request = require('request');

function getAccessToken(callback)
{
	if (process.argv.length <= 2)
	{
		regedit.list('HKCU\\Software\\DisruptorBeam\\Star Trek', function(err, result) {
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
				}
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
	var allItems = new Object();

	crew_avatars.forEach(function (crew)
	{
		allItems[crew.id] = {
			id: crew.id, name: crew.name, short_name: crew.short_name, max_rarity: crew.max_rarity,
			level: 0, rarity: 0, frozen: 0, buyback: false, traits: '""',
			command_skill: { 'core': 0, 'min': 0, 'max': 0 }, science_skill: { 'core': 0, 'min': 0, 'max': 0 },
			security_skill: { 'core': 0, 'min': 0, 'max': 0 }, engineering_skill: { 'core': 0, 'min': 0, 'max': 0 },
			diplomacy_skill: { 'core': 0, 'min': 0, 'max': 0 }, medicine_skill: { 'core': 0, 'min': 0, 'max': 0 }
		};
	});

	character.stored_immortals.forEach(function (crew)
	{
		allItems[crew.id].frozen = crew.quantity;
	});

	character.crew.forEach(function (crew)
	{
		allItems[crew.archetype_id].level = crew.level;
		allItems[crew.archetype_id].rarity = crew.rarity;
		allItems[crew.archetype_id].buyback = crew.in_buy_back_state;

		for (var skill in crew.skills)
		{
			allItems[crew.archetype_id][skill].core = crew.skills[skill].core;
			allItems[crew.archetype_id][skill].min = crew.skills[skill].range_min;
			allItems[crew.archetype_id][skill].max = crew.skills[skill].range_max;
		}

		allItems[crew.archetype_id].traits = '"' + crew.traits.concat(crew.traits_hidden).join() + '"';
	});

	return allItems;
}

function finishedLoading()
{
	var AllItems = matchCrew(allcrew.crew_avatars, player.player.character);

	console.log('id,name,short_name,max_rarity,rarity,level,frozen,buyback,command,command_min,command_max,diplomacy,diplomacy_min,diplomacy_max,engineering,engineering_min,engineering_max,medicine,medicine_min,medicine_max,science,science_min,science_max,security,security_min,security_max,traits');

	for (var item in AllItems)
	{
		console.log(AllItems[item].id + ',"' + AllItems[item].name + '",' + AllItems[item].short_name + ',' + AllItems[item].max_rarity + ',' + AllItems[item].rarity + ',' + AllItems[item].level
			+ ',' + AllItems[item].frozen + ',' + AllItems[item].buyback + ','
			+ AllItems[item].command_skill.core + ',' + AllItems[item].command_skill.min + ',' + AllItems[item].command_skill.max + ','
			+ AllItems[item].diplomacy_skill.core + ',' + AllItems[item].diplomacy_skill.min + ',' + AllItems[item].diplomacy_skill.max + ','
			+ AllItems[item].engineering_skill.core + ',' + AllItems[item].engineering_skill.min + ',' + AllItems[item].engineering_skill.max + ','
			+ AllItems[item].medicine_skill.core + ',' + AllItems[item].medicine_skill.min + ',' + AllItems[item].medicine_skill.max + ','
			+ AllItems[item].science_skill.core + ',' + AllItems[item].science_skill.min + ',' + AllItems[item].science_skill.max + ','
			+ AllItems[item].security_skill.core + ',' + AllItems[item].security_skill.min + ',' + AllItems[item].security_skill.max + ','
			+ AllItems[item].traits);
	}
}

getAccessToken(function(token)
{
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
