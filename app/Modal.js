'use strict'

require('./styles/modal.css')
const React = require('react')
const cn = require('./cn')

class Modal extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div
        className={cn('app_modal', { visible: this.props.visible })}
        onClick={this.props.toggleVisibility}>
        {this.props.visible &&
          this.props.children
        }
      </div>
    )
  }
}

module.exports = Modal
