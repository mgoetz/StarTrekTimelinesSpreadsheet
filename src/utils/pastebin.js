const request = require('electron').remote.require('request');
const fs = require('electron').remote.require('fs');

const CONFIG = require('./config.js');

function pastebinPost(html, callback) {
	const reqOptions = {
		method: 'POST',
		uri: 'https://ptpb.pw/',
		formData: {
			'c': html
		}
	};

	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var match = /url: (.*)/g.exec(body);
			callback(match[1] + '.html');
		}
		else {
			// TODO: notify user
		}
	});
}

export function shareCrew(roster, options, callback) {
	var html = `<html>
<head>
	<title>${options.title}</title>
	<script type="text/javascript" src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
	<script type="text/javascript" src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js"></script>
	<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/tabulator/3.2.2/js/tabulator.min.js"></script>

	<link href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/cyborg/bootstrap.min.css" rel="stylesheet">
	<link href="https://cdnjs.cloudflare.com/ajax/libs/tabulator/3.2.2/css/bootstrap/tabulator_bootstrap.min.css" rel="stylesheet">

	<style>
	body { margin: 5; }
	</style>
</head>
<body>
	<header>
		<h3>${options.title}</h3>
		<h4>${options.description}</h4>
	</header>
	<div id="crew-table"></div>
	<footer>
		<p>Exported via the <a href="https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet">Star Trek Timelines Spreadsheet Tool</a> on ${(new Date()).toDateString()}.</p>
	</footer>

	<script type="text/javascript">
		function starSvg(filled) {
			var star = '<svg xmlns="http://www.w3.org/2000/svg" style="margin:0 1px;" viewBox="0 0 512 512" width="14" height="14" xmlns:xml="http://www.w3.org/XML/1998/namespace" xml:space="preserve" xmlns:xml="http://www.w3.org/XML/1998/namespace"><polygon fill="#d2d2d2" stroke="#686868" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="37.6152" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919" /></svg>';

			if (filled) {
				star = star.replace('#d2d2d2', '#ffea00').replace('#686868', '#c1ab60');
			}

			return star;
		}

		$("#crew-table").tabulator({
			fitColumns: true,
			columns:[
				{title:"Portrait", field:"iconUrl", width: 70, headerSort:false, responsive:5, formatter:function(cell, formatterParams){
					return "<img src='" + cell.getValue() + "' height='48' />";
				}},
				{title:"Name", field:"name", width:150, responsive:0},
				{title:"Level", field:"level", width:80, align:"center", responsive:1},
				{title:"Rarity", field:"rarity", width:100, responsive:2, formatter:function(cell, formatterParams){
					return starSvg(true).repeat(cell.getValue()) + starSvg(false).repeat(cell.getRow().getData().max_rarity - cell.getValue());
				}},
				{title:"Frozen", field:"frozen", width:90, formatter:"tick", responsive:3},`;

	Object.keys(CONFIG.skillRes).forEach(function (skill) {
		html += `{title:"${CONFIG.skillRes[skill].name}", field:"${skill}_core", width:120, responsive:4, align:"center", formatter:function(cell, formatterParams){
					var crew = cell.getRow().getData();
					if (crew.${skill}.core > 0)
						return "<img src='${CONFIG.skillRes[skill].url}' /> <b>" + crew.${skill}.core + "</b><br/>+(" + crew.${skill}.min + " - " + crew.${skill}.max + ")";
					else
						return "";
				}},`});

	html += `{title:"Traits", field:"traits", responsive:6, headerSort:false},
			]
		});

		var tabledata = ${JSON.stringify(roster)};

		$("#crew-table").tabulator("setData", tabledata);
	</script>
</body>
</html>`;

	if (options.exportWhere == 'L') {
		fs.writeFile('export.html', html, function (err) {
			callback('export.html');
		});
	}
	else {
		pastebinPost(html, callback);

		// find a website where the user could share their crew (for example to gather feedback on forums / reddit, or just to brag)
		// TODO: any other host / pastebin-type for this sort of thing?
		// https://ptpb.pw/
		// https://pste.eu/
		// https://notehub.org/
		// https://www.bitballoon.com/
	}
}