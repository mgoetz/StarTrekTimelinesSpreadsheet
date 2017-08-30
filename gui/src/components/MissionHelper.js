import React, { Component } from 'react';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';

import { loadMissionData } from '../utils/missions.js';

export class Temp extends React.Component {
	render() {
		return (<ul>
			{this.props.mission.quests.map(function (quest) {
				return (<li key={quest.id}>{quest.name} ({quest.description})
					{quest.mastery_levels &&
					<span className='quest-mastery'>
						<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({quest.mastery_levels[0].progress.goal_progress} / {quest.mastery_levels[0].progress.goals})
						<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({quest.mastery_levels[1].progress.goal_progress} / {quest.mastery_levels[1].progress.goals})
						<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({quest.mastery_levels[2].progress.goal_progress} / {quest.mastery_levels[2].progress.goals})
					</span>
					}
					<ul>
						{quest.challenges && quest.challenges.map(function (challenge) {
							return (<li key={challenge.id}>{challenge.name} <i>({challenge.skill})</i>
								<span className='quest-mastery'>
									<Image src='https://stt.wiki/w/images/thumb/8/8f/Normal_64.png/48px-Normal_64.png' height={20} />({challenge.difficulty_by_mastery[0]})
									<Image src='https://stt.wiki/w/images/thumb/3/38/Elite_64.png/48px-Elite_64.png' height={20} />({challenge.difficulty_by_mastery[1]})
									<Image src='https://stt.wiki/w/images/thumb/5/57/Epic_64.png/48px-Epic_64.png' height={20} />({challenge.difficulty_by_mastery[2]})
								</span>
							</li>);
						})}
					</ul>
					</li>);
			})}
		</ul>);
	}
}

export class MissionHelper extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dataAvailable: false,
			missions: []
		};

		//TODO: Load on-demand
		loadMissionData(props.params.accesstoken, props.params.accepted_missions, function (result) {
			if (result.errorMsg || (result.statusCode && (result.statusCode != 200)))
			{

			}
			else {
				this.setState({ dataAvailable: true, missions: result.missionList });
			}
		}.bind(this));
	}

	render() {
		if (this.state.dataAvailable)
			return (
				<div>
					{this.state.missions.map(function (mission) {
						return (<div key={mission.id}>
							<p><b>{mission.episode_title}</b> <i>(Completed {mission.stars_earned} of {mission.total_stars})</i> - {mission.description}</p>
							<Temp mission={mission} />
							</div>
							);
					})}
				</div>
			);
		else
			return (<div>Not loaded yet</div>);
	}
}
