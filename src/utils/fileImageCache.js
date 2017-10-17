const fs = require('fs');
const electron = require('electron');
const app = electron.app || electron.remote.app;

export class FileImageCache {
	formatUrl(url) {
		return app.getPath('userData') + '/imagecache/' + url.substr(1).replace(new RegExp('/', 'g'), '_') + '.png';
	}

	getImage(url) {
		return new Promise((resolve, reject) => {
			fs.exists(this.formatUrl(url), (exists) => {
				if (exists) {
					resolve('file://' + this.formatUrl(url));
				}
				else {
					resolve(undefined);
				}
			});
		});
	}

	saveImage(url, data) {
		return new Promise((resolve, reject) => {
			fs.exists(app.getPath('userData') + '/imagecache', (exists) => {
				if (!exists) {
					fs.mkdirSync(app.getPath('userData') + '/imagecache');
				}

				fs.writeFile(this.formatUrl(url), data, (err) => {
					resolve('file://' + this.formatUrl(url));
				});
			});
		});
	}
}