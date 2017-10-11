import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Dropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import vis from 'vis';
import '!style-loader!css-loader!vis/dist/vis.css';

import STTApi from 'sttapi';

const CONFIG = require('../utils/config.js');

export class MissionExplorer extends React.Component {
    constructor(props) {
        super(props);

        let options = [];
        STTApi.missions.forEach(function (mission) {
            if ((mission.quests[0].cadet == true) != props.cadet) {
                return;
            }

            options.push({ key: mission.id, text: mission.episode_title, itemType: DropdownMenuItemType.Header });
            mission.quests.forEach(function (quest) {
                if (quest.quest_type == 'ConflictQuest') {
                    options.push({ key: quest.id, text: quest.name });
                }
            });
        });

        this.updateGraph = this.updateGraph.bind(this);
        this.loadSelectedMission = this.loadSelectedMission.bind(this);
        this.visContent = null;

        this.state = {
            dataAvailable: true,
            selectedItem: null,
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
                    nodes.push({id: challenge.id, label: challenge.difficulty ,level: challenge.grid_x, image: CONFIG.skillRes[challenge.skill].url, shape: 'image'});
                    if (challenge.children) {
                        challenge.children.forEach(child => {
                            edges.push({from: challenge.id, to: child});
                        });
                    }
                });

                this.visContent = new vis.Network(this.refs.visGraph, { nodes: nodes, edges: edges },
                    { height: 200, edges: { smooth: false }, layout: { hierarchical: { direction: 'LR' }}});
            }
        }
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
            <div ref='visGraph' style={{ width: '100%' }} />
        </div>);
    }

    render() {
        if (this.state.dataAvailable)
            return (
                <div className='tab-panel' data-is-scrollable='true'>
                    <Dropdown
                        selectedKey={this.state.selectedItem && this.state.selectedItem.key}
                        onChanged={item => this.setState({ selectedItem: item })}
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