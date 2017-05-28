'use strict'

const _ = require('lodash')
const qRequest = require('../tools/qRequest')
const AbstractAlbumWorker = require('./AbstractAlbumWorker')

const albumRe = /vk\.com\/album(-?\d+)_(\d+)/i

const makeAlbumApiURL = (ownerId, albumId) =>
  `http://api.vk.com/method/photos.get?v=5.49&owner_id=${ownerId}&album_id=${albumId}`

class VKAlbumWorker extends AbstractAlbumWorker {
  static get type () { return 'VKAlbum' }

  static parseURL (url) {
    const match = albumRe.exec(url)
    if (!match || !match[1] || !match[2]) {
      return { err: 'not a vk url ' + url }
    }
    return {
      owner: match[1],
      id: match[2]
    }
  }

  static makeFolderName (task) {
    return `vk album${task.owner}_${task.id}`
  }

  static preload (task) {
    return qRequest({
      url: makeAlbumApiURL(task.owner, task.id),
      json: true
    }).then((resp) => {
      const pics = _.compact(resp.body.response.items.map((photo) => {
        const src = photo.photo_2560 || photo.photo_1280 || photo.photo_807 || photo.photo_604
        if (src) {
          return {
            src: src,
            name: `photo_${photo.album_id}_${photo.id}.jpg`
          }
        }
      }))
      task.title = `vk album${task.owner}_${task.id}`
      return this.afterPreload(task, pics)
    })
  }
}

VKAlbumWorker.initStatCounter()

module.exports = VKAlbumWorker
