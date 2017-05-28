'use strict'

const EventEmitter = require('events')
const path = require('path')
const fs = require('fs')
const zlib = require('zlib')
const app = require('electron').app

const TASKS_FILE_PATH = path.resolve(app.getPath('home'), '.VRipper X')
const STORE_VERSION = 4

const buss = new EventEmitter()
const data = { _: {} }
const meta = {
  nextId: 1,
  ver: STORE_VERSION
}

let changes = {}
let nextNotification

class Store {
  static get buss () { return buss }
  static get data () { return data }

  static notify () {
    if (!nextNotification) {
      nextNotification = setImmediate(() => {
        buss.emit('change')
        nextNotification = null
      })
    }
  }

  /**
   * @param {Object} item
   * @param {boolean} [silent]
   * @returns {{ $id: number }}
   */
  static addItem (item, silent) {
    item.$id = meta.nextId
    meta.nextId += 1
    data[item.$id] = item
    changes[item.$id] = item
    !silent && this.notify()
    return item
  }

  /**
   * @param {number} $id
   * @returns {?Object}
   */
  static getItem ($id) {
    return data[$id]
  }

  /**
   * @param {{ $id: number }|number} itemOrId
   * @param {Object} [update]
   * @param {boolean} [silent]
   * @returns {?Object}
   */
  static updateItem (itemOrId, update, silent) {
    const $id = itemOrId.$id || itemOrId
    const item = this.getItem($id)
    update && Object.assign(item, update)
    changes[$id] = item
    !silent && this.notify()
    return item
  }

  /**
   * @param {{ $id: number }|number} itemOrId
   * @param {boolean} [silent]
   */
  static removeItem (itemOrId, silent) {
    const $id = itemOrId.$id || itemOrId
    delete data[$id]
    changes[$id] = null
    !silent && this.notify()
  }

  /**
   * @param {Object} update
   */
  static update (update) {
    for (let key of Object.keys(update)) {
      if (update[key] !== data._[key]) {
        data._[key] = update[key]
        buss.emit('change:' + key, update[key])
      }
      this.notify()
    }
  }

  /**
   * @returns {Object}
   */
  static getChanges () {
    const _changes = changes
    changes = {}
    _changes._ = data._
    return _changes
  }
}

const saveToFile = (filePath) => {
  try {
    fs.writeFileSync(filePath, zlib.gzipSync(
      // do not save null values
      // do not save $$keys
      JSON.stringify({meta, data}, (key, value) => {
        if (key.substr(0, 2) !== '$$' && value !== null) {
          return value
        }
      })
    ))
  } catch (err) {
    console.warn(err)
  }
}

const loadFromFile = (filePath) => {
  try {
    const parsed = JSON.parse(
      zlib.unzipSync(
        fs.readFileSync(filePath)
      ).toString()
    )
    if (parsed.meta.ver === STORE_VERSION) {
      Object.assign(meta, parsed.meta)
      Object.assign(data, parsed.data)
    }
  } catch (err) {
    console.warn(err)
  }
}

loadFromFile(TASKS_FILE_PATH)

app.on('quit', () => { saveToFile(TASKS_FILE_PATH) })

module.exports = Store
