# Star Trek Timelines Mobile Companion

Testing

## Installation Steps

### Visual Studio Code
*(you will need node and npm installed before)*
- Install [VSCode](https://code.visualstudio.com/)
- (Optional: Install the VSCode [Cordova Extension](https://marketplace.visualstudio.com/items?itemName=vsmobile.cordova-tools) )
- From the command line run `npm install`
- From the command line run `npm run bundle`
- Add the cordova platform and run `cordova platform add browser && cordova run`

At this point you'll need to make a change in platforms/browser/cordova/node_modules/cordova-serve/src/browser.js in order to be able to test locally: find "chromeArgs" and add this to the end: `'chrome': 'chrome --user-data-dir=%TEMP%\\' + dataDir + ' --disable-web-security',`
