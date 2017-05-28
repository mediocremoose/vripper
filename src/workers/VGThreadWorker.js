'use strict'

const AbstractWorker = require('./AbstractWorker')
const VGPostWorker = require('./VGPostWorker')
const ViperGirls = require('../rippers/ViperGirls')
const save = require('../tools/save')
const store = require('../store')
const settings = store.data._

function makeThreadDest (id, page, title) {
  page = page ? '_' + page : ''
  const prefix = settings.prefixThread ? `vg${id}${page} ` : ''
  return save.makePath(store.data._.root, [prefix + title])
}

function makePostDest (onePost, threadDest, index, title) {
  if (onePost || !settings.subfolders) {
    return threadDest
  }
  const prefix = `post ${index} - `
  const placeholder = `post ${index}`
  if (!title) {
    return save.makePath(threadDest, [placeholder])
  }
  if (settings.prefixPost) {
    return save.makePath(threadDest, [prefix + title])
  } else {
    return save.makePath(threadDest, [title])
  }
}

class VGThreadWorker extends AbstractWorker {
  static get type () { return 'VGThread' }

  static parseURL (url) {
    const parsedURL = ViperGirls.parseURL(url)
    return parsedURL.threadId
      ? { id: parsedURL.threadId, page: parsedURL.pageId }
      : { err: true }
  }

  static preload (task) {
    return ViperGirls.load(task.url).then((thread) => {
      const onePost = thread.posts.length === 1
      const dest = makeThreadDest(task.id, task.page, thread.title)
      let total = 0

      // create subtasks
      const posts = thread.posts.map((post) => {
        total += post.pics.length
        return VGPostWorker.create({
          $parent: task.$id,
          title: post.title,
          id: post.id,
          index: post.index,
          thanks: post.thanks,
          url: ViperGirls.makePostURL(post.id),
          dest: makePostDest(onePost, dest, post.index, post.title)
        }, post.pics).$id
      })

      return store.updateItem(task, {
        $sub: posts,
        title: thread.title,
        id: thread.id,
        page: thread.page,
        uiExpand: !onePost,
        pTotal: total,
        pDone: 0,
        pErr: 0,
        dest: dest,
        onePost: onePost
      })
    })
  }

  static load (task) {
    if (Array.isArray(task.$sub)) {
      for (let $subId of task.$sub) {
        setImmediate(() => VGPostWorker.start(store.getItem($subId)))
      }
    }
  }
}

module.exports = VGThreadWorker
