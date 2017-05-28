'use strict'

require('./styles/new-task.css')
const React = require('react')
const { ipcRenderer } = require('electron')

class NewTaskForm extends React.Component {
  constructor (props) {
    super(props)
    this.onFormSubmit = this.onFormSubmit.bind(this)
  }

  onFormSubmit (e) {
    e.preventDefault()
    if (this.refs.newUrl.value) {
      ipcRenderer.send('TaskManager.addByURL', this.refs.newUrl.value)
      this.refs.newUrl.value = ''
    }
  }

  render () {
    return (
      <div className='new-task-container'>
        <form className='new-task' onSubmit={this.onFormSubmit}>
          <input
            className='new-task_url'
            type='text'
            ref='newUrl'
            placeholder='http://'
            title='new task url. press ENTER to add'
            autoFocus
          />
        </form>
        <button className='new-task_bulk actions_btn' onClick={this.props.toggleImportDialogue}>
          Bulk Import <i className='fa fa-upload' />
        </button>
      </div>
    )
  }
}

module.exports = NewTaskForm
