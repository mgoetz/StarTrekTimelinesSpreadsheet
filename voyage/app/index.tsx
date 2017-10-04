import * as React from "react";
import * as ReactDOM from "react-dom";

import { LoginDialog } from "./loginDialog";
import { VoyageLog } from "./VoyageLog";

import STTApi from 'sttapi';
import { loginSequence, getWikiImageUrl } from 'sttapi';

enum Tab {
    VoyageLog,
    Crew,
    Feedback
}

interface IAppState {
    dataLoaded: boolean;
    showSpinner: boolean;
    loggedIn: boolean;
    captainName: string;
    spinnerLabel: string;
    captainAvatarUrl: string | undefined;
    filter: string;
    currentTab: Tab;
}

const skillRes:{ [index:string] : {name: string, url: string} } = {
    'command_skill': { name: 'Command', url: 'https://stt.wiki/w/images/thumb/6/6d/CMD.png/18px-CMD.png' },
    'science_skill': { name: 'Science', url: 'https://stt.wiki/w/images/thumb/b/ba/SCI.png/18px-SCI.png' },
    'security_skill': { name: 'Security', url: 'https://stt.wiki/w/images/thumb/c/c9/SEC.png/18px-SEC.png' },
    'engineering_skill': { name: 'Engineering', url: 'https://stt.wiki/w/images/thumb/8/8b/ENG.png/18px-ENG.png' },
    'diplomacy_skill': { name: 'Diplomacy', url: 'https://stt.wiki/w/images/thumb/5/58/DIP.png/18px-DIP.png' },
    'medicine_skill': { name: 'Medicine', url: 'https://stt.wiki/w/images/thumb/5/56/MED.png/18px-MED.png' }
};

//https://semantic-ui.com/elements/image.html#size
class App extends React.Component<any, IAppState> {
    constructor() {
        super();

        this._onAccessToken = this._onAccessToken.bind(this);
        this._renderVoyageLogPage = this._renderVoyageLogPage.bind(this);
        this._renderFeedbackPage = this._renderFeedbackPage.bind(this);

        this.state = {
            showSpinner: false,
            dataLoaded: false,
            loggedIn: false,
            captainName: 'Welcome',
            captainAvatarUrl: '',
            currentTab: Tab.VoyageLog,
            filter: '',
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
                    <p>&nbsp;</p>
                    <p>&nbsp;</p>
                    <p>&nbsp;</p>
                </div>
            )}

            {this.state.dataLoaded && (
                <div>
                    <div className="ui fixed inverted menu">
                        <div className="ui container">
                            <div className="ui simple dropdown item">
                                <img className="logo tiny" src={this.state.captainAvatarUrl} />
                                {this.state.captainName}
                                <div className="ui small teal right label">{STTApi.playerData.character.level}</div>

                                <div className="menu">
                                    <div className="item">
                                        <div className="ui label black">
                                            DBID: {STTApi.playerData.dbid}
                                        </div>

                                        <div className="ui label black">
                                            Location: {STTApi.playerData.character.navmap.places.find((place: any) => { return place.symbol == STTApi.playerData.character.location.place; }).display_name}
                                        </div>

                                        <br/><br/>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/1/12/Chroniton_icon.png/24px-Chroniton_icon.png" className="ui inline image" />&nbsp;
                                            {Math.min(Math.floor(STTApi.playerData.character.seconds_from_replay_energy_basis / STTApi.playerData.character.replay_energy_rate), STTApi.playerData.character.replay_energy_max) + STTApi.playerData.character.replay_energy_overflow}
                                        </div>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/1/1c/Dilithium_sm.png/19px-Dilithium_sm.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.premium_purchasable}
                                        </div>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/2/20/Merit_icon.png/22px-Merit_icon.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.premium_earnable}
                                        </div>

                                        <br/><br/>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/d/d4/Honor.png/24px-Honor.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.honor}
                                        </div>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/9/91/Credits_sm.png/24px-Credits_sm.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.money}
                                        </div>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/1/1e/Ticket.png/18px-Ticket.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.character.cadet_tickets.current} / {STTApi.playerData.character.cadet_tickets.max}
                                        </div>

                                        <br/><br/>

                                        <button className="ui primary button" onClick={() => this.setState({loggedIn: false})}>Logout</button>
                                    </div>
                                </div>
                            </div>
                            <a className="item" onClick={() => this.setState({currentTab: Tab.VoyageLog})} ><i className="film icon"></i> Voyage</a>
                            <a className="item" onClick={() => this.setState({currentTab: Tab.Crew})} ><i className="users icon"></i> Crew</a>
                            <a className="item" onClick={() => this.setState({currentTab: Tab.Feedback})} ><i className="help icon"></i> About</a>
                        </div>
                    </div>

                    <div className="ui main container" style={{ marginTop: '4em' }} >
                        {(this.state.currentTab == Tab.VoyageLog) && this._renderVoyageLogPage()}
                        {(this.state.currentTab == Tab.Crew) && this._renderCrewPage()}
                        {(this.state.currentTab == Tab.Feedback) && this._renderFeedbackPage()}
                    </div>
                </div>
            )}
        </div>);
    }

    _renderVoyageLogPage() {
        return <VoyageLog />;
    }

    _renderCrewPage() {
        let actualShip: any = STTApi.ships.find((ship: any) => ship.id == STTApi.playerData.character.voyage[0].ship_id);
        if (STTApi.playerData.character.voyage[0].ship_name == null) {
            STTApi.playerData.character.voyage[0].ship_name = actualShip.name;
        }

        return (<div>
            <h4>Voyage on the {STTApi.getShipTraitName(STTApi.playerData.character.voyage[0].ship_trait)} ship {STTApi.playerData.character.voyage[0].ship_name}</h4>
            <img className="ui medium image" src={actualShip.iconUrl} />

            <h4>Full crew complement</h4>
            <div className="ui list">
                {STTApi.playerData.character.voyage[0].crew_slots.map((slot: any) => {
                    return (<div className="item" key={slot.symbol}>
                        <img className="ui avatar image" src={STTApi.roster.find((rosterCrew: any) => rosterCrew.id == slot.crew.archetype_id).iconUrl} />
                        <div className="content">
                            <div className="header">{slot.crew.name}</div>
                            <div className="description">{slot.name}</div>
                        </div>
                    </div>);
                })}
            </div>

            <h4>Skill aggregates</h4>
            <div className="ui list">
                {Object.keys(STTApi.playerData.character.voyage[0].skill_aggregates).map((skillKey: any) => {
                    let skill = STTApi.playerData.character.voyage[0].skill_aggregates[skillKey];
                    return (<div className="item" key={skill.skill}>
                        <img className="ui image skillImage" src={skillRes[skill.skill].url} />

                        <div className="content">
                            <div className="header">{skill.core} ({skill.range_min}-{skill.range_max})</div>
                        </div>
                    </div>);
                })}
            </div></div>);
    }

    _renderFeedbackPage() {
        return <div>
            <h1>Star Trek Timelines Voyage Monitor v0.0.4</h1>
            <p>A tool to help with voyages in Star Trek Timelines</p>

            <p><b>DISCLAIMER</b> This tool is provided "as is", without warranty of any kind. Use at your own risk! It should be understood that <i>Star Trek Timelines</i> content and materials are trademarks and copyrights of <a href='https://www.disruptorbeam.com/tos/' target='_blank'>Disruptor Beam, Inc.</a> or its licensors. All rights reserved. This tool is neither endorsed by nor affiliated with Disruptor Beam, Inc.</p>
            <p>All images (crew portraits, items) displayed in the tool are references to <a href='https://stt.wiki/wiki/Main_Page' target='_blank'>stt.wiki</a>.</p>

            <p>For feedback, bugs and other issues please use the <a href='https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet/issues' target='_blank'>GitHub page</a>.</p>
        </div>;
    }

    _onAccessToken() {
        this.setState({ loggedIn: true, showSpinner: true });

        loginSequence((progressLabel) => this.setState({ spinnerLabel: progressLabel }), false)
            .then(() => {
                this.setState({
                    captainName: STTApi.playerData.character.display_name,
                    showSpinner: false,
                    dataLoaded: true
                });

                if (STTApi.playerData.character.crew_avatar) {
                    getWikiImageUrl(STTApi.playerData.character.crew_avatar.name.split(' ').join('_') + '_Head.png', 0).then(({ id, url }) => {
                        this.setState({ captainAvatarUrl: url });
                    }).catch((error) => { });
                }
            })
            .catch((error: any) => { });
    }
}

ReactDOM.render(<App />, document.getElementById("content"));