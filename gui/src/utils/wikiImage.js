const request = require('electron').remote.require('request');

export function getWikiImageUrl(fileName, id, callback, errCallback) {
	const reqOptions = {
		method: 'GET',
		uri: 'https://stt.wiki/w/api.php',
		qs: {
			action: 'query',
			titles: 'File:' + fileName,
			prop: 'imageinfo',
			iiprop: 'url|metadata',
			format: 'json'
		}
	};

	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var imageInfo = JSON.parse(body);
			var url = '';

			try {
				url = imageInfo.query.pages[Object.keys(imageInfo.query.pages)[0]].imageinfo[0].url;
			}
			catch (e) {
				if (errCallback)
					errCallback(e);
			}

			callback(id, url);
		}
	});
}