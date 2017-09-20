import React, { Component } from 'react';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox, ICheckboxStyles } from 'office-ui-fabric-react/lib/Checkbox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import STTApi from '../../shared/api/STTApi.ts';

import {ipcRenderer} from 'electron';

const CONFIG = require('../utils/config.js');

export class LoginDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hideDialog: !props.shownByDefault,
			errorMessage: null,
			autoLogin: true,
			showSpinner: false,
			waitingForFacebook: false,
			facebookImageUrl: '',
			facebookStatus: '',
			facebookAccessToken: null,
			facebookUserId: null,
			username: '',
			password: ''
		};

		this._closeDialog = this._closeDialog.bind(this);
		this._connectFacebook = this._connectFacebook.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.shownByDefault !== this.props.shownByDefault) {
			this.setState({hideDialog: !nextProps.shownByDefault});
		}
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

					<Pivot>
						<PivotItem linkText='Username and password'>
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
						</PivotItem>
						<PivotItem linkText='Facebook'>
							<center style={{ marginTop:'5px' }} >
								<PrimaryButton onClick={this._connectFacebook} text='Connect with Facebook' disabled={this.state.waitingForFacebook} />
								<Image src={this.state.facebookImageUrl} height={200} />
								<p>{this.state.facebookStatus}</p>
							</center>
						</PivotItem>
					</Pivot>

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

	_connectFacebook() {
		this.setState({
			waitingForFacebook: true
		});

		ipcRenderer.on('fb_access_token', function (event, data) {
			this.setState({
				waitingForFacebook: false,
				facebookStatus: 'Authenticated with Facebook as ' + data.name + '. Press Login to connect to STT!',
				facebookImageUrl: data.picture.data.url,
				facebookAccessToken: data.access_token,
				facebookUserId: data.id
			});
		}.bind(this));

		ipcRenderer.on('fb_closed', function (event, data) {
			if (this.state.waitingForFacebook) {
				this.setState({
					waitingForFacebook: false,
					facebookStatus: 'Not authenticated with Facebook!'
				});
			}
		}.bind(this));

		ipcRenderer.send("fb-authenticate", "yes");
	}

	_showDialog(errMsg) {
		this.setState({ hideDialog: false, errorMessage: errMsg });
	}

	_closeDialog() {
		this.setState({ showSpinner: true, errorMessage: null });

		let promiseLogin;
		if (this.state.facebookAccessToken) {
			promiseLogin = STTApi.loginWithFacebook(this.state.facebookAccessToken, this.state.facebookUserId, this.state.autoLogin);
		}
		else {
			promiseLogin = STTApi.login(this.state.username, this.state.password, this.state.autoLogin);
		}

		promiseLogin.then(() => {
			this.setState({ showSpinner: false, hideDialog: true });
			this.props.onAccessToken();
		})
		.catch((error) => {
			this.setState({ showSpinner: false, hideDialog: false, errorMessage: error });
		});
	}
}