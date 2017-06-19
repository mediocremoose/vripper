'use strict'

require('./styles/preview.css')
const _ = require('lodash')
const React = require('react')
const path = require('path')
const { shell } = require('electron')
const store = require('./clientStore')
const Progress = require('./Progress')
const PicsList = require('./PicsList')
const isWin32 = (navigator.platform == 'Win32')

class Preview extends React.Component {
  constructor (props) {
    super(props)
    this.renderSummary = this.renderSummary.bind(this)
    this.renderLoading = this.renderLoading.bind(this)
    this.renderAlbum = this.renderAlbum.bind(this)
  }

  openLink (url) {
    shell.openExternal(url)
  }

  openFolder (folder) {
    shell.showItemInFolder(path.resolve(folder))
  }

  getTitle (target) {
    switch (target.type) {
      case 'VGThread': return (
        <span className='preview_vg'>
          <span>ViperGirls.to thread </span>
          <span className='preview_id'>
            <span>№{target.id}</span>
            {!!target.page && <span>/{target.page}</span>}
          </span>
        </span>
      )
      case 'VGPost': return (
        <span className='preview_vg'>
          <span>ViperGirls.to post </span>
          <span className='preview_id'>
            <span>№{target.id}</span>
          </span>
        </span>
      )
      default: return target.title
    }
  }

  onCopyText(e, text){
    e.clipboardData.setData('text/plain', text);
    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard
  }

  renderSummary () {
    const tasks = store._.tasks
    const progress = { pTotal: 0, pDone: 0, pErr: 0 }
    for (let ref of tasks) {
      const task = store[ref]
      progress.pTotal += task.pTotal
      progress.pDone += task.pDone
      progress.pErr += task.pErr
    }
    return (
      <div className='preview_summary'>
        <div className='preview_summary_total'>Tasks: {tasks.length}</div>
        {!!progress.pTotal && <Progress task={progress} />}
      </div>
    )
  }

  renderLoading (target) {
    return (
      <div className='preview_loading'>
        <i className='preview_loading_spinner fa fa-spin fa-spinner fa-5x' />
        <div className='preview_loading_title'>Fetching:</div>
        <div
          className='preview_loading_url'
          onClick={() => this.openLink(target.url)}
        >{target.url}</div>
      </div>
    )
  }

  renderAlbum (target) {
    const pics = target.$sub ? _.flatten(target.$sub.map((ref) => {
      const sub = store[ref]
      return sub.$sub ? sub.$sub.map((ref) => store[ref]) : sub
    })) : target.pics
    return (
      <div className='preview_album'>
        <div className='preview_album_info'>
          <div
            className='preview_album_info_id'
            title={'Open: ' + target.url}
            onCopy={e => this.onCopyText(e, target.url)}
            onClick={() => this.openLink(target.url)}
          >
            <i className='fa fa-2x fa-link' />
            <div className='preview_album_info_id_val'>
              {this.getTitle(target)}
            </div>
          </div>
          {(target.pDone > 0) &&
            <div
              className='preview_album_info_folder'
              title={'Open: ' + target.dest}
              onCopy={e => this.onCopyText(e, target.dest)}
              onClick={() => this.openFolder(target.dest)}
            >
              <i className='fa fa-2x fa-folder-open-o' />
              <div className='album_info_folder_name'>
                {_.last(target.dest.split(isWin32 ? '\\' : '/'))}
              </div>
            </div>
          }
        </div>
        <PicsList pics={pics} task={target.$id}/>
      </div>
    )
  }

  render () {
    const target = store[this.props.target]
    let content
    if (!target) {
      content = this.renderSummary()
    } else if (target.$$preloading) {
      content = this.renderLoading(target)
    } else {
      content = this.renderAlbum(target)
    }
    return (
      <div className='preview'>
        {content}
      </div>
    )
  }
}

module.exports = Preview
