export interface NetworkInterface {
    post(uri: string, form: any, callback: (error: string|undefined, body: any) => void, bearerToken?: string) : void;
    get(uri: string, qs: any, callback: (error: string|undefined, body: any) => void) : void;
}