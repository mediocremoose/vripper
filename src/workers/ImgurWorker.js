'use strict'

const AbstractAlbumWorker = require('./AbstractAlbumWorker')
const Imgur = require('../rippers/Imgur')

class ImgurWorker extends AbstractAlbumWorker {
  static get type () { return 'Imgur' }

  static parseURL (url) {
    return Imgur.parseURL(url)
  }

  static makeFolderName (task) {
    return `imgur album${task.id}`
  }

  static preload (task) {
    return Imgur.getAlbum(task.id).then((album) => {
      task.title = `imgur album ${task.id} ${album.title || ''}`
      return this.afterPreload(task, album.pics)
    })
  }
}

ImgurWorker.initStatCounter()

module.exports = ImgurWorker
