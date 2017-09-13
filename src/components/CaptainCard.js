import '../assets/css/lcars.css';

import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

export class CaptainCard extends React.Component {
	render() {

		return (
			<div className='lcars-container'>

				<div className="lcars-row spaced">

					<div className="lcars-column u-2-8 lcars-elbow left bottom lcars-blue-bg">
						<a style={{ fontSize: 'x-small', color: 'black' }} >DBID: {this.props.player.dbid}</a>
					</div>

					<div className="lcars-column u-4-8 lcars-divider lcars-blue-tan-divide">
						<div className="lcars-row">
							<div className="lcars-column u-1-2">
								<h3 className="right">{this.props.player.character.display_name}</h3>
							</div>
							<div className="lcars-column u-1-2">
								<span className="right"><DefaultButton text='Logout' /></span>
							</div>
						</div>
					</div>

					<div className="lcars-column u-2-8 lcars-elbow right bottom lcars-tan-bg">
						<a style={{ fontSize: 'x-small', color: 'black' }} >&nbsp;&nbsp; {this.props.player.character.navmap.places.find(function (place) { return place.symbol == this.props.player.character.location.place; }.bind(this)).display_name}</a>
					</div>
				</div>

				<div className="lcars-row">

					<div className="lcars-column u-2-8">
						<ul className="lcars-menu left">
							<li className="lcars-blue-bg">Level {this.props.player.character.level}</li>
							<li className="lcars-blue-bg">VIP {this.props.player.vip_level} ({this.props.player.vip_points} pts)</li>
							<li className="lcars-tan-bg">XP {this.props.player.character.xp}</li>
							<li className="lcars-tan-bg"><img src='https://stt.wiki/w/images/thumb/1/1e/Ticket.png/18px-Ticket.png' /> {this.props.player.character.cadet_tickets.current} / {this.props.player.character.cadet_tickets.max} cadet</li>
							<li className="lcars-tan-bg"><img src='https://stt.wiki/w/images/9/9f/ReplicatorRationBasic.png' height='18px' width='18px' /> {this.props.player.replicator_uses_today} / {this.props.player.replicator_limit} replicator</li>
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
							<li className="lcars-salmon-bg"><img src='https://stt.wiki/w/images/thumb/1/12/Chroniton_icon.png/24px-Chroniton_icon.png' /> {Math.min(Math.floor(this.props.player.character.seconds_from_replay_energy_basis / this.props.player.character.replay_energy_rate), this.props.player.character.replay_energy_max) + this.props.player.character.replay_energy_overflow}</li>
							<li className="lcars-salmon-bg"><img src='https://stt.wiki/w/images/thumb/1/1c/Dilithium_sm.png/19px-Dilithium_sm.png' /> {this.props.player.premium_purchasable}</li>
							<li className="lcars-salmon-bg"><img src='https://stt.wiki/w/images/thumb/2/20/Merit_icon.png/22px-Merit_icon.png' /> {this.props.player.premium_earnable}</li>
							<li className="lcars-salmon-bg"><img src='https://stt.wiki/w/images/thumb/d/d4/Honor.png/24px-Honor.png' /> {this.props.player.honor}</li>
							<li className="lcars-salmon-bg"><img src='https://stt.wiki/w/images/thumb/9/91/Credits_sm.png/24px-Credits_sm.png' /> {this.props.player.money}</li>
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