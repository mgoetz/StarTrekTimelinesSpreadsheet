const fs = require('fs');
const electron = require('electron');
const app = electron.app || electron.remote.app;

export class FileImageCache {
	formatUrl(url) {
		return app.getPath('userData') + '/imagecache/' + url.substr(1).replace(new RegExp('/', 'g'), '_') + '.png';
	}

	getImage(url) {
		if (fs.existsSync(this.formatUrl(url))) {
			return 'file://' + this.formatUrl(url);
		}
		else {
			return undefined;
		}
	}

	saveImage(url, data) {
		if (!fs.existsSync(app.getPath('userData') + '/imagecache')) {
			fs.mkdirSync(app.getPath('userData') + '/imagecache');
		}

		fs.writeFileSync(this.formatUrl(url), data);
		return 'file://' + this.formatUrl(url);
	}
}