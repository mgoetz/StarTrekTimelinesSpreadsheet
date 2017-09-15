import React, { Component } from 'react';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox, ICheckboxStyles } from 'office-ui-fabric-react/lib/Checkbox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import STTApi from '../api/STTApi.ts';

const CONFIG = require('../utils/config.js');

export class LoginDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hideDialog: !props.shownByDefault,
			errorMessage: null,
			autoLogin: true,
			showSpinner: false,
			username: '',
			password: ''
		};

		this._closeDialog = this._closeDialog.bind(this);
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
					{this.state.errorMessage && (
						<MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
							<span>{this.state.errorMessage}</span>
						</MessageBar>
					)}

					<TextField
						label='Username (e-mail)'
						value={this.state.username}
						onChanged={(value) => { this.setState({ username: value }) }}
					/>

					<TextField
						label='Password'
						value={this.state.password}
						type='password'
						onChanged={(value) => { this.setState({ password: value }) }}
					/>

					<Checkbox
						label='Stay logged in'
						checked={this.state.autoLogin}
						onChange={(ev, checked) => {
							this.setState({ autoLogin: checked });
						}}
					/>

					<DialogFooter>
						<PrimaryButton onClick={this._closeDialog} text='Login' disabled={this.state.showSpinner} />
						{this.state.showSpinner && (
							<Spinner size={SpinnerSize.small} label='Logging in...' />
						)}
					</DialogFooter>
				</Dialog>
			</div>
		);
	}

	_showDialog(errMsg) {
		this.setState({ hideDialog: false, errorMessage: errMsg });
	}

	_closeDialog() {
		this.setState({ showSpinner: true, errorMessage: null });

		STTApi.login(this.state.username, this.state.password, function (error, success) {
			this.setState({ showSpinner: false });

			if (!success) {
				this.setState({ hideDialog: false, errorMessage: error });
			}
			else
			{
				this.setState({ hideDialog: true });
				this.props.onAccessToken(this.state.autoLogin);
			}
		}.bind(this));
	}
}