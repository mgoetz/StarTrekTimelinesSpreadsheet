import '../assets/css/App.css';
import React, { Component } from 'react';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuProps, IContextualMenuItem, DirectionalHint, ContextualMenu } from 'office-ui-fabric-react/lib/ContextualMenu';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Pivot, PivotItem, PivotLinkFormat, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import { getWikiImageUrl } from '../utils/wikiImage.js';
import { exportExcel } from '../utils/excelExporter.js';
import { exportCsv } from '../utils/csvExporter.js';
import { loadGauntlet } from '../utils/gauntlet.js';
import { loadData } from '../utils/dataLoader.js';
import { matchCrew } from '../utils/crewTools.js';
import { matchShips } from '../utils/shipTools.js';

import { AccessTokenDialog } from './AccessTokenDialog.js';
import { ShipList } from './ShipList.js';
import { ItemList } from './ItemList.js';
import { CrewList } from './CrewList.js';
import { GauntletHelper } from './GauntletHelper.js';

const shell = require('electron').shell;

const CONFIG = require('../utils/config.js');

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showSpinner: false,
			dataLoaded: false,
			captainName: 'captain',
			secondLine: '',
			captainAvatarUrl: '',
			crewList: [],
			shipList: [],
			itemList: [],
			gauntlet: null,
			spinnerLabel: 'Loading...'
		};

		this._onAccessToken = this._onAccessToken.bind(this);
		this._getCommandItems = this._getCommandItems.bind(this);
	}

	render() {
		return (
			<Fabric>
				<table>
					<tbody>
					<tr>
						<td rowSpan='2'>
							<Image src={this.state.captainAvatarUrl} height={60} />
						</td>
						<td>
							<b>Hello, {this.state.captainName}!</b>
						</td>
					</tr>
					<tr>
						<td>
							<Label>{this.state.secondLine}</Label>
						</td>
					</tr>
					</tbody>
				</table>

				{this.state.showSpinner && (
					<Spinner size={SpinnerSize.large} label={this.state.spinnerLabel} /> 
				)}

				{this.state.dataLoaded && (
					<Pivot linkFormat={PivotLinkFormat.tabs} linkSize={PivotLinkSize.large}>
						<PivotItem linkText='Crew' itemIcon='Teamwork'>
							<CommandBar items={this._getCommandItems()} />
							<CrewList data={this.state.crewList} ref='crewList' />
						</PivotItem>
						<PivotItem linkText='Items' itemIcon='Boards'>
							<ItemList data={this.state.itemList} />
						</PivotItem>
						<PivotItem linkText='Ships' itemIcon='Airplane'>
							<ShipList data={this.state.shipList} />
						</PivotItem>
						<PivotItem linkText='Gauntlet' itemIcon='DeveloperTools'>
							<GauntletHelper gauntlet={this.state.gauntlet} crew={this.state.crewList} />
						</PivotItem>
					</Pivot>
				)}

				<AccessTokenDialog ref='loginDialog' onAccessToken={this._onAccessToken} />
			</Fabric>
		);
	}

	_getCommandItems()
	{
		return [
			{
				key: 'exportExcel',
				name: 'Export Excel',
				icon: 'ExcelLogo',
				onClick: function () {
					const { dialog } = require('electron').remote;

					dialog.showSaveDialog(
						{
							filters: [ { name: 'Excel sheet (*.xlsx)', extensions: ['xlsx'] } ],
							title: 'Export Star Trek Timelines crew roster',
							defaultPath: 'My Crew.xlsx',
							buttonLabel: 'Export'
						},
						function (fileName) {
							if (fileName === undefined)
								return;

							exportExcel(this.state.crewList, this.state.itemList, this.state.shipList, fileName, function (filePath) {
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

							exportCsv(this.state.crewList, fileName, function (filePath) {
								shell.openItem(filePath);
							});
						}.bind(this));

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

	_onAccessToken(accesstoken) {
		this.setState({ showSpinner: true });
		loadData(accesstoken, function (data)
		{
			if (data.player)
			{
				this.setState({ spinnerLabel: 'Loading player data...' });
				this.player = data.player;
			}

			if (data.config) {
				this.setState({ spinnerLabel: 'Loading config...' });
				this.config = data.config;
			}

			if (data.allcrew) {
				this.setState({ spinnerLabel: 'Loading crew data...' });
				this.allcrew = data.allcrew;
			}

			if (data.errorMsg || (data.statusCode && (data.statusCode != 200)))
			{
				this.setState({ showSpinner: false });
				this.refs.loginDialog._showDialog((data.statusCode == 401) ? 'Incorrect access token. Try again!' : 'Unknown network error.');
			}

			if (this.player && this.config && this.allcrew)
			{
				// Successfully loaded all the needed data
				this.setState({
					showSpinner: false,
					captainName: this.player.player.character.display_name,
					secondLine: 'Level ' + this.player.player.character.level,
					itemList: this.player.player.character.items
				});

				getWikiImageUrl(this.player.player.character.crew_avatar.name.split(' ').join('_') + '_Head.png', 0, function (id, url)
				{
					this.setState({ captainAvatarUrl: url });
				}.bind(this));

				loadGauntlet(accesstoken, function (data) {
					if (data.gauntlet) {
						this.setState({ gauntlet: data.gauntlet });
					}
				}.bind(this));

				matchCrew(this.allcrew.crew_avatars, this.player.player.character, accesstoken, this.config.config.trait_names, function (roster) {
					roster.forEach(function (crew) {
						crew.iconUrl = '';
					});

					this.setState({ dataLoaded: true, crewList: roster });

					roster.forEach(function (crew) {
						getWikiImageUrl(crew.name.split(' ').join('_') + '_Head.png', crew.id, function (id, url) {
							this.state.crewList.forEach(function (crew) {
								if (crew.id === id)
									crew.iconUrl = url;
							});

							this.forceUpdate();
						}.bind(this));
					}.bind(this));

				}.bind(this));

				matchShips(this.player.player.character.ships, accesstoken, function (ships) {
					this.setState({ shipList: ships });
				}.bind(this));
			}
		}.bind(this));
	}
}

export default App;
