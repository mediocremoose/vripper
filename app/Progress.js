'use strict'

require('./styles/progress.css')
const React = require('react')

class progress extends React.Component {
  render () {
    const { pTotal, pDone, pErr } = this.props.task
    const donePct = (100 * pDone / pTotal)
    const errPct = (100 * pErr / pTotal)
    return (
      <div className='progress'>
        <div className='progress_bar progress_bar--done' style={{ left: 0, width: donePct + '%' }}></div>
        {(pErr > 0) &&
          <div
            className='progress_bar progress_bar--err'
            style={{ left: donePct + '%', width: errPct + '%' }}
          ></div>
        }
        <span className='progress_done'>{pDone}</span>
        {(pErr > 0) && <span> / </span>}
        {(pErr > 0) && <span className='progress_err'>{pErr}</span>}
        <span className='progress_total'> / {pTotal}</span>
      </div>
    )
  }
}

module.exports = progress
