import React, { Component } from 'react';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import { RarityStars } from './RarityStars';

import { sortItems, columnClick } from '../utils/listUtils.js';
import STTApi from 'sttapi';

export class ShipList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			items: sortItems(STTApi.ships, 'name'),
			columns: [
				{
					key: 'icon',
					name: '',
					minWidth: 48,
					maxWidth: 48,
					fieldName: 'name',
					onRender: (item) => {
						if (item.iconUrl)
							return (<Image src={item.iconUrl} width={48} height={48} imageFit={ImageFit.contain} />);
						else
							return <span />
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
					key: 'max_level',
					name: 'Level',
					fieldName: 'max_level',
					minWidth: 90,
					maxWidth: 130,
					isResizable: true,
					onRender: (item) => {
						return (
							<RarityStars
								min={1}
								max={item.max_level}
								value={(item.level > 0) ? item.level : null}
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
							<RarityStars
								min={1}
								max={item.rarity}
								value={item.rarity}
							/>
						);
					},
					isPadded: true
				},
				{
					key: 'shields',
					name: 'Shields',
					minWidth: 40,
					maxWidth: 50,
					isResizable: true,
					fieldName: 'shields'
				},
				{
					key: 'hull',
					name: 'Hull',
					minWidth: 40,
					maxWidth: 50,
					isResizable: true,
					fieldName: 'hull'
				},
				{
					key: 'attack',
					name: 'Attack',
					minWidth: 60,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'attack',
					onRender: (item) => {
						return (
							<span>{item.attack} ({item.attacks_per_second}/s)</span>
						);
					},
				},
				{
					key: 'accuracy',
					name: 'Accuracy',
					minWidth: 40,
					maxWidth: 50,
					isResizable: true,
					fieldName: 'accuracy'
				},
				{
					key: 'evasion',
					name: 'Evasion',
					minWidth: 40,
					maxWidth: 50,
					isResizable: true,
					fieldName: 'evasion'
				},
				{
					key: 'antimatter',
					name: 'Antimatter',
					minWidth: 40,
					maxWidth: 50,
					isResizable: true,
					fieldName: 'antimatter'
				},
				{
					key: 'traitNames',
					name: 'Traits',
					minWidth: 80,
					isResizable: true,
					fieldName: 'traitNames',
				},
				{
					key: 'flavor',
					name: 'Description',
					minWidth: 100,
					isResizable: true,
					fieldName: 'flavor'
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