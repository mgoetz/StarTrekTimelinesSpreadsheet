import STTApi from "./STTApi.ts";

export interface IChallengeSuccessTrait
{
    trait: string;
    bonus: number;
}

export interface IChallengeSuccessCrew
{
    crew: any;
    success: number;
}

export interface IChallengeSuccess
{
    mission: any;
    quest: any;
    challenge: any;
    roll: number;
    skill: string;
    cadet: boolean;
    crew_requirement: any;
    traits: Array<IChallengeSuccessTrait>;
    lockedTraits: Array<string>;
    crew: Array<IChallengeSuccessCrew>;
}

export function calculateMissionCrewSuccess(): Array<IChallengeSuccess> {
    let log: Array<IChallengeSuccess> = [];
    STTApi.missions.forEach((mission: any) => {
        mission.quests.forEach((quest: any) => {
            if (quest.quest_type == 'ConflictQuest') {
                quest.challenges.forEach((challenge: any) => {
                    let entry: IChallengeSuccess = {
                        mission: mission,
                        quest: quest,
                        challenge: challenge,
                        roll: 0,
                        skill: challenge.skill,
                        cadet: (quest.cadet == true) ? true : false,
                        crew_requirement: quest.crew_requirement,
                        traits: [],
                        lockedTraits: [],
                        crew: []
                    };

                    if (challenge.difficulty_by_mastery) {
                        entry.roll += challenge.difficulty_by_mastery[2];
                    }

                    if (challenge.critical && challenge.critical.threshold) {
                        entry.roll += challenge.critical.threshold;
                    }

                    if (challenge.trait_bonuses && (challenge.trait_bonuses.length > 0)) {
                        challenge.trait_bonuses.forEach((traitBonus: any) => {
                            entry.traits.push({ trait: traitBonus.trait, bonus: traitBonus.bonuses[2] });
                        });
                    }

                    if (challenge.locks && (challenge.locks.length > 0)) {
                        challenge.locks.forEach((lock: any) => {
                            if (lock.trait) {
                                entry.lockedTraits.push(lock.trait);
                            }
                        });
                    }

                    STTApi.roster.forEach((crew: any) => {
                        let rawTraits = new Set(crew.rawTraits);

                        if (entry.cadet) {
                            if ((crew.max_rarity < entry.crew_requirement.min_stars) || (crew.max_rarity > entry.crew_requirement.max_stars)) {
                                return; // Doesn't meet rarity requirements
                            }

                            if (entry.crew_requirement.traits && (entry.crew_requirement.traits.length > 0)) {
                                let matchingTraits: number = entry.crew_requirement.traits.filter((trait: string) => rawTraits.has(trait)).length;
                                if (matchingTraits != entry.crew_requirement.traits.length)
                                    return; // Doesn't meet trait requirements
                            }
                        }

                        if (entry.lockedTraits.length > 0) {
                            let matchingTraits: number = entry.lockedTraits.filter((trait: string) => rawTraits.has(trait)).length;
                            if (matchingTraits == 0)
                                return; // Node is locked by a trait which this crew doesn't have
                        }

                        // Compute roll for crew
                        var rollCrew = crew[entry.skill].core;

                        if (entry.traits && (entry.traits.length > 0)) {
                            let matchingTraits: number = entry.traits.filter((traitBonus: any) => rawTraits.has(traitBonus.trait)).length;
                            rollCrew += matchingTraits * entry.traits[0].bonus;
                        }

                        if (rollCrew + crew[entry.skill].max > entry.roll) // Does this crew even have a chance?
                        {
                            let successPercentage: number = (rollCrew + crew[entry.skill].max - entry.roll) * 100 / (crew[entry.skill].max - crew[entry.skill].min);
                            if (successPercentage > 100) {
                                successPercentage = 100;
                            }

                            entry.crew.push({ crew: crew, success: successPercentage });
                        }
                    });

                    entry.crew.sort((a: IChallengeSuccessCrew, b: IChallengeSuccessCrew) => b.success - a.success);

                    log.push(entry);
                });
            }
        });
    });

    return log;
}

export class MinimalComplement
{
    unneededCrew: Array<number>;
    neededCrew: Array<number>;
}

export function calculateMinimalComplement(): MinimalComplement {
    let baseline = 0;
    let allConsideredCrew = new Set<number>();
    STTApi.missionSuccess.forEach((entry: any) => {
        entry.crew.forEach((crew: any) => {
            allConsideredCrew.add(crew.crew.id);
        });

        baseline += (entry.crew.length > 0) ? entry.crew[0].success : 0;
    });

    // TODO: This should actually do a combinatorial (all possible combinations of crew ids from allConsideredCrew).
    // However, that pegs the CPU for minutes even on a fast i7-7700k
    // The algorithm below is suboptimal but it's much cheaper to run

    // Calculate minimal set of crew out of allConsideredCrew that still yields the same result for all challenges
    let start = allConsideredCrew.size;

    let removedCrew = new Set<number>();

    let before;
    do {
        before = allConsideredCrew.size;

        for (let crewId of allConsideredCrew) {
            let result = 0;

            STTApi.missionSuccess.forEach((entry: any) => {
                let filteredCrew = entry.crew.filter((crew: any) => { return (crew.crew.id != crewId) && !removedCrew.has(crew.crew.id); });
                result += (filteredCrew.length > 0) ? filteredCrew[0].success : 0;
            });

            if (result == baseline) {
                allConsideredCrew.delete(crewId);
                removedCrew.add(crewId);
                break;
            }
        }
    } while (allConsideredCrew.size < before);

    return {
        unneededCrew: Array.from(removedCrew),
        neededCrew: Array.from(allConsideredCrew)
    };
}