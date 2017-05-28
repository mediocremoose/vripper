'use strict'

const _ = require('lodash')
const AbstractWorker = require('./AbstractWorker')
const ImgWorker = require('./ImgWorker')
const WorkerRegistry = require('../WorkerRegistry')
const save = require('../tools/save')
const store = require('../store')
const settings = store.data._

const makeFilePrefix = (index, total) => {
  const len = ('' + total).length
  return _.padStart(index + 1 + '', len, '0') + ' - '
}

class AbstractAlbumWorker extends AbstractWorker {
  static get type () { return 'AbstractAlbum' }

  static beforeCreate (task) {
    super.beforeCreate(task)
    Object.assign(task, this.parseURL(task.url))
  }

  static afterPreload (task, pics) {
    return store.updateItem(task, {
      pDone: 0,
      pErr: 0,
      pTotal: pics.length,
      dest: save.makePath(settings.root,
        [this.makeFolderName(task)]),
      $sub: pics.map((pic, index) => {
        const prefix = makeFilePrefix(index, pics.length)
        return ImgWorker.create({
          $parent: task.$id,
          src: pic.src,
          name: pic.name,
          prefix: prefix
        }).$id
      })
    })
  }

  static load (task) {
    if (Array.isArray(task.$sub)) {
      for (let $subId of task.$sub) {
        setImmediate(() => WorkerRegistry.forId($subId).start(store.getItem($subId)))
      }
    }
  }
}

module.exports = AbstractAlbumWorker
