import React, { Component } from 'react';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { Persona, PersonaSize, PersonaPresence } from 'office-ui-fabric-react/lib/Persona';

import { CrewList } from './CrewList.js';
import { CollapsibleSection } from './CollapsibleSection.js';

import STTApi from 'sttapi';
import { CONFIG, bestVoyageSelection } from 'sttapi';

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
		/*if (!voyage || voyage.state == 'unstarted') {
			this.state = {
				voyageRecommendations: undefined,
				state: 'nothingToDo'
			};
		}
		else*/ {
			this.state = {
				voyageRecommendations: undefined,
				state: 'calculating'
			};

			bestVoyageSelection(3, (val, max, bestSoFar) => {
				// TODO: Can't report progress because the UI thread is blocked in a tight loop
				// Perhaps web worker is a solution, but I can't access STTApi from there, so would need to transfer all crew data along
				//console.log(`Voyage calculation ${val} of ${max}.`);
			}).then(result => {
				this.setState({ voyageRecommendations: result, state: 'done' });
			});
		}
	}

	render() {
		if (this.state.state === "nothingToDo") {
			return <span>Can only show voyage recommendations if you didn't begin your voyage yet!</span>;
		} else if (this.state.state === "calculating") {
			return <span>Calculations not finished yet, please wait...</span>;
		}
		else {
			let shipSpans = [];
			this.state.voyageRecommendations.bestShips.forEach(entry => {
				shipSpans.push(<Persona
					key={entry.ship.id}
					imageUrl={entry.ship.iconUrl}
					primaryText={entry.ship.name}
					secondaryText={entry.score.toFixed(0)}
					size={PersonaSize.regular} />);
			});

			let crewSpans = [];
			this.state.voyageRecommendations.crewSelection.forEach(entry => {
				crewSpans.push(<Persona
					key={entry.choice.name}
					imageUrl={entry.choice.iconUrl}
					primaryText={entry.choice.name}
					secondaryText={entry.slotName}
					tertiaryText={entry.score.toFixed(0)}
					size={PersonaSize.large}
					presence={entry.hasTrait ? PersonaPresence.online : PersonaPresence.away} />);
			});

			return (<CollapsibleSection title='Recommendations for next voyage'>
				<p><b>NOTE: </b>This algorithm is poor and a work in progress. Please only use these as rough guidelines.</p>
				<p>Best ship(s)</p>
				<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
					{shipSpans}
				</div>
				<p>Crew</p>
				<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                	{crewSpans}
            	</div>
				<p>Estimated duration: <b>{this.state.voyageRecommendations.estimatedDuration.toFixed(2)} hours</b></p>
			</CollapsibleSection>);
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