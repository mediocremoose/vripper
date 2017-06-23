'use strict'

const request = require('request')
const async = require('async')
const URL = require('url')
const _ = require('lodash')

const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36'
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B137 Safari/601.1'
const REQUEST_CONCURRENCY = 15
const REQUEST_RETRY_LIMIT = 5
const REQUEST_INT_BASE = 250
const Qs = new Map()
const jar = request.jar()

/**
 * Queue task handler (AsyncFunction)
 * @param {Object} task
 * @param {function} queueCallback
 */
const processRequest = (task, queueCallback) => {
  // We attempt to get a successful response REQUEST_RETRY_LIMIT times
  async.retry(REQUEST_RETRY_LIMIT, (retryCallback) => {
    request(task.options, retryCallback)
  // Processing, after succesful response or failed last request
  }, (err, resp) => {
    if (err) { // failed to get response
      task.reject({
        source: 'qRequest/processRequest: request callback error',
        options: task.options,
        err
      })
    } else if (resp.statusCode !== 200) { // response was, but it was unsuccessful nature
      task.reject({
        source: 'qRequest/processRequest: statusCode check',
        err: `bad status code: ${resp.statusCode} ${resp.statusMessage}`,
        options: task.options,
        statusCode: resp.statusCode
      })
    } else { // we had succsessful response
      task.resolve(resp)
    }
    setTimeout(queueCallback, (2 * REQUEST_INT_BASE * Math.random() | 0)) // We give system some time
  })
}

/**
 * Request wrapped in Promise and put in priorityQueue by hostname
 * @param {Object} options
 * @param {number} [priority]
 * @returns {Promise}
 */
const qRequest = (options, priority) => new Promise((resolve, reject) => {
    // declare data object for request
  _.defaultsDeep(options, {
    timeout: 30 * 1000,
    gzip: true,
    jar: jar,
    headers: {
      'User-Agent': options.mobile ? UA_MOBILE : UA_DESKTOP
    }
  })

  // remove low level domain name e.g. 'img123' from 'img123.domain.com'
  const host = URL.parse(options.url)
    .hostname.replace(/^[a-z]{1,3}\d{2,3}\./i, '')
  // domain based requests queue
  if (!Qs.has(host)) {
    Qs.set(host, async.priorityQueue(processRequest, REQUEST_CONCURRENCY))
  }
  Qs.get(host).push({options, resolve, reject}, 1000 - (priority | 0))
})

module.exports = qRequest
module.exports.jar = jar
