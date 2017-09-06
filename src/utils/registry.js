var regedit;
try { regedit = require('electron').remote.require('regedit'); } catch (err) { regedit = null; }
const storage = require('electron-json-storage');
const CONFIG = require('./config.js');

function loadAccessTokenFromCache(callback) {
	storage.get('accessToken', function (error, accessToken) {
		if (accessToken && accessToken.value)
			callback(accessToken.value);
	});
}

export function storeAccessTokenInCache(accessToken) {
	storage.set('accessToken', { value: accessToken }, function (error) {
		if (error) console.error(error);
	});
}

export function loadAccessTokenFromRegistry(callback, errCallback) {
	if (regedit) {
		regedit.list('HKCU\\Software\\DisruptorBeam\\Star Trek', function (err, result) {
			if (!result) {
				if (errCallback)
					errCallback('Registry key not found! Make sure you installed the Steam app and logged in.');
				return loadAccessTokenFromCache(callback);
			}

			for (var prop in result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values) {
				if (prop.includes('access_token')) {
					var value = String.fromCharCode.apply(String, result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values[prop].value);

					// Clean up the string
					value = value.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/[\u0000-\u0019]+/g, "");
					var reg = JSON.parse(value);

					return callback(reg.token);
				}
			}

			return loadAccessTokenFromCache(callback);
		});
	}
	else
	{
		errCallback('Registry module not installed.');
		return loadAccessTokenFromCache(callback);
	}
}