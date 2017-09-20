import React, { Component } from 'react';

import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import STTApi from '../../shared/api/STTApi.ts';
import { getWikiImageUrl } from '../../shared/api/WikiImageTools.ts';

const CONFIG = require('../utils/config.js');

export class ShuttleAdventure extends React.Component {
    constructor(props) {
        super(props);

        STTApi.playerData.character.shuttle_adventures.forEach((shuttle) => {
            if (shuttle.shuttles[0].id == props.activeId) {
                this.state = {
                    name: shuttle.shuttles[0].name,
                    description: shuttle.shuttles[0].description,
                    completes_in_seconds: shuttle.completes_in_seconds,
                    faction_id: shuttle.faction_id,
                    challenge_rating: shuttle.challenge_rating,
                    faction_iconUrl: '',
                    faction: null
                };
            }
        });

        STTApi.playerData.character.factions.forEach((faction) => {
            if (faction.id == this.state.faction_id) {
                this.state.faction = faction;

                getWikiImageUrl('Icon' + faction.name.split(' ').join('') + '.png', 0).then(({ id, url }) => {
                    this.setState({ faction_iconUrl: url });
                }).catch((error) => { });
            }
        });
    }

    render() {
        return (<div>
            <table>
                <tbody>
                    <tr>
                        <td style={{ width: '150px' }} >
                            <img src='https://stt.wiki/w/images/9/94/Shuttle_icon.png' />
                        </td>
                        <td style={{ verticalAlign: 'center' }} >
                            <h3>{this.state.name}</h3>
                        </td>
                        <td>
                            <img src={this.state.faction_iconUrl} style={{ height: '80px' }} />
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={3}>
                            <h4>{this.state.description}</h4>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p>Completes in {Math.floor(this.state.completes_in_seconds / 60)} minutes.</p>
            <p>Faction: {this.state.faction.name} ({this.state.faction.completed_shuttle_adventures} completed adventures)</p>
            <p>Challenge rating: {this.state.challenge_rating}.</p>
        </div>);
    }
}

export class Voyage extends React.Component {
    constructor(props) {
        super(props);

        STTApi.playerData.character.voyage.forEach((voyage) => {
            if (voyage.id == props.activeId) {
                this.state = {
                    ship_name: voyage.ship_name,
                    ship_id: voyage.ship_id,
                    created_at: voyage.created_at,
                    voyage_duration: voyage.voyage_duration,
                    seconds_since_last_dilemma: voyage.seconds_since_last_dilemma,
                    seconds_between_dilemmas: voyage.seconds_between_dilemmas,
                    skill_aggregates: voyage.skill_aggregates,
                    crew_slots: voyage.crew_slots,
                    voyage: voyage
                };
            }
        });
    }

    render() {
        return (<div>
            <h3>Voyage on the {STTApi.getShipTraitName(this.state.voyage.ship_trait)} ship {this.state.ship_name}</h3>
            <p>Voyage has been ongoing for {Math.floor(this.state.voyage_duration / 60)} minutes (new dillema in {Math.floor((this.state.seconds_between_dilemmas - this.state.seconds_since_last_dilemma) / 60)} minutes).</p>
            <p>Antimatter remaining: {this.state.voyage.hp} / {this.state.voyage.max_hp}.</p>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <section>
                                <h4>Full crew complement and skill aggregates</h4>
                                <ul>
                                    {this.state.voyage.crew_slots.map((slot) => {
                                        return (<li key={slot.symbol}>{slot.name}: {slot.crew.name}</li>);
                                    })}
                                </ul>
                            </section>
                        </td>
                        <td>
                            <ul>
                                {Object.values(this.state.voyage.skill_aggregates).map((skill) => {
                                    return (<li key={skill.skill}>
                                        <span className='quest-mastery'>
                                            <Image src={CONFIG.skillRes[skill.skill].url} height={18} />
                                            {CONFIG.skillRes[skill.skill].name}: {skill.core} ({skill.range_min}-{skill.range_max})
                                        </span>
                                    </li>);
                                })}
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
            <h4>Pending rewards</h4>
            {this.state.voyage.pending_rewards.loot.map((loot, index) => {
                return (<span key={index} style={{ color: loot.rarity && CONFIG.rarityRes[loot.rarity].color }}>{loot.quantity} {(loot.rarity == null) ? '' : CONFIG.rarityRes[loot.rarity].name} {loot.full_name}</span>);
            }).reduce((prev, curr) => [prev, ', ', curr])}
        </div>);
    }
}

export class ActiveCrewDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hideDialog: true,
            shuttle: true, // false if voyage,
            title: 'Active crew status',
            activeId: null
        };

        this._cancelDialog = this._cancelDialog.bind(this);
    }

    render() {
        return (
            <div>
                <Dialog
                    hidden={this.state.hideDialog}
                    title={this.state.title}
                    onDismiss={this._cancelDialog}
                    dialogContentProps={{ type: DialogType.largeHeader }}
                    modalProps={{
                        isBlocking: false,
                        containerClassName: 'activedialogMainOverride'
                    }}
                >

                    {this.state.shuttle && (
                        <ShuttleAdventure activeId={this.state.activeId} />
                    )}

                    {!this.state.shuttle && (
                        <Voyage activeId={this.state.activeId} />
                    )}
                </Dialog>
            </div>
        );
    }

    show(active_id, name) {
        let shuttle = STTApi.playerData.character.shuttle_adventures.find((shuttle) => shuttle.shuttles[0].id == active_id);
        this.setState({
            hideDialog: false,
            activeId: active_id,
            shuttle: shuttle,
            title: name + (shuttle ? ' is on a shuttle adventure' : ' is on a voyage')
        });
    }

    _cancelDialog() {
        this.setState({ hideDialog: true });
    }
}