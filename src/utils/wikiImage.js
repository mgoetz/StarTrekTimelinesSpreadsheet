import STTApi from '../api/STTApi.ts';

const CONFIG = require('./config.js');

export function getWikiImageUrl(fileName, id) {
	return STTApi.wikiImages.where('fileName').equals(fileName).first((entry) => {
		if (entry) {
			if (entry.url) {
				//console.info('Found ' + fileName + ' in the cache with url ' + entry.url);
				return Promise.resolve({ id: id, url: entry.url });
			} else {
				if ((Date.now() - entry.lastQueried) / 3600000 < CONFIG.hours_to_requery) {
					return Promise.reject('The Wiki didn\'t have an image for ' + fileName);
				}
			}
		}

		return STTApi.networkHelper.get('https://stt.wiki/w/api.php', {
			action: 'query',
			titles: 'File:' + fileName + "|File:" + fileName.replace('png', 'PNG') + "|File:" + fileName.replace('.png', '_Full.png') + "|File:" + fileName.replace('_', '-'),
			prop: 'imageinfo',
			iiprop: 'url|metadata',
			format: 'json'
		}).then((data) => {
			var foundUrl = null;
			Object.values(data.query.pages).forEach((page) => {
				if (page.imageinfo) {
					page.imageinfo.forEach((imgInfo) => {
						foundUrl = imgInfo.url;
					});
				}
			});

			return Promise.resolve({ id: id, url: foundUrl });
		}).then((found) => {

			if (found.url) {
				//console.info('Caching ' + fileName + ' with url ' + found.url);
				return STTApi.wikiImages.put({
					fileName: fileName,
					url: found.url,
					lastQueried: Date.now()
				}).then((a) => {
					return Promise.resolve(found);
				});
			} else {
				// the Wiki doesn't have this image yet, or it was named in a non-standard way

				//console.info('Caching the fact that ' + fileName + ' is not available in the wiki yet');
				return STTApi.wikiImages.put({
					fileName: fileName,
					url: null,
					lastQueried: Date.now()
				}).then((a) => {
					return Promise.reject('The Wiki doesn\'t have an image yet for ' + fileName);
				});
			}
		});
	});
}