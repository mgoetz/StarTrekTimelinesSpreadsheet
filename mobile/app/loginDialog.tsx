import * as React from "react";
import * as ReactDOM from "react-dom";
import STTApi from './STTApi';

import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Checkbox, ICheckboxStyles } from 'office-ui-fabric-react/lib/Checkbox';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

export interface ILoginDialogProps {
    onAccessToken: (autoLogin: boolean) => void;
}

export interface ILoginDialogState {
    errorMessage: string | undefined;
    autoLogin: boolean;
    showSpinner: boolean;
    username: string;
    password: string;
}

export class LoginDialog extends React.Component<ILoginDialogProps, ILoginDialogState> {
    constructor(props: ILoginDialogProps) {
        super(props);
        this.state = {
            errorMessage: undefined,
            autoLogin: true,
            showSpinner: false,
            username: '',
            password: ''
        };

        this._closeDialog = this._closeDialog.bind(this);
    }

    render() {
        return <div>
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

            <PrimaryButton onClick={this._closeDialog} text='Login' disabled={this.state.showSpinner} />
            {this.state.showSpinner && (
                <Spinner size={SpinnerSize.small} label='Logging in...' />
            )}
        </div>;
    }

    _closeDialog() {
        this.setState({ showSpinner: true, errorMessage: null });

        STTApi.login(this.state.username, this.state.password).then(() => {
            this.setState({ showSpinner: false });

            this.props.onAccessToken(this.state.autoLogin);
        })
        .catch((error: string) => {
            this.setState({ showSpinner: false, errorMessage: error });
        });
    }
}