import React, { Component } from 'react';
import { Icon } from 'office-ui-fabric-react/lib/Icon';

export class CollapsibleSection extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isCollapsed: true
		};
	}

	render() {
		return (<div>
			<h2><button type='button' style={{ cursor: 'default', background: 'none', border: 'none' }} onClick={() => this.setState({ isCollapsed: !this.state.isCollapsed })}>
				<Icon iconName={this.state.isCollapsed ? 'ChevronDown' : 'ChevronUp'} />
			</button> {this.props.title}
			</h2>
			{!this.state.isCollapsed && this.props.children}
		</div>);
	}
}