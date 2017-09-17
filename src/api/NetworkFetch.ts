// an implemention of NetworkInterface using the native browser fetch functionality
import { NetworkInterface } from "./NetworkInterface";

export class NetworkFetch implements NetworkInterface {
	post(uri: string, form: any, bearerToken: string | undefined = undefined, getjson: boolean = true): Promise<any> {
		let searchParams: URLSearchParams = new URLSearchParams();
		for (const prop of Object.keys(form)) {
			searchParams.set(prop, form[prop]);
		}

		let headers: any = {
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		};

		if (bearerToken !== undefined) {
			headers.Authorization = "Bearer " + new Buffer(bearerToken).toString("base64");
		}

		let promiseFetch = window.fetch(uri, {
			method: "post",
			headers: headers,
			body: searchParams
		});

		if (getjson) {
			return promiseFetch.then((response: Response) => response.json());
		} else {
			return promiseFetch.then((response: Response) => response.text());
		}
	}

	postjson(uri: string, form: any): Promise<any> {
		let headers: any = {
			"Content-type": "application/json"
		};

		let promiseFetch = window.fetch(uri, {
			method: "post",
			headers: headers,
			body: JSON.stringify(form)
		});

		return promiseFetch.then((response: Response) => response.text());
	}

	get(uri: string, qs: any): Promise<any> {
		let url: URL = new URL(uri);
		for (const prop of Object.keys(qs)) {
			url.searchParams.set(prop, qs[prop]);
		}

		return window.fetch(url.toString()).then((response: Response) => response.json());
	}
}