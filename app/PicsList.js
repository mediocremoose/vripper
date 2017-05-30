'use strict'

require('./styles/pics.css')
const _ = require('lodash')
const React = require('react')
const { shell } = require('electron')
const cn = require('./cn')
const isWin32 = (navigator.platform == 'Win32')

const PAGE_SIZE = 100

class PicsList extends React.Component {
  constructor (props) {
    super(props)
    this.state = { page: 0 }
  }

  componentWillReceiveProps (newProps) {
    if (newProps.task !== this.props.task ||
        newProps.pics.length !== this.props.pics.length) {
      this.setState({ page: 0 })
    }
  }

  makePicName (pic) {
    const prefix = pic.prefix || ''
    if (pic.file) {
      return prefix + (pic.name || _.last(pic.file.split('/')))
    }
    if (pic.err) {
      const errorMsg = pic.err.err?((typeof pic.err.err == 'object')?pic.err.err.code+(pic.err.options.url?': '+pic.err.options.url:''):pic.err.err):null;
      return prefix + (pic.err.message || errorMsg || pic.err || 'Error')
    }
    return prefix + pic.origin
  }

  onPickDoubleClick (pic) {
    if (pic.file) {
      shell.showItemInFolder(pic.file)
    } else {
      shell.openExternal(pic.origin || pic.src)
    }
  }

  onPickCopy(e, pic){
    e.clipboardData.setData('text/plain', JSON.stringify(pic,null,'  '));
    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard
  }

  pageLeft () {
    this.setState({ page: this.state.page - 1 })
  }

  pageRight () {
    this.setState({ page: this.state.page + 1 })
  }

  render () {
    const { pics } = this.props
    const { page } = this.state
    const pagination = pics.length > PAGE_SIZE
    const pageL = page > 0
    const pageR = pics.length > PAGE_SIZE * (page + 1)
    return (
      <div className='pics'>
        {pagination &&
          <div className='pics_pagination'>
            <div className='pics_pagination_page'>{page + 1}</div>
            {pageL && <div className='pics_pagination_arrow pics_pagination_arrow--left' onClick={this.pageLeft.bind(this)}>&lt;</div>}
            {pageR && <div className='pics_pagination_arrow pics_pagination_arrow--right' onClick={this.pageRight.bind(this)}>&gt;</div>}
          </div>
        }
        <div className={cn('pics_items', { pagination })}>
          {_.map(pics.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), (pic, index) => {
            const name = this.makePicName(pic)
            return (
              <div
                className={cn('pics_item', { err: pic.err, saved: pic.file })}
                onDoubleClick={() => this.onPickDoubleClick(pic)}
                onCopy={e => this.onPickCopy(e, pic)}
                title={name}
                key={index}
              >{name}</div>
            )
          })}
        </div>
      </div>
    )
  }
}

module.exports = PicsList
