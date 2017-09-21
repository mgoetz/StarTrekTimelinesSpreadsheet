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
			{STTApi.missionSuccess.map(function (recommendation) {
				if (recommendation.cadet != this.props.cadet) {
					return <span key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name} />;
				}

				if (recommendation.crew.length == 0) {
					return (<div key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}>
						<h3>{recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}</h3>
						<span style={{ color: 'red' }}>No crew can complete this challenge!</span><br />
						<span className='quest-mastery'>You need a crew with the <Image src={CONFIG.skillRes[recommendation.skill].url} height={18} /> {CONFIG.skillRes[recommendation.skill].name} skill of at least {recommendation.roll}
							{(recommendation.lockedTraits.length > 0) &&
								(<span>&nbsp;and one of these skills: {recommendation.lockedTraits.map(function (trait) { return (<span key={trait}>{STTApi.getTraitName(trait)}</span>); }.bind(this)).reduce((prev, curr) => [prev, ', ', curr])}
								</span>)}.</span>
					</div>);
				}

				if (recommendation.crew.filter(function (crew) { return crew.success > 99.9; }).length == 0) {
					return (<div key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}>
						<h3>{recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}</h3>
						<span>Your best bet is {recommendation.crew[0].crew.name} with a {recommendation.crew[0].success.toFixed(2)}% success chance.</span><br />
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

		this.state = {
			removableCrew: STTApi.roster.filter(function (crew) { return STTApi.minimalComplement.unneededCrew.includes(crew.id) && (crew.frozen == 0); }),
			unfreezeCrew: STTApi.roster.filter(function (crew) { return STTApi.minimalComplement.neededCrew.includes(crew.id) && (crew.frozen > 0); })
		};
	}

	render() {
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

				<Toggle
					onText='Show detailed list of crew success stats for all cadet challenges and missions'
					offText='Hide detailed list of crew success stats for all cadet challenges and missions'
					checked={this.state.showDetails}
					onChanged={checked => this.setState({ showDetails: checked })} />

				{this.state.showDetails && STTApi.missionSuccess.map(function (recommendation) {
					return (<div key={recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}>
						<h3>{recommendation.mission.episode_title + ' - ' + recommendation.quest.name + ' - ' + recommendation.challenge.name}</h3>
						{(recommendation.crew.length == 0) ? (<span style={{ color: 'red' }}>You have no crew which can complete this challenge!</span>) :
							recommendation.crew.map(function (crew) {
								return (<span key={crew.crew.name}>{crew.crew.name} ({crew.success.toFixed(2)}%)</span>);
							}).reduce((prev, curr) => [prev, ', ', curr])}
					</div>);
				})}
			</div>
		);
	}
}