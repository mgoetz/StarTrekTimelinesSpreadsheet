import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

import { CrewList } from './CrewList.js';

import STTApi from '../../shared/api/STTApi.ts';
import { getWikiImageUrl } from '../../shared/api/WikiImageTools.ts';
import { loadGauntlet, gauntletCrewSelection, gauntletRoundOdds, payToGetNewOpponents, playContest } from '../../shared/api/GauntletTools.ts';

const CONFIG = require('../utils/config.js');

class GauntletCrew extends React.Component {
	render() {
		return (<table className='table-GauntletCrew'>
			<tbody>
				<tr>
					<td>
						<b>{STTApi.getCrewAvatarBySymbol(this.props.crew.archetype_symbol).name}</b>
					</td>
				</tr>
				<tr>
					<td className={this.props.crew.disabled ? 'image-disabled' : ''}>
						<Image src={this.props.crew.iconUrl} height={200} style={{ display: 'inline-block' }} />
					</td>
				</tr>
				<tr>
					<td>
					{this.props.crew.disabled ?
						(<span>Disabled <Icon iconName='Dislike' /> ({this.props.crew.debuff/4} battles)</span>) :
						(<span>Active <Icon iconName='Like' /> ({this.props.crew.debuff/4} battles)</span>)
					}
					</td>
				</tr>
				<tr>
					<td>
						{this.props.crew.skills.map(function (skill) {
							return <span className='gauntletCrew-statline' key={skill.skill}>
								<Image src={CONFIG.skillRes[skill.skill].url} height={18} /> {CONFIG.skillRes[skill.skill].name} ({skill.min} - {skill.max})
							</span>;
						})}
						<span className='gauntletCrew-statline'>Crit chance {this.props.crew.crit_chance}%</span>
					</td>
				</tr>
			</tbody>
		</table>);
	}
}

class GauntletMatch extends React.Component {
	constructor(props) {
		super(props);

		this._playMatch = this._playMatch.bind(this);
	}

	_playMatch() {
		playContest(this.props.gauntletId, this.props.match.crewOdd.crew_id, this.props.match.opponent.player_id, this.props.match.opponent.crew_id).
			then((data) => this.props.onNewData(data));
	}

	render() {
		return (<table className='table-GauntletMatch'>
			<tbody>
				<tr>
					<td className='gauntlet-match-crew-slot'>
						<b>{STTApi.getCrewAvatarBySymbol(this.props.match.crewOdd.archetype_symbol).name}</b><br />
						<Image src={this.props.match.crewOdd.iconUrl} height={128} style={{ display: 'inline-block' }} /><br />
						Yours
					</td>
					<td>
						<div className='gauntlet-arrow'>
							<span><b>{this.props.match.chance}%</b> chance</span><br />
							<span><b>{this.props.match.opponent.value}</b> points</span>
						</div>
						<DefaultButton onClick={this._playMatch} text='Play this match!' iconProps={{ iconName: 'LightningBolt' }} />
					</td>
					<td className='gauntlet-match-crew-slot'>
						<b>{STTApi.getCrewAvatarBySymbol(this.props.match.opponent.archetype_symbol).name}</b><br />
						<Image src={this.props.match.opponent.iconUrl} height={128} style={{ display: 'inline-block' }}  />
						{this.props.match.opponent.name}
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
			gauntlet: null,
			lastResult: null,
			merits: null
		};

		this._reloadGauntletData = this._reloadGauntletData.bind(this);
		this._gauntletDataRecieved = this._gauntletDataRecieved.bind(this);
		this._payForNewOpponents = this._payForNewOpponents.bind(this);
		this._reloadGauntletData();
	}

	_reloadGauntletData() {
		loadGauntlet().then((data) => this._gauntletDataRecieved({ gauntlet: data }));
	}

	_payForNewOpponents() {
		payToGetNewOpponents(this.state.gauntlet.id).then((data) => this._gauntletDataRecieved(data));
	}

	_gauntletDataRecieved(data) {
		if (data.gauntlet) {
			if (data.gauntlet.state == 'NONE') {
				var result = gauntletCrewSelection(data.gauntlet, STTApi.roster);

				this.setState({
					gauntlet: data.gauntlet,
					lastResult: null,
					startsIn: Math.floor(data.gauntlet.seconds_to_join / 60),
					featuredSkill: data.gauntlet.contest_data.featured_skill,
					traits: data.gauntlet.contest_data.traits.map(function (trait) { return STTApi.getTraitName(trait); }.bind(this)),
					recommendations: result.recommendations.map(function (id) { return STTApi.roster.find((crew) => (crew.id == id)); }.bind(this)),
					bestInSkill: result.best
				});
			}
			else if (data.gauntlet.state == 'STARTED') {
				var result = gauntletRoundOdds(data.gauntlet);
				this.setState({
					gauntlet: data.gauntlet,
					roundOdds: result
				});

				let iconPromises = [];

				data.gauntlet.contest_data.selected_crew.forEach((crew) => {
					iconPromises.push(
					getWikiImageUrl(STTApi.getCrewAvatarBySymbol(crew.archetype_symbol).name.split(' ').join('_') + '.png', crew.crew_id).then(({id, url}) => {
						this.state.gauntlet.contest_data.selected_crew.forEach((crew) => {
							if (crew.crew_id === id) {
								crew.iconUrl = url;
							}
							});
						return Promise.resolve();
					}).catch((error) => { /*console.warn(error);*/ }));
				});
				
				result.matches.forEach((match) => {
					iconPromises.push(
					getWikiImageUrl(STTApi.getCrewAvatarBySymbol(match.crewOdd.archetype_symbol).name.split(' ').join('_') + '.png', match.crewOdd.crew_id).then(({id, url}) => {
						this.state.roundOdds.matches.forEach((match) => {
							if (match.crewOdd.crew_id === id) {
								match.crewOdd.iconUrl = url;
							}
						});
						return Promise.resolve();
					}).catch((error) => { /*console.warn(error);*/ }));

					iconPromises.push(
					getWikiImageUrl(STTApi.getCrewAvatarBySymbol(match.opponent.archetype_symbol).name.split(' ').join('_') + '.png', match.opponent.crew_id).then(({id, url}) => {
						this.state.roundOdds.matches.forEach((match) => {
							if (match.opponent.crew_id === id) {
								match.opponent.iconUrl = url;
							}
						});
						return Promise.resolve();
					}).catch((error) => { /*console.warn(error);*/ }));
				});

				Promise.all(iconPromises).then(() => this.forceUpdate());
			}
			else {
				this.setState({
					gauntlet: data.gauntlet
				});
			}
		}
		else if (data.gauntlet.state == 'UNSTARTED') {
			// You joined a gauntled and are waiting for opponents
		}
		else if (data.gauntlet.state == 'ENDED_WITH_REWARDS') {
			// The gauntlet ended and you got some rewards
		}

		if (data.lastResult) {
			{
				this.setState({
					lastResult: data.lastResult
				});
			}
		}
		if (data.merits) {
			this.setState({
				merits: data.merits
			});
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
					<CrewList data={this.state.recommendations} grouped={false} ref='recommendedCrew' />
				</div>
			);
		}
		else if (this.state.gauntlet && ((this.state.gauntlet.state == 'STARTED') && this.state.roundOdds)) {
			return (
				<div className='tab-panel' data-is-scrollable='true'>
					<h3>Current gauntlet stats</h3>
					<Label>Crew refeshes in {Math.floor(this.state.gauntlet.seconds_to_next_crew_refresh / 60)} minutes and the gauntlet ends in {Math.floor(this.state.gauntlet.seconds_to_end / 60)} minutes</Label>
					<Label>Your rank is {this.state.roundOdds.rank} and you have {this.state.roundOdds.consecutive_wins} consecutive wins</Label>
					<span><h3>Your crew stats <DefaultButton onClick={this._reloadGauntletData} text='Reload data' iconProps={{ iconName: 'Refresh' }} /></h3></span>
					<div style={{display: 'flex'}} >
						{this.state.gauntlet.contest_data.selected_crew.map(function (crew) {
							return <GauntletCrew key={crew.crew_id} crew={crew} />;
						})}
					</div>
					<h3>Gauntlet player - BETA</h3>

					{this.state.merits &&
						(<p>Merits left: {this.state.merits}</p>)
					}

					{this.state.lastResult &&
						(<table>
							<tbody>
							<tr>
								<td rowSpan={2}>
										<b> {(this.state.lastResult.win == true) ? 'WIN' : 'LOSE'} </b>
									</td>
									<td>You got {this.state.lastResult.player_rolls.reduce(function (sum, value) { return sum + value; }, 0)}</td>
									<td>{this.state.lastResult.player_rolls[0]} {this.state.lastResult.player_crit_rolls[0] ? '*' : ''}</td>
									<td>{this.state.lastResult.player_rolls[1]} {this.state.lastResult.player_crit_rolls[1] ? '*' : ''}</td>
									<td>{this.state.lastResult.player_rolls[2]} {this.state.lastResult.player_crit_rolls[2] ? '*' : ''}</td>
									<td>{this.state.lastResult.player_rolls[3]} {this.state.lastResult.player_crit_rolls[3] ? '*' : ''}</td>
									<td>{this.state.lastResult.player_rolls[4]} {this.state.lastResult.player_crit_rolls[4] ? '*' : ''}</td>
									<td>{this.state.lastResult.player_rolls[5]} {this.state.lastResult.player_crit_rolls[5] ? '*' : ''}</td>
								</tr>
								<tr>
									<td>They got {this.state.lastResult.opponent_rolls.reduce(function (sum, value) { return sum + value; }, 0)}</td>
									<td>{this.state.lastResult.opponent_rolls[0]} {this.state.lastResult.opponent_crit_rolls[0] ? '*' : ''}</td>
									<td>{this.state.lastResult.opponent_rolls[1]} {this.state.lastResult.opponent_crit_rolls[1] ? '*' : ''}</td>
									<td>{this.state.lastResult.opponent_rolls[2]} {this.state.lastResult.opponent_crit_rolls[2] ? '*' : ''}</td>
									<td>{this.state.lastResult.opponent_rolls[3]} {this.state.lastResult.opponent_crit_rolls[3] ? '*' : ''}</td>
									<td>{this.state.lastResult.opponent_rolls[4]} {this.state.lastResult.opponent_crit_rolls[4] ? '*' : ''}</td>
									<td>{this.state.lastResult.opponent_rolls[5]} {this.state.lastResult.opponent_crit_rolls[5] ? '*' : ''}</td>
								</tr>
							</tbody>
						</table>)
					}

					{(this.state.roundOdds.matches.length > 0) &&
						<DefaultButton onClick={this._payForNewOpponents} text='Pay merits for new opponents' iconProps={{ iconName: 'Money' }} />
					}
					<br />
					{this.state.roundOdds.matches.map(function (match) {
						return <GauntletMatch key={match.crewOdd.archetype_symbol + match.opponent.player_id} match={match} gauntletId={this.state.gauntlet.id} onNewData={this._gauntletDataRecieved} />;
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