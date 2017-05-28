'use strict'

const _ = require('lodash')
const URL = require('url')
const cheerio = require('cheerio')
const qRequest = require('../tools/qRequest')
const download = require('../tools/download')

// GENERICS:
const imgContinueSites = new Set()
const imgSelectors = [
  // easy selectors
  'img#img',
  'img#image',
  'img#thepic',
  'img#imageid',
  'img#lp-image',
  'img#full_image',
  'img#show_image',
  'img#photo',
  'img.pic',
  'img.image',
  'img.photo',
  'img.centred',
  'img.centred_resized',
  'img.preview',
  'img.view_photo',
  '#main-image',
  '#image-page #overflow-wrapper img',

  // deep selectors
  '#imgholder img',
  '#image_container img',
  '.show_image > a > img',

  // trying out luck
  'img[onload]',
  'img[alt=image]',
  'a[onclick] > img[alt]',
  'table a[target]',
  'img[src][alt][class][id]',
  'a > img[src][alt][width][height]',
  'a[target="_blank"]'
]
const thumbPatterns = [
  ['/t/', ''],
  ['/small/', '/big/'],
  ['_0.', '.'],
  ['_t.', '.'],
  ['_thumb.', '.'],
  ['-thumb.', '.'], // pic4you.ru
  ['/smnxs-', '/'], // sharenxs.com
  ['.th.', '.'],
  [/\d+\.t\./, 'i.'],
  ['-1-', '-0-'] // gallerysense.se
]
const badNames = [
  'loading'
]

// PRESETS:
const nameSelectors = [
  ['imageshack', '.image-info h1'],
  ['imgbox', '#img', 'title']
]
const namePrefixed = [
  'imagevenue',
  'imagezilla',
  'pixhost',
  'stooorage',
  'imgchili',
  'sharenxs'
]
const nameSuffixed = [
  'dumppix'
]
const nameInHosting = [
  'pixhost',
  'stooorage',
  'turboimagehost',
  'imgdragon',
  'imgspice',
  'pixroute',
  'imagevenue'
]
const nameInThumb = [
  'pimpandhost',
  'pixhost',
  'postimage',
  'stooorage',
  'turboimagehost',
  'picstate',
  'sharenxs',
  'picpie'
]
const noHTTPS = [
  'imagevenue',
  'depic',
  'pimpandhost',
  'picsee',
  'imagezilla',
  'imagebam'
]

/**
 * Helper
 * @param {string} target
 * @param {string|RegExp} pattern
 */
const test = (target, pattern) => pattern.test ? pattern.test(target) : target.includes(pattern)

/**
 * @param {string} str
 * @returns {?string}
 */
const filterAlt = (str) => {
  // check for empty string
  if (!str || str.length < 2) {
    return null
  }

  // check for bad patterns
  for (let badName of badNames) {
    if (test(str, badName)) {
      return null
    }
  }

  return str
}

/**
 * @param {string} thumbURL
 * @returns {?string}
 */
const getSrcFromThumb = (thumbURL) => {
  for (let rule of thumbPatterns) {
    let src = thumbURL.replace(...rule)
    if (src !== thumbURL) {
      return src
    }
  }
}

/**
 * @param {string} hostingURL
 * @returns {?string}
 */
const getNameFromHosting = (hostingURL) => {
  for (let rule of nameInHosting) {
    if (test(hostingURL, rule)) {
      // fix case like 'yadayada.png.html'
      hostingURL = hostingURL.replace(/.html?$/, '')
      // handle both 'path/filename.jpg' and 'path/to?file=filename.jpg'
      return _.last(_.last(hostingURL.split('/')).split('='))
    }
  }
}

/**
 * @param {string} thumbURL
 * @returns {?string}
 */
const getNameFromThumb = (thumbURL) => {
  for (let rule of nameInThumb) {
    if (test(thumbURL, rule)) {
      if (thumbURL.includes(".th.")) {
        thumbURL = thumbURL.replace(".th.", ".")
      }
      return _.last(thumbURL.split('/'))
    }
  }
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
const useHTTPS = (hostname) => {
  for (let rule of noHTTPS) {
    if (test(hostname, rule)) {
      return false
    }
  }
  return true
}

/**
 * Ensure extension and remove prefix and(or) suffix
 * @param {string} name
 * @param {string} ext
 * @param {string} hosting
 * @returns {string}
 */
const fixName = (name, ext, hosting) => {
  // remove prefix
  for (let prefixRule of namePrefixed) {
    if (test(hosting, prefixRule)) {
      name = name.replace(/^[^-_]+[-_]/, '')
      break
    }
  }
  // remove suffix
  for (let suffixRule of nameSuffixed) {
    if (test(hosting, suffixRule)) {
      name = name.replace(/,[^,]+$/, '')
      break
    }
  }
  // ensure extension
  if (!/\.\w{3,5}$/.test(name)) {
    name += '.' + ext
  }
  return name
}

/**
 * Sometimes cheerio fil to find form in a real mess
 * @param {string} html
 * @returns {Object}
 */
const findFormData = (html) => {
  const split1 = html.split(/<form/gi)
  if (split1.length < 2) {
    return null
  }
  const split2 = ('<form' + split1[1]).split(/<\/form>/gi)
  if (split2.length < 2) {
    return null
  }
  const $ = cheerio.load(`<form${split2[0]}</form>`)
  let formData = null
  $('input').each((i, elem) => {
    const $elem = $(elem)
    const name = $elem.attr('name')
    const value = $elem.attr('value')
    if (name && value) {
      formData = formData || {}
      formData[name] = value
    }
  })
  return formData
}

/**
 * Find url of img we need
 * @param {string} html
 * @param {string} href
 * @returns {?{src: string, name:string}}
 */
const findImg = (html, href) => {
  const $ = cheerio.load(html)
  for (let selector of imgSelectors) {
    const find = $(selector)
    const imgs = _.uniqBy(find.map((i, el) => {
      const tag = el.name.toLowerCase()
      const $el = $(el)
      return {
        src: tag === 'img' ? $el.attr('src') : $el.attr('href'),
        alt: filterAlt($(el).attr('alt'))
      }
    }), 'src')

    if (imgs.length !== 1) {
      continue
    }

    // check for alternative sources of name
    let name
    for (let nameSelector of nameSelectors) {
      if (test(href, nameSelector[0])) {
        const find = $(nameSelector[1])
        if (find.length) {
          name = nameSelector[2] ? find.attr(nameSelector[2]) : find.text()
        }
        break
      }
    }

    return {
      src: imgs[0].src,
      name: name || imgs[0].alt
    }
  }
}

/**
 * Torture image hosting
 * @param {string} hostingUrl
 * @returns {Promise}
 */
const resolveFromHosting = (hostingUrl) => new Promise((resolve, reject) => {
  let parsedURL = URL.parse(hostingUrl, true, true)
  let ref = false

  if (/dumppix/i.test(parsedURL.hostname)) {
    parsedURL.query.enter = ''
  }

  hostingUrl = URL.format({
    protocol: useHTTPS(parsedURL.hostname) ? 'https' : 'http',
    host: parsedURL.host,
    pathname: parsedURL.pathname,
    query: parsedURL.query
  }).replace(/=(&|$)/g, '$1') // handle '?a=' and '?a=&b=1' cases

  let depth = 0
  const fetchPage = (formData) => {
    const headers = {}
    headers.Accept = 'text/html,application/xhtml+xml,application/xml'
    if (formData || ref) {
      headers.Referer = hostingUrl
    }
    qRequest({
      url: hostingUrl,
      method: formData ? 'POST' : 'GET',
      formData: formData,
      headers: headers
    }, depth).then((resp) => {
      const href = resp.request.href
      const img = findImg(resp.body, href)
      if (img) {
        // make url absolute
        img.src = URL.resolve(href, img.src)
        return resolve(img)
      }

      const newFormData = findFormData(resp.body)
      if (!newFormData) {
        return reject({
          source: 'ImageHosting/resolve/fetchPage: form existence check',
          message: 'cannot find image on page',
          formData
        })
      }

      if (_.isEqual(formData, newFormData)) {
        return reject({
          source: 'ImageHosting/resolve/fetchPage: form recursion check',
          message: 'cannot find image on page, recursive form',
          formData
        })
      }

      // remember 'imgContinue' type hosting
      newFormData.imgContinue && imgContinueSites.add(parsedURL.hostname)

      depth += 1
      fetchPage(newFormData)
    }, reject)
  }

  let initialFormData = null
  if (imgContinueSites.has(parsedURL.hostname)) {
    initialFormData = {'imgContinue': '1'}
  }

  fetchPage(initialFormData)
})

/**
 * @param {string} hostingURL
 * @param {string} [thumbURL]
 * @param {boolean} [forceOriginalName]
 * @returns {Promise.<{src: string, name:string, data: Buffer}>}
 */
const resolve = (hostingURL, thumbURL, forceOriginalName) => {
  thumbURL = thumbURL || ''
  const fromThumbSrc = getSrcFromThumb(thumbURL)
  const fromThumbName = getNameFromThumb(thumbURL) || getNameFromHosting(hostingURL)

  const loadFromHosting = () => resolveFromHosting(hostingURL).then((img) => download({
    url: img.src,
    headers: { Referer: hostingURL }
  }).then((file) => ({
    src: file.src,
    name: fixName(fromThumbName || img.name || file.name, file.ext, hostingURL),
    data: file.data
  })))

  const loadFromThumb = () => download({
    url: fromThumbSrc,
    headers: { Referer: hostingURL }
  }).then((file) => ({
    src: file.src,
    name: fixName(fromThumbName || file.name, file.ext, hostingURL),
    data: file.data
  }))

  if (fromThumbSrc && (!forceOriginalName || fromThumbName)) {
    return loadFromThumb().then((x) => x, loadFromHosting)
  } else if (fromThumbSrc) {
    return loadFromHosting().then((x) => x, loadFromThumb)
  } else {
    return loadFromHosting()
  }
}

module.exports = resolve
