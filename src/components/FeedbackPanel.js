import React, { Component } from 'react';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

import STTApi from 'sttapi';

export class FeedbackPanel extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showFeedbackPanel: false,
			showSpinner: false
		};

		this.show = this.show.bind(this);
		this._sendFeedback = this._sendFeedback.bind(this);

		this.userFeedback = {
			feature: '',
			bug: '',
			other: '',
			nameSuggestion: '',
			email: '',
		};
	}

	show() {
		this.setState({ showFeedbackPanel: true });
	}

	_sendFeedback() {
		this.setState({ showSpinner: true });

		STTApi.submitUserFeedback(this.userFeedback).then(() => {
			this.setState({ showSpinner: false, showFeedbackPanel: false });
			var n = new Notification('Thank you for your feedback!', { body: 'All feedback helps me prioritize my work to deliver the most value.' });
		})
		.catch((error) => {
			this.setState({ showSpinner: false, showFeedbackPanel: false });
			var n = new Notification('Failed sending feedback', { body: 'Please use the GitHub issues page instead. Error:' + error });
		});
	}

	render() {
		return (
			<Panel
				isOpen={this.state.showFeedbackPanel}
				type={PanelType.smallFixedFar}
				onDismiss={() => this.setState({ showFeedbackPanel: false })}
				headerText='I need your feedback!'
			>
				<h3>I need your feedback to better understand your needs and manage my time investment.</h3>
				<TextField label='What would you like to see implemented next' placeholder='Your #1 feature reqest' multiline autoAdjustHeight onChanged={(text) => this.userFeedback.feature = text } />
				<TextField label="Bug, or something you'd want to be implemented differently" placeholder='Your #1 annoyance' multiline autoAdjustHeight onChanged={(text) => this.userFeedback.bug = text} />
				<TextField label='Any other feedback' multiline autoAdjustHeight onChanged={(text) => this.userFeedback.other = text} />
				<TextField label='Do you have a name suggestion better than "Tool" ? 😁' onChanged={(text) => this.userFeedback.nameSuggestion = text} />
				<TextField label='(Optional) Your e-mail address' onChanged={(text) => this.userFeedback.email = text} />
				<i>I won't share this with anyone; I'll only use it to contact you if I have questions about your feedback</i><br />
				<PrimaryButton text='Send feedback' onClick={this._sendFeedback} iconProps={{ iconName: 'ChatInviteFriend' }} style={{ width: '100%', marginBottom: '20px' }} />
				{this.state.showSpinner && (
					<Spinner size={SpinnerSize.small} label='Sending feedback...' />
				)}
			</Panel>);
	}
}
