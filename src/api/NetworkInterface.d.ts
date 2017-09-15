export interface NetworkInterface {
	post(uri: string, form: any, bearerToken?: string): Promise<any>;
    get(uri: string, qs: any) : Promise<any>;
}