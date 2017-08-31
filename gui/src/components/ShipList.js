import React, { Component } from 'react';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Rating, RatingSize } from 'office-ui-fabric-react/lib/Rating';

import { groupBy, sortItems, columnClick } from '../utils/listUtils.js';

export class ShipList extends React.Component {
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
			<div className='tab-panel' data-is-scrollable='true'>
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