import React, { Component } from 'react';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Link } from 'office-ui-fabric-react/lib/Link';

import { loadFleet } from '../utils/fleet.js';

export class FleetDetails extends React.Component {
	constructor(props) {
		super(props);

		if (props.id) {
			this.state = {
				dataAvailable: false,
				fleetData: null
			};

			loadFleet(props.accessToken, props.id, function (data) {
				if (data.fleetData) {
					this.setState({ dataAvailable: true, fleetData: data.fleetData });
				}
			}.bind(this));
		}
		else
		{
			this.state = {
				dataAvailable: true,
				fleetData: null
			};
		}
	}

	render() {
		if (this.state.dataAvailable) {

			if (!this.state.fleetData) {
				return <p>It looks like you are not part of a fleet yet!</p>;
			}

			return <div>
				{this.state.fleetData.members.map(function (member) {
					return <p key={member.dbid}>{member.display_name}, {member.rank}, (last active {(member.last_active / 60).toFixed(0)} minutes ago)</p>
				})}
			</div>;
		}
		else {
			return (<Spinner size={SpinnerSize.large} label='Loading data...' />);
		}
	}
}