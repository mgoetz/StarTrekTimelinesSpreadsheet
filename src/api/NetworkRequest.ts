// an implemention of NetworkInterface using the request module.
// for some reason request times out when used from electron renderer process
// so we can either use ipc (electron.remote), or use the fetch-based implementation of this
import * as request from "request";

import { NetworkInterface } from "./NetworkInterface";

export class NetworkRequest implements NetworkInterface {
	post(uri: string, form: any, bearerToken?: string): Promise<any> {
		let headers: any = {
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		};

		if (bearerToken !== undefined) {
			headers.Authorization = "Bearer " + new Buffer(bearerToken).toString("base64");
		}

		const options: request.CoreOptions = {
			method: "POST",
			form: form,
			headers: headers
		};

		return new Promise((resolve, reject) => {
			request.post(uri, options, (error: string, _response: any, body: string) => {
				if (error) {
					reject(error);
				} else {
					resolve(JSON.parse(body));
				}
			});
		});
	}

	get(uri: string, qs: any): Promise<any> {
		const options: request.CoreOptions = {
			method: "GET",
			qs: qs
		};

		return new Promise((resolve, reject) => {
			request.get(uri, options, (error: string, _response: any, body: string) => {
				if (error) {
					reject(error);
				} else {
					resolve(JSON.parse(body));
				}
			});
		});
	}
}