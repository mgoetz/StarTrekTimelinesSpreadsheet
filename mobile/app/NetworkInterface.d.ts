export interface NetworkInterface {
	post(uri: string, form: any, bearerToken?: string): Promise<any>;
	postjson(uri: string, form: any): Promise<any>;
    get(uri: string, qs: any) : Promise<any>;
}