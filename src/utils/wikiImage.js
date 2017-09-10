const request = require('electron').remote.require('request');
const storage = require('electron-json-storage');
const CONFIG = require('./config.js');

var sttImageCacheGlobal = null;

export function getWikiImageUrl(fileName, id, callback, errCallback) {

	if (sttImageCacheGlobal && sttImageCacheGlobal[fileName]) {
		callback(id, sttImageCacheGlobal[fileName]);
		return;
	}

	storage.get('sttImageCache', function (error, sttImageCache) {
		if (error) console.error(error);

		if (!sttImageCacheGlobal)
			sttImageCacheGlobal = sttImageCache;

		if (sttImageCache && sttImageCache[fileName])
		{
			callback(id, sttImageCache[fileName]);
		}
		else
		{
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

						if (!sttImageCache)
							sttImageCache = {};
						sttImageCache[fileName] = url;
						sttImageCacheGlobal[fileName] = url;

						storage.set('sttImageCache', sttImageCacheGlobal, function (error) {
							if (error) console.error(error);
							callback(id, url);
						});
					}
					catch (e) {
						console.error(e);
						if (errCallback)
							errCallback(e);
					}
				}
			});
		}
	});
}