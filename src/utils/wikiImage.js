const request = require('electron').remote.require('request');

const CONFIG = require('./config.js');

export function getWikiImageUrl(imageURLs, fileName, id, callback, errCallback) {
	var result = imageURLs.findOne({ fileName: fileName });
	if (result) {
		callback(id, result.url);
		return;
	}

	//TODO: why are there so many we can't find?
	//console.info('Didn\'t find ' + fileName + ' in cache');

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
			var url = '';

			try {
				var imageInfo = JSON.parse(body).query.pages;
				if ((Object.keys(imageInfo).length > 0) && imageInfo[Object.keys(imageInfo)[0]].imageinfo) {
					url = imageInfo[Object.keys(imageInfo)[0]].imageinfo[0].url;
				}

				imageURLs.insert({
					fileName: fileName,
					url: url
				});

				callback(id, url);
			}
			catch (e) {
				console.error(e);
				if (errCallback)
					errCallback(e);
			}
		}
	});
}