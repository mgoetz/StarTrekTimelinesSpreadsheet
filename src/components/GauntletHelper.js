import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { CrewList } from './CrewList.js';

import { loadGauntlet, gauntletCrewSelection, gauntletRoundOdds, payToGetNewOpponents, playContest } from '../utils/gauntlet.js';
import { getCrewIconFromCache } from '../utils/crewTools.js';

const CONFIG = require('../utils/config.js');

export class GauntletMatch extends React.Component {
	constructor(props) {
		super(props);

		this._playMatch = this._playMatch.bind(this);
	}

	_playMatch() {
		playContest(this.props.accessToken, this.props.gauntletId, this.props.match.crewOdd.crew_id, this.props.match.opponent.player_id, this.props.match.opponent.crew_id, function (data) {
			this.props.onNewData(data);
		}.bind(this));
	}

	render() {
		var yourCrew = this.props.allcrew.find((crew) => crew.symbol == this.props.match.crewOdd.archetype_symbol);
		var theirCrew = this.props.allcrew.find((crew) => crew.symbol == this.props.match.opponent.archetype_symbol);

		return (<table className='table-GauntletMatch'>
			<tbody>
				<tr>
					<td>
						<center><span>Your <b>{yourCrew.name}</b></span></center>
						<Image src={getCrewIconFromCache(this.props.imageURLs, yourCrew.name)} height={128} />
					</td>
					<td style={{ verticalAlign: 'top' }}>
						<span>has a {this.props.match.chance}% chance of beating</span>
					</td>
					<td>
						<center><span>{this.props.match.opponent.name}'s <b>{theirCrew.name}</b></span></center>
						<Image src={getCrewIconFromCache(this.props.imageURLs, theirCrew.name)} height={128} />
					</td>
					<td style={{ verticalAlign: 'top' }}>
						<span>for {this.props.match.opponent.value} points</span>
					</td>
					<td>
						<DefaultButton onClick={this._playMatch} text='Play this match!' iconProps={{ iconName: 'LightningBolt' }} />
					</td>
				</tr>
			</tbody>
		</table>);
	}
}

export class GauntletHelper extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			gauntlet: null
		};

		this._reloadGauntletData = this._reloadGauntletData.bind(this);
		this._gauntletDataRecieved = this._gauntletDataRecieved.bind(this);
		this._payForNewOpponents = this._payForNewOpponents.bind(this);
		this._reloadGauntletData();
	}

	_reloadGauntletData() {
		loadGauntlet(this.props.accessToken, function (data) {
			this._gauntletDataRecieved(data);
		}.bind(this));
	}

	_payForNewOpponents() {
		payToGetNewOpponents(this.props.accessToken, this.state.gauntlet.id, function (data) {
			this._gauntletDataRecieved(data);
		}.bind(this));
	}

	_gauntletDataRecieved(data) {
		if (data.gauntlet) {
			if (data.gauntlet.state == 'NONE') {
				var result = gauntletCrewSelection(data.gauntlet, this.props.crew);

				this.setState({
					gauntlet: data.gauntlet,
					startsIn: Math.floor(data.gauntlet.seconds_to_join / 60),
					featuredSkill: data.gauntlet.contest_data.featured_skill,
					traits: data.gauntlet.contest_data.traits.map(function (trait) { return this.props.trait_names[trait] ? this.props.trait_names[trait] : trait; }),
					recommendations: result.recommendations.map(function (id) { return this.props.crew.find((crew) => (crew.id == id)); }),
					bestInSkill: result.best
				});
			}
			else if (data.gauntlet.state == 'STARTED') {
				var result = gauntletRoundOdds(data.gauntlet);

				this.setState({
					gauntlet: data.gauntlet,
					roundOdds: result
				});
			}
			else {
				this.setState({
					gauntlet: data.gauntlet
				});
			}
		}
		else if (data.lastResult) {
			{
				alert('You ' + data.lastResult.win ? 'won' : 'lost');
				//"player_rolls":[137, 143, 147, 0, 1, 1], "opponent_rolls":[1, 0, 0, 218, 274, 206],
				//"player_crit_rolls":[false, false, false, false, false, false],
				//"opponent_crit_rolls":[false, false, false, false, false, false],
			}
		}
	}

	render() {
		if (this.state.gauntlet && (this.state.gauntlet.state == 'NONE')) {
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
		else if (this.state.gauntlet && ((this.state.gauntlet.state == 'STARTED') && this.state.roundOdds)) {
			return (
				<div className='tab-panel' data-is-scrollable='true'>
					<h2>Next gauntlet round</h2>
					<DefaultButton onClick={this._reloadGauntletData} text='Reload data' iconProps={{ iconName: 'Refresh' }} />
					<DefaultButton onClick={this._payForNewOpponents} text='Pay merits for new opponents' iconProps={{ iconName: 'Money' }} />
					<Label>Your rank is {this.state.roundOdds.rank} and you have {this.state.roundOdds.consecutive_wins} consecutive wins.</Label>
					{this.state.roundOdds.matches.map(function (match) {
						return <GauntletMatch key={match.crewOdd.archetype_symbol + match.opponent.name} match={match} allcrew={this.props.allcrew} gauntletId={this.state.gauntlet.id} accessToken={this.props.accessToken} imageURLs={this.props.imageURLs} onNewData={this._gauntletDataRecieved} />;
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