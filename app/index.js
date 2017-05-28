'use strict'

const React = require('react')
const ReactDOM = require('react-dom')
const App = require('./App')
const store = require('./clientStore')
const { remote } = require('electron')

const root = document.getElementById('root')
const render = () => {
  ReactDOM.render(<App />, root)
}

render()
store.buss.on('update', render)

// context menu
const InputMenu = remote.Menu.buildFromTemplate([
  { label: 'Undo', role: 'undo' },
  { label: 'Redo', role: 'redo' },
  { type: 'separator' },
  { label: 'Cut', role: 'cut' },
  { label: 'Copy', role: 'copy' },
  { label: 'Paste', role: 'paste' },
  { type: 'separator' },
  { label: 'Select all', role: 'selectall' }
])

document.body.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  e.stopPropagation()
  InputMenu.popup(remote.getCurrentWindow())
})
