const builder = require("electron-builder");
const Platform = builder.Platform;
const path = require('path');

const rootPath = path.join('./');
const outPath = path.join(rootPath, 'builds');

// Promise is returned
builder.build({
	targets: Platform.WINDOWS.createTarget(),
	prepackaged: path.join(outPath, 'startrektimelinestool-win32-x64'),
	config: {
		win: { target: ['nsis', '7z'] }
	}
})
	.then(() => {
		// handle result
	})
	.catch((error) => {
		// handle error
	});
