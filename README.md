# StarTrekTimelinesSpreadsheet
A tool to ease with crew management in Star Trek Timelines

# How to use

**DISCLAIMER** This tool is provided "as is", without warranty of any kind. Use at your own risk! Make sure you read and understand [Disruptor Beam's Terms of Service](https://www.disruptorbeam.com/tos/); review the functionality of this tool and their TOS carefully before determining its compliance.

Star Trek Timelines content and materials are trademarks and copyrights of [Disruptor Beam](https://www.disruptorbeam.com/games/star-trek-timelines/); I have no affiliation with Disruptor Beam or any of its partners.

## Installation
Clone or download and extract the repository in a folder on your device.

Download and install [node.js](https://nodejs.org/) on your computer.

## Get an access token
First, you need to obtain an access token. If you're running on a Windows PC, install the free Star Trek Timelines [Steam application](http://store.steampowered.com/app/600750/Star_Trek_Timelines/), then open it at least once to log in.

If you're not running on a Windows PC or don't want to install the Steam application, you can use the Facebook application through your browser. Please follow the steps below for obtaining an access token:

1. Open Chrome and hit F12 and switch to the Network tab in the debug pane that opens
2. Now navigate to [Star Trek Timelines](https://apps.facebook.com/sttimelines) on the page and wait until you get the "Play >>" link
3. Back in the debug page, enter "stt.disruptorbeam.com/player" in the Filter input. Select the first item in the list of requests.
4. On the right, you should see something like this:

![Screenshot](/screenshot.png "Screenshot")

5. Copy the access_token, which should be in this format: "123e4567-e89b-12d3-a456-426655440000"

*NOTE*: you need to repeat this process about once every 2 weeks, as the access token expires after a set period of time.

## Before running the script

On a Windows machine, open "Node.js command prompt" from the Start menu, and navigate to the folder wher you cloned or downloaded the tool. For example, if you extracted the zip in "D:\tool", you'd issue these commands:

```
Your environment has been set up for using Node.js 6.11.2 (x64) and npm.
C:\Users\user>d:
D:\Program Files\nodejs>cd d:\tool
D:\tool>
```

If this is the first time using the tool, or you recently downloaded a new version, make sure you install its needed dependencies by running this command:
```
npm install
```

## Generating the spreadsheet
Once you got the access token, you can generate a spreadsheet of your crew by invoking the script with:
```
node sttsheet.js [access_token] > filename.csv
```

If you have the Steam app installed you don't need to pass the `[access_token]` parameter, the tool will attempt to load that from registry.

If you don't have the Steam app installed, replace `[access_token]` with the value you copied from Chrome's debug pane.

Open `filename.csv` with your spreadsheet application of choice and enjoy.

### Other options
If you want to generate a spreadsheet of your item stats instead, invoke the script with:
```
node sttsheet.js [-i|--items] [access_token] > filename.csv
```

Similarly, if you want to generate a spreadsheet of your ship stats, invoke the script with:
```
node sttsheet.js [-s|--ships] [access_token] > filename.csv
```

### Gauntlet crew recommendations
The tool can recommend an optimal list of crew to use for your next gauntlet; it tries to compute the list of crew with the highest statistical score. It only works if you haven't already joined the gauntlet. To use this option, invoke the script with:
```
node sttsheet.js [-g|--gauntlet] [access_token]
```
*Note*: the algorithm is very raw and could use improving. Please send suggestions / feedback.
