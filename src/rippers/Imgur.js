'use strict'

const URL = require('url')
const qRequest = require('../tools/qRequest')

const HOSTNAME = 'imgur.com'
const albumRe = /^\/a\/([\w|\d]+)/i
const makeAlbumURL = (id) => `http://m.${HOSTNAME}/a/${id}`

const parseURL = (url) => {
  const parsed = URL.parse(url)
  if (parsed.hostname.indexOf(HOSTNAME) === -1) {
    return { err: `wrong hostname ${url}` }
  }

  const match = albumRe.exec(parsed.path)
  if (!match || !match[1]) {
    return { err: `not an album path ${url}` }
  }

  return { id: match[1] }
}

const getAlbum = (id) => {
  const url = makeAlbumURL(id)
  return qRequest({ url, mobile: true }).then((resp) => {
    let data = resp.body.split(/[\r\n]+/).find((line) => {
      return line.trim().startsWith('window.initialData')
    })
    if (data) {
      data = data.trim()
      data = data.substring(data.indexOf('{'), data.length - 1)
      data = JSON.parse(data).posts[id]
      return {
        title: data.title,
        pics: data.images.map((image) => ({ src: image.link }))
      }
    }
    return Promise.reject('cant find pics at' + url)
  })
}

module.exports = {
  HOSTNAME,
  parseURL,
  getAlbum
}
