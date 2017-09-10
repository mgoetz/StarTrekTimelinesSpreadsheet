import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Link } from 'office-ui-fabric-react/lib/Link';

export class AboutAndHelp extends React.Component {
	render() {
		return <div>
			<h1>Star Trek Timelines Spreadsheet Tool v{require('electron').remote.app.getVersion()}</h1>
			<p>A tool to help with crew management in Star Trek Timelines</p>

			<p><b>NOTE</b> This tool does not (and will never) automate any part of the game play; its sole purpose is to help players organize their crew using the functionality built within or with a spreadsheet application of their choice.</p>

			<p><b>DISCLAIMER</b> This tool is provided "as is", without warranty of any kind. Use at your own risk! It should be understood that <i>Star Trek Timelines</i> content and materials are trademarks and copyrights of <Link href='https://www.disruptorbeam.com/tos/' target='_blank'>Disruptor Beam, Inc.</Link> or its licensors. All rights reserved. This tool is neither endorsed by nor affiliated with Disruptor Beam, Inc..</p>
			<p>All images (crew portraits, items) displayed in the tool are references to <Link href='https://stt.wiki/wiki/Main_Page' target='_blank'>stt.wiki</Link>.</p>

			<Label>For feedback, bugs and other issues please use the <Link href='https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet/issues' target='_blank'>GitHub page</Link>.</Label>
		</div>;
	}
}