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
  return path.resolve(root, (folders || []).map(cleanFilename).join('/'))
}

/**
 * @param {Object} file
 * @param {string} dest
 * @returns {Promise.<string>}
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
