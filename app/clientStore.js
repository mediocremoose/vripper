'use strict'

/** @type {Electron.IpcRenderer} */
const ipcRenderer = require('electron').ipcRenderer
const EventEmitter = require('events')
const store = ipcRenderer.sendSync('store.data')
const buss = new EventEmitter()
const DEBUG = store._.debug

const setData = (field, value) => {
  ipcRenderer.send('store.update', { [field]: value })
}

ipcRenderer.on('update', (event, update) => {
  DEBUG && console.log(update)
  Object.assign(store, update)
  buss.emit('update')
})

module.exports = store
module.exports.setData = setData
module.exports.buss = buss

DEBUG && console.log(store)
