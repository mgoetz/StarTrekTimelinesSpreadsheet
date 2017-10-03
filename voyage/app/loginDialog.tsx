import * as React from "react";
import * as ReactDOM from "react-dom";
import STTApi from '../../shared/api/STTApi';

export interface ILoginDialogProps {
    onAccessToken: () => void;
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
        return <div className="ui middle aligned center aligned">
            {this.state.errorMessage && (
                <div className="ui error message">{this.state.errorMessage}</div>
            )}

            <h2 className="ui teal header">
                <div className="content">Log-in with your account</div>
            </h2>
            <div className="ui large form">
                <div className="ui stacked segment">
                    <div className="field">
                        <div className="ui left icon input">
                            <i className="user icon"></i>
                            <input type="text" name="email" placeholder="Username (e-mail)" value={this.state.username} onChange={(event: any) => this.setState({ username: event.target.value })} />
                        </div>
                    </div>
                    <div className="field">
                        <div className="ui left icon input">
                            <i className="lock icon"></i>
                            <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={(event: any) => this.setState({ password: event.target.value })} />
                        </div>
                    </div>
                    <div className="field">
                        <div className="ui checkbox">
                            <input type="checkbox" name="save" checked={this.state.autoLogin} onChange={(event: any) => this.setState({ autoLogin: event.target.checked })} />
                            <label>Stay logged in</label>
                        </div>
                    </div>
                    <div className="ui fluid large teal submit button" onClick={this._closeDialog}>Login</div>
                </div>
            </div>

            <div className="ui message">
                New to Star Trek Timelines? <a href="https://www.disruptorbeam.com/games/star-trek-timelines/">Check it out</a>
            </div>

            {this.state.showSpinner && (
                <div className="ui active inverted dimmer">
                    <div className="ui small text loader">Logging in...</div>
                </div>
            )}
        </div>;
    }

    _closeDialog() {
        this.setState({ showSpinner: true, errorMessage: undefined });

        STTApi.login(this.state.username, this.state.password, this.state.autoLogin).then(() => {
            this.setState({ showSpinner: false });

            this.props.onAccessToken();
        })
        .catch((error: string) => {
            this.setState({ showSpinner: false, errorMessage: error });
        });
    }
}