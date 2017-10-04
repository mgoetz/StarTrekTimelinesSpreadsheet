import * as React from "react";
import * as ReactDOM from "react-dom";

import { CrewCard } from "./CrewCard";

import STTApi from 'sttapi';

interface IMinimalComplementState {
    dataLoaded: boolean;
    removableCrew: any[];
    unfreezeCrew: any[];
    duplicates: any[];
}

export class MinimalComplement extends React.Component<any, IMinimalComplementState> {
    constructor() {
        super();

        var uniq = STTApi.roster.map((crew: any) => { return { count: 1, crewId: crew.id }; })
            .reduce((a: any, b: any) => {
                a[b.crewId] = (a[b.crewId] || 0) + b.count;
                return a;
            }, {});

        var duplicateIds = Object.keys(uniq).filter((a: any) => uniq[a] > 1);

        if (!STTApi.minimalComplement) {
            // The thread (worker) didn't finish loading yet
            this.state = {
                dataLoaded: false,
                removableCrew: [],
                unfreezeCrew: [],
                duplicates: []
            };
        }
        else {
            this.state = {
                dataLoaded: true,
                duplicates: STTApi.roster.filter(function (crew: any) { return duplicateIds.indexOf(crew.id.toString()) != -1; }),
                removableCrew: STTApi.roster.filter(function (crew: any) { return (STTApi.minimalComplement.unneededCrew.indexOf(crew.id) != -1) && (crew.frozen == 0); }),
                unfreezeCrew: STTApi.roster.filter(function (crew: any) { return (STTApi.minimalComplement.neededCrew.indexOf(crew.id) != -1) && (crew.frozen > 0); })
            };
        }
    }

    _clientSideAccordion(event: any) {
        // toggle between hiding and showing the active panel
        var panel = event.target.nextElementSibling;
        if (!panel)
            return;

        if (panel.style.display === "block") {
            panel.style.display = "none";
            event.target.firstChild.className = "caret down icon";
        } else {
            panel.style.display = "block";
            event.target.firstChild.className = "caret up icon";
        }
    }

    render() {
        if (this.state.dataLoaded) {
            return (<div>
                <p><b>Note:</b> These recommendations do not take into account the needs for gauntlets, shuttle adventures, voyages or any ship battle missions. They also don't account for quest paths, only considering the needs of individual nodes. Manually review each one before making decisions.</p>

                <div className="ui accordion">
                    <div className="title" onClick={this._clientSideAccordion}>
                        <i className="caret down icon"></i>Duplicated crew ({this.state.duplicates.length})
                    </div>
                    <div className="content">
                        <div className="ui two stackable cards">
                            {this.state.duplicates.map((crew: any) => <CrewCard key={crew.name + crew.crew_id} crew={crew} />)}
                        </div>
                    </div>

                    <div className="title" onClick={this._clientSideAccordion}>
                        <i className="caret down icon"></i>Crew which could be frozen or airlocked ({this.state.removableCrew.length})
                    </div>
                    <div className="content">
                        <div className="ui two stackable cards">
                            {this.state.removableCrew.map((crew: any) => <CrewCard key={crew.name + crew.crew_id} crew={crew} />)}
                        </div>
                    </div>

                    <div className="title" onClick={this._clientSideAccordion}>
                        <i className="caret down icon"></i>Crew which needs to be unfrozen ({this.state.unfreezeCrew.length})
                    </div>
                    <div className="content">
                        <div className="ui two stackable cards">
                            {this.state.unfreezeCrew.map((crew: any) => <CrewCard key={crew.name + crew.crew_id} crew={crew} />)}
                        </div>
                    </div>

                    <div className="title" onClick={this._clientSideAccordion}>
                        <i className="caret down icon"></i>Raw mission stats !SIZE WARNING! ({STTApi.missionSuccess.length})
                    </div>
                    <div className="content">
                        {STTApi.missionSuccess.map((recommendation: any) => {
                            return (<div key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}>
                                <h3 className="ui top attached header">{recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}</h3>
                                <div className="ui attached segment">
                                    {(recommendation.crew.length == 0) ? (<div className="ui red basic label">You have no crew which can complete this challenge!</div>) :
                                        recommendation.crew.map((crew: any) => {
                                            return (<div className="ui basic label" key={crew.crew.name}>{crew.crew.name}<div className="detail">{crew.success.toFixed(2)}%</div></div>);
                                    })}
                                </div>
                            </div>);
                        })}
                    </div>
                </div>
            </div >);
        }
        else {
            return <p>Minimal crew calculation not done yet. Reload this tab in a bit.</p>
        }
    }
}