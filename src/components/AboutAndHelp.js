import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';

const electron = require('electron');
const app = electron.app || electron.remote.app;
const shell = electron.shell || electron.remote.shell;

import STTApi from 'sttapi';

export class AboutAndHelp extends React.Component {
	constructor(props) {
		super(props);

		STTApi.getGithubReleases().then((data) => {
			this.setState({ version: data[0] });
		});

		this.state = {
			version: null
		};
	}

	render() {
		return <div>
			<h1>Star Trek Timelines Spreadsheet Tool v{app.getVersion()}</h1>
			<p>A tool to help with crew management in Star Trek Timelines</p>

			{this.state.version &&
				<div>
				<h3>Latest version: {this.state.version.tag_name} {this.state.version.name}</h3>
				<p>{this.state.version.body}</p>
				<PrimaryButton onClick={() => shell.openItem(this.state.version.html_url)} text='Download now' />
				</div>}

			<p><b>NOTE</b> This tool does not (and will never) automate any part of the game play; its sole purpose is to help players organize their crew using the functionality built within or with a spreadsheet application of their choice.</p>

			<p><b>DISCLAIMER</b> This tool is provided "as is", without warranty of any kind. Use at your own risk! It should be understood that <i>Star Trek Timelines</i> content and materials are trademarks and copyrights of <Link href='https://www.disruptorbeam.com/tos/' target='_blank'>Disruptor Beam, Inc.</Link> or its licensors. All rights reserved. This tool is neither endorsed by nor affiliated with Disruptor Beam, Inc..</p>

			<Label>For feedback, bugs and other issues please use the <Link href='https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet/issues' target='_blank'>GitHub page</Link>. For information about other tools for Star Trek Timelines, see <Link href='https://iampicard.github.io/' target='_blank'>here</Link>.</Label>
		</div>;
	}
}