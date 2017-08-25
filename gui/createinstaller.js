const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
     .then(createWindowsInstaller)
     .catch((error) => {
     console.error(error.message || error)
     process.exit(1)
 })

function getInstallerConfig () {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'builds')

    return Promise.resolve({
       appDirectory: path.join(outPath, 'star-trek-timelines-tool-win32-x64'),
       authors: 'IAmPicard',
       noMsi: false,
       outputDirectory: path.join(outPath, 'windows-installer'),
       exe: 'star-trek-timelines-tool.exe',
       setupExe: 'star-trek-timelines-tool-installer.exe'
   })
}