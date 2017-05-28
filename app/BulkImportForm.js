'use strict'

require('./styles/bulk-import.css')
const React = require('react')

const { ipcRenderer } = require('electron')

class BulkImportDialogue extends React.Component {
  constructor (props) {
    super(props)
    this.onImportClick = this.onImportClick.bind(this)
  }

  onImportClick () {
    const rawText = this.refs.urls.value
    const urls = rawText.length > 0 ? rawText.split("\n") : []
    if (urls.length > 0)
      ipcRenderer.send('TaskManager.bulkImportUrls', urls)
    // because clicks propagate to the parent, clicking import automagically
    // hides the modal
  }

  // however, we don't want this behavior when the user is trying to add urls
  stopClickthruAndSelect (e) {
    e.stopPropagation()
    e.target.select()
  }

  render () {
    const { importUrls } = this.props
    return (
      <div className='import-dialogue'>
        <textarea
          ref='urls'
          onClick={this.stopClickthruAndSelect}
          defaultValue={'Insert urls one per line.\nClick the background to go back.'} >
        </textarea>
        <button type='submit' onClick={this.onImportClick}>Import</button>
      </div>
    )
  }
}

module.exports = BulkImportDialogue
