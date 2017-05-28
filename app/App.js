'use strict'

require('./styles/app.css')
const React = require('react')
const cn = require('./cn')
const store = require('./clientStore')
const NewTaskForm = require('./NewTaskForm')
const TaskList = require('./TaskList')
const Actions = require('./Actions')
const Settings = require('./Settings')
const Preview = require('./Preview')
const Modal = require('./Modal')
const BulkImportForm = require('./BulkImportForm')

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      fullSettings: false,
      preview: null,
      importDialogue: false
    }
    this.setPreview = this.setPreview.bind(this)
    this.toggleSettings = this.toggleSettings.bind(this)
    this.toggleImportDialogue = this.toggleImportDialogue.bind(this)
  }

  toggleSettings () {
    this.setState({
      fullSettings: !this.state.fullSettings
    })
  }

  setPreview (target) {
    this.setState({
      preview: target,
      fullSettings: false
    })
  }

  toggleImportDialogue () {
    this.setState({
      importDialogue: !this.state.importDialogue
    })
  }

  render () {
    return (
      <div className='app'>
        <div className='app_main'>
          <div className='app_main_controls'>
            <NewTaskForm
              toggleImportDialogue={this.toggleImportDialogue}
            />
          </div>
          <div className='app_main_tasks'>
            <TaskList setPreview={this.setPreview} />
          </div>
          <div className='app_main_actions'>
            <Actions />
          </div>
        </div>
        <div className='app_side'>
          <div className={cn('app_side_settings', { expanded: this.state.fullSettings })}>
            <Settings
              isToggled={this.state.fullSettings}
              toggle={this.toggleSettings}
              data={store._}
              update={store.setData}
            />
          </div>
          {!this.state.fullSettings &&
            <div className='app_side_preview'>
              <Preview target={this.state.preview} />
            </div>
          }
        </div>
        <Modal
          toggleVisibility={this.toggleImportDialogue}
          visible={this.state.importDialogue} >
          <BulkImportForm importUrls={this.importUrls} />
        </Modal>
      </div>
    )
  }
}

module.exports = App
