const fs = require('fs');
const electron = require('electron');

export class FileImageCache {
	basePath;
	constructor() {
		const app = electron.app || electron.remote.app;
		this.basePath = app.getPath('userData') + '/imagecache/';
	}

	formatUrl(url) {
		return this.basePath + url.substr(1).replace(new RegExp('/', 'g'), '_') + '.png';
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

	bitmapToPng(data, callback) {
		var canvas = document.createElement('canvas');
		canvas.height = data.height;
		canvas.width = data.width;

		var ctx = canvas.getContext('2d');
		var myImageData = new ImageData(new Uint8ClampedArray(data.data), data.width, data.height);
		ctx.putImageData(myImageData, 0, 0);

		canvas.toBlob((blob) => {
			let fileReader = new FileReader();
			fileReader.onload = function (progressEvent) {
				callback(new Uint8Array(progressEvent.target.result));
			};
			fileReader.readAsArrayBuffer(blob);
		});
	}

	saveImage(url, data) {
		return new Promise((resolve, reject) => {
			fs.exists(this.basePath, (exists) => {
				if (!exists) {
					fs.mkdirSync(this.basePath);
				}

				if (data.data.length > 0) {
					this.bitmapToPng(data, (pngData) => {
						fs.writeFile(this.formatUrl(url), pngData, (err) => {
							resolve('file://' + this.formatUrl(url));
						});
					});
				}
				else {
					reject('Invalid data');
				}
			});
		});
	}
}