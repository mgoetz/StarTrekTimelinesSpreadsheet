import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Rating, RatingSize } from 'office-ui-fabric-react/lib/Rating';
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { CollapsibleSection } from './CollapsibleSection.js';

const CONFIG = require('../utils/config.js');
import STTApi from 'sttapi';
import { loadFullTree, getWikiImageUrl } from 'sttapi';

export class EquipmentSlot extends React.Component {
	constructor(props) {
		super(props);

		let equipment = STTApi.itemArchetypeCache.archetypes.find(equipment => equipment.id == this.props.crew.equipment_slots[this.props.slot].archetype);

		this.state = {
			iconUrl: equipment ? equipment.iconUrl : '',
			have: this.props.crew.equipment_slots[this.props.slot].have
		};
	}

	render() {
		return (<div onClick={this.props.onClick}>
			<Image className={this.props.selected ? 'equipment-slot-selected' : 'equipment-slot'} shouldFadeIn={false} src={this.state.iconUrl} width={50} height={50} imageFit={ImageFit.contain} style={{ opacity: this.state.have ? '1' : '0.6' }} />
		</div>);
	}
}

export class ItemDetails extends React.Component {
	constructor(props) {
		super(props);

		this.loadRecipeTree = this.loadRecipeTree.bind(this);

		this.state = {
			equipment: null
		};
	}

	loadRecipeTree(equipment, multi) {
		if (!equipment)
			return [];

		if (!equipment.recipe || !equipment.recipe.demands || (equipment.recipe.demands.length == 0))
			return [{ equipment: equipment, count: multi }];

		var result = [];
		equipment.recipe.demands.forEach((item) => {
			let childEquipment = STTApi.itemArchetypeCache.archetypes.find(equipment => equipment.id == item.archetype_id);
			if (!childEquipment) {
				console.error('Could not find equipment information for id ' + item.archetype_id + ' in the cache!');
			}
			result = result.concat(this.loadRecipeTree(childEquipment, item.count * multi));
		});

		return result;
	}

	changeEquipment(slot) {
		let equipment = STTApi.itemArchetypeCache.archetypes.find(equipment => equipment.id == this.props.crew.equipment_slots[slot].archetype);

		let recipeTree = this.loadRecipeTree(equipment, 1);

		var result = [];
		recipeTree.reduce(function (res, value) {
			if (!res[value.equipment.id]) {
				res[value.equipment.id] = {
					count: 0,
					equipment: value.equipment
				};
				result.push(res[value.equipment.id]);
			}
			res[value.equipment.id].count += value.count;
			return res;
		}, {});

		recipeTree = result;

		this.setState({
			equipment: equipment,
			recipeTree: recipeTree
		});
	}

	render() {
		if (this.state.equipment) {
			return (<div>
				<span className='quest-mastery'><span style={{ paddingTop: '12px', color: CONFIG.rarityRes[this.state.equipment.rarity].color }}>{CONFIG.rarityRes[this.state.equipment.rarity].name} {this.state.equipment.name}</span></span>

				{this.state.equipment.item_sources && (this.state.equipment.item_sources.length > 0) &&
					<div>Sources:
					{this.state.equipment.item_sources.map(function (source) {
						return <span key={source.id}>{source.name} ({source.chance_grade}/5 chance)</span>;
						})}
				</div>}

				{this.state.equipment.recipe &&
					<div className='recipe-container'><span className='recipe-item-span'>Recipe:</span>{this.state.recipeTree.map(function (item) {
						return <span key={item.equipment.id} className='recipe-item-span'><span style={{ color: CONFIG.rarityRes[item.equipment.rarity].color }} >{item.count} x {CONFIG.rarityRes[item.equipment.rarity].name} {item.equipment.name}</span><Image className='recipe-item-image' shouldFadeIn={false} src={item.equipment.iconUrl} width={20} height={20} imageFit={ImageFit.contain} /> </span>;
						})}
				</div>}
			</div>);
		}
		else {
			return <span />;
		}
	}
}

export class CrewEquipment extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedSlot: 0
		};

		this._changeSelection = this._changeSelection.bind(this);
	}

	_changeSelection(index) {
		this.setState({ selectedSlot: index });
		this.refs.itemDetails.changeEquipment(index);
	}

	render() {
		return (<div>
			<table className='table-CrewEquipment'>
				<tbody>
					<tr>
						<td style={{ width: '160px' }}>
							<center><b>{this.props.crew.name}</b></center>
							<Image src={this.props.crew.iconBodyUrl} height={200} imageFit={ImageFit.contain} />
						</td>
						<td style={{ width: '52px' }}>
							<EquipmentSlot crew={this.props.crew} slot={0} selected={this.state.selectedSlot == 0} onClick={(e) => this._changeSelection(0)} />
							<EquipmentSlot crew={this.props.crew} slot={1} selected={this.state.selectedSlot == 1} onClick={(e) => this._changeSelection(1)} />
							<EquipmentSlot crew={this.props.crew} slot={2} selected={this.state.selectedSlot == 2} onClick={(e) => this._changeSelection(2)} />
							<EquipmentSlot crew={this.props.crew} slot={3} selected={this.state.selectedSlot == 3} onClick={(e) => this._changeSelection(3)} />
						</td>
						<td style={{ verticalAlign: 'top' }}>
							<ItemDetails ref='itemDetails' crew={this.props.crew} />
						</td>
					</tr>
				</tbody>
			</table>
		</div>);
	}
}

export class EquipmentDetails extends React.Component {
	constructor(props) {
		super(props);

		// Search for crew without all 4 equipment slots filled
		var filteredCrew = STTApi.roster.filter(function (crew) {
			return crew.equipment_slots.some(equipment => !equipment.have);
		});

		this.state = {
			dataAvailable: false,
			filteredCrew: filteredCrew
		};

		loadFullTree().then(() => {
			let iconPromises = [];
			STTApi.itemArchetypeCache.archetypes.forEach((equipment) => {
				var fileName = equipment.name + CONFIG.rarityRes[equipment.rarity].name + '.png';
				fileName = fileName.split(' ').join('');
				fileName = fileName.split('\'').join('');

				equipment.iconUrl = CONFIG.defaultItemIconUrl;
	
				iconPromises.push(getWikiImageUrl(fileName, equipment.id).then(({id, url}) => {
					STTApi.itemArchetypeCache.archetypes.forEach(function (item) {
						if ((item.id === id) && url)
							item.iconUrl = url;
					});
					return Promise.resolve();
				}).catch((error) => {}));
			});

			Promise.all(iconPromises).then(() => this.setState({ dataAvailable: true }));
		});
	}
	
	render() {
		if (this.state.dataAvailable) {
			return (<div className='tab-panel' data-is-scrollable='true'>
				{this.state.filteredCrew.map(function (crew) {
					return <CrewEquipment key={crew.crew_id} crew={crew} />;
				}.bind(this))}
			</div>);
		}
		else {
			return (<Spinner size={SpinnerSize.large} label='Loading data...' />);
		}
	}
}