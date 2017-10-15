import '../assets/css/lcars.css';

import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

import STTApi from 'sttapi';
import { CONFIG } from 'sttapi';

export class CaptainCard extends React.Component {
	render() {
		return (
			<div className='lcars-container'>
				<div className="lcars-row spaced">
					<div className="lcars-column u-2-8 lcars-elbow left bottom lcars-blue-bg">
						<a style={{ fontSize: 'x-small', color: 'black' }} >DBID: {STTApi.playerData.dbid}</a>
					</div>

					<div className="lcars-column u-4-8 lcars-divider lcars-blue-tan-divide">
						<div className="lcars-row">
							<div className="lcars-column u-1-2">
								<h3 className="right">{STTApi.playerData.character.display_name}</h3>
							</div>
							<div className="lcars-column u-1-2">
								<span className="right"><DefaultButton text='Logout' /></span>
							</div>
						</div>
					</div>

					<div className="lcars-column u-2-8 lcars-elbow right bottom lcars-tan-bg">
						<a style={{ fontSize: 'x-small', color: 'black' }} >&nbsp;&nbsp; {STTApi.playerData.character.navmap.places.find(function (place) { return place.symbol == STTApi.playerData.character.location.place; }.bind(this)).display_name}</a>
					</div>
				</div>

				<div className="lcars-row">
					<div className="lcars-column u-2-8">
						<ul className="lcars-menu left">
							<li className="lcars-blue-bg">Level {STTApi.playerData.character.level}</li>
							<li className="lcars-blue-bg">VIP {STTApi.playerData.vip_level} ({STTApi.playerData.vip_points} pts)</li>
							<li className="lcars-tan-bg">XP {STTApi.playerData.character.xp}</li>
							<li className="lcars-tan-bg"><img src={CONFIG.SPRITES['cadet_icon'].url} height='22px' width='22px' /> {STTApi.playerData.character.cadet_tickets.current} / {STTApi.playerData.character.cadet_tickets.max} cadet</li>
							<li className="lcars-tan-bg"><img src={CONFIG.SPRITES['victory_point_icon'].url} height='22px' width='22px' /> {STTApi.playerData.replicator_uses_today} / {STTApi.playerData.replicator_limit} replicator</li>
						</ul>
					</div>

					<div className="lcars-column u-4-8 lcars-middle">
						<div className="lcars-row">
							<div className="lcars-column u-1-1">
								<Image src={this.props.captainAvatarBodyUrl} height={180} />
							</div>
						</div>
					</div>

					<div className="lcars-column u-2-8">
						<ul className="lcars-menu right">
							<li className="lcars-salmon-bg"><img src={CONFIG.SPRITES['energy_icon'].url} height='22px' width='22px' /> {Math.min(Math.floor(STTApi.playerData.character.seconds_from_replay_energy_basis / STTApi.playerData.character.replay_energy_rate), STTApi.playerData.character.replay_energy_max) + STTApi.playerData.character.replay_energy_overflow}</li>
							<li className="lcars-salmon-bg"><img src={CONFIG.SPRITES['images_currency_pp_currency_0'].url} height='22px' width='22px' /> {STTApi.playerData.premium_purchasable}</li>
							<li className="lcars-salmon-bg"><img src={CONFIG.SPRITES['images_currency_pe_currency_0'].url} height='22px' width='22px' /> {STTApi.playerData.premium_earnable}</li>
							<li className="lcars-salmon-bg"><img src={CONFIG.SPRITES['images_currency_honor_currency_0'].url} height='22px' width='22px' /> {STTApi.playerData.honor}</li>
							<li className="lcars-salmon-bg"><img src={CONFIG.SPRITES['images_currency_sc_currency_0'].url} height='22px' width='22px' /> {STTApi.playerData.money}</li>
						</ul>
					</div>
				</div>

				<div className="lcars-row spaced">
					<div className="lcars-column u-2-8 lcars-elbow left top lcars-tan-bg">
					</div>

					<div className="lcars-column u-4-8 lcars-divider bottom lcars-tan-blue-divide">
						<div className="lcars-row">
							<div className="lcars-column u-1-1">&nbsp;</div>
						</div>
					</div>

					<div className="lcars-column u-2-8 lcars-elbow right top lcars-blue-bg">
					</div>
				</div>
			</div>);
	}
}