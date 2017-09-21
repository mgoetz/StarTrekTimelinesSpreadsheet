import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { GroupedList } from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { DetailsRow } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsRow';
import { FocusZone, FocusZoneDirection } from 'office-ui-fabric-react/lib/FocusZone';
import { Selection, SelectionMode, SelectionZone } from 'office-ui-fabric-react/lib/utilities/selection/index';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import STTApi from '../../shared/api/STTApi.ts';

const CONFIG = require('../utils/config.js');

export class TraitBonuses extends React.Component {
	render() {

		if (!this.props.trait_bonuses || this.props.trait_bonuses.length == 0) {
			return (<span />);
		}
		else {
			var traitBonuses = [];

			this.props.trait_bonuses.map(function (traitBonus) {
				traitBonuses.push(<span key={traitBonus.trait}>{STTApi.getTraitName(traitBonus.trait)}</span>);
			}.bind(this));

			return (<span>
				<br />
				<span style={{ width: 3 * 20, display: 'inline-block' }} />Trait bonuses: {traitBonuses.reduce((prev, curr) => [prev, ', ', curr])}
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
					lockTraits.push(<span key={lock.trait}>{STTApi.getTraitName(lock.trait)}</span>);
				}
				else
				{
					// TODO: get name of challenge
					lockTraits.push(<span key='s{lock.success_on_node_id}'>Success on {lock.success_on_node_id}</span>);
				}
			}.bind(this))

			return (<span>
				<br />
				<span style={{ width: 3 * 20, display: 'inline-block' }} />Locks: {lockTraits.reduce((prev, curr) => [prev, ', ', curr])}
			</span>);
		}
	}
}

export class QuestDetails extends React.Component {
	_menuButtonElement;

	constructor(props) {
		super(props);

		this._onShowMenuClicked = this._onShowMenuClicked.bind(this);
		this._onCalloutDismiss = this._onCalloutDismiss.bind(this);

		this.state = {
			isCalloutVisible: false
		};
	}

	htmlDecode(input) {
		input = input.replace(/<#([0-9A-F]{6})>/gi, '<span style="color:#$1">');
		input = input.replace(/<\/color>/g, '</span>');

		return {
			__html: input
		};
	}

	render() {
		let { isCalloutVisible } = this.state;

		return (
			<div className='CalloutQuest'>
				<div className='CalloutQuest-buttonArea' ref={(menuButton) => this._menuButtonElement = menuButton}>
					<DefaultButton
						onClick={this._onShowMenuClicked}
						text={isCalloutVisible ? 'Hide details' : 'Show details'}
					/>
				</div>
				{isCalloutVisible && (
					<Callout
						className='CalloutQuest-callout'
						ariaLabelledBy={'callout-label-1'}
						ariaDescribedBy={'callout-description-1'}
						role={'alertdialog'}
						gapSpace={0}
						targetElement={this._menuButtonElement}
						onDismiss={this._onCalloutDismiss}
						setInitialFocus={true}
					>
						<div className='CalloutQuest-header'>
							<p className='CalloutQuest-title' id={'callout-label-1'}>
								{this.props.quest.name}
							</p>
						</div>
						<div className='CalloutQuest-inner'>
							<div className='CalloutQuest-content'>
								<div className='CalloutQuest-subText' id={'callout-description-1'}>
									{this.props.quest.description}
								</div>
								<div className='CalloutQuest-subText' id={'callout-description-1'}>
									Mastery required: <span className='quest-mastery'>
										<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({this.props.quest.difficulty_by_mastery[0]})
										<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({this.props.quest.difficulty_by_mastery[1]})
										<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({this.props.quest.difficulty_by_mastery[2]})
									</span>
								</div>
								<div className='CalloutQuest-subText' id={'callout-description-2'}>
									Trait bonuses: <span className='quest-mastery'>
										<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({this.props.quest.trait_bonuses[0]})
										<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({this.props.quest.trait_bonuses[1]})
										<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({this.props.quest.trait_bonuses[2]})
									</span>
								</div>
								<div className='CalloutQuest-subText' id={'callout-description-3'}>
									Critical threshold: {this.props.quest.critical_threshold ? this.props.quest.critical_threshold : 'none'}
								</div>
								{this.props.quest.cadet && (
									<div className='CalloutQuest-subText' id={'callout-description-4'}>
										Cadet requirements: <span dangerouslySetInnerHTML={this.htmlDecode(this.props.quest.crew_requirement.description)} />
									</div>
								)}
							</div>
						</div>
					</Callout>
				)}
			</div>
		);

		//TODO: the threshold is for the last data.mastery_levels[0] with locked==false
	}

	_onShowMenuClicked() {
		this.setState({
			isCalloutVisible: !this.state.isCalloutVisible
		});
	}

	_onCalloutDismiss() {
		this.setState({
			isCalloutVisible: false
		});
	}
}

export class MissionHelper extends React.Component {
	constructor(props) {
		super(props);

		this._onRenderCell = this._onRenderCell.bind(this);
		this._selection = new Selection;

		var allChallenges = [];
		var allMissions = [];
		var startIndex = 0;
		STTApi.missions.forEach(function (mission) {
			if ((mission.quests[0].cadet == true) != props.cadet) {
				return;
			}

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

					// Get the numbers from the first challenge that has them (since they match across the quest)
					newQuest.challenges.forEach(function (challenge) {
						if (challenge.difficulty_by_mastery) {
							newQuest.difficulty_by_mastery = challenge.difficulty_by_mastery;
						}

						if (challenge.critical && challenge.critical.threshold) {
							newQuest.critical_threshold = challenge.critical.threshold;
						}

						if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
							newQuest.trait_bonuses = challenge.trait_bonuses[0].bonuses;
						}
					});

					newMission.children.push(newQuest);
				}
			});

			allMissions.push(newMission);
		});

		this.state = {
			dataAvailable: true,
			missions: allMissions,
			challenges: allChallenges
		};
	}

	render() {
		if (this.state.dataAvailable)
			return (
				<div className='tab-panel' data-is-scrollable='true'>
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
			return (<Spinner size={SpinnerSize.large} label='Loading mission and quest data...' /> );
	}

	_onRenderCell(nestingDepth, challenge, itemIndex) {
		return (
			<div data-selection-index={itemIndex} data-is-focusable={true}>
				<FocusZone direction={FocusZoneDirection.horizontal}>
					<span className='groupHeaderDescriptiom'>
						<span className='itemHeader'><span style={{ width: 2 * 20, display: 'inline-block' }} />{challenge.name}</span><br/>
						<span style={{ width: 3 * 20, display: 'inline-block' }} />
						<span className='quest-mastery'>
							Skill: <Image src={CONFIG.skillRes[challenge.skill].url} height={18} /> {CONFIG.skillRes[challenge.skill].name}
						</span>
						<TraitBonuses trait_bonuses={challenge.trait_bonuses} />
						<Locks locks={challenge.locks} />
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
							<span className='groupHeaderDescriptiom'> (Completed {props.group.stars_earned} of {props.group.total_stars})</span>
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
							<QuestDetails quest={props.group} />
							<br />
							{props.group.isCollapsed || true ? (<span />) : (<span className='groupHeaderDescriptiom'>{props.group.description}</span>)}
						</span>)
					}
				</FocusZone>
			</div>
		);
	}
}