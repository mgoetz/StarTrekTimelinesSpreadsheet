# StarTrekTimelinesSpreadsheet
A tool to ease with crew management in Star Trek Timelines

# How to use

*DISCLAIMER* This tool is provided "as is", without warranty of any kind. Use at your own risk! Make sure you read and understand [Disruptor Beam's Terms of Service](https://www.disruptorbeam.com/tos/). I am not a lawyer, review the functionality of this tool and their TOS carefully before determining its compliance.
Star Trek Timelines content and materials are trademarks and copyrights of [Disruptor Beam](https://www.disruptorbeam.com/games/star-trek-timelines/); I have no affiliation with Disruptor Beam or any of its partners.

## Install node.js
Download and install [node.js](https://nodejs.org/en/) on your computer.
Install a few needed npm packages:
```
npm install request
npm install regedit
```

## Get an access token
First, you need to obtain an access token. If you're running on a Windows PC, install the free [Steam application](http://store.steampowered.com/app/600750/Star_Trek_Timelines/), then open it at least once to log in.

If you're not running on a Windows PC or don't want to install the Steam application, you need to follow the steps below for obtaining an access token:

1. Open Chrome and navigate to Facebook
2. Hit F12 and switch to the Network tab in the debug pane that opens
3. Now navigate to Star Trek Timelines on the page and wait until you get the "Play >>" link
4. Back in the debug page, enter "stt.disruptorbeam.com/player" in the Filter input. Select the first item in the list of requests.
5. On the right, you should see something like this:

![Screenshot](/screenshot.png "Screenshot")

6. Copy the access_token, which should be in this format: "123e4567-e89b-12d3-a456-426655440000"

## Generating the spreadsheet
Once you got the access token, you can generate a spreadsheet by invoking the script with:
```
node sttsheet.js [access_token] > filename.csv
```

If you have the Steam app installed you don't need to pass a parameter; if you don't, replace `[access_token]` with the value you copied from Chrome's debug pane.
