import React, { Component } from 'react';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import { CrewList } from './CrewList.js';
import { CollapsibleSection } from './CollapsibleSection.js';

import STTApi from '../../shared/api/STTApi.ts';

const CONFIG = require('../utils/config.js');

export class GuaranteedSuccess extends React.Component {
	render() {
		return (<CollapsibleSection title={this.props.title}>
			{this.props.recommendations.map(function (recommendation) {
				if (recommendation.crew.length == 0) {
					return (<div key={recommendation.name}>
						<h3>{recommendation.name}</h3>
						<span style={{ color: 'red' }}>No crew can complete this challenge!</span><br />
						<span className='quest-mastery'>You need a crew with the <Image src={CONFIG.skillRes[recommendation.skill].url} height={18} /> {CONFIG.skillRes[recommendation.skill].name} skill of at least {recommendation.roll}
							{(recommendation.lockedTraits.length > 0) &&
								(<span>&nbsp;and one of these skills: {recommendation.lockedTraits.map(function (trait) { return (<span key={trait}>{STTApi.getTraitName(trait)}</span>); }.bind(this)).reduce((prev, curr) => [prev, ', ', curr])}
								</span>)}.</span>
					</div>);
				}

				if (recommendation.crew.filter(function (crew) { return crew.success > 99.9; }).length == 0) {
					return (<div key={recommendation.name}>
						<h3>{recommendation.name}</h3>
						<span>Your best bet is {recommendation.crew[0].name} with a {recommendation.crew[0].success.toFixed(2)}% success chance.</span><br />
						<span className='quest-mastery'>You need a crew with the <Image src={CONFIG.skillRes[recommendation.skill].url} height={18} /> {CONFIG.skillRes[recommendation.skill].name} skill of at least {recommendation.roll}
							{(recommendation.lockedTraits.length > 0) &&
								(<span>&nbsp;and one of these skills: {recommendation.lockedTraits.map(function (trait) { return (<span key={trait}>{STTApi.getTraitName(trait)}</span>); }.bind(this)).reduce((prev, curr) => [prev, ', ', curr])}
								</span>)}.</span>
					</div>);
				}
			}.bind(this))
			}</CollapsibleSection>);
	}
}

export class CrewDuplicates extends React.Component {
	constructor(props) {
		super(props);

		var uniq = STTApi.roster.map((crew) => { return { count: 1, crewId: crew.id }; })
			.reduce((a, b) => {
				a[b.crewId] = (a[b.crewId] || 0) + b.count;
				return a;
			}, {});

		var duplicateIds = Object.keys(uniq).filter((a) => uniq[a] > 1);

		this.state = {
			duplicates: STTApi.roster.filter(function (crew) { return duplicateIds.includes(crew.id.toString()); })
		};
	}

	render() {
		if (this.state.duplicates.length > 0) {
			return (<CollapsibleSection title={this.props.title}>
				<CrewList data={this.state.duplicates} grouped={false} sortColumn='name' overrideClassName='embedded-crew-grid' />
			</CollapsibleSection>);
		}
		else {
			return <span />;
		}
	}
}

export class MinimalComplement extends React.Component {
	constructor(props) {
		super(props);

		var baseline = 0;

		var allConsideredCrew = new Set();
		props.recommendations.forEach(function (entry) {
			entry.crew.forEach(function (crew) {
				allConsideredCrew.add(crew.id);
			});

			baseline += (entry.crew.length > 0) ? entry.crew[0].success : 0;
		});

		// TODO: This should actually do a combinatorial (all possible combinations of crew ids from allConsideredCrew).
		// However, that pegs the CPU for minutes even on a fast i7-7700k
		// The algorithm below is suboptimal but it's much cheaper to run

		// Calculate minimal set of crew out of allConsideredCrew that still yields the same result for all challenges
		var start = allConsideredCrew.size;

		var removedCrew = new Set();

		var before;
		do {
			before = allConsideredCrew.size;

			for (var crewId of allConsideredCrew) {
				var result = 0;

				props.recommendations.forEach(function (entry) {
					var filteredCrew = entry.crew.filter(function (crew) { return (crew.id != crewId) && !removedCrew.has(crew.id); });
					result += (filteredCrew.length > 0) ? filteredCrew[0].success : 0;
				});

				if (result == baseline) {
					allConsideredCrew.delete(crewId);
					removedCrew.add(crewId);
					break;
				}
			}
		} while (allConsideredCrew.size < before);
		
		this.state = {
			removableCrew: STTApi.roster.filter(function (crew) { return removedCrew.has(crew.id) && (crew.frozen == 0); }),
			unfreezeCrew: STTApi.roster.filter(function (crew) { return allConsideredCrew.has(crew.id) && (crew.frozen > 0); })
		};
	}

	render() {
		return (<CollapsibleSection title={this.props.title}>
			<div>
				<p><b>Note:</b> These recommendations do not take into account the needs for gauntlets, shuttle missions or any ship battle missions. They also don't account for quest paths, only considering the needs of individual nodes. Manually review each one before making decisions.</p>

				<h3>Crew which could be frozen or airlocked</h3>
				<CrewList data={this.state.removableCrew} grouped={false} overrideClassName='embedded-crew-grid' />
				<h3>Crew which needs to be unfrozen</h3>
				<CrewList data={this.state.unfreezeCrew} grouped={false} overrideClassName='embedded-crew-grid' />
			</div>
		</CollapsibleSection>);
	}
}

export class CrewRecommendations extends React.Component {
	constructor(props) {
		super(props);

		var log = [];
		STTApi.missions.forEach(function (mission) {
			mission.quests.forEach(function (quest) {
				if (quest.quest_type == 'ConflictQuest') {
					quest.challenges.forEach(function (challenge) {
						var entry = {
							name: mission.episode_title + ' - ' + quest.name + ' - ' + challenge.name,
							roll: 0,
							skill: challenge.skill,
							cadet: quest.cadet,
							crew_requirement: quest.crew_requirement,
							traits: [],
							lockedTraits: [],
							crew: []
						};

						if (challenge.difficulty_by_mastery) {
							entry.roll += challenge.difficulty_by_mastery[2];
						}

						if (challenge.critical && challenge.critical.threshold) {
							entry.roll += challenge.critical.threshold;
						}

						if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
							challenge.trait_bonuses.forEach(function (traitBonus) {
								entry.traits.push({ trait: traitBonus.trait, bonus: traitBonus.bonuses[2] });
							});
						}

						if (challenge.locks && (challenge.locks.length > 0)) {
							challenge.locks.forEach(function (lock) {
								if (lock.trait) {
									entry.lockedTraits.push(lock.trait);
								}
							});
						}

						STTApi.roster.forEach(function (crew) {
							let rawTraits = new Set(crew.rawTraits);

							if (entry.cadet) {
								if ((crew.rarity < entry.crew_requirement.min_stars) || (crew.rarity > entry.crew_requirement.max_stars)) {
									return; // Doesn't meet rarity requirements
								}

								if (entry.crew_requirement.traits && (entry.crew_requirement.traits.length > 0)) {
									var matchingTraits = entry.crew_requirement.traits.filter(trait => rawTraits.has(trait)).length;
									if (matchingTraits == 0)
										return; // Doesn't meet trait requirements
								}
							}

							if (entry.lockedTraits.length > 0) {
								var matchingTraits = entry.lockedTraits.filter(trait => rawTraits.has(trait)).length;
								if (matchingTraits == 0)
									return; // Node is locked by a trait which this crew doesn't have
							}

							// Compute roll for crew
							var rollCrew = crew[entry.skill].core;

							if (entry.traits && (entry.traits.length > 0)) {
								var matchingTraits = entry.traits.filter(traitBonus => rawTraits.has(traitBonus.trait)).length;
								rollCrew += matchingTraits * entry.traits[0].bonus;
							}

							if (rollCrew + crew[entry.skill].max > entry.roll) // Does this crew even have a chance?
							{
								var successPercentage = (rollCrew + crew[entry.skill].max - entry.roll) * 100 / (crew[entry.skill].max - crew[entry.skill].min);
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

		this.state = {
			dataAvailable: true,
			showDetails: false,
			recommendations: log
		};
	}

	render() {
		if (this.state.dataAvailable) {
			return (
				<div className='tab-panel' data-is-scrollable='true'>
					<GuaranteedSuccess title='Cadet challenges without guaranteed success' recommendations={this.state.recommendations.filter(function (recommendation) { return recommendation.cadet; })} />
					<GuaranteedSuccess title='Missions without guaranteed success' recommendations={this.state.recommendations.filter(function (recommendation) { return !recommendation.cadet; })} />
					<CrewDuplicates title='Crew duplicates' />
					<MinimalComplement title='Minimal crew complement needed for cadet challenges' recommendations={this.state.recommendations} />

					<Toggle
						onText='Show detailed list of crew success stats for all cadet challenges and missions'
						offText='Hide detailed list of crew success stats for all cadet challenges and missions'
						checked={this.state.showDetails}
						onChanged={checked => this.setState({ showDetails: checked })} />

					{this.state.showDetails && this.state.recommendations.map(function (recommendation) {
						return (<div key={recommendation.name}>
							<h3>{recommendation.name}</h3>
							{(recommendation.crew.length == 0) ? (<span style={{ color: 'red' }}>You have no crew which can complete this challenge!</span>) :
								recommendation.crew.map(function (crew) {
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