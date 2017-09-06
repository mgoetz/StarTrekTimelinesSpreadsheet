import React, { Component } from 'react';

import { loadAccessTokenFromRegistry, storeAccessTokenInCache } from '../utils/registry.js';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';

const CONFIG = require('../utils/config.js');

export class AccessTokenDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hideDialog: false,
			labelString: 'Access Token',
			accesstoken: ''
		};

		loadAccessTokenFromRegistry(function (accessToken) {
			this._regeditUpdate(accessToken);
		}.bind(this));

		this._closeDialog = this._closeDialog.bind(this);
		this._getErrorMessage = this._getErrorMessage.bind(this);
		this._regeditUpdate = this._regeditUpdate.bind(this);
	}

	_regeditUpdate(val) {
		this.setState({ accesstoken: val });
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
					<DefaultButton href='https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet' target='_blank' title='Access Token documentation'>How to get an access token</DefaultButton>
					<TextField
						label={this.state.labelString}
						value={this.state.accesstoken}
						onChanged={(value) => { this.setState({ accesstoken: value }) }}
						placeholder={CONFIG.accessTokenFormat}
						onGetErrorMessage={this._getErrorMessage}
						validateOnFocusIn={true}
						validateOnFocusOut={true}
					/>

					<DialogFooter>
						<PrimaryButton onClick={this._closeDialog} text='Login' />
					</DialogFooter>
				</Dialog>
			</div>
		);
	}

	_getErrorMessage(value) {
		return (value.length == CONFIG.accessTokenFormat.length)
			? '' : `The length of the input value should be ${CONFIG.accessTokenFormat.length}, actual is ${value.length}.`;
	}

	_showDialog(errMsg) {
		this.setState({ hideDialog: false, labelString: errMsg });
	}

	_closeDialog() {
		this.setState({ hideDialog: true });
		storeAccessTokenInCache(this.state.accesstoken);
		this.props.onAccessToken(this.state.accesstoken);
	}
}