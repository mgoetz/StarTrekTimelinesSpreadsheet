import '../assets/css/App.css';
import React, { Component } from 'react';
import { Fabric } from 'office-ui-fabric-react/lib/Fabric';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuProps, IContextualMenuItem, DirectionalHint, ContextualMenu } from 'office-ui-fabric-react/lib/ContextualMenu';
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Pivot, PivotItem, PivotLinkFormat, PivotLinkSize } from 'office-ui-fabric-react/lib/Pivot';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Rating, RatingSize } from 'office-ui-fabric-react/lib/Rating';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import { loadStuff, loadCrewImageUrl, matchCrew, exportCsv, exportExcel, loadGauntlet, computeGauntlet, matchShips } from './stt.js';

var regedit;
try { regedit = require('electron').remote.require('regedit'); } catch (err) { regedit = null; }

export class AccessTokenDialog extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			hideDialog: false,
			labelString: 'Access Token',
			accesstoken: ''
		};

		if (regedit) {
			regedit.list('HKCU\\Software\\DisruptorBeam\\Star Trek', function (err, result) {
				if (!result) {
					console.log('Registry key not found! Make sure you installed the Steam app and logged in, or pass the access token as a parameter!');
					return;
				}
				
				for (var prop in result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values) {
					if (prop.includes('access_token')) {

						var value = String.fromCharCode.apply(String, result['HKCU\\Software\\DisruptorBeam\\Star Trek'].values[prop].value);

						// Clean up the string
						value = value.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f").replace(/[\u0000-\u0019]+/g, "");
						var reg = JSON.parse(value);
						this._regeditUpdate(reg.token);

						return;
					}
				}

				if (!result) {
					console.log('Access token not found in the registry! Make sure you installed the Steam app and logged in, or pass the access token as a parameter!');
					return;
				}
			}.bind(this));
		}

		this._closeDialog = this._closeDialog.bind(this);
		this._getErrorMessage = this._getErrorMessage.bind(this);
		this._regeditUpdate = this._regeditUpdate.bind(this);
	}

	_regeditUpdate(val) {
		this.setState({ accesstoken: val });
	}

	render() {
		return (
			<div>
				<Dialog
					hidden={this.state.hideDialog}
					onDismiss={this._closeDialog}
					dialogContentProps={{
						type: DialogType.normal,
						title: 'Login to Star Trek Timelines'
					}}
					modalProps={{
						isBlocking: true
					}}
				>
					<DefaultButton href='https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet' target='_blank' title='Access Token documentation'>How to get an access token</DefaultButton>
					<TextField
						label={this.state.labelString}
						value={this.state.accesstoken}
						onChanged={(value) => { this.setState({ accesstoken: value }) }}
						placeholder='123e4567-e89b-12d3-a456-426655440000'
						onGetErrorMessage={this._getErrorMessage}
						validateOnFocusIn={true}
						validateOnFocusOut={true}
					/>

					<DialogFooter>
						<PrimaryButton onClick={this._closeDialog} text='Login' />
					</DialogFooter>
				</Dialog>
			</div>
		);
	}

	_getErrorMessage(value) {
		return (value.length == '123e4567-e89b-12d3-a456-426655440000'.length)
			? ''
			: `The length of the input value should be ${'123e4567-e89b-12d3-a456-426655440000'.length}, actual is ${value.length}.`;
	}

	_showDialog(errMsg) {
		this.setState({ hideDialog: false, labelString: errMsg });
	}

	_closeDialog() {
		this.setState({ hideDialog: true });
		this.props.onAccessToken(this.state.accesstoken);
	}

	_onChoiceChanged() {
		console.log('Choice option change');
	}
}

const rarityRes = {
	'0': { name: 'Basic', color: 'Grey' },
	'1': { name: 'Common', color: '#ddd' },
	'2': { name: 'Uncommon', color: '#682' },
	'3': { name: 'Rare', color: '#359' },
	'4': { name: 'Super Rare', color: '#b3f' },
	'5': { name: 'Legendary', color: 'gold' }
};

function groupBy(items, fieldName) {
	let groups = items.reduce((currentGroups, currentItem, index) => {
		let lastGroup = currentGroups[currentGroups.length - 1];
		let fieldValue = currentItem[fieldName];

		if (!lastGroup || lastGroup.value !== fieldValue) {
			currentGroups.push({
				key: 'group' + fieldValue + index,
				name: rarityRes[fieldValue].name + " crew",
				value: fieldValue,
				startIndex: index,
				level: 0,
				count: 0
			});
		}
		if (lastGroup) {
			lastGroup.count = index - lastGroup.startIndex;
		}
		return currentGroups;
	}, []);

	// Fix last group count
	let lastGroup = groups[groups.length - 1];

	if (lastGroup) {
		lastGroup.count = items.length - lastGroup.startIndex;
	}

	return groups;
}

function sortItems(items, sortBy, descending)
{
	if (descending) {
		return items.sort((a, b) => {
			if (a[sortBy] < b[sortBy]) {
				return 1;
			}
			if (a[sortBy] > b[sortBy]) {
				return -1;
			}
			return 0;
		});
	} else {
		return items.sort((a, b) => {
			if (a[sortBy] < b[sortBy]) {
				return -1;
			}
			if (a[sortBy] > b[sortBy]) {
				return 1;
			}
			return 0;
		});
	}
}

function columnClick(items, columns, column)
{
	let isSortedDescending = column.isSortedDescending;

	// If we've sorted this column, flip it.
	if (column.isSorted) {
		isSortedDescending = !isSortedDescending;
	}

	// Sort the items.
	items = items.concat([]).sort((a, b) => {
		let firstValue = a[column.fieldName].core ? a[column.fieldName].core : a[column.fieldName];
		let secondValue = b[column.fieldName].core ? b[column.fieldName].core : b[column.fieldName];

		if (isSortedDescending) {
			return firstValue > secondValue ? -1 : 1;
		} else {
			return firstValue > secondValue ? 1 : -1;
		}
	});

	// Reset the items and columns to match the state.
	return {
		items: items,
		columns: columns.map(col => {
			col.isSorted = (col.key === column.key);

			if (col.isSorted) {
				col.isSortedDescending = isSortedDescending;
			}

			return col;
		})
	};
}

class ShipList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			items: sortItems(this.props.data, 'name'),
			columns: [
				{
					key: 'name',
					name: 'Name',
					minWidth: 130,
					maxWidth: 180,
					isSorted: true,
					isSortedDescending: false,
					isResizable: true,
					fieldName: 'name'
				},
				{
					key: 'max_level',
					name: 'Level',
					fieldName: 'max_level',
					minWidth: 90,
					maxWidth: 130,
					isResizable: true,
					onRender: (item) => {
						return (
							<Rating
								min={1}
								max={item.max_level}
								rating={item.level}
							/>
						);
					},
					isPadded: true
				},
				{
					key: 'rarity',
					name: 'Rarity',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'rarity',
					onRender: (item) => {
						return (
							<Rating
								min={1}
								max={item.rarity}
								rating={item.rarity}
							/>
						);
					},
					isPadded: true
				},
				{
					key: 'shields',
					name: 'Shields',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'shields'
				},
				{
					key: 'hull',
					name: 'Hull',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'hull'
				},
				{
					key: 'attack',
					name: 'Attack',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'attack'
				},
				{
					key: 'accuracy',
					name: 'Accuracy',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'accuracy'
				},
				{
					key: 'evasion',
					name: 'Evasion',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'evasion'
				}
			]
		};

		this._onColumnClick = this._onColumnClick.bind(this);
	}

	render() {
		return (
			<div className='data-grid' data-is-scrollable='true'>
				<DetailsList
					items={this.state.items}
					columns={this.state.columns}
					setKey='set'
					selectionMode={SelectionMode.none}
					layoutMode={DetailsListLayoutMode.justified}
					onColumnHeaderClick={this._onColumnClick}
				/>
			</div>
		);
	}

	_onColumnClick(ev, column) {
		this.setState(columnClick(this.state.items, this.state.columns, column));
	}
}

class ItemList extends React.Component {
	constructor(props) {
		super(props);

		var items = this.props.data.map(function (item) {
			return {
				id: item.id,
				name: item.name,
				rarity: item.rarity,
				quantity: item.quantity,
				iconUrl: 'https://stt.wiki/w/images/d/d6/ItemNameBasic.png',
				type: item.icon.file.replace("/items", "").split("/")[1],
				symbol: item.icon.file.replace("/items", "").split("/")[2],
				flavor: item.flavor
			}
		});

		items.forEach(function (item) {
			var fileName = item.name + rarityRes[item.rarity].name + '.png';
			fileName = fileName.split(' ').join('');
			fileName = fileName.split('\'').join('');

			loadCrewImageUrl(fileName, item.id, function (id, url) {
				this.state.items.forEach(function (item) {
					if (item.id === id)
						item.iconUrl = url;
				});

				this.forceUpdate();
			}.bind(this));
		}.bind(this));

		this.state = {
			items: sortItems(items, 'name'),
			columns: [
				{
					key: 'icon',
					name: '',
					minWidth: 50,
					maxWidth: 50,
					fieldName: 'name',
					onRender: (item) => {
						return (<Image src={item.iconUrl} width={50} height={50} imageFit={ImageFit.contain} />);
					}
				},
				{
					key: 'name',
					name: 'Name',
					minWidth: 130,
					maxWidth: 180,
					isSorted: true,
					isSortedDescending: false,
					isResizable: true,
					fieldName: 'name'
				},
				{
					key: 'rarity',
					name: 'Rarity',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'rarity',
					onRender: (item) => {
						return (
							<Rating
								min={0}
								max={item.rarity}
								rating={item.rarity}
							/>
						);
					},
					isPadded: true
				},
				{
					key: 'quantity',
					name: 'Quantity',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'quantity'
				},
				{
					key: 'type',
					name: 'Type',
					minWidth: 70,
					maxWidth: 120,
					isResizable: true,
					fieldName: 'type'
				},
				{
					key: 'symbol',
					name: 'Symbol',
					minWidth: 70,
					maxWidth: 120,
					isResizable: true,
					fieldName: 'symbol'
				},
				{
					key: 'details',
					name: 'Details',
					minWidth: 90,
					maxWidth: 130,
					isResizable: true,
					fieldName: 'flavor'
				}
			]
		};

		this._onColumnClick = this._onColumnClick.bind(this);
	}

	render() {
		return (
			<div className='data-grid' data-is-scrollable='true'>
				<DetailsList
					items={this.state.items}
					columns={this.state.columns}
					setKey='set'
					selectionMode={SelectionMode.none}
					layoutMode={DetailsListLayoutMode.justified}
					onColumnHeaderClick={this._onColumnClick}
				/>
			</div>
		);
	}

	_onColumnClick(ev, column) {
		this.setState(columnClick(this.state.items, this.state.columns, column));
	}
}

class CrewList extends React.Component {
	constructor(props) {
		super(props);

		var items = props.data;
		items = sortItems(items, 'max_rarity');

		const _columns = [
			{
				key: 'icon',
				name: '',
				minWidth: 50,
				maxWidth: 50,
				fieldName: 'name',
				onRender: (item) => {
					return (<Image src={item.iconUrl} width={50} height={50} imageFit={ImageFit.contain}/>);
				}
			},
			{
				key: 'short_name',
				name: 'Name',
				minWidth: 80,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'short_name',
				onRender: (item) => {
					return (<Link href={'https://stt.wiki/wiki/' + item.name.split(' ').join('_')} target='_blank'>{item.short_name}</Link>);
				}
			},
			{
				key: 'name',
				name: 'Full name',
				minWidth: 100,
				isResizable: true,
				fieldName: 'name'
			},
			{
				key: 'level',
				name: 'Level',
				minWidth: 30,
				maxWidth: 80,
				isResizable: true,
				fieldName: 'level'
			},
			{
				key: 'max_rarity',
				name: 'Rarity',
				fieldName: 'max_rarity',
				minWidth: 70,
				maxWidth: 100,
				isResizable: true,
				isSorted: true,
				isSortedDescending: false,
				onRender: (item) => {
					return (
						<Rating
							min={1}
							max={item.max_rarity}
							rating={item.rarity}
						/>
					);
				},
				isPadded: true
			},
			{
				key: 'frozen',
				name: 'Frozen',
				minWidth: 16,
				maxWidth: 16,
				iconName: 'Snow',
				isIconOnly: true,
				fieldName: 'frozen',
				onRender: (item) => {
					if (item.frozen)
						return (<Icon iconName='Snow' />);
					else
						return (<p/>);
				}
			},
			{
				key: 'command_skill',
				name: 'Command',
				minWidth: 70,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'command_skill',
				onRender: (item) => {
					if (item.command_skill.core > 0)
						return (
							<div className='skill-stats-div'>
								<span className='skill-stats'>{item.command_skill.core}</span>
								<br/>
								<span className='skill-stats-range'>+({item.command_skill.min} - {item.command_skill.max})</span>
							</div>
						);
					else
						return (<div className='skill-stats-div'><span className='skill-stats'></span></div>);
				}
			},
			{
				key: 'diplomacy_skill',
				name: 'Diplomacy',
				minWidth: 70,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'diplomacy_skill',
				onRender: (item) => {
					if (item.diplomacy_skill.core > 0)
						return (
							<div className='skill-stats-div'>
								<span className='skill-stats'>{item.diplomacy_skill.core}</span>
								<br />
								<span className='skill-stats-range'>+({item.diplomacy_skill.min} - {item.diplomacy_skill.max})</span>
							</div>
						);
					else
						return (<div className='skill-stats-div'><span className='skill-stats'></span></div>);
				}
			},
			{
				key: 'engineering_skill',
				name: 'Engineering',
				minWidth: 75,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'engineering_skill',
				onRender: (item) => {
					if (item.engineering_skill.core > 0)
						return (
							<div className='skill-stats-div'>
								<span className='skill-stats'>{item.engineering_skill.core}</span>
								<br />
								<span className='skill-stats-range'>+({item.engineering_skill.min} - {item.engineering_skill.max})</span>
							</div>
						);
					else
						return (<div className='skill-stats-div'><span className='skill-stats'></span></div>);
				}
			},
			{
				key: 'medicine_skill',
				name: 'Medicine',
				minWidth: 70,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'medicine_skill',
				onRender: (item) => {
					if (item.medicine_skill.core > 0)
						return (
							<div className='skill-stats-div'>
								<span className='skill-stats'>{item.medicine_skill.core}</span>
								<br />
								<span className='skill-stats-range'>+({item.medicine_skill.min} - {item.medicine_skill.max})</span>
							</div>
						);
					else
						return (<div className='skill-stats-div'><span className='skill-stats'></span></div>);
				}
			},
			{
				key: 'science_skill',
				name: 'Science',
				minWidth: 70,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'science_skill',
				onRender: (item) => {
					if (item.science_skill.core > 0)
						return (
							<div className='skill-stats-div'>
								<span className='skill-stats'>{item.science_skill.core}</span>
								<br />
								<span className='skill-stats-range'>+({item.science_skill.min} - {item.science_skill.max})</span>
							</div>
						);
					else
						return (<div className='skill-stats-div'><span className='skill-stats'></span></div>);
				}
			},
			{
				key: 'security_skill',
				name: 'Security',
				minWidth: 70,
				maxWidth: 100,
				isResizable: true,
				fieldName: 'security_skill',
				onRender: (item) => {
					if (item.security_skill.core > 0)
						return (
							<div className='skill-stats-div'>
								<span className='skill-stats'>{item.security_skill.core}</span>
								<br />
								<span className='skill-stats-range'>+({item.security_skill.min} - {item.security_skill.max})</span>
							</div>
						);
					else
						return (<div className='skill-stats-div'><span className='skill-stats'></span></div>);
				}
			},
			{
				key: 'traits',
				name: 'Traits',
				minWidth: 120,
				isResizable: true,
				fieldName: 'traits'
			}
		];

		this.state = {
			items: items,
			columns: _columns,
			groups: groupBy(items, 'max_rarity'),
			groupedColumn: 'max_rarity',
			isCompactMode: true
		};

		this._onColumnClick = this._onColumnClick.bind(this);
	}

	render() {
		let { columns, isCompactMode, items, groups } = this.state;

		return (
			<div className='data-grid' data-is-scrollable='true'>
				<DetailsList
					items={items}
					groups={groups}
					columns={columns}
					setKey='set'
					selectionMode={SelectionMode.none}
					layoutMode={DetailsListLayoutMode.justified}
					onColumnHeaderClick={this._onColumnClick}
				/>
			</div>
		);
	}

	_onColumnClick(ev, column) {
		this.setState(columnClick(this.state.items, this.state.columns, column));
	}

	getGroupedColumn() {
		return this.state.groupedColumn;
	}

	setGroupedColumn(groupedColumn) {
		if (groupedColumn == '')
			this.setState({ groupedColumn: '', groups: null });
		else
			this.setState({ groupedColumn: groupedColumn, groups: groupBy(this.state.items, groupedColumn) });
	}
}

class GauntletHelper extends React.Component {
	constructor(props) {
		super(props);

		if (props.gauntlet.state != 'NONE') {
			this.state = {
				alreadyStarted: true
			};
		}
		else {
			var result = computeGauntlet(props.gauntlet, props.crew);

			this.state = {
				alreadyStarted: false,
				startsIn: Math.floor(props.gauntlet.seconds_to_join / 60),
				featuredSkill: props.gauntlet.contest_data.featured_skill,
				traits: props.gauntlet.contest_data.traits,
				recommendations: result.recommendations.map(function (id) { return props.crew.find((crew) => (crew.id == id)); }),
				bestInSkill: result.best
			};
		}
	}

	render() {
		if (this.state.alreadyStarted) {
			return (<MessageBar messageBarType={MessageBarType.error} >It looks like you already started this gauntlet. Try to use this option before joining your next gauntlet!</MessageBar>);
		}
		else {
			return (
				<div>
					<Label>Next gauntlet starts in {this.state.startsIn} minutes.</Label>
					<Label>Featured skill: {this.state.featuredSkill}</Label>
					<Label>Featured traits: {this.state.traits.join(', ')}</Label>
					<h2>Recommeded crew selection:</h2>
					<CrewList data={this.state.recommendations} ref='recommendedCrew' />
				</div>
			);
		}
	}

	componentDidMount() {
		this.refs.recommendedCrew.setGroupedColumn('');
	}
}

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

							exportExcel(this.state.crewList, this.state.itemList, this.state.shipList, fileName);
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

							exportCsv(this.state.crewList, fileName);
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
		loadStuff(accesstoken, function (data)
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

				loadCrewImageUrl(this.player.player.character.crew_avatar.name.split(' ').join('_') + '_Head.png', 0, function (id, url)
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
						loadCrewImageUrl(crew.name.split(' ').join('_') + '_Head.png', crew.id, function (id, url) {
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
