import React, { Component } from 'react';

export class SkillCell extends React.Component {
	render() {
		if (this.props.skill.core > 0)
			return (
				<div className='skill-stats-div'>
					<span className='skill-stats'>{this.props.skill.core}</span>
					<br />
					<span className='skill-stats-range'>+({this.props.skill.min} - {this.props.skill.max})</span>
				</div>
			);
		else
			return (<div className='skill-stats-div'></div>);
	}
}