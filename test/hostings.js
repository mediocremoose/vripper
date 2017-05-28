'use strict'
require('colors')
const URL = require('url')
const ImageHosting = require('../src/rippers/ImageHosting')

const cases = {
  'fastpic.ru': {
    hosting: 'https://fastpic.ru/view/74/2016/0309/675cc494990d3033da9b46ffd5f14b7a.png.html',
    thumbnail: 'https://i74.fastpic.ru/thumb/2016/0309/7a/675cc494990d3033da9b46ffd5f14b7a.jpeg',
    origin: 'https://i74.fastpic.ru/big/2016/0309/7a/675cc494990d3033da9b46ffd5f14b7a.png'
    // thumbnail converted to jpeg
    // does not preserve original filename
    // checks for referer, redirects from origin to hosting
  },
  'imageshack.com': {
    hosting: 'https://imageshack.com/i/pmQYl0P6j',
    thumbnail: 'https://imagizer.imageshack.us/v2/320x240q90/922/QYl0P6.jpg',
    origin: 'https://imageshack.com/a/img922/3760/QYl0P6.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // multiple thumbnails
    // filename in hosting title 'ImageShack - test_image_big_not_transparent.jpg'
  },
  'imageupper.com': {
    hosting: 'http://imageupper.com/i/?S0600010020011B14945440771855621',
    thumbnail: 'http://s06.imageupper.com/1_t/2/B14945440771855621_1.jpg',
    origin: 'http://s06.imageupper.com/1/2/B14945440771855621_1.jpg'
    // no filename
  },
  'imgbox.com': {
    hosting: 'https://imgbox.com/nG0JdM7s',
    thumbnail: 'https://1.t.imgbox.com/nG0JdM7s.jpg',
    origin: 'https://i.imgbox.com/nG0JdM7s.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // filename in img TITLE
  },
  'picstate.com': {
    hosting: 'https://picstate.com/view/full/1620138_lmypx',
    thumbnail: 'https://picstate.com/thumbs/small/1620138_lmypx/test_image_big_not_transparent.jpg',
    origin: 'https://picstate.com/files/1620138_lmypx/test_image_big_not_transparent.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // filename in ALT and PATH
  },
  'pixhost.org': {
    hosting: 'https://www.pixhost.org/show/67/31824165_test_image_big_not_transparent.jpg',
    thumbnail: 'https://t7.pixhost.org/thumbs/67/31824165_test_image_big_not_transparent.jpg',
    origin: 'https://img7.pixhost.org/images/67/31824165_test_image_big_not_transparent.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // filename in PATH and ALT prefixed
  },
  'postimage.org': {
    hosting: 'https://postimg.org/image/ik1o76chv/',
    thumbnail: 'https://s13.postimg.org/ik1o76chv/test-image.jpg',
    origin: 'https://s13.postimg.org/aejm90o93/test-image.jpg',
    name: 'test-image.jpg'
    // filename in PATH or ALT
  },
  'sharenxs.com': {
    hosting: 'https://sharenxs.com/gallery/5914b457dcb5e/test-image_5914b458117ef',
    thumbnail: 'https://sharenxs.com/photos/2017/05/11/5914b43cce958/smnxs-test-image.jpg',
    origin: 'https://sharenxs.com/photos/2017/05/11/5914b43cce958/test-image.jpg',
    name: 'test-image.jpg'
    // filename in PATH prefixed
  },
  'turboimagehost.com': {
    hosting: 'https://www.turboimagehost.com/p/25893691/test_image_big_not_transparent.jpg.html',
    thumbnail: 'https://s6d8.turboimg.net/t/25893691_test_image_big_not_transparent.jpg',
    origin: 'https://s6d8.turboimg.net/sp/0cf792ceb86d5ab4b297cc652972a8f3/test_image_big_not_transparent.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // filename in PATH
  },
  'coreimg.net': {
    hosting: 'https://coreimg.net/vurdf7r7qp6o',
    thumbnail: 'https://coreimg.net/t/010/03003/vurdf7r7qp6o',
    origin: 'https://i010.coreimg.net/i/03003/vurdf7r7qp6o.jpg',
    name: 'test-image.jpg'
    // filename in ALT
  },
  'imagetwist.com': {
    hosting: 'https://imagetwist.com/xw9cgnravqu9/test_image_big_not_transparent.jpg',
    thumbnail: 'https://img155.imagetwist.com/th/11185/xw9cgnravqu9.jpg',
    origin: 'https://img155.imagetwist.com/i/11185/xw9cgnravqu9.jpg/test_image_big_not_transparent.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // filename in ALT
  },
  'img.yt': {
    hosting: 'https://img.yt/img-56e01bc4c1ec1.html',
    thumbnail: 'https://img.yt/upload/small/2016/03/09/56e01bc4c1e85.jpg',
    origin: 'https://s.img.yt/big/2016/03/09/56e01bc4c1e85.jpg',
    name: 'test_image_big_not_transparent.jpg'
    // filename in ALT, no ext
  },
  'imgchili.net': {
    hosting: 'https://imgchili.net/show/80592/80592562_test_image_big_not_t.jpg',
    thumbnail: 'https://t8.imgchili.net/80592/80592562_test_image_big_not_t.jpg',
    origin: 'https://i8.imgchili.net/80592/80592562_test_image_big_not_t.jpg',
    name: 'test_image_big_not_t.jpg'
    // filename in PATH and ALT, prefixed
  },
  'acidimg.cc': {
    hosting: 'https://acidimg.cc/img-5914b1433436c.html',
    thumbnail: 'https://acidimg.cc/upload/small/2017/05/11/5914b14334331.jpg',
    origin: 'https://i.acidimg.cc/big/2017/05/11/5914b14334331.jpg',
    name: 'test-image.jpg'
    // filename in ALT, no ext
  },
  'ima.gy': {
    hosting: 'https://ima.gy/i/5xIqYJ',
    thumbnail: 'https://ima.gy/upload/small/2017/05/11/5914b63cc00be.jpg',
    origin: 'https://ima.gy/upload/big/2017/05/11/5914b63cc00be.jpg',
    name: 'test-image.jpg'
    // filename in ALT
  },
  'picz.site': {
    hosting: 'https://picz.site/img-5914b7a5d1498.html',
    thumbnail: 'https://picz.site/upload/small/2017/05/11/5914b7a5d148a.jpg',
    origin: 'https://picz.site/upload/big/2017/05/11/5914b7a5d148a.jpg',
    name: 'test-image.jpg'
    // filename in ALT
  },
  'imageho.me': {
    hosting: 'https://imageho.me/img-5914b89db9d6d.html',
    thumbnail: 'http://imageho.me/upload/small/2017/05/11/5914b89db9d2b.jpg',
    origin: 'http://i.imageho.me/big/2017/05/11/5914b89db9d2b.jpg',
    // no filename
  },
  'picpie.org': {
    hosting: 'https://picpie.org/image/kpng0m',
    thumbnail: 'https://picpie.org/images/2017/05/12/test-image.th.jpg',
    origin: 'https://picpie.org/images/2017/05/12/test-image.jpg',
    name: "test-image.jpg"
    // filename in PATH
  },
  'depic.me': {
    hosting: 'http://depic.me/i9i0rn6qyy3n',
    thumbnail: 'http://s9.dpic.me/02008/i9i0rn6qyy3n.jpg',
    origin: /s9\.dpic\.me\/[^\/]+\/test_image\.jpg/,
    name: "test_image.jpg"
    // filename in PATH and ALT
  },
  'imagevenue.com': {
    hosting: 'http://img278.imagevenue.com/img.php?image=42843_test_image_122_198lo.jpg',
    thumbnail: 'http://img278.imagevenue.com/loc198/th_42843_test_image_122_198lo.jpg',
    origin: /test_image/i,
    originExample: 'http://img278.imagevenue.com/aAfkjfp01fo1i-13879/loc198/42843_test_image_122_198lo.jpg',
    name: 'test_image_122_198lo.jpg'
    // filename in PATH, prefixed
  },
  'pimpandhost.com': {
    hosting: 'http://pimpandhost.com/image/66184033',
    thumbnail: 'http://ist3-6.filesor.com/pimpandhost.com/1/_/_/_/1/4/t/H/u/4tHup/test-image.jpg',
    origin: 'https://ist3-6.filesor.com/pimpandhost.com/1/_/_/_/1/4/t/H/u/4tHup/test-image.jpg',
    name: 'test-image.jpg'
  },
  'picsee.net': {
    hosting: 'http://picsee.net/2017-05-24/60e329b31b5e.jpg.html',
    thumbnail: 'http://picsee.net/upload/2017-05-24/thumbnail/60e329b31b5e.jpg',
    origin: 'http://picsee.net/upload/2017-05-24/60e329b31b5e.jpg',
    // no filename
  },
  'imagezilla.net': {
    hosting: 'http://imagezilla.net/show/7GHaqRT-test-image.jpg',
    thumbnail: 'http://imagezilla.net/thumbs2/7GHaqRT-test-image_tn.jpg',
    origin: 'http://imagezilla.net/images/7GHaqRT-test-image.jpg',
    name: 'test-image.jpg'
    // filename in ALT and PATH, prefixed
  },
  'imagebam.com': {
    hosting: 'http://www.imagebam.com/image/911127550207816',
    thumbnail: 'http://thumbnails103.imagebam.com/55021/911127550207816.jpg',
    origin: 'http://103.imagebam.com/download/4RKaeE0ch42T9KlRZ5yljA/55021/550207816/test-image.jpg',
    name: 'test-image.jpg'
    // filename in PATH, bad ALT: 'loading' 
  }
}

const test = (hosting) => {
  const test = cases[hosting]

  test.hosting && ImageHosting(test.hosting, test.thumbnail, true).then((img) => {
    if (test.origin) {
      const originCheck = test.origin.test
        ? test.origin.test(img.src)
        : img.src && test.origin && URL.parse(img.src).pathname === URL.parse(test.origin).pathname
      console.log(originCheck
        ? `${hosting}: origin passed`.green
        : `${hosting}: origin failed\nfound:\t\t${img.src}\nexpected:\t${test.origin}`.red)
    }
    if (test.name) {
      const nameCheck = test.name === img.name
      console.log(nameCheck
        ? `${hosting}: name passed`.green
        : `${hosting}: name failed\nfound:\t\t${img.name}\nexpected:\t${test.name}`.red)
    }
  }, (err) => {
    console.log('ERROR'.red, hosting, err)
  }).catch((err) => {
    console.log('ERROR'.red, hosting, err)
  })
}

const runAll = () => {
  Object.keys(cases).forEach(test)
}

runAll()
