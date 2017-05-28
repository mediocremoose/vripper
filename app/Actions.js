'use strict'

require('./styles/actions.css')
const ipcRenderer = require('electron').ipcRenderer
const React = require('react')
const cn = require('./cn')
const store = require('./clientStore')

class Actions extends React.Component {
  constructor (props) {
    super(props)
    this.onClipboardClick = this.onClipboardClick.bind(this)
    this.onResumeAllClick = this.onResumeAllClick.bind(this)
    this.onClearAllClick = this.onClearAllClick.bind(this)
  }

  onResumeAllClick () {
    ipcRenderer.send('TaskManager.startAll')
  }

  onClearAllClick () {
    ipcRenderer.send('TaskManager.clearDone')
  }

  onClipboardClick () {
    store.setData('clipboard', !store._.clipboard)
  }

  render () {
    return (
      <div className='actions'>
        <button
          className={cn('actions_btn', { 'clip': true, 'clip_on': store._.clipboard })}
          onClick={this.onClipboardClick}
        >
          <i className='fa fa-copy' />
          { store._.clipboard
            ? <span> Stop Clipboard Monitoring</span>
            : <span> Start Clipboard Monitoring</span>
          }
        </button>
        <button className='actions_btn' onClick={this.onResumeAllClick}>
          <i className='fa fa-play' /> Start/Resume All Tasks
        </button>
        <button className='actions_btn' onClick={this.onClearAllClick}>
          <i className='fa fa-trash-o' /> Clear All Successful Tasks
        </button>
      </div>
    )
  }
}

module.exports = Actions
