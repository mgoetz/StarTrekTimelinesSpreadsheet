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
					var imageInfo = JSON.parse(body);
					var url = CONFIG.defaultItemIconUrl;

					try {

						if (imageInfo.query.pages.length > 0) {
							url = imageInfo.query.pages[Object.keys(imageInfo.query.pages)[0]].imageinfo[0].url;
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