import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Dropdown, DropdownMenuItemType, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { Persona, PersonaSize, PersonaPresence } from 'office-ui-fabric-react/lib/Persona';
import vis from 'vis';
import '!style-loader!css-loader!vis/dist/vis.css';

import STTApi from 'sttapi';
import { CONFIG } from 'sttapi';

export class MissionDetails extends React.Component {
	constructor(props) {
        super(props);
        
        this.loadMissionDetails = this.loadMissionDetails.bind(this);
        this.loadMissionDetailsInternal = this.loadMissionDetailsInternal.bind(this);
        this.updateGraph = this.updateGraph.bind(this);
        this.visContent = null;

        if (!this.props.questId) {
            this.state = {
                mission: undefined,
                selectedChallenge: undefined,
                bestCrewPaths: undefined
            };
        }
        else {
            this.state = this.loadMissionDetailsInternal(this.props.questId.data.questId);
        }
    }

    componentDidMount() {
        this.updateGraph();
    }

    componentDidUpdate() {
        this.updateGraph();
    }
    
    loadMissionDetails(questId) {
        this.setState(this.loadMissionDetailsInternal(questId));
    }

    loadMissionDetailsInternal(questId) {
        let mission = undefined;
        STTApi.missions.forEach(epsiode => {
            epsiode.quests.forEach(quest => {
                if (quest.id == questId) {
                    mission = quest;
                }
            });
        });

        if (!mission) {
            return {
                mission: undefined,
                bestCrewPaths: undefined
            };
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

        // TODO: This should probably move down into STTApi
        // This algorithm assumes the graph is acyclic
        var nodeElem = {};
        var unfinishedNodes = [];
        mission.challenges.forEach(challenge => {
            nodeElem[challenge.id] = challenge;

            if (challenge.critical && !challenge.critical.claimed) {
                unfinishedNodes.push(challenge.id)
            }
        });

        // DFS to build all possible paths through the graph
        var paths = [];
        let buildTree = (index, path) => {
            let newPath = path.slice(0);
            newPath.push(index);
            if (nodeElem[index].children && nodeElem[index].children.length > 0) {
                nodeElem[index].children.forEach(child => {
                    buildTree(child, newPath);
                });
            }
            else {
                // Reached an end-node, record the path
                paths.push(newPath);
            }
        };
        buildTree(0, []);

        // Eliminate paths that are all done (don't include any unfinished node)
        paths = paths.filter(path => {
            return path.filter(node => unfinishedNodes.indexOf(node) > -1).length > 0;
        });

        // NOTE: this algorithm doesn't consider crew selections where you intentionally fail a node (all nodes must have success > 0)
        var bestCrewPaths = [];

        // Calculate optimal crew selection for each path
        // WARNING - computationally intensive (consider showing a progress and using a WebWorker to unblock the UI thread)
        paths = paths.forEach(path => {
            var crewSelections = [];
            let pathStep = (level, crewSelection) => {
                if (path.length == level) {
                    crewSelections.push(crewSelection);
                    return;
                }

                let recommendations = STTApi.missionSuccess.find(missionSuccess => (missionSuccess.quest.id == mission.id) && (missionSuccess.challenge.id == path[level]));
                if (recommendations && recommendations.crew.length > 0) {
                    recommendations.crew.forEach(recommendation => {
                        // If we already picked 3 crew, all subsequent choices must be from those 3
                        if ((crewSelection.length < 3) || (crewSelection.find(selection => selection.crew.id == recommendation.crew.id))) {
                            let newCrewSelection = crewSelection.slice(0);
                            newCrewSelection.push(recommendation);
                            pathStep(level + 1, newCrewSelection);
                        }
                    });
                }
            };
            pathStep(0, []);

            // Apply tired crew coefficient and sort crew selections by total success
            let totalSuccess = (crewSelection) => {
                let min = crewSelection[0].success;
                let total = crewSelection[0].success;
                for (var i = 1; i < crewSelection.length; i++) {
                    if (crewSelection[i].crew.id == crewSelection[i - 1].crew.id) {
                        // If crew is used on consecutive nodes, it gets -20% to skill rating
                        let skill = nodeElem[path[i]].skill;
                        let tiredSuccess = ((crewSelection[i].rollCrew + crewSelection[i].crew[skill].max) * STTApi.serverConfig.config.conflict.tired_crew_coefficient - crewSelection[i].rollRequired) * 100 /
                            (crewSelection[i].crew[skill].max - crewSelection[i].crew[skill].min);
                        if (tiredSuccess > 100) tiredSuccess = 100;

                        if (tiredSuccess < min) {
                            min = tiredSuccess;
                        }

                        total += tiredSuccess;
                    }
                    else {
                        if (crewSelection[i].success < min) {
                            min = crewSelection[i].success;
                        }
                        total += crewSelection[i].success;
                    }
                }
                return {total, min};
            };

            // Filter out the selections that now are no longer feasible after applying the tired crew coefficient
            crewSelections = crewSelections.filter(crewSelection => totalSuccess(crewSelection).min > 0);

            crewSelections.sort((a,b) => totalSuccess(b).total - totalSuccess(a).total);

            if (crewSelections.length > 0) {
                bestCrewPaths.push({path, crew: crewSelections[0], success: totalSuccess(crewSelections[0]).min});
            }
        });

        return { mission, bestCrewPaths };
    }

    updateGraph() {
        if (!this.refs.visGraph)
            return;

        if (this.visContent)
            this.visContent.destroy();

        let mission = this.state.mission;
        if (mission) {
            let nodes = [];
            let edges = [];
            mission.challenges.forEach(challenge => {
                let color = undefined;
                if (challenge.critical) {
                    if (!challenge.critical.claimed) {
                        color = 'red';
                    }
                }

                nodes.push({ id: challenge.id, label: '(' + challenge.id + ') ' + challenge.name, level: challenge.grid_x, image: CONFIG.SPRITES['icon_' + challenge.skill].url, shape: 'image', font: {color : color } });
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

    renderChallengeDetails() {
        let challenge = undefined;
        let mission = this.state.mission;
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
                Skill: <Image src={CONFIG.SPRITES['icon_' + challenge.skill].url} height={18} /> {CONFIG.SKILLS[challenge.skill]}
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

    htmlDecode(input) {
        input = input.replace(/<#([0-9A-F]{6})>/gi, '<span style="color:#$1">');
        input = input.replace(/<\/color>/g, '</span>');

        return {
            __html: input
        };
    }

	render() {
        if (!this.state.mission) {
            return <span/>;
        }

		var crewSelectionLog;
        if (this.state.bestCrewPaths.length == 0) {
            crewSelectionLog = <span style={{ color: 'red' }}>There is no crew selection capable of completing this mission. Get more crew!</span>;
        }
        else {
            crewSelectionLog = [];
            this.state.bestCrewPaths.forEach((crewpath, indexcrewpath) => {
                let crewSuccess = [];
                crewpath.crew.forEach((crewpathcrew, index) => {
                    crewSuccess.push(<Persona
                        key={crewpathcrew.crew.name + index}
                        imageUrl={crewpathcrew.crew.iconUrl}
                        primaryText={'(' + crewpath.path[index] + ') ' + crewpathcrew.crew.name}
                        size={PersonaSize.extraExtraSmall}
                        presence={PersonaPresence.none} />);
                });

                crewSelectionLog.push(
                    <div key={indexcrewpath} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                        <span>{(crewpath.success).toFixed(2)}% guaranteed success:</span>
                        {crewSuccess}
                    </div>
                );
            });
        }

        return (<div>
            <table style={{ width: '100%' }}>
                <tbody>
                <tr style={{ minWidth: '300px' }}><td style={{ width: '50%' }}>
                    <h3>{this.state.mission.name}</h3>
                    <p>{this.state.mission.description}</p>

                    <div>
                        Mastery required: <span className='quest-mastery'>
                            <Image src={CONFIG.SPRITES['mastery_lowest_icon'].url} height={20} />({this.state.mission.difficulty_by_mastery[0]})
                            <Image src={CONFIG.SPRITES['mastery_medium_icon'].url} height={20} />({this.state.mission.difficulty_by_mastery[1]})
                            <Image src={CONFIG.SPRITES['mastery_highest_icon'].url} height={20} />({this.state.mission.difficulty_by_mastery[2]})
                        </span>
                    </div>
                    <div>
                        Completed: <span className='quest-mastery'>
                            <Image src={CONFIG.SPRITES['mastery_lowest_icon'].url} height={20} />({this.state.mission.mastery_levels[0].progress.goal_progress} / {this.state.mission.mastery_levels[0].progress.goals})
                            <Image src={CONFIG.SPRITES['mastery_medium_icon'].url} height={20} />({this.state.mission.mastery_levels[1].progress.goal_progress} / {this.state.mission.mastery_levels[1].progress.goals})
                            <Image src={CONFIG.SPRITES['mastery_highest_icon'].url} height={20} />({this.state.mission.mastery_levels[2].progress.goal_progress} / {this.state.mission.mastery_levels[2].progress.goals})
                        </span>
                    </div>
                    <div>
                        Trait bonuses: <span className='quest-mastery'>
                            <Image src={CONFIG.SPRITES['mastery_lowest_icon'].url} height={20} />({this.state.mission.trait_bonuses[0]})
                            <Image src={CONFIG.SPRITES['mastery_medium_icon'].url} height={20} />({this.state.mission.trait_bonuses[1]})
                            <Image src={CONFIG.SPRITES['mastery_highest_icon'].url} height={20} />({this.state.mission.trait_bonuses[2]})
                        </span>
                    </div>
                    <div>
                        Critical threshold: {this.state.mission.critical_threshold ? this.state.mission.critical_threshold : 'none'}
                    </div>
                    {this.state.mission.cadet && (
                        <div>
                            Cadet requirements: <span dangerouslySetInnerHTML={this.htmlDecode(this.state.mission.crew_requirement.description)} />
                        </div>
                    )}
                </td><td style={{ width: '50%', height:'100%' }}>
                        <div ref='visGraph' style={{ border: '1px solid lightgray', height:'100%' }} />
                </td></tr>
                <tr><td colSpan={2}>
                    {crewSelectionLog}
                    {(this.state.selectedChallenge != undefined) && this.renderChallengeDetails()}
                </td>
                </tr>
                </tbody>
            </table>
        </div>);
	}
}

export class MissionExplorer extends React.Component {
    constructor(props) {
        super(props);

        this.loadOptions = this.loadOptions.bind(this);

        this.state = {
            dataAvailable: true,
            selectedItem: null,
            onlyIncomplete: false,
            options: this.loadOptions(false)
        };
    }

    loadOptions(onlyIncomplete) {
        let options = [];
        STTApi.missions.forEach(function (mission) {
            if (mission.quests.length == 0) return;
            if (onlyIncomplete && (mission.stars_earned == mission.total_stars)) return;

            var missionLabel = (mission.quests[0].cadet ? 'CADET - ' : '') + mission.episode_title;
            missionLabel += ' (' + mission.stars_earned + ' / ' + mission.total_stars + ')';

            options.push({ key: mission.episode_title + mission.id, text: missionLabel, itemType: DropdownMenuItemType.Header });
            var any = false;
            mission.quests.forEach(function (quest) {
                if (quest.quest_type == 'ConflictQuest') {
                    if (onlyIncomplete) {
                        let goals = quest.mastery_levels[0].progress.goals + quest.mastery_levels[1].progress.goals + quest.mastery_levels[2].progress.goals;
                        let goal_progress = quest.mastery_levels[0].progress.goal_progress + quest.mastery_levels[1].progress.goal_progress + quest.mastery_levels[2].progress.goal_progress;
                        if (goals == goal_progress) return;
                    }

                    options.push({ key: quest.name + quest.id, text: quest.name, data: { mission: mission.episode_title, questId: quest.id } });
                    any = true;
                }
            });

            if (!any) {
                options.pop();
            }
        });

        return options;
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
                        onChanged={item => {this.setState({ selectedItem: item }); this.refs.missionDetails.loadMissionDetails(item.data.questId); }}
                        onRenderTitle={this._onRenderTitle}
                        placeHolder='Select a mission'
                        options={this.state.options}
                    />
                    <Checkbox label='Show only missions that are not fully complete' checked={this.state.onlyIncomplete}
                        onChange={ (ev, isChecked) => this.setState({options: this.loadOptions(isChecked), onlyIncomplete: isChecked}) }
                    />
                    <MissionDetails questId={this.state.selectedItem} ref='missionDetails' />
                </div>
            );
        else
            return (<Spinner size={SpinnerSize.large} label='Loading mission and quest data...' />);
    }
}