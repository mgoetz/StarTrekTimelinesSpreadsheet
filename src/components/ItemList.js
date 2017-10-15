import React, { Component } from 'react';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Rating, RatingSize } from 'office-ui-fabric-react/lib/Rating';
import { Link } from 'office-ui-fabric-react/lib/Link';

import { sortItems, columnClick } from '../utils/listUtils.js';

export class ItemList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			items: sortItems(this.props.data, 'name'),
			sortColumn: 'name',
			sortedDescending: false,
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
								min={1}
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
					fieldName: 'typeName'
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
			<div className='item-panel' data-is-scrollable='true'>
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

	_filterItem(item, searchString) {
		return searchString.split(' ').every(text => {
			// search the name first
			if (item.name.toLowerCase().indexOf(text) > -1) {
				return true;
			}

			// now search the traits
			if (item.symbol && (item.symbol.toLowerCase().indexOf(text) > -1)) {
				return true;
			}

			// now search the raw traits
			if (item.flavor && (item.flavor.toLowerCase().indexOf(text) > -1)) {
				return true;
			}

			return false;
		});
	}

	filter(newValue) {
		this.setState({
			items: sortItems((newValue ?
				this.props.data.filter(i => this._filterItem(i, newValue)) :
				this.props.data), this.state.sortColumn, this.state.sortedDescending)
		});
	}

	_onColumnClick(ev, column) {
		this.setState(columnClick(this.state.items, this.state.columns, column));
	}
}