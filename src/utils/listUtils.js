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

	// Reset the items and columns to match the state.
	return {
		items: sortItems(items, column.fieldName, isSortedDescending),
		columns: columns.map(col => {
			col.isSorted = (col.key === column.key);

			if (col.isSorted) {
				col.isSortedDescending = isSortedDescending;
			}

			return col;
		}),
		sortColumn: column.fieldName,
		sortedDescending : isSortedDescending
	};
}