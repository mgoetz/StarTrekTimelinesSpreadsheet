const request = require('request');
const CONFIG = require('./config.js');

export function loadData(token, callback) {
	if (!token)
		return;

	const reqOptions = { method: 'GET', qs: { client_api: CONFIG.client_api_version, access_token: token } };

	reqOptions.uri = 'https://stt.disruptorbeam.com/player';
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ player: JSON.parse(body) });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});

	reqOptions.uri = 'https://stt.disruptorbeam.com/config/platform';
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ config: JSON.parse(body) });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});

	reqOptions.uri = 'https://stt.disruptorbeam.com/character/get_avatar_crew_archetypes';
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			callback({ allcrew: JSON.parse(body) });
		}
		else {
			callback({ errorMsg: error, statusCode: response.statusCode });
		}
	});
}