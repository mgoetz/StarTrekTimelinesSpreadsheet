import * as React from "react";
import * as ReactDOM from "react-dom";

import STTApi from '../../shared/api/STTApi';

const skillRes = {
    'command_skill': { name: 'Command', url: 'https://stt.wiki/w/images/thumb/6/6d/CMD.png/18px-CMD.png' },
    'science_skill': { name: 'Science', url: 'https://stt.wiki/w/images/thumb/b/ba/SCI.png/18px-SCI.png' },
    'security_skill': { name: 'Security', url: 'https://stt.wiki/w/images/thumb/c/c9/SEC.png/18px-SEC.png' },
    'engineering_skill': { name: 'Engineering', url: 'https://stt.wiki/w/images/thumb/8/8b/ENG.png/18px-ENG.png' },
    'diplomacy_skill': { name: 'Diplomacy', url: 'https://stt.wiki/w/images/thumb/5/58/DIP.png/18px-DIP.png' },
    'medicine_skill': { name: 'Medicine', url: 'https://stt.wiki/w/images/thumb/5/56/MED.png/18px-MED.png' }
};

export class CrewCard extends React.Component<any, any> {
    render() {
        let crew: any = this.props.crew;
        let rating: JSX.Element[] = [];
        for (let i = 0; i < crew.rarity; i++) {
            rating.push(<i key={i} className='yellow star icon' />);
        }
        for (let i = 0; i < crew.max_rarity - crew.rarity; i++) {
            rating.push(<i key={i + 5} className='grey star icon' />);
        }

        return (<div className="card">
            <div className="content">
                <img className="left floated ui tiny image" src={crew.iconUrl} />
                <div className="header">
                    {(crew.frozen > 0) && <i className="right snowflake icon"></i>}
                    {crew.buyback && <i className="right recycle icon"></i>}
                    {crew.active_id && <i className="right wait icon"></i>}
                    {crew.name}
                </div>
                <div className="meta">Level {crew.level} {rating}
                    <br/>
                    Equipment
                    <i className={crew.equipment_slots[0].have ? "green square icon" : "square icon"} />
                    <i className={crew.equipment_slots[1].have ? "green square icon" : "square icon"} />
                    <i className={crew.equipment_slots[2].have ? "green square icon" : "square icon"} />
                    <i className={crew.equipment_slots[3].have ? "green square icon" : "square icon"} />
                </div>
                <div className="description">{crew.rawTraits.map((trait: any) => <div className="ui horizontal mini label" style={{ marginBottom: '.25em' }} key={trait}>{STTApi.getTraitName(trait)}</div>)}</div>
            </div>
            <div className="extra content">
                <div className="ui three column grid">
                    {(crew.command_skill.core > 0) &&
                        <div className="column">
                            <img className="ui image skillImage" src={skillRes["command_skill"].url} />&nbsp;<b>{crew.command_skill.core}</b>&nbsp; +({crew.command_skill.min} - {crew.command_skill.max})
                        </div>
                    }
                    {(crew.science_skill.core > 0) &&
                        <div className="column">
                            <img className="ui image skillImage" src={skillRes["science_skill"].url} />&nbsp;<b>{crew.science_skill.core}</b>&nbsp; +({crew.science_skill.min} - {crew.science_skill.max})
                        </div>
                    }
                    {(crew.security_skill.core > 0) &&
                        <div className="column">
                            <img className="ui image skillImage" src={skillRes["security_skill"].url} />&nbsp;<b>{crew.security_skill.core}</b>&nbsp; +({crew.security_skill.min} - {crew.security_skill.max})
                        </div>
                    }
                    {(crew.engineering_skill.core > 0) &&
                        <div className="column">
                            <img className="ui image skillImage" src={skillRes["engineering_skill"].url} />&nbsp;<b>{crew.engineering_skill.core}</b>&nbsp; +({crew.engineering_skill.min} - {crew.engineering_skill.max})
                        </div>
                    }
                    {(crew.diplomacy_skill.core > 0) &&
                        <div className="column">
                            <img className="ui image skillImage" src={skillRes["diplomacy_skill"].url} />&nbsp;<b>{crew.diplomacy_skill.core}</b>&nbsp; +({crew.diplomacy_skill.min} - {crew.diplomacy_skill.max})
                        </div>
                    }
                    {(crew.medicine_skill.core > 0) &&
                        <div className="column">
                            <img className="ui image skillImage" src={skillRes["medicine_skill"].url} />&nbsp;<b>{crew.medicine_skill.core}</b>&nbsp; +({crew.medicine_skill.min} - {crew.medicine_skill.max})
                        </div>
                    }
                </div>
            </div>
        </div>);
    }
}