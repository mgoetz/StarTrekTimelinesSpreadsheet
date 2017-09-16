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

import { getWikiImageUrl } from '../utils/wikiImage.js';
import { exportExcel } from '../utils/excelExporter.js';
import { exportCsv } from '../utils/csvExporter.js';
import { shareCrew } from '../utils/pastebin.js';
import { matchCrew } from '../utils/crewTools.js';
import { matchShips } from '../utils/shipTools.js';

import { LoginDialog } from './LoginDialog.js';
import { ShipList } from './ShipList.js';
import { ItemList } from './ItemList.js';
import { CrewList } from './CrewList.js';
import { GauntletHelper } from './GauntletHelper.js';
import { MissionHelper } from './MissionHelper.js';
import { CrewRecommendations } from './CrewRecommendations.js';
import { AboutAndHelp } from './AboutAndHelp.js';
import { FleetDetails } from './FleetDetails.js';
import { ShareDialog } from './ShareDialog.js';
import { EquipmentDetails } from './EquipmentDetails.js';
import { CaptainCard } from './CaptainCard.js';

import STTApi from '../api/STTApi.ts';

const loki = require('lokijs');
const path = require('path');
const electron = require('electron');
const app = electron.app || electron.remote.app;
const shell = electron.shell;

const CONFIG = require('../utils/config.js');

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showSpinner: false,
			dataLoaded: false,
			isCaptainCalloutVisible: false,
			captainName: 'Welcome!',
			secondLine: '',
			captainAvatarUrl: '',
			captainAvatarBodyUrl: '',
			crewList: [],
			shipList: [],
			itemList: [],
			allequipment: [],
			missionHelperParams: {},
			cadetMissionHelperParams: {},
			spinnerLabel: 'Loading...'
		};

		this.dbCache = null;
		this._captainButtonElement = null;

		this._onAccessToken = this._onAccessToken.bind(this);
		this._getCommandItems = this._getCommandItems.bind(this);
		this._onShare = this._onShare.bind(this);
		this._onCaptainClicked = this._onCaptainClicked.bind(this);
		this._onCaptainCalloutDismiss = this._onCaptainCalloutDismiss.bind(this);
		this._onDataFinished = this._onDataFinished.bind(this);
		this._onDataError = this._onDataError.bind(this);

		if (CONFIG.UserConfig.getValue('autoLogin') == true) {
			this.state.showSpinner = true;
			this.state.showLoginDialog = false;
			STTApi.loginWithCachedAccessToken(CONFIG.UserConfig.getValue('accessToken'));
			this._onAccessToken(true);
		}
		else {
			this.state.showLoginDialog = true;
		}
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
								<CaptainCard captainAvatarBodyUrl={this.state.captainAvatarBodyUrl} />
							</Callout>
						)}
					</div>
					<div className='lcars-box' />
					<div className='lcars-content-text'>
						{this.state.secondLine}
					</div>
					<div className='lcars-corner-right' />
				</div>

				{this.state.showSpinner && (
					<Spinner size={SpinnerSize.large} label={this.state.spinnerLabel} /> 
				)}

				{this.state.dataLoaded && (
					<Pivot linkFormat={PivotLinkFormat.tabs} linkSize={PivotLinkSize.large}>
						<PivotItem linkText='Crew' itemIcon='Teamwork'>
							<CommandBar items={this._getCommandItems()} />
							<CrewList data={this.state.crewList} grouped={false} ref='crewList' />
						</PivotItem>
						<PivotItem linkText='Items' itemIcon='Boards'>
							<ItemList data={this.state.itemList} />
						</PivotItem>
						<PivotItem linkText='Equipment' itemIcon='CheckList'>
							<EquipmentDetails crewList={this.state.crewList} allequipment={this.state.allequipment} />
						</PivotItem>
						<PivotItem linkText='Ships' itemIcon='Airplane'>
							<ShipList data={this.state.shipList} />
						</PivotItem>
						<PivotItem linkText='Missions' itemIcon='Ribbon'>
							<MissionHelper params={this.state.missionHelperParams} dbCache={this.dbCache} />
						</PivotItem>
						<PivotItem linkText='Cadet' itemIcon='Trophy'>
							<MissionHelper params={this.state.cadetMissionHelperParams} dbCache={this.dbCache} />
						</PivotItem>
						<PivotItem linkText='Recommendations' itemIcon='Lightbulb'>
							<CrewRecommendations crew={this.state.crewList} cadetMissions={this.state.cadetMissionHelperParams} missions={this.state.missionHelperParams} dbCache={this.dbCache} />
						</PivotItem>
						<PivotItem linkText='Gauntlet' itemIcon='DeveloperTools'>
							<GauntletHelper crew={this.state.crewList} />
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
		shareCrew(this.dbCache, this.state.crewList, options, this.state.missionHelperParams, this.state.cadetMissionHelperParams, function (url) {
			shell.openItem(url);
		});
	}

	componentWillUnmount() {
		if (this.dbCache) {
			this.dbCache.close();
		}
	}

	_onAccessToken(autoLogin) {
		CONFIG.UserConfig.setValue('autoLogin', autoLogin);
		CONFIG.UserConfig.setValue('accessToken', STTApi.accessToken);

		this.setState({ showSpinner: true });

		// TODO: instead of loki use IndexedDB or a wrapper like http://dexie.org/

		this.dbCache = new loki(path.join(app.getPath('userData'), 'storage', 'cache.json'), { autosave: true, autoload: true });

		var mainResources = [
			{
				loader: STTApi.loadCrewArchetypes.bind(STTApi),
				description: 'crew information'
			},
			{
				loader: STTApi.loadServerConfig.bind(STTApi),
				description: 'server configuration'
			},
			{
				loader: STTApi.loadPlatformConfig.bind(STTApi),
				description: 'platform configuration'
			},
			{
				loader: STTApi.loadShipSchematics.bind(STTApi),
				description: 'ship information'
			},
			{
				loader: STTApi.loadPlayerData.bind(STTApi),
				description: 'player data'
			}
		];

		var fleetResources = [
			{
				loader: STTApi.loadFleetMemberInfo.bind(STTApi),
				description: 'fleet members'
			},
			{
				loader: STTApi.loadFleetData.bind(STTApi),
				description: 'fleet data'
			},
			{
				loader: STTApi.loadStarbaseData.bind(STTApi),
				description: 'starbase data'
			}
		];

		mainResources.reduce((prev, cur) => {
			return prev.then(() => {
				this.setState({ spinnerLabel: 'Loading ' + cur.description + '...' });
				return cur.loader();
			});
		}, Promise.resolve())
		.then(() => {
			if (STTApi.playerData.fleet && STTApi.playerData.fleet.id != 0) {
				return fleetResources.reduce((prev, cur) => {
					return prev.then(() => {
						this.setState({ spinnerLabel: 'Loading ' + cur.description + '...' });
						return cur.loader(STTApi.playerData.fleet.id);
					});
				}, Promise.resolve());
			}
			else {
				return Promise.resolve();
			}
		})
		.then(() => {
			this.setState({ spinnerLabel: 'Finishing up...' });
		})
		.then(this._onDataFinished)
		.catch(this._onDataError);
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
			itemList: STTApi.playerData.character.items,
			missionHelperParams: {
				accepted_missions: STTApi.playerData.character.accepted_missions,
				dispute_histories: STTApi.playerData.character.dispute_histories
			},
			cadetMissionHelperParams: {
				accepted_missions: STTApi.playerData.character.cadet_schedule.missions
			}
		});

		if (STTApi.playerData.character.crew_avatar) {
			getWikiImageUrl(STTApi.playerData.character.crew_avatar.name.split(' ').join('_') + '_Head.png', 0).then(({id, url}) => {
				this.setState({ captainAvatarUrl: url });
			}).catch((error) => {});

			getWikiImageUrl(STTApi.playerData.character.crew_avatar.name.split(' ').join('_') + '.png', 0).then(({id, url}) => {
				this.setState({ captainAvatarBodyUrl: url });
			}).catch((error) => {});
		}

		// all the equipment available in the game, along with sources and recipes
		var allequipment = [];
		STTApi.itemArchetypeCache.archetypes.forEach(function (archetype) {
			var newEquipment = {
				name: archetype.name,
				id: archetype.id,
				rarity: archetype.rarity,
				type: archetype.type, // 3 - no recipe, can only get from sources; 2 - otherwise
				short_name: archetype.short_name, // only for type 3
				recipe: archetype.recipe ? archetype.recipe.demands : null, //optional
				item_sources: archetype.item_sources,
				icon: archetype.icon.file,
				iconUrl: CONFIG.defaultItemIconUrl
			};

			allequipment.push(newEquipment);
		});

		this.setState({ allequipment: allequipment });

		allequipment.forEach(function (equipment) {
			var fileName = equipment.name + CONFIG.rarityRes[equipment.rarity].name + '.png';
			fileName = fileName.split(' ').join('');
			fileName = fileName.split('\'').join('');

			getWikiImageUrl(fileName, equipment.id).then(({id, url}) => {
				this.state.allequipment.forEach(function (item) {
					if ((item.id === id) && url)
						item.iconUrl = url;
				});
			}).catch((error) => {});
		}.bind(this));

		matchCrew(this.dbCache, STTApi.playerData.character, function (roster) {
			roster.forEach(function (crew) {
				crew.iconUrl = '';
				crew.iconBodyUrl = '';
			});

			this.setState({ dataLoaded: true, crewList: roster });

			roster.forEach((crew) => {
				getWikiImageUrl(crew.name.split(' ').join('_') + '_Head.png', crew.id).then(({id, url}) => {
					this.state.crewList.forEach(function (crew) {
						if (crew.id === id)
							crew.iconUrl = url;
					});

					this.forceUpdate();
				}).catch((error) => { console.warn(error); });
				getWikiImageUrl(crew.name.split(' ').join('_') + '.png', crew.id).then(({id, url}) => {
					this.state.crewList.forEach(function (crew) {
						if (crew.id === id)
							crew.iconBodyUrl = url;
					});

					this.forceUpdate();
				}).catch((error) => { console.warn(error); });
			});
		}.bind(this));

		matchShips(STTApi.playerData.character.ships, function (ships) {
			this.setState({ shipList: ships });
		}.bind(this));
	}
}

export default App;
