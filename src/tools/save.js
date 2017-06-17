'use strict'

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const cleanFilename = require('./cleanFilename')

/**
 * @param {string} root
 * @param {Array} folders
 * @returns {string} resolved path
 */
const makePath = (root, folders) => {
  return path.resolve(root, (folders || []).filter(x=>x.length>0).map(cleanFilename).join(path.sep))
}

/**
 * @param {Object} file - object containing data of file
 * @param {string} file.name
 * @param {buffer} file.data - binary file data (image / video)
 * @param {?string} file.prefix
 * @param {string} dest - directory
 * @returns {Promise.<string>} if success, Path to saved file (absolute) else err object
 */
const save = (file, dest) => new Promise((resolve, reject) => {
  mkdirp(dest, (err) => {
    if (err) {
      return reject({
        source: 'save.js/save: mkdirp cb error',
        err,
        dest
      })
    }
    const filePath = path.resolve(dest, (file.prefix || '') + cleanFilename(file.name))
    fs.writeFile(filePath, file.data, 'binary', (err) => {
      if (err) {
        reject({
          source: 'save.js/save: writeFile cb error',
          err,
          filePath
        })
      } else {
        resolve(filePath)
      }
    })
  })
})

module.exports = save
module.exports.makePath = makePath
