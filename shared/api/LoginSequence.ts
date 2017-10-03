import STTApi from "./STTApi.ts";
import CONFIG from "./CONFIG.ts";
import { matchCrew } from './CrewTools.ts';
import { matchShips } from './ShipTools.ts';
import { getWikiImageUrl, IFoundResult } from './WikiImageTools.ts';
import { loadMissionData } from './MissionTools.ts';
import { calculateMissionCrewSuccess, calculateMinimalComplementAsync } from './MissionCrewSuccess.ts';

export function loginSequence(onProgress: (description: string) => void, loadMissions: boolean = true): Promise<any> {
    var mainResources = [
        {
            loader: STTApi.loadCrewArchetypes.bind(STTApi),
            description: 'crew information'
        },
        {
            loader: STTApi.loadServerConfig.bind(STTApi),
            description: 'server configuration'
        },
        {
            loader: STTApi.loadPlatformConfig.bind(STTApi),
            description: 'platform configuration'
        },
        {
            loader: STTApi.loadShipSchematics.bind(STTApi),
            description: 'ship information'
        },
        {
            loader: STTApi.loadPlayerData.bind(STTApi),
            description: 'player data'
        }
    ];

    var fleetResources = [
        {
            loader: STTApi.loadFleetMemberInfo.bind(STTApi),
            description: 'fleet members'
        },
        {
            loader: STTApi.loadFleetData.bind(STTApi),
            description: 'fleet data'
        },
        {
            loader: STTApi.loadStarbaseData.bind(STTApi),
            description: 'starbase data'
        }
    ];

    let promise: Promise<any> = mainResources.reduce((prev, cur) => {
        return prev.then(() => {
            onProgress('Loading ' + cur.description + '...');
            return cur.loader();
        });
    }, Promise.resolve())
    .then(() => {
        if (STTApi.playerData.fleet && STTApi.playerData.fleet.id != 0) {
            return fleetResources.reduce((prev, cur) => {
                return prev.then(() => {
                    onProgress('Loading ' + cur.description + '...');
                    return cur.loader(STTApi.playerData.fleet.id);
                });
            }, Promise.resolve());
        }
        else {
            return Promise.resolve();
        }
    })
    .then(() => {
        onProgress('Analyzing crew...');

        return matchCrew(STTApi.playerData.character).then((roster: any) => {
            STTApi.roster = roster;
            roster.forEach((crew: any) => {
                crew.iconUrl = '';
                crew.iconBodyUrl = '';
            });

            onProgress('Finding crew images...');
            let iconPromises: Array<Promise<void>> = [];
            roster.forEach((crew: any) => {
                iconPromises.push(getWikiImageUrl(crew.name.split(' ').join('_') + '_Head.png', crew.id).then((found: IFoundResult) => {
                    STTApi.roster.forEach((crew: any) => {
                        if (crew.id === found.id)
                            crew.iconUrl = found.url;
                    });

                    return Promise.resolve();
                }).catch((error: any) => { /*console.warn(error);*/ }));
                iconPromises.push(getWikiImageUrl(crew.name.split(' ').join('_') + '.png', crew.id).then((found: IFoundResult) => {
                    STTApi.roster.forEach((crew: any) => {
                        if (crew.id === found.id)
                            crew.iconBodyUrl = found.url;
                    });

                    return Promise.resolve();
                }).catch((error: any) => { /*console.warn(error);*/ }));
            });

            // Also load the avatars for crew not in the roster
            STTApi.crewAvatars.forEach((crew: any) => {
                iconPromises.push(getWikiImageUrl(crew.name.split(' ').join('_') + '_Head.png', crew.id).then((found: IFoundResult) => {
                    STTApi.crewAvatars.forEach((crew: any) => {
                        if (crew.id === found.id)
                            crew.iconUrl = found.url;
                    });

                    return Promise.resolve();
                }).catch((error: any) => { /*console.warn(error);*/ }));
            });

            return Promise.all(iconPromises);
        }).then(() => {
            onProgress('Loading ships...');

            return matchShips(STTApi.playerData.character.ships).then((ships: any) => {
                STTApi.ships = ships;

                onProgress('Finding ship images...');
                let iconPromises: Array<Promise<void>> = [];
                ships.forEach((ship: any) => {
                    var fileName = ship.name.split(' ').join('_').split('.').join('').split('\'').join('') + '.png';
                    iconPromises.push(getWikiImageUrl(fileName, ship.name).then((found: IFoundResult) => {
                        STTApi.ships.forEach((ship: any) => {
                            if (ship.name === found.id)
                                ship.iconUrl = found.url;
                        });

                        return Promise.resolve();
                    }).catch((error: any) => { /*console.warn(error);*/ }));
                });
                return Promise.all(iconPromises);
            });
        });
    });

    if (loadMissions) {
        return promise.then(() => {
            onProgress('Loading missions and quests...');
            return loadMissionData(STTApi.playerData.character.cadet_schedule.missions.concat(STTApi.playerData.character.accepted_missions), STTApi.playerData.character.dispute_histories).then((missions) => {
                STTApi.missions = missions;

                onProgress('Calculating mission success stats for crew...');
                STTApi.missionSuccess = calculateMissionCrewSuccess();
                calculateMinimalComplementAsync();

                return Promise.resolve();
            });
        });
    }
    else {
        return promise;
    }
}
