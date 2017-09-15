// an implemention of NetworkInterface using the native browser fetch functionality
import {NetworkInterface} from "./NetworkInterface";

export class NetworkFetch implements NetworkInterface {
    post(uri: string, form: any, callback: (error: string|undefined, body: any) => void, bearerToken?: string): void {
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

        window.fetch(uri, {
            method: "post",
            headers: headers,
            body: searchParams
          })
          .then((response : Response) => response.json())
          .then((data) => callback(undefined, data))
          .catch((error) => callback(error, undefined));
    }

    get(uri: string, qs: any, callback: (error: string|undefined, body: any) => void): void {
        let url: URL = new URL(uri);
        for (const prop of Object.keys(qs)) {
            url.searchParams.set(prop, qs[prop]);
        }

        window.fetch(url.toString())
        .then((response : Response) => response.json())
        .then((data) => callback(undefined, data))
        .catch((error) => callback(error, undefined));
    }
}