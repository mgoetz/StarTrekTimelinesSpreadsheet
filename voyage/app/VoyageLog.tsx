import * as React from "react";
import * as ReactDOM from "react-dom";

import STTApi from '../../shared/api/STTApi';

const skillRes: { [index: string]: { name: string, url: string } } = {
    'command_skill': { name: 'Command', url: 'https://stt.wiki/w/images/thumb/6/6d/CMD.png/18px-CMD.png' },
    'science_skill': { name: 'Science', url: 'https://stt.wiki/w/images/thumb/b/ba/SCI.png/18px-SCI.png' },
    'security_skill': { name: 'Security', url: 'https://stt.wiki/w/images/thumb/c/c9/SEC.png/18px-SEC.png' },
    'engineering_skill': { name: 'Engineering', url: 'https://stt.wiki/w/images/thumb/8/8b/ENG.png/18px-ENG.png' },
    'diplomacy_skill': { name: 'Diplomacy', url: 'https://stt.wiki/w/images/thumb/5/58/DIP.png/18px-DIP.png' },
    'medicine_skill': { name: 'Medicine', url: 'https://stt.wiki/w/images/thumb/5/56/MED.png/18px-MED.png' }
};

const rarityRes = [
    { name: 'Basic', color: 'Grey' },
    { name: 'Common', color: '#ddd' },
    { name: 'Uncommon', color: '#682' },
    { name: 'Rare', color: '#359' },
    { name: 'Super Rare', color: '#b3f' },
    { name: 'Legendary', color: 'gold' }
];

interface IVoyageLogEntryProps {
    log: any;
}

class VoyageLogEntry extends React.Component<any, IVoyageLogEntryProps> {
    constructor(props: IVoyageLogEntryProps) {
        super(props);
    }

    render() {
        return (<div className='event'>
                {this.props.entry.crewIconUrl && (
                    <div className='label'>
                        <img src={this.props.entry.crewIconUrl} />
                    </div>
                )}

                <div className='content'>
                    <div className='summary'>
                        {this.props.entry.skill_check && (
                            <span>
                                <img className="ui image skillImage" src={skillRes[this.props.entry.skill_check.skill].url} />
                                {(this.props.entry.skill_check.passed == true) ? <i className='check circle icon' /> : <i className='minus circle icon' />}
                            </span>
                        )}

                        <span dangerouslySetInnerHTML={{ __html: this.props.entry.text }} />
                        <div className="date">
                            {((Date.now()/1000 - this.props.entry.event_time) / 60).toFixed(0)} minutes ago
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

interface IVoyageLogState {
    dataLoaded: boolean;
    voyage: any;
    voyageNarrative: any;
    antimatter: number;
}

export class VoyageLog extends React.Component<any, IVoyageLogState> {
    timerID: any;
    _antimatterstatistic: any;

    constructor() {
        super();

        this.state = {
            dataLoaded: false,
            voyage: undefined,
            voyageNarrative: undefined,
            antimatter: 0
        };

        this.reloadState = this.reloadState.bind(this);
        this.animateAntimatter = this.animateAntimatter.bind(this);

        this.reloadState();
    }

    animateAntimatter() {
        var distance = 6;
        var keyframes = [
            { transform: 'translate3d(0, 0, 0)' },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)' },
            { transform: 'translate3d(0, 0, 0)' }];
        var timing = { duration: 900, iterations: 1 };
        this._antimatterstatistic.animate(keyframes, timing);
    }

    reloadState() {
        if (STTApi.playerData.character.voyage && STTApi.playerData.character.voyage.length > 0) {
            STTApi.loadVoyage(STTApi.playerData.character.voyage[0].id, false).then((voyageNarrative) => {
                // TODO: some log entries have 2 crew; how do I display those?
                voyageNarrative.forEach((entry: any) => {
                    if (entry.crew) {
                        let rc = STTApi.roster.find((rosterCrew: any) => rosterCrew.symbol == entry.crew[0]);
                        if (rc) {
                            entry.crewIconUrl = rc.iconUrl;
                        }
                    }
                });

                voyageNarrative = voyageNarrative.reverse();

                this.setState({
                    dataLoaded: true,
                    voyage: STTApi.playerData.character.voyage[0],
                    antimatter: STTApi.playerData.character.voyage[0].hp,
                    voyageNarrative: voyageNarrative
                });

                this.animateAntimatter();
            });
        }
    }

    componentDidMount() {
        this.timerID = setInterval( this.reloadState, 20000);
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    renderVoyageState(): JSX.Element {
        if (this.state.voyage.state == "recalled") {
            return <p>Voyage has lasted for {Math.floor(this.state.voyage.voyage_duration / 60)} minutes and it's currently returning.</p>;
        } else if (this.state.voyage.state == "failed") {
            return <p>Voyage has run out of antimatter after {Math.floor(this.state.voyage.voyage_duration / 60)} minutes and it's waiting to be abandoned or replenished.</p>;
        } else {
            return <p>Voyage has been ongoing for {Math.floor(this.state.voyage.voyage_duration / 60)} minutes (new dilemma in {Math.floor((this.state.voyage.seconds_between_dilemmas - this.state.voyage.seconds_since_last_dilemma) / 60)} minutes).</p>;
        }
    }

    render() {
        if (this.state.dataLoaded) {
            return (<div style={{ userSelect: 'initial' }}>
                <h3>Voyage on the {STTApi.getShipTraitName(this.state.voyage.ship_trait)} ship {this.state.voyage.ship_name}</h3>
                {this.renderVoyageState()}

                <div className="ui center aligned inverted segment">
                    <div className="ui teal inverted statistic">
                        <div className="value" ref={(antimatterstatistic) => this._antimatterstatistic = antimatterstatistic}>
                            {this.state.voyage.hp}
                        </div>
                        <div className="label">
                            Antimatter
                        </div>
                    </div>
                </div>

                <h3>Pending rewards</h3>
                <div className="ui inverted segment">
                    {this.state.voyage.pending_rewards.loot.map((loot: any, index: number) => {
                        return (<span key={index} style={{ color: loot.rarity && rarityRes[loot.rarity].color }}>{loot.quantity} {(loot.rarity == null) ? '' : rarityRes[loot.rarity].name} {loot.full_name}</span>);
                    }).reduce((prev: any, curr: any) => [prev, ', ', curr])}
                </div>

                <h3>Complete Captain's Log</h3>
                <div className="ui feed">
                    {this.state.voyageNarrative.map((entry: any) => {
                        return <VoyageLogEntry key={entry.index + entry.text} entry={entry} />;
                    })}
                </div>
            </div>);
        }
        else {
            return (<div className="ui segment">
                <div className="ui active inverted dimmer">
                    <div className="ui text loader">Loading voyage details...</div>
                </div>
                <p>&nbsp;</p>
                <p>&nbsp;</p>
                <p>&nbsp;</p>
            </div>);
        }
    }
}