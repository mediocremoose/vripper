'use strict'

const qRequest = require('./qRequest')
const trim = require('lodash/trim')
const last = require('lodash/last')
const fileType = require('file-type')
/**
 * Get filename from Content-Disposition header
 * @param {Object} headers
 * @returns {?string}
 */
const getFilenameFromHeaders = (headers) => {
  const contentDisposition = headers['content-disposition']
  if (contentDisposition) {
    const chunks = contentDisposition.split('filename=')
    if (chunks.length === 2) {
      return trim(chunks[1], '"')
    }
  }
}

/**
 * Get last part of path
 * e.g. 'foo/bar.jpg' => 'bar.jpg'
 * @param {string} path
 * @returns {string}
 */
const getFilenameFromPath = (path) => last(path.split('/'))

/**
 * @param {Object} options
 * @param {string} options.url
 * @param {number} [priority]
 * @returns {Promise.<{data: string|Buffer, name: string, ext: string, src: string}>}
 */
const download = (options, priority) => {
  options.encoding = null
  return qRequest(options, priority || 100).then((resp) => {
    if (resp.body.length < 10000) {
      return Promise.reject(`File too small, probably dummy, ${options.url}`)
    }
    const filename = getFilenameFromHeaders(resp.headers) || getFilenameFromPath(resp.request.path)
    const type = fileType(resp.body)
    return {
      data: resp.body,
      name: filename,
      ext: type && type.ext,
      src: resp.request.href
    }
  })
}

module.exports = download
