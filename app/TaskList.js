'use strict'

require('./styles/tasks.css')
const _ = require('lodash')
const { ipcRenderer, shell } = require('electron')
const React = require('react')
const cn = require('./cn')
const store = require('./clientStore')
const Progress = require('./Progress')
const isWin32 = (navigator.platform == 'Win32')

class TaskList extends React.Component {
  constructor (props) {
    super(props)

    this.state = {}

    this.onListClick = this.onListClick.bind(this)
    this.onRowClick = this.onRowClick.bind(this)
    this.onRowDoubleClick = this.onRowDoubleClick.bind(this)
    this.onCrossClick = this.onCrossClick.bind(this)
    this.stopEvent = this.stopEvent.bind(this)
    this.getRowContent = this.getRowContent.bind(this)
  }

  onListClick () {
    this.props.setPreview(null)
  }

  onRowClick (e, task) {
    e.stopPropagation()
    this.props.setPreview(task.$id)
  }

  onRowDoubleClick (e, task) {
    e.stopPropagation()
    task.dest && shell.showItemInFolder(task.dest)
  }

  onToggleClick (e, task) {
    e.stopPropagation()
    this.setState({
      ['e' + task.$id]: !this.state['e' + task.$id]
    })
  }

  onCrossClick (e, task) {
    e.stopPropagation()
    ipcRenderer.send('TaskManager.remove', task.$id)
  }

  onRefreshClick (e, task) {
    e.stopPropagation()
    ipcRenderer.send('TaskManager.start', task.$id)
  }

  stopEvent (e) {
    e.stopPropagation()
  }

  getHead () {
    return (
      <div className='tasks_head'>
        <div className='tasks_head_item'>Title</div>
        <div className='tasks_head_item'>Progress</div>
        <div className='tasks_head_item'></div>
      </div>
    )
  }

  getRowContent (ref) {
    const task = store[ref]
    const isExpanded = this.state['e' + task.$id]
    const hasProgress = !task.$$preloading && task.pTotal > 0
    const title = task.$$preloading
      ? `loading: ${task.url}`
      : (task.isPreloaded ? (task.title || _.last(task.dest.split(isWin32 ? '\\' : '/'))) : task.url)

    return [
      <div
        className='tasks_row'
        key={task.$id}
        onClick={(e) => this.onRowClick(e, task)}
        onDoubleClick={(e) => this.onRowDoubleClick(e, task)}
      >
        <div className='tasks_row_item'>
          {task.uiExpand &&
            <div
              className='tasks_row_item_toggle'
              onClick={(e) => this.onToggleClick(e, task)}
              onDoubleClick={this.stopEvent}
            >
              <i className={cn('fa', {'chevron-down': !isExpanded, 'chevron-right': isExpanded}, '-')} />
            </div>
          }
          <div className={cn('tasks_row_item_title', { sub: task.$parent })} title={title}>{title}</div>
        </div>
        <div className='tasks_row_item'>
          {hasProgress && <Progress task={task}/>}
        </div>
        <div className='tasks_row_item'>
          {!task.$parent &&
            <i
              className='fa fa-remove'
              onClick={(e) => this.onCrossClick(e, task)}
              onDoubleClick={this.stopEvent}
              title='remove from list'
            />
          }
          {!task.$$preloading &&
            <i
              className='fa fa-refresh'
              onClick={(e) => this.onRefreshClick(e, task)}
              onDoubleClick={this.stopEvent}
              title='restart task'
            />
          }
        </div>
      </div>
    ].concat(task.uiExpand && isExpanded && task.$sub.map(this.getRowContent))
  }

  render () {
    const refs = store._.tasks
    return (
      <div className='tasks' onClick={this.onListClick}>
        {this.getHead()}
        <div className='tasks_list'>
          <div className='tasks_list_content'>
            {refs.map(this.getRowContent)}
          </div>
        </div>
      </div>
    )
  }
}

module.exports = TaskList
