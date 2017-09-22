import * as React from "react";
import * as ReactDOM from "react-dom";
import STTApi from '../../shared/api/STTApi';
import { loginSequence } from '../../shared/api/LoginSequence';

import { LoginDialog } from "./loginDialog";

export interface IAppState {
    dataLoaded: boolean;
    showSpinner: boolean;
    loggedIn: boolean;
    captainName: string;
    spinnerLabel: string;
}

const skillRes = {
    'command_skill': { name: 'Command', url: 'https://stt.wiki/w/images/thumb/6/6d/CMD.png/18px-CMD.png' },
    'science_skill': { name: 'Science', url: 'https://stt.wiki/w/images/thumb/b/ba/SCI.png/18px-SCI.png' },
    'security_skill': { name: 'Security', url: 'https://stt.wiki/w/images/thumb/c/c9/SEC.png/18px-SEC.png' },
    'engineering_skill': { name: 'Engineering', url: 'https://stt.wiki/w/images/thumb/8/8b/ENG.png/18px-ENG.png' },
    'diplomacy_skill': { name: 'Diplomacy', url: 'https://stt.wiki/w/images/thumb/5/58/DIP.png/18px-DIP.png' },
    'medicine_skill': { name: 'Medicine', url: 'https://stt.wiki/w/images/thumb/5/56/MED.png/18px-MED.png' }
};

class App extends React.Component<any, IAppState> {
    constructor() {
        super();

        this._onAccessToken = this._onAccessToken.bind(this);
        this._renderCrew = this._renderCrew.bind(this);
        //this._onRenderSecondaryText = this._onRenderSecondaryText.bind(this);

        this.state = {
            showSpinner: false,
            dataLoaded: false,
            loggedIn: false,
            captainName: 'Welcome',
            spinnerLabel: 'Loading data...',
        };

        STTApi.loginWithCachedAccessToken().then((success) => {
            if (success) {
                this._onAccessToken();
            }
            else {
                this.setState({ loggedIn: false });
            }
        });
    }

    render() {
        if (!this.state.loggedIn) {
            return <LoginDialog onAccessToken={this._onAccessToken} />;
        }
        return (<div>
            {this.state.showSpinner && (
                <div className="ui segment">
                    <div className="ui active inverted dimmer">
                        <div className="ui massive text loader">{this.state.spinnerLabel}</div>
                    </div>
                    <p>&nbsp;</p>
                    <p>&nbsp;</p>
                    <p>&nbsp;</p>
                </div>
            )}

            {this.state.dataLoaded && (
                <div>
                    <p>Welcome {this.state.captainName}</p>
                    <div className="ui three stackable cards">
                        {STTApi.roster.map((crew: any) => this._renderCrew(crew))}
                    </div>
                </div>
            )}
        </div>);
    }

    //https://semantic-ui.com/elements/image.html#size

    _renderCrew(crew: any) {
        let rating: JSX.Element[] = [];
        for (let i = 0; i < crew.rarity; i++) {
            rating.push(<i key={i} className='yellow star icon' />);
        }
        for (let i = 0; i < crew.max_rarity - crew.rarity; i++) {
            rating.push(<i key={i + 5} className='grey star icon' />);
        }

        return (<div className="card">
            <div className="content">
                <img className="left floated ui tiny image" src={crew.iconUrl} />
                <div className="header">
                    {(crew.frozen > 0) && <i className="right lock icon"></i>}
                    {crew.buyback && <i className="right recycle icon"></i>}
                    {crew.active_id && <i className="right wait icon"></i>}
                    {crew.name}
                </div>
                <div className="meta">Level {crew.level} {rating}</div>
                <div className="description">{crew.traits.replace(/,/g, ', ')}</div>
            </div>
            <div className="extra content">
                <div className="ui small feed">
                    {(crew.command_skill.core > 0) &&
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    <img className="ui image skillImage" src={skillRes["command_skill"].url} />{crew.command_skill.core} +({crew.command_skill.min} - {crew.command_skill.max})
                            </div>
                            </div>
                        </div>
                    }
                    {(crew.science_skill.core > 0) &&
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    <img className="ui image skillImage" src={skillRes["science_skill"].url} />{crew.science_skill.core} +({crew.science_skill.min} - {crew.science_skill.max})
                            </div>
                            </div>
                        </div>
                    }
                    {(crew.security_skill.core > 0) &&
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    <img className="ui image skillImage" src={skillRes["security_skill"].url} />{crew.security_skill.core} +({crew.security_skill.min} - {crew.security_skill.max})
                            </div>
                            </div>
                        </div>
                    }
                    {(crew.engineering_skill.core > 0) &&
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    <img className="ui image skillImage" src={skillRes["engineering_skill"].url} />{crew.engineering_skill.core} +({crew.engineering_skill.min} - {crew.engineering_skill.max})
                            </div>
                            </div>
                        </div>
                    }
                    {(crew.diplomacy_skill.core > 0) &&
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    <img className="ui image skillImage" src={skillRes["diplomacy_skill"].url} />{crew.diplomacy_skill.core} +({crew.diplomacy_skill.min} - {crew.diplomacy_skill.max})
                            </div>
                            </div>
                        </div>
                    }
                    {(crew.medicine_skill.core > 0) &&
                        <div className="event">
                            <div className="content">
                                <div className="summary">
                                    <img className="ui image skillImage" src={skillRes["medicine_skill"].url} />{crew.medicine_skill.core} +({crew.medicine_skill.min} - {crew.medicine_skill.max})
                            </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>);
    }

    _onAccessToken() {
        this.setState({ loggedIn: true, showSpinner: true });

        loginSequence((progressLabel) => this.setState({ spinnerLabel: progressLabel }))
            .then(() => {
                this.setState({
                    captainName: STTApi.playerData.character.display_name,
                    showSpinner: false,
                    dataLoaded: true
                });
            })
            .catch((error: any) => { });
    }
}

ReactDOM.render(<App />, document.getElementById("content"));