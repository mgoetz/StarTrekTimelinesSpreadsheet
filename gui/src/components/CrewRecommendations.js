import React, { Component } from 'react';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

import { loadMissionData } from '../utils/missions.js';
const CONFIG = require('../utils/config.js');

export class CrewRecommendations extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dataAvailable: false,
			recommendations: []
		};

		loadMissionData(props.cadetMissions.accesstoken, props.cadetMissions.accepted_missions, function (result) {
			if (result.errorMsg || (result.statusCode && (result.statusCode != 200))) {

			}
			else {
				var log = [];

				result.missionList.forEach(function (mission) {
					mission.quests.forEach(function (quest) {
						if (quest.quest_type == 'ConflictQuest') {
							quest.challenges.forEach(function (challenge) {

								var entry = {
									name: mission.episode_title + ' - ' + quest.name + ' - ' + challenge.name,
									roll: 0,
									critical: 0,
									traits: [],
									crew: []
								};

								var roll = 0;

								if (challenge.difficulty_by_mastery) {
									entry.roll = challenge.difficulty_by_mastery[2];
									roll += challenge.difficulty_by_mastery[2];
								}

								if (challenge.critical && challenge.critical.threshold) {
									entry.critical = challenge.critical.threshold;
									roll += challenge.critical.threshold;
								}

								if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
									challenge.trait_bonuses.forEach(function (traitBonus) {
										entry.traits.push({ trait: traitBonus.trait, bonus: traitBonus.bonuses[2] });
									});
								}

								if (challenge.locks && (challenge.locks.length > 0)) {
									alert('It looks like DB introduced locks in cadet challenged. Contact me to update the script!');
								}
								
								this.props.crew.forEach(function (crew) {
									if ((crew.rarity < quest.crew_requirement.min_stars) || (crew.rarity > quest.crew_requirement.max_stars)) {
										return; // Doesn't meet rarity requirements
									}

									let rawTraits = new Set(crew.rawTraits);
									if (quest.crew_requirement.traits && (quest.crew_requirement.traits.length > 0)) {
										var matchingTraits = quest.crew_requirement.traits.filter(trait => rawTraits.has(trait)).length;
										if (matchingTraits == 0)
											return; // Doesn't meet trait requirements
									}

									// Compute roll for crew
									var rollCrew = crew[challenge.skill].core;

									if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
										var matchingTraits = challenge.trait_bonuses.filter(traitBonus => rawTraits.has(traitBonus.trait)).length;
										rollCrew += matchingTraits * challenge.trait_bonuses[0].bonuses[2];
									}

									if (rollCrew + crew[challenge.skill].max > roll) // Does this crew even have a chance?
									{
										var successPercentage = (rollCrew + crew[challenge.skill].max - roll) * 100 / (crew[challenge.skill].max - crew[challenge.skill].min);
										if (successPercentage > 100) successPercentage = 100;

										entry.crew.push({ id: crew.id, name: crew.name, frozen: crew.frozen, success: successPercentage });
									}
								});

								entry.crew.sort(function (a, b) { return b.success - a.success; });

								log.push(entry);
							}.bind(this));
						}
					}.bind(this));
				}.bind(this));

				this.setState({
					dataAvailable: true,
					recommendations: log
				});
			}
		}.bind(this));
	}

	render() {
		if (this.state.dataAvailable) {
			return (
				<div className='data-grid' data-is-scrollable='true'>
					<h2>Cadet challenges without 100% success chance</h2>
					{this.state.recommendations.map(function (recommendation) {
						if (recommendation.crew.length == 0) {
							return (<div key={recommendation.name}>
								<h3>{recommendation.name}</h3>
								<span style={{color:'red'}}>You have no crew which can complete this challenge!</span>
							</div>);
						}

						if (recommendation.crew.filter(function (crew) { return crew.success > 99.9; }).length == 0)
						{
							return (<div key={recommendation.name}>
								<h3>{recommendation.name}</h3>
								<span>Your best bet is {recommendation.crew[0].name} with a {recommendation.crew[0].success.toFixed(2)}% success chance.</span>
							</div>);
						}

						return <span />;
					})}
					<h2>Minimal crew complement needed for cadet challenges</h2>
					<span style={{ color: 'red' }}>Not yet implemented!</span>

					<h2>Detailed list of crew success stats for all cadet challenge</h2>
					{this.state.recommendations.map(function (recommendation) {
						return (<div key={recommendation.name}>
							<h3>{recommendation.name}</h3>
							{recommendation.crew.map(function (crew) {
								return (<span key={crew.name}>{crew.name} ({crew.success.toFixed(2)}%)</span>);
							}).reduce((prev, curr) => [prev, ', ', curr])}
						</div>);
					})}
				</div>
			);
		}
		else {
			return (<Spinner size={SpinnerSize.large} label='Loading data...' />);
		}
	}
}