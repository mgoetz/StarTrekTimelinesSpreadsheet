import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import { CrewList } from './CrewList.js';

import { gauntletCrewSelection, gauntletRoundOdds } from '../utils/gauntlet.js';
const CONFIG = require('../utils/config.js');

export class GauntletHelper extends React.Component {
	constructor(props) {
		super(props);

		if (props.gauntlet.state == 'NONE') {
			var result = gauntletCrewSelection(props.gauntlet, props.crew);

			this.state = {
				gauntlet: props.gauntlet,
				startsIn: Math.floor(props.gauntlet.seconds_to_join / 60),
				featuredSkill: props.gauntlet.contest_data.featured_skill,
				traits: props.gauntlet.contest_data.traits.map(function (trait) { return props.trait_names[trait] ? props.trait_names[trait] : trait; }),
				recommendations: result.recommendations.map(function (id) { return props.crew.find((crew) => (crew.id == id)); }),
				bestInSkill: result.best
			};
		}
		else if (props.gauntlet.state == 'STARTED') {
			var result = gauntletRoundOdds(props.gauntlet);

			this.state = {
				gauntlet: props.gauntlet,
				roundOdds: result
			};
		}
		else {
			this.state = {
				gauntlet: props.gauntlet
			};
		}
	}

	render() {
		if (this.state.gauntlet.state == 'NONE') {
			return (
				<div>
					<Label>Next gauntlet starts in {this.state.startsIn} minutes.</Label>
					<span className='quest-mastery'>Featured skill: <Image src={CONFIG.skillRes[this.state.featuredSkill].url} height={18} /> {CONFIG.skillRes[this.state.featuredSkill].name}</span>
					<Label>Featured traits: {this.state.traits.join(', ')}</Label>
					<h2>Recommeded crew selection:</h2>
					<CrewList data={this.state.recommendations} ref='recommendedCrew' />
				</div>
			);
		}
		else if ((this.state.gauntlet.state == 'STARTED') && this.state.roundOdds) {
			return (
				<div className='tab-panel' data-is-scrollable='true'>
					<h2>Next gauntlet round</h2>
					<Label>Your rank is {this.state.roundOdds.rank} and you have {this.state.roundOdds.consecutive_wins} consecutive wins.</Label>
					{this.state.roundOdds.matches.map(function (match) {
						return <p key={match.crewOdd.archetype_symbol + match.opponent.name}>Your {this.props.allcrew.find(function (crew) { return crew.symbol == match.crewOdd.archetype_symbol; }).name} would beat {match.opponent.name}'s {this.props.allcrew.find(function (crew) { return crew.symbol == match.opponent.archetype_symbol; }).name} {match.chance}% of the time for {match.opponent.value} points.</p>;
					}.bind(this))}
				</div>
			);
		}
		else {
			return (<MessageBar messageBarType={MessageBarType.error} >Unknown state for this gauntlet! Check the app, perhaps it's waiting to join or already done.</MessageBar>);
		}
	}

	componentDidMount() {
		if (this.refs.recommendedCrew) {
			this.refs.recommendedCrew.setGroupedColumn('');
		}
	}
}