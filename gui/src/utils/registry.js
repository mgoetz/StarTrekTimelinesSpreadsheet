var regedit;
try { regedit = require('electron').remote.require('regedit'); } catch (err) { regedit = null; }

export function loadAccessTokenFromRegistry(callback, errCallback) {
	if (regedit) {
		regedit.list('HKCU\\Software\\DisruptorBeam\\Star Trek', function (err, result) {
			if (!result) {
				if (errCallback)
					errCallback('Registry key not found! Make sure you installed the Steam app and logged in.');
				return;
			}

			for (var prop in result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values) {
				if (prop.includes('access_token')) {
					var value = String.fromCharCode.apply(String, result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values[prop].value);

					// Clean up the string
					value = value.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/[\u0000-\u0019]+/g, "");
					var reg = JSON.parse(value);
					callback(reg.token);

					return;
				}
			}
		});
	}
	else
	{
		errCallback('Registry module not installed.');
	}
}