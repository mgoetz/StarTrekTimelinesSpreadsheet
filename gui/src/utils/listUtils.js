const CONFIG = require('./config.js');

export function groupBy(items, fieldName) {
	let groups = items.reduce((currentGroups, currentItem, index) => {
		let lastGroup = currentGroups[currentGroups.length - 1];
		let fieldValue = currentItem[fieldName];

		if (!lastGroup || lastGroup.value !== fieldValue) {
			currentGroups.push({
				key: 'group' + fieldValue + index,
				name: CONFIG.rarityRes[fieldValue].name + " crew",
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

export function sortItems(items, sortBy, descending) {
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

export function columnClick(items, columns, column) {
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