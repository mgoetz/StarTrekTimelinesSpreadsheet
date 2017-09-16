import * as storage from "electron-json-storage-sync";

// TODO: switch this over to Dexie too
export class UserConfigLoader {
	userConfig: any;

	constructor() {
		let result: any = storage.get("userConfig");
		if (result.status) {
			this.userConfig = result.data;
		}
	}

	getValue(prop : string): any {
		if (this.userConfig) {
			return this.userConfig[prop];
		} else {
			return undefined;
		}
	}

	setValue(prop: string, value : any): void {
		if (!this.userConfig) {
			this.userConfig = {};
		}

		this.userConfig[prop] = value;

		storage.set("userConfig", this.userConfig);
	}
}