import Dexie from "dexie";

export class DexieCache extends Dexie {
    private _questsTable: Dexie.Table<QuestsTable, number>;
    private _immortalsTable: Dexie.Table<ImmortalsTable, string>;
    private _wikiImageTable: Dexie.Table<WikiImageTable, string>;

    get quests(): Dexie.Table<QuestsTable, number> {
		return this._questsTable;
    }
    
    get immortals(): Dexie.Table<ImmortalsTable, string> {
		return this._immortalsTable;
    }
    
    get wikiImages(): Dexie.Table<WikiImageTable, string> {
		return this._wikiImageTable;
	}

    constructor (databaseName: string) {
        super(databaseName);
        this.version(1).stores({
            _questsTable: 'id,description,challenges,mastery_levels,cadet,crew_requirement',
            _immortalsTable: 'symbol,crew',
            _wikiImageTable: 'fileName,url,lastQueried'
        });
    }
}

export interface QuestsTable {
    id: number,
    description: string,
    challenges: any,
    mastery_levels: any,
    cadet: boolean,
    crew_requirement: any
}

export interface ImmortalsTable {
    symbol: string,
    crew: any
}

export interface WikiImageTable {
    fileName: string,
    url: string,
    lastQueried: Date
}