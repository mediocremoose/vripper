'use strict'

const _ = require('lodash')
const qRequest = require('../tools/qRequest')
const AbstractAlbumWorker = require('./AbstractAlbumWorker')
const store = require('../store')
const settings = store.data._

const threadRe = /boards\.4chan\.org\/([\w\d]+)\/thread\/(\d+)/i

class Chan4Worker extends AbstractAlbumWorker {
  static get type () { return 'Chan4' }

  static parseURL (url) {
    const match = threadRe.exec(url)
    if (!match || !match[1] || !match[2]) {
      return { err: 'not a thread url ' + url }
    }
    return {
      board: match[1],
      id: match[2]
    }
  }

  static makeFolderName (task) {
    const prefix = settings.prefixMain ? '4chan ' : ''
    const subject = task.subject ? ' ' + task.subject : ''
    return prefix + task.board + task.id + subject
  }

  static preload (task) {
    return qRequest({
      url: `http://a.4cdn.org/${task.board}/thread/${task.id}.json`,
      json: true
    }).then((resp) => {
      const posts = resp.body.posts
      const pics = _.compact(posts.map((post) => {
        if (post.tim && post.fsize > 11000) {
          return {
            src: `http://i.4cdn.org/${task.board}/${post.tim}${post.ext}`,
            name: (settings.originalName ? post.filename : post.tim) + post.ext
          }
        }
      }))
      task.subject = posts[0].sub || ''
      task.title = `4chan /${task.board}/${task.id} ${task.subject}`
      return this.afterPreload(task, pics)
    })
  }
}

Chan4Worker.initStatCounter()

module.exports = Chan4Worker
