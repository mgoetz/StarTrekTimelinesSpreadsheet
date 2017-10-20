/*
    StarTrekTimelinesSpreadsheet - A tool to help with crew management in Star Trek Timelines
    Copyright (C) 2017 IAmPicard

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import '../assets/css/App.css';
import React, { Component } from 'react';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuProps, IContextualMenuItem, DirectionalHint, ContextualMenu } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Pivot, PivotItem, PivotLinkFormat, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';

import { exportExcel } from '../utils/excelExporter.js';
import { exportCsv } from '../utils/csvExporter.js';
import { shareCrew } from '../utils/pastebin.js';
import { FileImageCache } from '../utils/fileImageCache.js';

import { LoginDialog } from './LoginDialog.js';
import { ShipList } from './ShipList.js';
import { ItemList } from './ItemList.js';
import { CrewList } from './CrewList.js';
import { GauntletHelper } from './GauntletHelper.js';
import { MissionExplorer } from './MissionExplorer.js';
import { CrewRecommendations } from './CrewRecommendations.js';
import { AboutAndHelp } from './AboutAndHelp.js';
import { FleetDetails } from './FleetDetails.js';
import { ShareDialog } from './ShareDialog.js';
import { EquipmentDetails } from './EquipmentDetails.js';
import { CaptainCard } from './CaptainCard.js';
import { FeedbackPanel } from './FeedbackPanel.js';
import { ShakingButton } from './ShakingButton.js';

import STTApi from 'sttapi';
import { loginSequence } from 'sttapi';

const compareSemver = require('compare-semver');
const electron = require('electron');
const app = electron.app || electron.remote.app;
const shell = electron.shell;

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showSpinner: false,
			dataLoaded: false,
			isCaptainCalloutVisible: false,
			showLoginDialog: false,
			captainName: 'Welcome!',
			secondLine: '',
			captainAvatarUrl: '',
			captainAvatarBodyUrl: '',
			spinnerLabel: 'Loading...'
		};

		this._captainButtonElement = null;
		this._onAccessToken = this._onAccessToken.bind(this);
		this._onLogout = this._onLogout.bind(this);
		this._getCommandItems = this._getCommandItems.bind(this);
		this._onShare = this._onShare.bind(this);
		this._onCaptainClicked = this._onCaptainClicked.bind(this);
		this._onCaptainCalloutDismiss = this._onCaptainCalloutDismiss.bind(this);
		this._onDataFinished = this._onDataFinished.bind(this);
		this._onDataError = this._onDataError.bind(this);
		this._playerResync = this._playerResync.bind(this);

		STTApi.setImageProvider(true, new FileImageCache());

		STTApi.loginWithCachedAccessToken().then((success) => {
			if (success) {
				this.setState({ showSpinner: true, showLoginDialog: false });
				this._onAccessToken();
			}
			else {
				this.setState({ showLoginDialog: true });
			}
		});
	}

	_onCaptainClicked() {
		if (!this.state.showSpinner)
			this.setState({ isCaptainCalloutVisible: !this.state.isCaptainCalloutVisible });
	}

	_onCaptainCalloutDismiss() {
		this.setState({
			isCaptainCalloutVisible: false
		});
	}

	componentDidMount() {
		this.intervalPlayerResync = setInterval(this._playerResync, 5 * 60 * 1000);
	}

	componentWillUnmount() {
		clearInterval(this.intervalPlayerResync);
	}

	_playerResync() {
		// Every 5 minutes, refresh the player currency data (the number of merits, chronitons, etc.)
		if (this.state.dataLoaded) {
			STTApi.resyncPlayerCurrencyData();
		}
	}

	render() {
		return (
			<Fabric className='App'>
				<div className='lcars'>
					<div className='lcars-corner-left' />
					<div className='lcars-content'>
						<Image src={this.state.captainAvatarUrl} height={25} />
					</div>
					<div className='lcars-ellipse' />
					<div className='lcars-content-text'>
						<span style={{ cursor: 'pointer' }} onClick={this._onCaptainClicked} ref={(menuButton) => this._captainButtonElement = menuButton}>{this.state.captainName}</span>
						{this.state.isCaptainCalloutVisible && (
							<Callout className='CaptainCard-callout'
								role={'alertdialog'}
								gapSpace={0}
								targetElement={this._captainButtonElement}
								onDismiss={this._onCaptainCalloutDismiss}
								setInitialFocus={true}
							>
								<CaptainCard captainAvatarBodyUrl={this.state.captainAvatarBodyUrl} onLogout={this._onLogout} />
							</Callout>
						)}
					</div>
					<div className='lcars-ellipse' />
					<div className='lcars-content-text'>
						{this.state.secondLine}
					</div>
					<div className='lcars-box' />
					<div className='lcars-content'>
						<ShakingButton iconName='Emoji2' title='Feedback' interval={10000} onClick={() => this.refs.feedbackPanel.show()} />
					</div>
					<div className='lcars-corner-right' />
				</div>

				<FeedbackPanel ref='feedbackPanel' />

				{this.state.showSpinner && (
					<Spinner size={SpinnerSize.large} label={this.state.spinnerLabel} />
				)}

				{this.state.dataLoaded && (
					<Pivot linkFormat={PivotLinkFormat.tabs} linkSize={PivotLinkSize.large}>
						<PivotItem linkText='Crew' itemIcon='Teamwork'>
							<CommandBar items={this._getCommandItems()} />
							<SearchBox labelText='Search by name or trait...'
								onChange={(newValue) => this.refs.crewList.filter(newValue)}
								onSearch={(newValue) => this.refs.crewList.filter(newValue)}
							/>
							<CrewList data={STTApi.roster} grouped={false} ref='crewList' />
						</PivotItem>
						<PivotItem linkText='Items' itemIcon='Boards'>
							<SearchBox labelText='Search by name description...'
								onChange={(newValue) => this.refs.itemList.filter(newValue)}
								onSearch={(newValue) => this.refs.itemList.filter(newValue)}
							/>
							<ItemList data={STTApi.playerData.character.items} ref='itemList' />
						</PivotItem>
						<PivotItem linkText='Equipment' itemIcon='CheckList'>
							<EquipmentDetails />
						</PivotItem>
						<PivotItem linkText='Ships' itemIcon='Airplane'>
							<ShipList />
						</PivotItem>
						<PivotItem linkText='Missions' itemIcon='Trophy'>
							<MissionExplorer />
						</PivotItem>
						<PivotItem linkText='Recommendations' itemIcon='Lightbulb'>
							<CrewRecommendations />
						</PivotItem>
						<PivotItem linkText='Gauntlet' itemIcon='DeveloperTools'>
							<GauntletHelper />
						</PivotItem>
						<PivotItem linkText='Fleet' itemIcon='WindDirection'>
							<FleetDetails />
						</PivotItem>
						<PivotItem linkText='About' itemIcon='Help'>
							<AboutAndHelp />
						</PivotItem>
					</Pivot>
				)}

				<LoginDialog ref='loginDialog' onAccessToken={this._onAccessToken} shownByDefault={this.state.showLoginDialog} />
				<ShareDialog ref='shareDialog' onShare={this._onShare} />
			</Fabric>
		);
	}

	_getCommandItems() {
		return [
			{
				key: 'exportExcel',
				name: 'Export Excel',
				icon: 'ExcelLogo',
				onClick: function () {
					const { dialog } = require('electron').remote;

					dialog.showSaveDialog(
						{
							filters: [{ name: 'Excel sheet (*.xlsx)', extensions: ['xlsx'] }],
							title: 'Export Star Trek Timelines crew roster',
							defaultPath: 'My Crew.xlsx',
							buttonLabel: 'Export'
						},
						function (fileName) {
							if (fileName === undefined)
								return;

							exportExcel(STTApi.playerData.character.items, fileName).then((filePath) => {
								shell.openItem(filePath);
							});
						}.bind(this));

				}.bind(this)
			},
			{
				key: 'exportCsv',
				name: 'Export CSV',
				icon: 'ExcelDocument',
				onClick: function () {
					const { dialog } = require('electron').remote;

					dialog.showSaveDialog(
						{
							filters: [{ name: 'Comma separated file (*.csv)', extensions: ['csv'] }],
							title: 'Export Star Trek Timelines crew roster',
							defaultPath: 'My Crew.csv',
							buttonLabel: 'Export'
						},
						function (fileName) {
							if (fileName === undefined)
								return;

							exportCsv(fileName).then((filePath) => {
								shell.openItem(filePath);
							});
						}.bind(this));

				}.bind(this)
			},
			{
				key: 'share',
				name: 'Share',
				icon: 'Share',
				onClick: function () {
					this.refs.shareDialog._showDialog(this.state.captainName);
				}.bind(this)
			},
			{
				key: 'configure',
				name: 'Configure',
				icon: 'Settings',
				subMenuProps: {
					items: [
						{
							key: 'grouping',
							name: 'Group options',
							subMenuProps: {
								items: [
									{
										key: 'none',
										name: 'None',
										//canCheck: true,
										//checked: this.refs.crewList ? (this.refs.crewList.getGroupedColumn() == '') : false,
										onClick: function () { this.refs.crewList.setGroupedColumn(''); }.bind(this)
									},
									{
										key: 'rarity',
										name: 'Group by rarity',
										//canCheck: true,
										//checked: this.refs.crewList ? (this.refs.crewList.getGroupedColumn() == 'max_rarity') : false,
										onClick: function () { this.refs.crewList.setGroupedColumn('max_rarity'); }.bind(this)
									}
								]
							}
						}
					]
				}
			}
		];
	}

	_onShare(options) {
		shareCrew(options).then((url) => {
			shell.openItem(url);
		});
	}

	_onAccessToken() {
		this.setState({ showSpinner: true });

		loginSequence((progressLabel) => this.setState({ spinnerLabel: progressLabel }))
			.then(this._onDataFinished)
			.catch(this._onDataError);
	}

	_onLogout() {
		// TODO: Implement a logout in STTApi itself to clear out any old data before proceeding
		this.setState({ showLoginDialog: true, dataLoaded: false, captainName: 'Welcome!', spinnerLabel: 'Loading...', secondLine: ''});
	}

	_onDataError(reason) {
		this.setState({ showSpinner: false });
		this.refs.loginDialog._showDialog('Network error:' + reason);
	}

	_onDataFinished() {
		this.setState({
			showSpinner: false,
			captainName: STTApi.playerData.character.display_name,
			secondLine: 'Level ' + STTApi.playerData.character.level,
			dataLoaded: true
		});

		STTApi.getGithubReleases().then((data) => {
			let versions = data.map((release) => release.tag_name.replace('v', ''));

			if (compareSemver.max(versions) != app.getVersion()) {
				var n = new Notification('STT Tool - Update available!', { body: 'A new release of the Star Trek Tool (' + data[0].tag_name + ' ' + data[0].name + ') has been made available. Please check the About tab for download instructions!' });
			}
		});

		if (STTApi.playerData.character.crew_avatar) {
			STTApi.imageProvider.getCrewImageUrl(STTApi.playerData.character.crew_avatar, false, 0).then(({ id, url }) => {
				this.setState({ captainAvatarUrl: url });
			}).catch((error) => { this.setState({ captainAvatarUrl: '' }); });

			STTApi.imageProvider.getCrewImageUrl(STTApi.playerData.character.crew_avatar, true, 0).then(({ id, url }) => {
				this.setState({ captainAvatarBodyUrl: url });
			}).catch((error) => { this.setState({ captainAvatarBodyUrl: '' }); });
		}

		this.refs.crewList.filter('');
	}
}

export default App;
