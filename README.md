# Star Trek Timelines Spreadsheet Tool
A tool to ease with crew management in Star Trek Timelines

**DISCLAIMER** This tool is provided "as is", without warranty of any kind. Use at your own risk! Make sure you read and understand [Disruptor Beam's Terms of Service](https://www.disruptorbeam.com/tos/); review the functionality of this tool and their TOS carefully before determining its compliance.

Star Trek Timelines content and materials are trademarks and copyrights of [Disruptor Beam](https://www.disruptorbeam.com/games/star-trek-timelines/); I have no affiliation with Disruptor Beam or any of its partners.

I recommend you install the development environment and play with the source code yourself; make improvements and submit PRs to help your fellow players!

However, if you're only interested in installing and running the tool, head on to the [releases](/releases) page and pick a recent release to install.

![Screenshot tool](/Screenshot-Tool.png "Tool screenshot")

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

## Command line version of the tool
[See details here for the command line version of the tool](CLI.MD)

## GUI version of the tool
[See details here for the GUI version of the tool](gui/README.md)
