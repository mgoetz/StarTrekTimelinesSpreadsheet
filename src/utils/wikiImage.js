import STTApi from '../api/STTApi.ts';

const CONFIG = require('./config.js');

export function getWikiImageUrl(fileName, id) {
	return STTApi.wikiImages.where('fileName').equals(fileName).first((entry) => {
		if (entry) {
			//console.info('Found ' + fileName + ' in the cache with url ' + entry.url);
			return Promise.resolve({id: id, url: entry.url});
		} else {
			return STTApi.networkHelper.get('https://stt.wiki/w/api.php', {
				action: 'query',
				titles: 'File:' + fileName + "|File:" + fileName.replace('png','PNG') + "|File:" + fileName.replace('.png','_Full.png' )+ "|File:" + fileName.replace('_','-'),
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
		
				if (foundUrl) {
					return Promise.resolve({id: id, url: foundUrl});
				} else {
					return Promise.reject('The Wiki doesn\'t have an image yet for ' + fileName);
				}
			}).then((found) => {
				//console.info('Caching ' + fileName + ' with url ' + found.url);

				return STTApi.wikiImages.put({
					fileName: fileName,
					url: found.url
				}).then((a) => {
					return Promise.resolve(found);
				});
			});
		}
	});
}