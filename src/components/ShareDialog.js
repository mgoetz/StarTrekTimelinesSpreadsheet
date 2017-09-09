import React, { Component } from 'react';

import { loadAccessTokenFromRegistry, storeAccessTokenInCache } from '../utils/registry.js';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, DropdownMenuItemType } from 'office-ui-fabric-react/lib/Dropdown';
import { Checkbox, ICheckboxStyles } from 'office-ui-fabric-react/lib/Checkbox';

const CONFIG = require('../utils/config.js');

export class ShareDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hideDialog: true,
			shareMissions: false,
			exportWhere: 'L',
			title: '',
			description: 'Here are my crew stats. Recommendations?'
		};

		this._closeDialog = this._closeDialog.bind(this);
		this._cancelDialog = this._cancelDialog.bind(this);
	}

	render() {
		return (
			<div>
				<Dialog
					hidden={this.state.hideDialog}
					onDismiss={this._cancelDialog}
					dialogContentProps={{
						type: DialogType.largeHeader,
						title: 'Share your crew roster',
						subText: 'Upload the crew list with their stats, allowing you to share the link with others online; maybe your fleet or on the forums / reddit to gather feedback.'
					}}
					modalProps={{
						isBlocking: false
					}}
				>
					<TextField
						label='Title:'
						value={this.state.title}
						onChanged={(value) => { this.setState({ title: value }) }}
					/>

					<TextField
						label='Description text:'
						value={this.state.description}
						onChanged={(value) => { this.setState({ description: value }) }}
						multiline autoAdjustHeight
					/>

					<Dropdown
						selectedKey={this.state.exportWhere}
						label='Where to export:'
						allowFreeform={false}
						autoComplete='on'
						options={[
							{ key: 'L', text: 'To local file' },
							{ key: 'O', text: 'Online' }
						]}
						onChanged={(item) => {
							this.setState({ exportWhere: item.key });
						}}
					/>

					<Checkbox
						label='Also share mission completion stats'
						checked={this.state.shareMissions}
						onChange={(ev, checked) => {
							this.setState({ shareMissions: checked });
						}}
					/>

					<DialogFooter>
						<PrimaryButton onClick={this._closeDialog} text='Share' />
						<DefaultButton onClick={this._cancelDialog} text='Cancel' />
					</DialogFooter>
				</Dialog>
			</div>
		);
	}

	_showDialog(captainName) {
		this.setState({ hideDialog: false, title: captainName + '\'s crew' });
	}

	_closeDialog() {
		this.setState({ hideDialog: true });
		this.props.onShare({ description: this.state.description, title: this.state.title, exportWhere: this.state.exportWhere, shareMissions: this.state.shareMissions});
	}

	_cancelDialog() {
		this.setState({ hideDialog: true });
	}
}