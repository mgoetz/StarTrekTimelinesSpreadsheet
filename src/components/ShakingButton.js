import React, { Component } from 'react';
import { IconButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';

export class ShakingButton extends React.Component {
	constructor(props) {
        super(props);

        this._feedbackButton = null;

        this._tick = this._tick.bind(this);
    }

    _tick() {
        var distance = 6;
        var keyframes = [
            { transform: 'translate3d(0, 0, 0)', offset: 0 },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)', offset: 0.1 },
            { transform: 'translate3d(' + distance + 'px, 0, 0)', offset: 0.2 },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)', offset: 0.3 },
            { transform: 'translate3d(' + distance + 'px, 0, 0)', offset: 0.4 },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)', offset: 0.5 },
            { transform: 'translate3d(' + distance + 'px, 0, 0)', offset: 0.6 },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)', offset: 0.7 },
            { transform: 'translate3d(' + distance + 'px, 0, 0)', offset: 0.8 },
            { transform: 'translate3d(-' + distance + 'px, 0, 0)', offset: 0.9 },
            { transform: 'translate3d(0, 0, 0)', offset: 1 }];
        var timing = { duration: 900, iterations: 1 };
        this._feedbackButton.animate(keyframes, timing);
	}

    componentDidMount() {
		this.interval = setInterval(this._tick, this.props.interval);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	render() {
        return (
            <div ref={(feedbackButton) => this._feedbackButton = feedbackButton}>
                <IconButton iconProps={{ iconName: this.props.iconName }} title={this.props.title} onClick={this.props.onClick} />
            </div>
        );
	}
}