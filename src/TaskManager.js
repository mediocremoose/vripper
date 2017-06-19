'use strict'

const _ = require('lodash')
const store = require('./store')
const registry = require('./WorkerRegistry')
const settings = store.data._

_.defaults(store.data._, { tasks: [] })
const tasks = store.data._.tasks

const tasksByUID = tasks.reduce((res, ref) => {
  res[store.getItem(ref).uid] = ref
  return res
}, {})

function withTasks (listOfTasks, callback) {
  if (listOfTasks) {
    if (!Array.isArray(listOfTasks)) {
      listOfTasks = [listOfTasks]
    }
    for (let task of listOfTasks) {
      if (task) {
        const $id = task.$id || task
        task = store.getItem($id)
        setImmediate(() => callback(task))
      }
    }
  }
}

class TaskManager {
  /**
   * Try to create task from URL
   * @param {string} url - http://url or vr:url
   * @returns {?Object}
   */
  static addByURL (url) {
    // fix url if it's missing protocol
    if (!_.startsWith(url, 'vr:') && !/^https?:\/\//.test(url)) {
      url = 'http://' + url
    }
    for (let worker of registry.workers) {
      const uid = worker.makeUID(url)
      if (!uid) {
        continue
      }

      if (tasksByUID[uid]) {
        console.log('duplicate task', url)
        if (settings.ignoreDouble) return null
      }

      const newTask = worker.create({
        url, uid,
        added: Date.now()
      })
      if (newTask) {
        console.log('new task', url)
        tasks.unshift(newTask.$id)
        tasksByUID[uid] = newTask.$id
        store.notify()
        return newTask
      }
    }
  }

  static bulkImportUrls (urls) {
    urls.forEach(function (url) {
      TaskManager.addByURL(url);
    });
  }

  /**
   * Remove single task
   * @param {Object|number} taskOrId
   */
  static remove (taskOrId) {
    withTasks(taskOrId, (task) => {
      delete tasksByUID[task.uid]
      const taskIndex = tasks.indexOf(task.$id)
      if (taskIndex > -1) {
        tasks.splice(taskIndex, 1)
      }
      registry.workersByType[task.type].removeById(task.$id)
      store.notify()
    })
  }

  /**
   * Start single task
   * @param {Object|number} taskOrId
   * @param {boolean} [force]
   */
  static start (taskOrId, force) {
    withTasks(taskOrId, (task) => {
      registry.workersByType[task.type].start(task, force)
    })
  }

  /**
   * Start all tasks
   */
  static startAll () {
    withTasks(Array.from(tasks).reverse(), (task) => {
      registry.workersByType[task.type].start(task)
    })
  }

  /**
   * Remove finished tasks with less than 3 errors
   */
  static clearDone () {
    withTasks(tasks, (task) => {
      if (task.isPreloaded && task.pDone > task.pTotal - 3) {
        this.remove(task.$id)
      }
    })
  }
}

module.exports = TaskManager
