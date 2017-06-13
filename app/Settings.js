'use strict'

require('./styles/settings.css')
const React = require('react')
const cn = require('./cn')
const dialog = require('electron').remote.dialog
const { ipcRenderer } = require('electron')
const { remote } = require('electron')
const versionRe = /^(\d\.)?(\d)(\.)?(\d)$/g
const currentVersion = require('electron').remote.app.getVersion().replace(versionRe, '$1$2$4')
const updater = remote.require('electron-simple-updater')

class Settings extends React.Component {
  constructor (props) {
    super(props)
    this.changeRoot = this.changeRoot.bind(this)
    this.onDeleteVGCookiesCLick = this.onDeleteVGCookiesCLick.bind(this)
    this.makeCheckbox = this.makeCheckbox.bind(this)
    this.getDownloadRoot = this.getDownloadRoot.bind(this)
    this.onAutoThanksChange = this.onAutoThanksChange.bind(this)
  }

  onAutoThanksChange (newValue) {
    const cookies = this.props.data.vgCookies
    if (newValue && (!cookies || !cookies.length)) {
      ipcRenderer.send('autothanks.openAuth')
    } else {
      this.props.update('autothanks', newValue)
    }
  }

  onDeleteVGCookiesCLick () {
    this.props.update('autothanks', false)
    this.props.update('vgCookies', null)
  }

  changeRoot () {
    dialog.showOpenDialog({
      title: 'Saving location',
      defaultPath: this.props.data.root,
      properties: ['openDirectory']
    }, (files) => {
      if (files && files[0]) {
        this.props.update('root', files[0])
      }
    })
  }

  makeCheckbox (field, label, onChange) {
    onChange = onChange ||
      ((newValue) => this.props.update(field, newValue))
    return (
      <label className='settings_check' htmlFor={field}>
        <input
          className='settings_check_input'
          id={field}
          type='checkbox'
          checked={this.props.data[field]}
          onChange={(e) => { e.preventDefault(); onChange(!this.props.data[field]) }}
        />
        <span className='settings_check_text'>{label}</span>
      </label>
    )
  }

  getDownloadRoot () {
    return (
      <div className='settings_root'>
        <div className='settings_root_title'>Download location:</div>
        <div className='settings_root_wrap'>
          <input
            className='settings_root_val'
            type='text'
            value={this.props.data.root}
            readOnly
          />
          <button
            className='settings_root_set'
            onClick={this.changeRoot.bind(this)}
          >Change</button>
        </div>
      </div>
    )
  }

  updateCheck () {
    updater.checkForUpdates()
  }

  getVersion () {
    return (
      <div className='settings_version'>
        <label>Current version: <span id="version">v{currentVersion}</span></label>
        <div className='settings_version_wrap'>
          <button
            className='update_check'
            onClick={this.updateCheck.bind(this)}
          >Check for Update</button>
        </div>
      </div>
    )
  }

  render () {
    const { isToggled, toggle, data } = this.props
    return (
      <div className={cn('settings', { toggled: isToggled })}>
        <button className='settings_toggle' onClick={toggle}>
          {isToggled
            ? <span><i className='fa fa-minus-square-o'/> HIDE SETTINGS</span>
            : <span><i className='fa fa-plus-square-o'/> OPEN SETTINGS</span>
          }
        </button>
        {isToggled &&
          <div className='settings_main'>
            {this.makeCheckbox('autostart', 'Autostart downloading')}
            {this.makeCheckbox('autothanks', 'Autothanks', this.onAutoThanksChange)}
            {!!data.autothanks &&
              <button onClick={this.onDeleteVGCookiesCLick}>delete vipergirls cookies</button>
            }
            {this.makeCheckbox('originalName', 'Search for original filename')}
            {this.makeCheckbox('prefixFile', 'Prefix images (012 - )')}
            {this.makeCheckbox('prefixMain', 'Prefix task folder (vg1234)')}
            {this.makeCheckbox('subfolders', 'Make subfolders for posts')}
            {!!data.subfolders &&
              this.makeCheckbox('prefixSub', 'Prefix subfolders (post 7 - )')}
            {this.makeCheckbox('ignoreDouble', 'Ignore duplicate tasks')}
            {this.getDownloadRoot()}
            {this.getVersion()}
          </div>
        }
      </div>
    )
  }
}

module.exports = Settings
