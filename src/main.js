'use strict'

const DEBUG = process.env.NODE_ENV === 'dev'

if (DEBUG) {
  process.on('unhandledRejection', (reason, err) => {
    console.error('unhandledRejection', err)
  })
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException', err)
  })
}

const path = require('path')
const debounce = require('lodash/debounce')
const defaults = require('lodash/defaults')
const updater = require('electron-simple-updater')
const dialog = require('electron').dialog

updater.on('update-available', (meta) => {
  var choice = dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    title: 'Update Available',
    message: 'A new update is available. Do you wish to download it?'
  });
  if (choice == 0) {
    dialog.showMessageBox({
      type: 'info',
      title: 'Download Update',
      buttons: ['Ok'],
      message: 'The update will begin downloading in the background after closing this prompt.\n\nPlease be patient.'
    });
    updater.downloadUpdate();
  }
});

updater.on('update-not-available', (meta) => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Ok'],
    title: 'No Update Available',
    message: 'No update is available at this time.'
  });
});

updater.on('update-downloaded', (meta) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Downloaded',
    buttons: ['Ok'],
    message: 'VRipper X will now restart to apply the new update.'
  });
  updater.quitAndInstall();
});

updater.on('error', (err) => {
  dialog.showMessageBox({
    type: 'error',
    title: 'Update Failed',
    buttons: ['Ok'],
    message: err
  });
});

updater.init({
  checkUpdateOnStart: false,
  autoDownload: false
});

/** @type {Electron} */
const electron = require('electron')
/** @type {Electron.App} */
const app = electron.app
/** @type {Electron.IPCMain} */
const ipcMain = electron.ipcMain
const BrowserWindow = electron.BrowserWindow

// configure store
const store = require('./store')
const defaultRoot = path.resolve(app.getPath('home'), 'VRipper X')
defaults(store.data._, {
  root: defaultRoot,
  defaultRoot: defaultRoot,
  clipboard: false,
  autostart: true,
  originalName: false,
  prefixMain: false,
  prefixSub: false,
  prefixFile: true,
  subfolders: true,
  vgCookies: null
})
store.update({ debug: DEBUG })

const TaskManager = require('./TaskManager')
const clipboardMonitoring = require('./clipboardMonitoring')
const menu = require('./menu')
const autothanks = require('./autothanks')
if (DEBUG) {
  const test = require('../test/hostings.js') // Runs automated tests against hosts - output is printed to the terminal
}

function initApp () {
  if (DEBUG) {
    menu.setMenu()
  }

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'VRipper X',
    titleBarStyle: 'hidden'
  })
  mainWindow.loadURL(`file://${app.getAppPath()}/app/index.html`)

  DEBUG && mainWindow.webContents.openDevTools()

  ipcMain.on('store.data', (event) => { event.returnValue = store.data })
  ipcMain.on('store.update', (event, update) => store.update(update))

  ipcMain.on('TaskManager.addByURL', (event, url) => TaskManager.addByURL(url))
  ipcMain.on('TaskManager.bulkImportUrls', (event, urls) => TaskManager.bulkImportUrls(urls))
  ipcMain.on('TaskManager.remove', (event, taskId) => TaskManager.remove(taskId))
  ipcMain.on('TaskManager.start', (event, taskId, force) => TaskManager.start(taskId, force))
  ipcMain.on('TaskManager.startAll', (event) => TaskManager.startAll())
  ipcMain.on('TaskManager.clearDone', (event) => TaskManager.clearDone())

  ipcMain.on('autothanks.openAuth', (event) => autothanks.openAuth())
  ipcMain.on('autothanks.auth', (event, credentials) => autothanks.auth(credentials))

  store.buss.on('change', debounce(() => {
    mainWindow.webContents.send('update', store.getChanges())
  }, 100))

  clipboardMonitoring.init()
  autothanks.init()
}

app.on('ready', initApp)
app.on('open-url', (event, url) => {
  event.preventDefault()
  TaskManager.addByURL(url)
})
app.on('window-all-closed', () => app.quit())
