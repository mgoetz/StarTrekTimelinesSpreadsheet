const request = require('electron').remote.require('request');

const CONFIG = require('./config.js');

export function login(username, password, callback) {
	const reqOptions = {
		method: 'POST',
		uri: 'https://thorium.disruptorbeam.com/oauth2/token',
		form:
		{
			'username': username,
			'password': password,
			'client_id': CONFIG.client_id,
			'grant_type': 'password'
		},
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': '*/*'
		}
	};

	request(reqOptions, function (error, response, body) {
		if (!error) {
			var result = JSON.parse(body);
			if (result.error_description) {
				callback({ errorMsg: result.error_description });
			}
			else {
				callback({ loginDetails: result });
			}
		}
		else {
			callback({ errorMsg: error });
		}
	});
}