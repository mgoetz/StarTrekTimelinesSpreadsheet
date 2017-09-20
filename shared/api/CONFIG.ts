export default class CONFIG {
	static readonly URL_PLATFORM: string = "https://thorium.disruptorbeam.com/";
	static readonly URL_SERVER: string = "https://stt.disruptorbeam.com/";

	// default client_id of the Steam Windows version of STT
	static readonly CLIENT_ID: string = "4fc852d7-d602-476a-a292-d243022a475d";
	static readonly CLIENT_API_VERSION: number = 8;

	// feedback form endpoint URL
	static readonly URL_USERFEEDBACK: string = "https://prod-23.westus.logic.azure.com:443/workflows/fb9aad14945947ee96196506c5cb99c4/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=7DdF1Ybdsk60b2Q2m063oQcxDEvzKXoT3y741A6CL1s";

	// releases URL
	static readonly URL_GITHUBRELEASES: string = "https://api.github.com/repos/IAmPicard/StarTrekTimelinesSpreadsheet/releases";

	// Every 10 days, check the wiki again for updated / new images
	static readonly HOURS_TO_RECOVERY: number = 24 * 10;
}