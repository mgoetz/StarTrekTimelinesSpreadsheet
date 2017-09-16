import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Rating, RatingSize } from 'office-ui-fabric-react/lib/Rating';
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react/lib/ChoiceGroup';

import { CollapsibleSection } from './CollapsibleSection.js';

const CONFIG = require('../utils/config.js');

export class EquipmentSlot extends React.Component {
	render() {
		return (<div onClick={this.props.onClick}>
			<Image className={this.props.selected ? 'equipment-slot-selected' : 'equipment-slot'} shouldFadeIn={false} src={this.props.iconUrl} width={50} height={50} imageFit={ImageFit.contain} style={{ opacity: this.props.have ? '1' : '0.6' }} />
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
		if (!equipment) // TODO: the archetype cache doesn't include all the items; we should see how we can load more
			return [];

		if (!equipment.recipe || (equipment.recipe.length == 0))
			return [{ equipment: equipment, count: multi }];

		var result = [];
		equipment.recipe.forEach(function (item) {
			result = result.concat(this.loadRecipeTree(this.props.findEquipment(item.archetype_id), item.count * multi));
		}.bind(this));

		return result;
	}

	changeEquipment(equipment) {
		this.setState({
			equipment: equipment,
			recipeTree: this.loadRecipeTree(equipment, 1)
		});
	}

	render() {
		if (this.state.equipment) {
			return (<div>
				<span className='quest-mastery'><span style={{ paddingTop: '12px' }}>{this.state.equipment.name}</span><Rating min={1} max={this.state.equipment.rarity} rating={this.state.equipment.rarity} /></span>
				<p>Sources: {this.state.equipment.item_sources && this.state.equipment.item_sources.length}</p>

				{this.state.equipment.recipe &&
					<p>Recipe (incomplete): {this.state.recipeTree.map(function (item) { return item.count + 'x ' + item.equipment.name; }).join(', ')}
				</p>}
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

		this.findEquipment = this.findEquipment.bind(this);
		this._changeSelection = this._changeSelection.bind(this);
	}

	findEquipment(archetype) {
		return this.props.allequipment.find(equipment => equipment.id == archetype);

		// If not already in the cache, we can load equipment details with 
		//https://stt.disruptorbeam.com/item/description?ids[]=2242&ids[]=2248&client_api=8&access_token=
	}

	_changeSelection(index) {
		this.setState({ selectedSlot: index });
		this.refs.itemDetails.changeEquipment(this.findEquipment(this.props.crew.equipment_slots[index].archetype));
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
							<EquipmentSlot iconUrl={this.findEquipment(this.props.crew.equipment_slots[0].archetype).iconUrl} have={this.props.crew.equipment_slots[0].have} selected={this.state.selectedSlot == 0} onClick={(e) => this._changeSelection(0)} />
							<EquipmentSlot iconUrl={this.findEquipment(this.props.crew.equipment_slots[1].archetype).iconUrl} have={this.props.crew.equipment_slots[1].have} selected={this.state.selectedSlot == 1} onClick={(e) => this._changeSelection(1)} />
							<EquipmentSlot iconUrl={this.findEquipment(this.props.crew.equipment_slots[2].archetype).iconUrl} have={this.props.crew.equipment_slots[2].have} selected={this.state.selectedSlot == 2} onClick={(e) => this._changeSelection(2)} />
							<EquipmentSlot iconUrl={this.findEquipment(this.props.crew.equipment_slots[3].archetype).iconUrl} have={this.props.crew.equipment_slots[3].have} selected={this.state.selectedSlot == 3} onClick={(e) => this._changeSelection(3)} />
						</td>
						<td style={{ verticalAlign: 'top' }}>
							<ItemDetails ref='itemDetails' findEquipment={this.findEquipment} />
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
		var filteredCrew = this.props.crewList.filter(function (crew) {
			return crew.equipment_slots.some(equipment => !equipment.have);
		});

		this.state = {
			filteredCrew: filteredCrew
		};
	}
	
	render() {
		return (<div className='tab-panel' data-is-scrollable='true'>
			{this.state.filteredCrew.map(function (crew) {
				return <CrewEquipment key={crew.crew_id} allequipment={this.props.allequipment} crew={crew} />;
			}.bind(this))}
		</div>);
	}
}