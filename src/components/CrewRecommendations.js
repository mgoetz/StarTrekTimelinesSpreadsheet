import React, { Component } from 'react';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import { CrewList } from './CrewList.js';
import { CollapsibleSection } from './CollapsibleSection.js';

import STTApi from 'sttapi';
import { CONFIG } from 'sttapi';

export class GuaranteedSuccess extends React.Component {
	render() {
		return (<CollapsibleSection title={this.props.title}>
			{STTApi.missionSuccess.map(function (recommendation) {
				if (recommendation.cadet != this.props.cadet) {
					return <span key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name} />;
				}

				if (recommendation.crew.length == 0) {
					return (<div key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}>
						<h3>{recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}</h3>
						<span style={{ color: 'red' }}>No crew can complete this challenge!</span><br />
						<span className='quest-mastery'>You need a crew with the <Image src={CONFIG.SPRITES['icon_' + recommendation.skill].url} height={18} /> {CONFIG.SKILLS[recommendation.skill]} skill of at least {recommendation.roll}
							{(recommendation.lockedTraits.length > 0) &&
								(<span>&nbsp;and one of these skills: {recommendation.lockedTraits.map(function (trait) { return (<span key={trait}>{STTApi.getTraitName(trait)}</span>); }.bind(this)).reduce((prev, curr) => [prev, ', ', curr])}
								</span>)}.</span>
					</div>);
				}

				if (recommendation.crew.filter(function (crew) { return crew.success > 99.9; }).length == 0) {
					return (<div key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}>
						<h3>{recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}</h3>
						<span>Your best bet is {recommendation.crew[0].crew.name} with a {recommendation.crew[0].success.toFixed(2)}% success chance.</span><br />
						<span className='quest-mastery'>You need a crew with the <Image src={CONFIG.SPRITES['icon_' + recommendation.skill].url} height={18} /> {CONFIG.SKILLS[recommendation.skill]} skill of at least {recommendation.roll}
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

		if (!STTApi.minimalComplement) {
			// The thread (worker) didn't finish loading yet
			this.state = {
				dataLoaded: false
			};
		}
		else {
			this.state = {
				dataLoaded: true,
				removableCrew: STTApi.roster.filter(function (crew) { return STTApi.minimalComplement.unneededCrew.includes(crew.id) && (crew.frozen == 0); }),
				unfreezeCrew: STTApi.roster.filter(function (crew) { return STTApi.minimalComplement.neededCrew.includes(crew.id) && (crew.frozen > 0); })
			};
		}
	}

	render() {
		if (this.state.dataLoaded) {
			return (<CollapsibleSection title={this.props.title}>
				<div>
					<p><b>Note:</b> These recommendations do not take into account the needs for gauntlets, shuttle adventures, voyages or any ship battle missions. They also don't account for quest paths, only considering the needs of individual nodes. Manually review each one before making decisions.</p>

					<h3>Crew which could be frozen or airlocked</h3>
					<CrewList data={this.state.removableCrew} grouped={false} overrideClassName='embedded-crew-grid' />
					<h3>Crew which needs to be unfrozen</h3>
					<CrewList data={this.state.unfreezeCrew} grouped={false} overrideClassName='embedded-crew-grid' />
				</div>
			</CollapsibleSection>);
		}
		else {
			return <p>Minimal crew calculation not done yet. Reload this tab in a bit.</p>
		}
	}
}

export class VoyageCrew extends React.Component {
	constructor(props) {
		super(props);

		let voyage = STTApi.playerData.character.voyage[0];
		if (!voyage || voyage.state == 'unstarted') {
			voyage = STTApi.playerData.character.voyage_descriptions[0];
			// Best ship
			let consideredShips = [];
			STTApi.ships.forEach(ship => {
				if (ship.id > 0) {
					let entry = {
						ship: ship,
						score: ship.antimatter
					};

					if (ship.traits.find(trait => trait == voyage.ship_trait)) {
						entry.score += 150;
					}

					consideredShips.push(entry);
				}
			});

			// TODO: Figure out how the antimatter is actually calculated in the client (2050 to 2500)
			consideredShips = consideredShips.sort((a, b) => b.score - a.score);
			consideredShips = consideredShips.filter(entry => entry.score == consideredShips[0].score);

			// Best crew

			// TODO: what would be the most efficient algorithm?
			// If we do a full combinatorial we'd use a lot of resources numcrew^12 (potentially 400^12 entries, way too much)
			// Tried that on a Xeon and with 200 crew it takes >1hr to calculate; obviously not a solution
			// Lets randomly pick just the first X crew sorted by the given skill, should make it more manageable
			// Even 10 would be too much though; 10^12 = 1000000000000
			const howManyToConsider = 3;
			let bestChoices = [];
			let bestScore = 0;

			function crewScore(crew, primary_skill, secondary_skill) {
				let score = 0;
				Object.keys(CONFIG.SKILLS).forEach(skill => {
					let skillScore = crew[skill].core + (crew[skill].max - crew[skill].min) / 2;
					score += skillScore;
					if (skill == primary_skill) {
						score += skillScore * 4;
					}
					if (skill == secondary_skill) {
						score += skillScore * 3;
					}
				});

				return score;
			}

			let presortedCrewSlices = {};
			Object.keys(CONFIG.SKILLS).forEach(skill => {
				presortedCrewSlices[skill] = STTApi.roster.sort((a, b) => crewScore(b, undefined, skill) - crewScore(a, undefined, skill))
					.filter(crew => crew[skill].core > 0)
					.slice(0, howManyToConsider);
			});

			let currentChoices = [];
			function fillSlot(slotIndex) {
				presortedCrewSlices[voyage.crew_slots[slotIndex].skill].forEach(choice => {
					if (currentChoices.find(v => v.choice.id == choice.id)) {
						// If already in the list of choices, skip
						return;
					}

					let currentChoice = {
						choice,
						score: crewScore(choice, voyage.skills.primary_skill, voyage.skills.secondary_skill)
					};

					if (choice.rawTraits.find(trait => trait == voyage.crew_slots[slotIndex].trait)) {
						currentChoice.score *= 1.1; //TODO: Fine-tune this value
					}

					currentChoices.push(currentChoice);
					if (slotIndex < voyage.crew_slots.length - 1) {
						fillSlot(slotIndex + 1);
					}
					else {
						// we have a complete crew complement, compute score
						let currentScore = currentChoices.reduce((sum, choice) => sum + choice.score, 0);
						if (currentScore > bestScore) {
							bestScore = currentScore;
							bestChoices = currentChoices.slice();
						}
					}
					currentChoices.pop();
				});
			}

			fillSlot(0);

			this.state = {
				voyageRecommendations: {
					consideredShips, bestChoices
				}
			};
		}
		else {
			this.state = {
				voyageRecommendations: undefined
			};
		}
	}

	render() {
		if (this.state.voyageRecommendations) {
			let shipSpans = [];
			this.state.voyageRecommendations.consideredShips.forEach(entry => {
				shipSpans.push(<span key={entry.ship.id}>{entry.score} - {entry.ship.name}</span>);
			});

			let crewSpans = [];
			this.state.voyageRecommendations.bestChoices.forEach(entry => {
				crewSpans.push(<span key={entry.choice.id}>{entry.score} - {entry.choice.name}</span>);
			});

			return (<CollapsibleSection title='Recommendations for next voyage'>
				{shipSpans}
				{crewSpans}
			</CollapsibleSection>);
		}
		else {
			return <span>Can only show voyage recommendations if you didn't begin your voyage yet!</span>;
		}
	}
}

export class CrewRecommendations extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showDetails: false
		};
	}

	render() {
		return (
			<div className='tab-panel' data-is-scrollable='true'>
				<GuaranteedSuccess title='Cadet challenges without guaranteed success' cadet={true} />
				<GuaranteedSuccess title='Missions without guaranteed success' cadet={false} />
				<CrewDuplicates title='Crew duplicates' />
				<MinimalComplement title='Minimal crew complement needed for cadet challenges' />
				<VoyageCrew />
			</div>
		);
	}
}