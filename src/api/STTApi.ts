import { NetworkInterface } from "./NetworkInterface";
import { NetworkFetch } from "./NetworkFetch.ts";
import { DexieCache, QuestsTable, ImmortalsTable, WikiImageTable } from "./Cache.ts";
import Dexie from "dexie";
import CONFIG from "./CONFIG.ts";

class STTApi {
	private _accessToken: string | undefined;
	private _net: NetworkInterface;
	private _crewAvatars: any;
	private _serverConfig: any;
	private _playerData: any;
	private _platformConfig: any;
	private _shipSchematics: any;
	private _starbaseData: any;
	private _fleetData: any;
	private _fleetMemberInfo: any;
	private _cache: DexieCache;

	constructor() {
		this._accessToken = undefined;
		this._crewAvatars = null;
		this._serverConfig = null;
		this._playerData = null;
		this._platformConfig = null;
		this._shipSchematics = null;
		this._starbaseData = null;
		this._fleetData = null;
		this._fleetMemberInfo = null;

		this._net = new NetworkFetch();

		// TODO: Dexie uses IndexedDB, so doesn't work in plain node.js without polyfill - should the caching be an interface?
		this._cache = new DexieCache("sttcache");
	}

	get networkHelper(): NetworkInterface {
		return this._net;
	}

	get quests(): Dexie.Table<QuestsTable, number> {
		return this._cache.quests;
    }
    
    get immortals(): Dexie.Table<ImmortalsTable, string> {
		return this._cache.immortals;
    }
    
    get wikiImages(): Dexie.Table<WikiImageTable, string> {
		return this._cache.wikiImages;
	}

	get accessToken(): string | undefined {
		return this._accessToken;
	}

	get loggedIn(): boolean {
		return this._accessToken != null;
	}

	get playerData(): boolean {
		return this._playerData.player;
	}

	get itemArchetypeCache(): boolean {
		return this._playerData.item_archetype_cache;
	}

	get shipSchematics(): any {
		return this._shipSchematics;
	}

	get fleetData(): any {
		return this._fleetData;
	}

	get fleetMembers(): any {
		return this._fleetMemberInfo.members;
	}

	get fleetSquads(): any {
		return this._fleetMemberInfo.squads;
	}

	get starbaseRooms(): any {
		return this._starbaseData[0].character.starbase_rooms;
	}

	getTraitName(trait: string): string {
		return this._platformConfig.config.trait_names[trait] ? this._platformConfig.config.trait_names[trait] : trait;
	}

	getCrewAvatarById(id: number): any {
		return this._crewAvatars.find((avatar: any) => avatar.id === id);
	}

	getCrewAvatarBySymbol(symbol: string): any {
		return this._crewAvatars.find((avatar: any) => avatar.symbol === symbol);
	}

	login(username: string, password: string): Promise<any> {
		return this._net.post(CONFIG.URL_PLATFORM + "oauth2/token", {
			"username": username,
			"password": password,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "password"
		}).then((data: any) => {
			if (data.error_description) {
				return Promise.reject(data.error_description);
			} else if (data.access_token) {
				this._accessToken = data.access_token;
				console.info("Logged in with access token " + data.access_token);
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for login!");
			}
		});
	}

	loginWithCachedAccessToken(accessToken: string): void {
		this._accessToken = accessToken;
	}

	loginWithFacebook(facebookAccessToken: string, facebookUserId: string): Promise<any> {
		return this._net.post(CONFIG.URL_PLATFORM + "oauth2/token", {
			"third_party.third_party": "facebook",
			"third_party.access_token": facebookAccessToken,
			"third_party.uid": facebookUserId,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "third_party"
		}).then((data: any) => {
			if (data.error_description) {
				return Promise.reject(data.error_description);
			} else if (data.access_token) {
				this._accessToken = data.access_token;
				console.info("Logged in with access token " + data.access_token);
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for login!");
			}
		});
	}

	executeGetRequest(resourceUrl: string, qs: any = {}): Promise<any> {
		if (this._accessToken === undefined) {
			return Promise.reject("Not logged in!");
		}

		return this._net.get(CONFIG.URL_SERVER + resourceUrl,
			Object.assign({ client_api: CONFIG.CLIENT_API_VERSION, access_token: this._accessToken}, qs));
	}

	executePostRequest(resourceUrl: string, qs: any): Promise<any> {
		if (this._accessToken === undefined) {
			return Promise.reject("Not logged in!");
		}

		return this._net.post(CONFIG.URL_SERVER + resourceUrl,
			Object.assign({ client_api: CONFIG.CLIENT_API_VERSION }, qs),
			this._accessToken
		);
	}

	loadServerConfig(): Promise<any> {
		return this.executeGetRequest("config").then((data: any) => {
			this._serverConfig = data;
			console.info("Loaded server config");
			return Promise.resolve();
		});
	}

	loadCrewArchetypes(): Promise<any> {
		return this.executeGetRequest("character/get_avatar_crew_archetypes").then((data: any) => {
			if (data.crew_avatars) {
				this._crewAvatars = data.crew_avatars;
				console.info("Loaded " + data.crew_avatars.length +" crew avatars");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for crew avatars!");
			}
		});
	}

	loadPlatformConfig(): Promise<any> {
		return this.executeGetRequest("config/platform").then((data: any) => {
			this._platformConfig = data;
			console.info("Loaded platform config");
			return Promise.resolve();
		});
	}

	loadPlayerData(): Promise<any> {
		return this.executeGetRequest("player").then((data: any) => {
			if (data.player) {
				this._playerData = data;
				console.info("Loaded player data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for player!");
			}
		});
	}

	loadShipSchematics(): Promise<any> {
		return this.executeGetRequest("ship_schematic").then((data: any) => {
			if (data.schematics) {
				this._shipSchematics = data.schematics;
				console.info("Loaded " + data.schematics.length + " ship schematics");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for ship schematics!");
			}
		});
	}

	loadFrozenCrew(symbol: string): Promise<any> {
		return this.executePostRequest("stasis_vault/immortal_restore_info", { symbol: symbol }).then((data: any) => {
			if (data.crew) {
				//console.info("Loaded frozen crew stats for " + symbol);
				return Promise.resolve(data.crew);
			} else {
				return Promise.reject("Invalid data for frozen crew!");
			}
		});
	}

	loadFleetMemberInfo(guildId: string): Promise<any> {
		return this.executePostRequest("fleet/complete_member_info", { guild_id: guildId }).then((data: any) => {
			if (data) {
				this._fleetMemberInfo = data;
				console.info("Loaded fleet member info");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for fleet member info!");
			}
		});
	}

	loadFleetData(guildId: string): Promise<any> {
		return this.executeGetRequest("fleet/" + guildId).then((data: any) => {
			if (data.fleet) {
				this._fleetData = data.fleet;
				console.info("Loaded fleet data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for fleet!");
			}
		});
	}

	loadStarbaseData(guildId: string): Promise<any> {
		return this.executeGetRequest("starbase/get").then((data: any) => {
			if (data) {
				this._starbaseData = data;
				console.info("Loaded starbase data");
				return Promise.resolve();
			} else {
				return Promise.reject("Invalid data for starbase!");
			}
		});
	}
}

export default (new STTApi());