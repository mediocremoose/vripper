'use strict'

const store = require('./store')
const workers = [
  // top priority
  require('./workers/VGThreadWorker'),
  require('./workers/VGPostWorker'),
  // everyone else alphabetically
  require('./workers/Chan4Worker'),
  require('./workers/ImgurWorker'),
  require('./workers/VKAlbumWorker'),
  // second tire
  require('./workers/ImgHostingWorker'),
  require('./workers/ImgWorker')
]

const workersByType = workers.reduce((map, worker) => {
  map[worker.type] = worker
  return map
}, {})

function forId ($id) {
  const task = store.getItem($id)
  if (task) {
    return workersByType[task.type]
  }
}

// do not redefine module.exports for cyclical dependencies sake
module.exports.workers = workers
module.exports.workersByType = workersByType
module.exports.forId = forId
