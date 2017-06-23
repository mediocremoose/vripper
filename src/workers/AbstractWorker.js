'use strict'

const WorkerRegistry = require('../WorkerRegistry')
const store = require('../store')
const settings = store.data._

/**
 * Task workflow
 * beforeCreate -> create -> prepare ->
 */
class AbstractWorker {
  static get type () { return 'Abstract' }

  static parseURL () {
    return { err: 'redefine!' }
  }

  static makeUID (url) {
    const parsed = this.parseURL(url)
    if (parsed && !parsed.err) {
      return this.type + JSON.stringify(parsed, (key, val) => {if (val) return val})
    }
  }

  static beforeCreate () {}

  static create (task, ...args) {
    task.type = this.type
    store.addItem(task)
    this.beforeCreate(task, ...args)
    store.notify()
    this.start(task)
    return task
  }

  /**
   * @param {Object} task
   * @param {boolean} [force]
   */
  static start (task, force) {
    // check that task type correspond to the worker
    if (task.type !== this.type) {
      console.warn('wrong task type', task, this.type)
      return
    }

    // start loading if already preloaded
    if (task.isPreloaded) {
      this.load(task, force)
      return
    }

    // check for "double preloading"
    if (!task.$$preloading) {
      store.updateItem(task, {
        $$preloading: true,
        isPreloaded: false
      })
      this.preload(task, force).then((task) => {
        store.updateItem(task, {
          $$preloading: false,
          isPreloaded: true
        })
        if (force || (!task.$parent && settings.autostart)) {
          this.load(task, force)
        }
      }, (err) => {
        throw err
      }).catch((err) => {
        store.updateItem(task, {
          $$preloading: false,
          isPreloaded: false,
          err: err instanceof Error ? { message: err.message } : err
        })
      })
    }
  }

  static preload (task) {
    return Promise.resolve(task)
  }

  static load (task, force) {
    // do nothing, redefine!
  }

  /**
   * @param {number} $id
   */
  static removeById ($id) {
    const task = store.getItem($id)
    if (task) {
      task.$removed = true
      if (Array.isArray(task.$sub)) {
        for (let $subId of task.$sub) {
          WorkerRegistry.forId($subId).removeById($subId)
        }
      }
      store.removeItem($id)
    }
  }

  static initStatCounter () {
    store.buss.on(this.type, (action, subRef) => {
      const post = store.getItem(store.getItem(subRef).$parent)
      const thread = store.getItem(post.$parent)

      if (action === 'sub_done') {
        store.updateItem(post, { pDone: post.pDone + 1 })
        thread && store.updateItem(thread, { pDone: thread.pDone + 1 })
      }

      if (action === 'sub_err') {
        store.updateItem(post, { pErr: post.pErr + 1 })
        thread && store.updateItem(thread, { pErr: thread.pErr + 1 })
      }

      if (action === 'sub_restart') {
        store.updateItem(post, { pErr: post.pErr - 1 })
        thread && store.updateItem(thread, { pErr: thread.pErr - 1 })
      }
    })
  }
}

module.exports = AbstractWorker
