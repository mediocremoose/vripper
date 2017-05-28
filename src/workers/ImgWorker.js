'use strict'

const AbstractWorker = require('./AbstractWorker')
const store = require('../store')
const download = require('../tools/download')
const save = require('../tools/save')
const settings = store.data._

class ImgWorker extends AbstractWorker {
  static get type () { return 'Img' }

  static load (task, force) {
    // already loading
    if (task.$$loading) {
      return
    }

    // already saved
    if (!force && task.file) {
      return
    }

    const parent = store.getItem(task.$parent)

    // notify parent task that it restarts
    if (task.err && parent) {
      store.buss.emit(parent.type, 'sub_restart', task.$id)
    }

    store.updateItem(task, {
      $$loading: true,
      err: null
    })

    download({
      url: task.src
    }).then((file) => {
      task.name = task.name || file.name
      // ensure extension
      if (file.ext && !/\.\w{3,5}$/.test(task.name)) {
        task.name += '.' + file.ext
      }

      return save({
        prefix: settings.prefixFile ? task.prefix : '',
        name: task.name,
        data: file.data
      }, task.dest || parent.dest)
    }).then((filePath) => {
      parent && store.buss.emit(parent.type, 'sub_done', task.$id)
      return store.updateItem(task, {
        $$loading: false,
        isSaved: true,
        file: filePath
      })
    }, (err) => {
      throw err
    }).catch((err) => {
      // console.error(err)
      parent && store.buss.emit(parent.type, 'sub_err', task.$id)
      store.updateItem(task, {
        $$loading: false,
        err: err instanceof Error ? { message: err.message } : err
      })
    })
  }
}

module.exports = ImgWorker
