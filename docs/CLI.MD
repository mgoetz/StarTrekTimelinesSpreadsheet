## Installation
Clone or download and extract the repository in a folder on your device.

Download and install [node.js](https://nodejs.org/) on your computer.

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

### Excel format
If your spreadsheet application can open Excel files (.xlsx), you can export a single Excel workbook with all the stats. For this option, invoke the script with:
```
node sttsheet.js -e|--excel filename.xlsx [access_token]
```

### Gauntlet crew recommendations
The tool can recommend an optimal list of crew to use for your next gauntlet; it tries to compute the list of crew with the highest statistical score. It only works if you haven't already joined the gauntlet. To use this option, invoke the script with:
```
node sttsheet.js [-g|--gauntlet] [access_token]
```
*Note*: the algorithm is very raw and could use improving. Please send suggestions / feedback.
