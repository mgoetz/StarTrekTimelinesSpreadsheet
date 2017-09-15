import { NetworkInterface } from "./NetworkInterface";
import { NetworkFetch } from "./NetworkFetch.ts";
import CONFIG from "./CONFIG.ts";

class STTApi {
	private _accessToken: string | undefined;
	private _net: NetworkInterface;
	private _crewAvatars: any;
	private _serverConfig: any;
	private _playerData: any;
	private _platformConfig: any;

	constructor() {
		this._accessToken = undefined;
		this._crewAvatars = null;
		this._serverConfig = null;
		this._playerData = null;
		this._platformConfig = null;
		this._net = new NetworkFetch();
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

	getTraitName(trait: string): string {
		return this._platformConfig.config.trait_names[trait] ? this._platformConfig.config.trait_names[trait] : trait;
	}

	getCrewAvatarById(id: number): any {
		return this._crewAvatars.find((avatar: any) => avatar.id === id);
	}

	getCrewAvatarBySymbol(symbol: string): any {
		return this._crewAvatars.find((avatar: any) => avatar.symbol === symbol);
	}

	private _loginResult(error: string | undefined, jsonBody: any, callback: (error: string | undefined, success: boolean) => void): void {
		if (!error) {
			let result: any = jsonBody;
			if (result.error_description) {
				callback(result.error_description, false);
			} else if (result.access_token) {
				this._accessToken = result.access_token;
				callback(undefined, true);
			} else {
				callback("unknown error", false);
			}
		} else {
			callback(error, false);
		}
	}

	login(username: string, password: string, callback: (error: string | undefined, success: boolean) => void): void {
		this._net.post(CONFIG.URL_PLATFORM + "oauth2/token", {
			"username": username,
			"password": password,
			"client_id": CONFIG.CLIENT_ID,
			"grant_type": "password"
		}, (error: string | undefined, jsonBody: any) => this._loginResult(error, jsonBody, callback));
	}

	loginWithCachedAccessToken(accessToken: string): void {
		this._accessToken = accessToken;
	}

	private _finishRequest(error: string | undefined,
		jsonBody: any,
		callback: (error: string | undefined, success: boolean) => void,
		dataCallback: (data: any) => boolean): void {
		if (!error) {
			if (jsonBody && dataCallback(jsonBody)) {
				callback(undefined, true);
			} else {
				callback("unknown error", false);
			}
		} else {
			callback(error, false);
		}
	}

	executeGetRequest(resourceUrl: string,
		callback: (error: string | undefined, success: boolean) => void,
		dataCallback: (data: any) => boolean): void {
		if (this._accessToken === undefined) {
			return callback("Not logged in!", false);
		}

		this._net.get(CONFIG.URL_SERVER + resourceUrl, {
			client_api: CONFIG.CLIENT_API_VERSION,
			access_token: this._accessToken
		}, (error: string | undefined, jsonBody: any) => this._finishRequest(error, jsonBody, callback, dataCallback));
	}

	executePostRequest(resourceUrl: string, qs: any,
		dataCallback: (data: any) => boolean,
		callback: (error: string | undefined, success: boolean) => void): void {
		if (this._accessToken === undefined) {
			return callback("Not logged in!", false);
		}

		this._net.post(CONFIG.URL_SERVER + resourceUrl, Object.assign({ client_api: CONFIG.CLIENT_API_VERSION }, qs),
			(error: string | undefined, jsonBody: any) => this._finishRequest(error, jsonBody, callback, dataCallback), this._accessToken);
	}

	loadServerConfig(callback: (error: string | undefined, success: boolean) => void): void {
		return this.executeGetRequest("config", callback, (data: any): boolean => {
			this._serverConfig = data;
			return true;
		});
	}

	loadCrewArchetypes(callback: (error: string | undefined, success: boolean) => void): void {
		return this.executeGetRequest("character/get_avatar_crew_archetypes", callback, (data: any): boolean => {
			if (data.crew_avatars) {
				this._crewAvatars = data.crew_avatars;
				return true;
			} else {
				return false;
			}
		});
	}

	loadPlatformConfig(callback: (error: string | undefined, success: boolean) => void): void {
		return this.executeGetRequest("config/platform", callback, (data: any): boolean => {
			this._platformConfig = data;
			return true;
		});
	}

	loadPlayerData(callback: (error: string | undefined, success: boolean) => void): void {
		return this.executeGetRequest("player", callback, (data: any): boolean => {
			if (data.player) {
				this._playerData = data;
				return true;
			} else {
				return false;
			}
		});
	}

	loadFrozenCrew(symbol: string,
		dataCallback: (crew: any) => void,
		callback?: (error: string | undefined, success: boolean) => void): void {

		if (callback === undefined) {
			callback = (error: string | undefined, success: boolean): void => { if (!success) { console.error(error); } };
		}

		return this.executePostRequest("stasis_vault/immortal_restore_info", { symbol: symbol },
			(data: any): boolean => {
				if (data.crew) {
					dataCallback(data.crew);
					return true;
				} else {
					return false;
				}
			}, callback);
	}
}

export default (new STTApi());