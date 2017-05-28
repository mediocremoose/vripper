'use strict'

const { clipboard, app, powerSaveBlocker } = require('electron')
const store = require('./store')
const TaskManager = require('./TaskManager')
const os = require('os')

const CHECK_DELAY = 100
let nextCheckId
let lastClip
let psbId

function readClip () {
  return clipboard.readText().trim()
}

function checkClipboard () {
  const newClip = readClip()
  if (newClip !== lastClip) {
    lastClip = newClip
    if (TaskManager.addByURL(newClip) && os.platform() == 'darwin') {
      const bounceId = app.dock.bounce('informational')
      setTimeout(() => app.dock.cancelBounce(bounceId), 3000)
    }
  }
  nextCheckId = setTimeout(checkClipboard, CHECK_DELAY)
}

function monitoringSwitch (isOn) {
  if (isOn && !nextCheckId) {
    psbId = powerSaveBlocker.start('prevent-app-suspension')
    lastClip = readClip()
    checkClipboard()
  }

  if (!isOn && nextCheckId) {
    powerSaveBlocker.stop(psbId)
    clearTimeout(nextCheckId)
    nextCheckId = null
  }
}

module.exports.init = () => {
  monitoringSwitch(store.data._.clipboard)
  store.buss.on('change:clipboard', monitoringSwitch)
}
