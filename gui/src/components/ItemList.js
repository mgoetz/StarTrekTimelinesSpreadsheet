import React, { Component } from 'react';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Rating, RatingSize } from 'office-ui-fabric-react/lib/Rating';

import { groupBy, sortItems, columnClick } from '../utils/listUtils.js';
import { getWikiImageUrl } from '../utils/wikiImage.js';

const CONFIG = require('../utils/config.js');

export class ItemList extends React.Component {
	constructor(props) {
		super(props);

		var items = this.props.data.map(function (item) {
			return {
				id: item.id,
				name: item.name,
				rarity: item.rarity,
				quantity: item.quantity,
				iconUrl: CONFIG.defaultItemIconUrl,
				type: item.icon.file.replace("/items", "").split("/")[1],
				symbol: item.icon.file.replace("/items", "").split("/")[2],
				flavor: item.flavor
			}
		});

		items.forEach(function (item) {
			var fileName = item.name + CONFIG.rarityRes[item.rarity].name + '.png';
			fileName = fileName.split(' ').join('');
			fileName = fileName.split('\'').join('');

			getWikiImageUrl(fileName, item.id, function (id, url) {
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