import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { GroupedList } from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { DetailsRow } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsRow';
import { FocusZone, FocusZoneDirection } from 'office-ui-fabric-react/lib/FocusZone';
import { Selection, SelectionMode, SelectionZone } from 'office-ui-fabric-react/lib/utilities/selection/index';
import { Link } from 'office-ui-fabric-react/lib/Link';

import { loadMissionData } from '../utils/missions.js';

export class TraitBonuses extends React.Component {

	render() {

		if (!this.props.trait_bonuses || this.props.trait_bonuses.length == 0) {
			return (<span />);
		}
		else {

			var traitBonuses = [];

			this.props.trait_bonuses.map(function (traitBonus) {
				traitBonuses.push(
				<span key={traitBonus.trait}>{traitBonus.trait}
					<span className='quest-mastery'>
						<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({traitBonus.bonuses[0]})
						<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({traitBonus.bonuses[1]})
						<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({traitBonus.bonuses[2]})
					</span>,
				</span>);
			});

			return (<span>
				<br />
				<span style={{ width: 2 * 20, display: 'inline-block' }} />Trait bonuses: {traitBonuses}
			</span>);
		}
	}
}

export class Locks extends React.Component {

	render() {

		if (!this.props.locks || this.props.locks.length == 0) {
			return (<span />);
		}
		else {
			var lockTraits = [];

			this.props.locks.map(function (lock) {
				if (lock.trait) {
					lockTraits.push(<span key={lock.trait}>{lock.trait}</span>);
				}
				else
				{
					// TODO: get name of challenge
					lockTraits.push(<span key={lock.trait}>Success on {lock.success_on_node_id}</span>);
				}
			})

			return (<span>
				<br />
				<span style={{ width: 2 * 20, display: 'inline-block' }} />Locks:{lockTraits}
			</span>);
		}
	}
}

export class Critical extends React.Component {

	render() {

		if (!this.props.critical) {
			return (<span />);
		}
		else {
			//TODO: the threshold is for the last data.mastery_levels[0] with locked==false
			return (<span>
				<br />
				<span style={{ width: 2 * 20, display: 'inline-block' }} />Critical threshold:{this.props.critical.threshold}
			</span>);
		}
	}
}

export class MissionHelper extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dataAvailable: false,
			missions: [],
			challenges: []
		};

		this._onRenderCell = this._onRenderCell.bind(this);
		this._selection = new Selection;

		//TODO: Load on-demand
		loadMissionData(props.params.accesstoken, props.params.accepted_missions, function (result) {
			if (result.errorMsg || (result.statusCode && (result.statusCode != 200)))
			{

			}
			else {
				var allChallenges = [];
				var allMissions = [];
				var startIndex = 0;
				result.missionList.forEach(function (mission) {
					var newMission = mission;
					newMission.key = newMission.id;
					newMission.name = newMission.episode_title;
					newMission.count = newMission.quests.reduce(function (sum, value) {
						return sum + (value.challenges ? value.challenges.length : 0);
					}, 0);
					newMission.startIndex = startIndex;
					newMission.level = 0;
					newMission.children = [];

					newMission.quests.forEach(function (quest) {
						if (quest.quest_type == 'ConflictQuest') {
							var newQuest = quest;
							newQuest.key = quest.id;
							newQuest.count = newQuest.challenges ? newQuest.challenges.length : 0;
							newQuest.startIndex = startIndex;
							startIndex += newQuest.count;
							newQuest.level = 1;

							if (newQuest.challenges) {
								allChallenges = allChallenges.concat(newQuest.challenges.map(function (challenge) {
									var newChallenge = challenge;
									newChallenge.key = challenge.id;
									return newChallenge;
								}));
							}

							newMission.children.push(newQuest);
						}
					});
					
					allMissions.push(newMission);
				});

				this.setState({ dataAvailable: true, missions: allMissions, challenges: allChallenges });
			}
		}.bind(this));
	}

	render() {
		if (this.state.dataAvailable)
			return (
				<div className='data-grid' data-is-scrollable='true'>
				<FocusZone>
					<SelectionZone
						selection={this._selection}
						selectionMode={SelectionMode.none}
					>
						<GroupedList
							items={this.state.challenges}
							onRenderCell={this._onRenderCell}
							groups={this.state.missions}
							selectionMode={SelectionMode.none}
							selection={this._selection}
							groupProps={{ onRenderHeader: this._onRenderHeader }}
						/>
					</SelectionZone>
				</FocusZone>
				</div>
			);
		else
			return (<div>Not loaded yet</div>);
	}

	_onRenderCell(nestingDepth, challenge, itemIndex) {
		console.log(JSON.stringify(challenge));
		return (
			<div data-selection-index={itemIndex} data-is-focusable={true}>
				<FocusZone direction={FocusZoneDirection.horizontal}>
					<span className='groupHeaderDescriptiom'>
						<span style={{ width: 2 * 20, display: 'inline-block' }} />
						{challenge.name} <i>({challenge.skill})</i>
						<span className='quest-mastery'>
							<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({challenge.difficulty_by_mastery[0]})
							<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({challenge.difficulty_by_mastery[1]})
							<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({challenge.difficulty_by_mastery[2]})
						</span>
						<TraitBonuses trait_bonuses={challenge.trait_bonuses} />
						<Locks locks={challenge.locks} />
						<Critical critical={challenge.critical} />
					</span>
				</FocusZone>
			</div>
		);
	}

	_onRenderHeader(props) {
		return (
			<div className='groupHeader' data-is-focusable={true}>
				<FocusZone direction={FocusZoneDirection.horizontal}>
					<span style={{ width: props.groupLevel * 20, display: 'inline-block' }} />
					<button
						type='button'
						style={{ cursor: 'default', background: 'none', border: 'none' }}
						onClick={() => props.onToggleCollapse(props.group)}>
						<Icon
							iconName={props.group.isCollapsed ? 'ChevronDown' : 'ChevronUp'}
						/>
					</button>

					{(props.groupLevel == 0) ?
						(<span>{props.group.episode_title}
							<span className='groupHeaderDescriptiom'>(Completed {props.group.stars_earned} of {props.group.total_stars})</span>
							<br />
							{props.group.isCollapsed || true ? (<span />) : (<span className='groupHeaderDescriptiom'>{props.group.description}</span>)}
						</span>)
						:
						(<span>{props.group.name}
							<span className='quest-mastery groupHeaderDescriptiom'>
								<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({props.group.mastery_levels[0].progress.goal_progress} / {props.group.mastery_levels[0].progress.goals})
								<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({props.group.mastery_levels[1].progress.goal_progress} / {props.group.mastery_levels[1].progress.goals})
								<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({props.group.mastery_levels[2].progress.goal_progress} / {props.group.mastery_levels[2].progress.goals})
							</span>
							<br />
							{props.group.isCollapsed || true ? (<span />) : (<span className='groupHeaderDescriptiom'>{props.group.description}</span>)}
						</span>)
					}
				</FocusZone>
			</div>
		);
	}
}