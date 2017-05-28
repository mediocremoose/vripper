'use strict'

const store = require('./store')
const qRequest = require('./tools/qRequest')
const { app, BrowserWindow } = require('electron')
const settings = store.data._

const URL = 'https://vipergirls.to/login.php'

let promptWindow

function storeToJar () {
  if (settings.vgCookies && settings.vgCookies.length) {
    settings.vgCookies.forEach((cookie) => {
      try {
        qRequest.jar.setCookie(cookie, URL)
      } catch (e) { }
    })
  }
}

function jarToStore () {
  const vgCookies = qRequest.jar.getCookies(URL)
  let vgLoggedIn = false
  for (let cookie of vgCookies) {
    if (cookie.key === 'vg_userid') {
      vgLoggedIn = true
      break
    }
  }
  if (vgLoggedIn) {
    store.update({
      vgCookies: vgCookies.map((cookie) => cookie.toString())
    })
  }
}

function auth (credentials) {
  return qRequest({
    url: URL,
    method: 'POST',
    formData: {
      do: 'login',
      vb_login_username: credentials.login,
      vb_login_password: credentials.pass,
      cookieuser: 1
    }
  }).then(() => {
    jarToStore()
    if (settings.vgCookies && settings.vgCookies.length) {
      store.update({ autothanks: true })
      promptWindow.webContents.send('allGood')
    } else {
      promptWindow.webContents.send('allBad')
    }
  }, (err) => {
    console.log(err)
    promptWindow.webContents.send('allBad')
  })
}

function openAuth () {
  promptWindow = new BrowserWindow({
    width: 300,
    height: 200,
    show: false,
    resizable: false,
    alwaysOnTop: true,
    title: 'ViperGirls authentication'
  })
  promptWindow.loadURL(`file://${app.getAppPath()}/app/auth.html`)
  promptWindow.show()
  promptWindow.on('closed', () => {
    promptWindow = null
  })
}

function init () {
  storeToJar()
}

module.exports = {
  init,
  openAuth,
  auth
}
