'use strict'

const _ = require('lodash')
const AbstractWorker = require('./AbstractWorker')
const save = require('../tools/save')
const ViperGirls = require('../rippers/ViperGirls')
const ImgHostingWorker = require('./ImgHostingWorker')
const ImgWorker = require('./ImgWorker')
const WorkerRegistry = require('../WorkerRegistry')
const store = require('../store')
const settings = store.data._

const makeFilePrefix = (index, total, postIndex) => {
  const prefix = settings.subfolders ? '' : postIndex + '_'
  const len = ('' + total).length
  return prefix + _.padStart(index + 1 + '', len, '0') + ' - '
}

function makeDest (id, title) {
  const prefix = settings.prefixMain ? `vgp${id} ` : ''
  return save.makePath(store.data._.root, [prefix + title])
}

function makeSub (task, pics) {
  task.pTotal = pics.length
  task.pDone = 0
  task.pErr = 0
  return pics.map((pic, index) => {
    const prefix = makeFilePrefix(index, pics.length, task.index)
    if (pic.length === 2) {
      return ImgHostingWorker.create({
        $parent: task.$id,
        origin: pic[0],
        thumb: pic[1],
        prefix
      }).$id
    } else {
      return ImgWorker.create({
        $parent: task.$id,
        src: pic,
        prefix
      }).$id
    }
  })
}

class VGPostWorker extends AbstractWorker {
  static get type () { return 'VGPost' }

  static parseURL (url) {
    const parsedURL = ViperGirls.parseURL(url)
    return parsedURL.postId
      ? { id: parsedURL.postId }
      : { err: true }
  }

  static preload (task) {
    if (task.$parent) {
      return super.preload(task)
    }
    return ViperGirls.load(task.url).then((post) => {
      store.updateItem(task, {
        title: post.title,
        id: post.id,
        index: post.index,
        dest: makeDest(post.id, post.title),
        thanks: post.thanks
      })
      return store.updateItem(task, {
        $sub: makeSub(task, post.pics)
      })
    })
  }

  static beforeCreate (task, pics) {
    if (pics) {
      task.$sub = makeSub(task, pics)
    }
  }

  static load (task) {
    // start subtasks
    if (Array.isArray(task.$sub)) {
      for (let $subId of task.$sub) {
        setImmediate(() => {
          WorkerRegistry.forId($subId).start(store.getItem($subId))
        })
      }
    }
    // say thanks to post
    if (settings.autothanks && task.thanks) {
      ViperGirls.thanks(task.thanks)
    }
  }
}

VGPostWorker.initStatCounter()

module.exports = VGPostWorker
