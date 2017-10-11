import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Dropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Persona, PersonaSize, PersonaPresence } from 'office-ui-fabric-react/lib/Persona';
import vis from 'vis';
import '!style-loader!css-loader!vis/dist/vis.css';

import STTApi from 'sttapi';

const CONFIG = require('../utils/config.js');

export class MissionExplorer extends React.Component {
    constructor(props) {
        super(props);

        let options = [];
        STTApi.missions.forEach(function (mission) {
            var missionLabel = (mission.quests[0].cadet ? 'CADET - ' : '') + mission.episode_title;
            missionLabel += ' (' + mission.stars_earned + ' / ' + mission.total_stars + ')';

            options.push({ key: mission.id, text: missionLabel, itemType: DropdownMenuItemType.Header });
            var any = false;
            mission.quests.forEach(function (quest) {
                if (quest.quest_type == 'ConflictQuest') {
                    options.push({ key: quest.id, text: quest.name, data: { mission: mission.episode_title } });
                    any = true;
                }
            });

            if (!any) {
                options.pop();
            }
        });

        this.updateGraph = this.updateGraph.bind(this);
        this.loadSelectedMission = this.loadSelectedMission.bind(this);
        this.visContent = null;

        this.state = {
            dataAvailable: true,
            selectedItem: null,
            selectedChallenge: undefined,
            options: options
        };
    }

    htmlDecode(input) {
        input = input.replace(/<#([0-9A-F]{6})>/gi, '<span style="color:#$1">');
        input = input.replace(/<\/color>/g, '</span>');

        return {
            __html: input
        };
    }

    componentDidMount() {
        this.updateGraph();
    }

    componentDidUpdate() {
        this.updateGraph();
    }

    loadSelectedMission() {
        let mission = null;
        STTApi.missions.forEach(epsiode => {
            epsiode.quests.forEach(quest => {
                if (quest.id == this.state.selectedItem.key) {
                    mission = quest;
                }
            });
        });

        return mission;
    }

    updateGraph() {
        if (!this.refs.visGraph)
            return;

        if (this.visContent)
            this.visContent.destroy();

        if (this.state.selectedItem && this.state.selectedItem.key) {
            let mission = this.loadSelectedMission();
            if (mission) {
                let nodes = [];
                let edges = [];
                mission.challenges.forEach(challenge => {
                    // label: challenge.name
                    nodes.push({ id: challenge.id, label: challenge.name, level: challenge.grid_x, image: CONFIG.skillRes[challenge.skill].url, shape: 'image' });
                    if (challenge.children) {
                        challenge.children.forEach(child => {
                            edges.push({ from: challenge.id, to: child });
                        });
                    }
                });

                this.visContent = new vis.Network(this.refs.visGraph, { nodes: nodes, edges: edges },
                    {
                        edges: { smooth: false, arrows: { to: { enabled: true } } },
                        layout: { hierarchical: { direction: 'LR' } }
                    });

                this.visContent.on("click", (params) => {
                    if (params.nodes && params.nodes.length > 0) {
                        this.setState({ selectedChallenge: params.nodes[0] });
                    }
                });
            }
        }
    }

    renderChallengeDetails() {
        let challenge = undefined;
        let mission = this.loadSelectedMission();
        if (mission) {
            mission.challenges.forEach(item => {
                if (item.id == this.state.selectedChallenge) {
                    challenge = item;
                }
            });
        }

        if (!challenge) {
            return <span />;
        }

        var traitBonuses = [];
        challenge.trait_bonuses.map((traitBonus) => {
            traitBonuses.push(<span key={traitBonus.trait}>{STTApi.getTraitName(traitBonus.trait)}</span>);
        });

        var lockTraits = [];
        challenge.locks.map((lock) => {
            if (lock.trait) {
                lockTraits.push(<span key={lock.trait}>{STTApi.getTraitName(lock.trait)}</span>);
            }
            else {
                lockTraits.push(<span key='s{lock.success_on_node_id}'>Success on {mission.challenges.find(item => item.id == lock.success_on_node_id).name}</span>);
            }
        });

        let critical = <span />;
        if (challenge.critical) {
            if (!challenge.critical.claimed) {
                critical = <p>Critical reward: {challenge.critical.reward[0].full_name}</p>;
            }
        }

        let recommendations = STTApi.missionSuccess.find(missionSuccess => (missionSuccess.quest.id == mission.id) && (missionSuccess.challenge.id == challenge.id));
        let crewSuccess = [];
        recommendations.crew.forEach(item => {
            crewSuccess.push(<Persona
                key={item.crew.name}
                imageUrl={item.crew.iconUrl}
                primaryText={item.crew.name}
                secondaryText={item.success.toFixed(2) + '%'}
                showSecondaryText={true}
                size={PersonaSize.small}
                presence={(item.success >= 99.9) ? PersonaPresence.online : ((item.success > 50) ? PersonaPresence.away : PersonaPresence.busy)} />);
        });

        return (<div>
            <h4>{challenge.name}</h4>
            <span className='quest-mastery'>
                Skill: <Image src={CONFIG.skillRes[challenge.skill].url} height={18} /> {CONFIG.skillRes[challenge.skill].name}
            </span>
            <p>Trait bonuses: {(traitBonuses.length > 0) ? traitBonuses.reduce((prev, curr) => [prev, ', ', curr]) : 'none'}</p>
            <p>Locks: {(lockTraits.length > 0) ? lockTraits.reduce((prev, curr) => [prev, ', ', curr]) : 'none'}</p>
            {critical}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                {crewSuccess}
            </div>
            {(recommendations.crew.length == 0) && <span style={{ color: 'red' }}>You have no crew capable of completing this node!</span>}
        </div>);
    }


    renderMissionDetails() {
        let mission = this.loadSelectedMission();

        if (!mission) {
            return <span />;
        }

        // Get the numbers from the first challenge that has them (since they match across the quest)
        mission.challenges.forEach(function (challenge) {
            if (challenge.difficulty_by_mastery) {
                mission.difficulty_by_mastery = challenge.difficulty_by_mastery;
            }

            if (challenge.critical && challenge.critical.threshold) {
                mission.critical_threshold = challenge.critical.threshold;
            }

            if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
                mission.trait_bonuses = challenge.trait_bonuses[0].bonuses;
            }
        });

        return (<div>
            <table style={{ width: '100%' }}>
                <tbody>
                <tr style={{ minWidth: '300px' }}><td style={{ width: '50%' }}>
                    <h3>{mission.name}</h3>
                    <p>{mission.description}</p>

                    <div>
                        Mastery required: <span className='quest-mastery'>
                            <Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({mission.difficulty_by_mastery[0]})
                            <Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({mission.difficulty_by_mastery[1]})
                            <Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({mission.difficulty_by_mastery[2]})
                        </span>
                    </div>
                    <div>
                        Completed: <span className='quest-mastery'>
                            <Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({mission.mastery_levels[0].progress.goal_progress} / {mission.mastery_levels[0].progress.goals})
                            <Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({mission.mastery_levels[1].progress.goal_progress} / {mission.mastery_levels[1].progress.goals})
                            <Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({mission.mastery_levels[2].progress.goal_progress} / {mission.mastery_levels[2].progress.goals})
                        </span>
                    </div>
                    <div>
                        Trait bonuses: <span className='quest-mastery'>
                            <Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({mission.trait_bonuses[0]})
                            <Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({mission.trait_bonuses[1]})
                            <Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({mission.trait_bonuses[2]})
                        </span>
                    </div>
                    <div>
                        Critical threshold: {mission.critical_threshold ? mission.critical_threshold : 'none'}
                    </div>
                    {mission.cadet && (
                        <div>
                            Cadet requirements: <span dangerouslySetInnerHTML={this.htmlDecode(mission.crew_requirement.description)} />
                        </div>
                    )}
                </td><td style={{ width: '50%', height:'100%' }}>
                        <div ref='visGraph' style={{ border: '1px solid lightgray', height:'100%' }} />
                </td></tr>
                <tr><td colSpan={2}>
                    {(this.state.selectedChallenge != undefined) && this.renderChallengeDetails()}
                </td>
                </tr>
                </tbody>
            </table>
        </div>);
    }

    _onRenderTitle(option) {
        return (<div>
            <span><b>{option.data.mission} : </b></span>
            <span>{option.text}</span>
        </div>);
    }

    render() {
        if (this.state.dataAvailable)
            return (
                <div className='tab-panel' data-is-scrollable='true'>
                    <Dropdown
                        selectedKey={this.state.selectedItem && this.state.selectedItem.key}
                        onChanged={item => this.setState({ selectedItem: item })}
                        onRenderTitle={this._onRenderTitle}
                        placeHolder='Select a mission'
                        options={this.state.options}
                    />
                    {this.state.selectedItem && this.state.selectedItem.key && this.renderMissionDetails()}
                </div>
            );
        else
            return (<Spinner size={SpinnerSize.large} label='Loading mission and quest data...' />);
    }
}