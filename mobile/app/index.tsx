import * as React from "react";
import * as ReactDOM from "react-dom";

import { LoginDialog } from "./loginDialog";
import { MinimalComplement } from "./MinimalComplement";
import { CrewCard } from "./CrewCard";

import STTApi from '../../shared/api/STTApi';
import { loginSequence } from '../../shared/api/LoginSequence';
import { getWikiImageUrl } from '../../shared/api/WikiImageTools';

enum Tab {
    Crew = 1,
    Recommendations,
    Feedback
}

interface IAppState {
    dataLoaded: boolean;
    showSpinner: boolean;
    loggedIn: boolean;
    captainName: string;
    spinnerLabel: string;
    filteredCrew: any[];
    sortColumn: string;
    sortedDescending: boolean;
    captainAvatarUrl: string;
    filter: string;
    currentTab: Tab;
}

const skillRes = {
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
        this._filterCrew = this._filterCrew.bind(this);
        this._renderRecommendationsPage = this._renderRecommendationsPage.bind(this);
        this._renderCrewPage = this._renderCrewPage.bind(this);
        this._renderFeedbackPage = this._renderFeedbackPage.bind(this);
        this._sortBy = this._sortBy.bind(this);

        this.state = {
            showSpinner: false,
            dataLoaded: false,
            loggedIn: false,
            filteredCrew: [],
            sortColumn: 'name',
            sortedDescending: false,
            captainName: 'Welcome',
            captainAvatarUrl: '',
            currentTab: Tab.Crew,
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

    sortItems(items: any[], sortBy: string, descending: boolean) {
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

    _filterCrewItem(crew: any, searchString: string) {
        return searchString.split(' ').every((text: string) => {
            // search the name first
            if (crew.name.toLowerCase().indexOf(text) > -1) {
                return true;
            }

            // now search the traits
            if (crew.traits.toLowerCase().indexOf(text) > -1) {
                return true;
            }

            // now search the raw traits
            if (crew.rawTraits.find((trait: string) => { trait.toLowerCase().indexOf(text) > -1 })) {
                return true;
            }

            return false;
        });
    }

    _filterCrew(newValue: string, field: string|undefined = undefined, sortedDescending: boolean|undefined = undefined) {
        this.setState({
            filter: newValue,
            sortColumn: (field == undefined) ? this.state.sortColumn : field,
            sortedDescending: (sortedDescending == undefined) ? this.state.sortedDescending : sortedDescending,
            filteredCrew: this.sortItems((newValue ?
                STTApi.roster.filter((i: any) => this._filterCrewItem(i, newValue)) : STTApi.roster),
                (field == undefined) ? this.state.sortColumn : field,
                (sortedDescending == undefined) ? this.state.sortedDescending : sortedDescending)
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

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/d/d4/Honor.png/24px-Honor.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.honor}
                                        </div>

                                        <br/><br/>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/9/91/Credits_sm.png/24px-Credits_sm.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.money}
                                        </div>

                                        <div className="ui label black">
                                            <img src="https://stt.wiki/w/images/thumb/1/1e/Ticket.png/18px-Ticket.png" className="ui inline image" />&nbsp;
                                            {STTApi.playerData.character.cadet_tickets.current} / {STTApi.playerData.character.cadet_tickets.max}
                                        </div>

                                        <div className="ui label black">
                                            <img src='https://stt.wiki/w/images/9/9f/ReplicatorRationBasic.png' height='18px' width='18px' className="ui inline image" />&nbsp;
                                            {STTApi.playerData.replicator_uses_today} / {STTApi.playerData.replicator_limit}
                                        </div>

                                        <br/><br/>

                                        <button className="ui primary button" onClick={() => this.setState({loggedIn: false})}>Logout</button>
                                    </div>
                                </div>
                            </div>
                            <div className="ui simple dropdown item" onClick={() => this.setState({currentTab: Tab.Crew})} >
                                Sort <i className="angle down icon"></i>
                                <div className="menu" style={{ paddingRight: '10px' }}>
                                    <a className="item" onClick={() => this._sortBy('name')}>Name {this._renderSortColumnIcon('name')}</a>
                                    <a className="item" onClick={() => this._sortBy('level')}>Level {this._renderSortColumnIcon('level')}</a>
                                    <a className="item" onClick={() => this._sortBy('max_rarity')}>Rarity {this._renderSortColumnIcon('max_rarity')}</a>
                                    <div className="divider"></div>
                                    <div className="header">Skills</div>
                                    <a className="item" onClick={() => this._sortBy('command_skill_core')}>
                                        <img className="ui image skillImageMenu" src={skillRes["command_skill"].url}/>
                                        Command {this._renderSortColumnIcon('command_skill_core')}
                                    </a>
                                    <a className="item" onClick={() => this._sortBy('diplomacy_skill_core')}>
                                        <img className="ui image skillImageMenu" src={skillRes["diplomacy_skill"].url}/>
                                        Diplomacy {this._renderSortColumnIcon('diplomacy_skill_core')}
                                    </a>
                                    <a className="item" onClick={() => this._sortBy('science_skill_core')}>
                                        <img className="ui image skillImageMenu" src={skillRes["science_skill"].url}/>
                                        Science {this._renderSortColumnIcon('science_skill_core')}
                                    </a>
                                    <a className="item" onClick={() => this._sortBy('security_skill_core')}>
                                        <img className="ui image skillImageMenu" src={skillRes["security_skill"].url}/>
                                        Security {this._renderSortColumnIcon('security_skill_core')}
                                    </a>
                                    <a className="item" onClick={() => this._sortBy('engineering_skill_core')}>
                                        <img className="ui image skillImageMenu" src={skillRes["engineering_skill"].url}/>
                                        Engineering {this._renderSortColumnIcon('engineering_skill_core')}
                                    </a>
                                    <a className="item" onClick={() => this._sortBy('medicine_skill_core')}>
                                        <img className="ui image skillImageMenu" src={skillRes["medicine_skill"].url}/>
                                        Medicine {this._renderSortColumnIcon('medicine_skill_core')}
                                    </a>
                                </div>
                            </div>
                            <a className="item" onClick={() => this.setState({currentTab: Tab.Recommendations})} >Recommendations <i className="wizard icon"></i></a>
                            <a className="item" onClick={() => this.setState({currentTab: Tab.Feedback})} >Help <i className="help icon"></i></a>
                        </div>
                    </div>

                    <div className="ui main container" style={{ marginTop: '4em' }} >
                        {(this.state.currentTab == Tab.Crew) && this._renderCrewPage()}
                        {(this.state.currentTab == Tab.Recommendations) && this._renderRecommendationsPage()}
                        {(this.state.currentTab == Tab.Feedback) && this._renderFeedbackPage()}
                    </div>
                </div>
            )}
        </div>);
    }

    _renderSortColumnIcon(field: string): JSX.Element {
        if (this.state.sortColumn == field) {
            if (this.state.sortedDescending) {
                return <i className="arrow up icon" />;
            }
            else {
                return <i className="arrow down icon" />;
            }
        }
        else {
            return null;
        }
    }

    _sortBy(field: string) {
        let sortedDescending: boolean = this.state.sortedDescending;
        if (this.state.sortColumn == field) {
            sortedDescending = !sortedDescending;
        }

        this._filterCrew(this.state.filter, field, sortedDescending);
    }

    _renderCrewPage() {
        return (<div>
            <div className="ui fluid icon input">
                <i className="search icon" />
                <input type="text" placeholder="Search by name or trait..." value={this.state.filter} onChange={(event: any) => this._filterCrew(event.target.value)} />
            </div>
            <br />

            <div className="ui two stackable cards">
                {this.state.filteredCrew.map((crew: any) => <CrewCard key={crew.id + crew.crew_id} crew={crew} />)}
            </div>
        </div>);
    }

    _renderRecommendationsPage() {
        return <MinimalComplement />;
    }

    _renderFeedbackPage() {
        return <div>
            <h1>Star Trek Timelines Companion v0.0.1</h1>
            <p>A tool to help with crew management in Star Trek Timelines</p>

            <p><b>NOTE</b> This tool does not (and will never) automate any part of the game play; its sole purpose is to help players organize their crew using the functionality built within or with a spreadsheet application of their choice.</p>

            <p><b>DISCLAIMER</b> This tool is provided "as is", without warranty of any kind. Use at your own risk! It should be understood that <i>Star Trek Timelines</i> content and materials are trademarks and copyrights of <a href='https://www.disruptorbeam.com/tos/' target='_blank'>Disruptor Beam, Inc.</a> or its licensors. All rights reserved. This tool is neither endorsed by nor affiliated with Disruptor Beam, Inc.</p>
            <p>All images (crew portraits, items) displayed in the tool are references to <a href='https://stt.wiki/wiki/Main_Page' target='_blank'>stt.wiki</a>.</p>

            <p>For feedback, bugs and other issues please use the <a href='https://github.com/IAmPicard/StarTrekTimelinesSpreadsheet/issues' target='_blank'>GitHub page</a>.</p>
        </div>;
    }

    _onAccessToken() {
        this.setState({ loggedIn: true, showSpinner: true });

        loginSequence((progressLabel) => this.setState({ spinnerLabel: progressLabel }))
            .then(() => {
                this.setState({
                    captainName: STTApi.playerData.character.display_name,
                    filteredCrew: this.sortItems(STTApi.roster, this.state.sortColumn, this.state.sortedDescending),
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