// an implemention of NetworkInterface using the request module.
// for some reason request times out when used from electron renderer process
// so we can either use ipc (electron.remote), or use the fetch-based implementation of this
import * as request from "request";

import { NetworkInterface } from "./NetworkInterface";

export class NetworkRequest implements NetworkInterface {
	post(uri: string, form: any, callback: (error: string | undefined, body: any) => void, bearerToken?: string): void {

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

		request.post(uri, options, (error: string, _response: any, body: string): void => callback(error, body));
	}

	get(uri: string, qs: any, callback: (error: string | undefined, body: any) => void): void {
		const options: request.CoreOptions = {
			method: "GET",
			qs: qs
		};

		request.get(uri, options, (error: string, _response: any, body: string): void => callback(error, body));
	}
}