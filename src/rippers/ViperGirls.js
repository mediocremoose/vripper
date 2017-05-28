'use strict'

const URL = require('url')
const cheerio = require('cheerio')
const _ = require('lodash')
const qRequest = require('../tools/qRequest')

const HOSTNAME = 'vipergirls.to'
const PICS_PER_POST_MINIMUM = 3
const threadPathRe = /\/threads\/(\d+)[^\/]*(\/page(\d+))?/i
const postIdRe = /post_(\d+)/i
const garbage = '★♥~-!►* '

/**
 * @param {(number|string)} threadId
 * @returns {string}
 */
const makeThreadURL = (threadId) =>
  `https://${HOSTNAME}/threads/${threadId}`

/**
 * @param {(number|string)} threadId
 * @param {(number|string)} pageId
 * @returns {string}
 */
const makeThreadPageURL = (threadId, pageId) =>
  `${makeThreadURL(threadId)}/page${pageId}`

/**
 * @param {(number|string)} postId
 */
const makePostURL = (postId) =>
  `https://${HOSTNAME}/threads/?p=${postId}#post${postId}`

/**
 * Remove garbage
 * @param {string} title
 * @returns {string}
 */
const cleanTitle = (title) => {
  // double trim to remove \r\n first
  return _.trim(title.trim(), garbage).replace(/^Re: /i, '')
}

/**
 * @param {string} html
 * @returns {{pages: number, posts: Array, title: string}}
 */
const parseThreadPage = (html) => {
  const $ = cheerio.load(html)

  // get number of pages in thread
  const pagination = $('.pagination .popupctrl')
  const numberOfPages = pagination.length
    ? +pagination.first().text().split(' of ')[1]
    : 1 // 'Page 2 of 4'

  // get title
  const threadTitle = cleanTitle($('.threadtitle').first().text())

  // get all posts with images
  const contentPosts = []
  $('.postcontainer').each((i, post) => {
    const $post = $(post)
    let pics = []

    // first type of post
    // link with thumbnail in it
    $post.find('.postbody .postcontent a').each((i, a) => {
      const $a = $(a)
      const $img = $a.find('img')
      if ($a.attr('target') === '_blank' && $img.length === 1) {
        const src = $a.attr('href')
        const thumb = $img.attr('src')
        if (URL.parse(src).hostname === HOSTNAME) {
          // check for internal links. AKA more of my content
          return
        }
        pics.push([src, thumb])
      }
    })

    // second type of post
    // just original images
    if (pics.length < PICS_PER_POST_MINIMUM) {
      pics = []
      $post.find('.postbody .postcontent > img').each((i, img) => {
        const src = $(img).attr('src')
        // only external images
        if (src.substr(0, 4) === 'https') {
          pics.push(src)
        }
      })
    }

    if (pics.length >= PICS_PER_POST_MINIMUM) {
      const text = $post.find('.postbody .content').text().trim()
      let title = $post.find('.postbody .title').first().text().replace(/[\r\n]/g, '').trim()
      if (title === threadTitle || title.replace(/Re:\s/, '') === threadTitle) {
        title = cleanTitle(text.split(/[\n\r]+/g)[0])
      }
      contentPosts.push({
        id: +postIdRe.exec($post.attr('id'))[1],
        index: +$post.find('.posthead .postcounter').text().substring(1), // '#42' => 42
        thanks: $post.find('.post_thanks_button').attr('href'),
        text,
        title,
        pics
      })
    }
  })

  return {
    pages: numberOfPages,
    posts: contentPosts,
    title: threadTitle
  }
}

/**
 * @param {string} url
 */
const parseURL = (url) => {
  // test for custom protocol for thread
  const matchThread = /vr:t=(\d+)/i.exec(url)
  if (matchThread && matchThread[1]) {
    return { threadId: +matchThread[1] }
  }

  // test for custom protocol for thread
  const postMatch = /vr:p=(\d+)/i.exec(url)
  if (postMatch && postMatch[1]) {
    return { postId: +postMatch[1] }
  }

  // validate hostname
  const parsedURL = URL.parse(url, true)
  if (parsedURL.hostname !== HOSTNAME) {
    return { err: `bad hostname: ${parsedURL.hostname}` }
  }

  // check for post id in query, it has higher priority on thread
  if (parsedURL.query.p) {
    return { postId: parsedURL.query.p }
  }

  // find thread name and
  const threadPath = threadPathRe.exec(parsedURL.path) || []
  const threadId = +threadPath[1]
  const pageId = +threadPath[3]
  if (!threadId) {
    return { err: `bad thread url: ${url}` }
  }

  return { threadId, pageId }
}

function loadThread (threadId, pageId) {
  const fullThread = !pageId
  const thread = { id: threadId, page: pageId }
  return qRequest({ url: makeThreadPageURL(threadId, pageId || 1) }).then((resp) => {
    Object.assign(thread, parseThreadPage(resp.body))
    if (fullThread && thread.pages > 1) {
      return Promise.all(
        _.range(2, thread.pages + 1)
          .map((pageId) => qRequest({url: makeThreadPageURL(threadId, pageId)})
            .then((resp) => parseThreadPage(resp.body).posts))
      ).then((allPosts) => {
        thread.posts = thread.posts.concat(_.flatten(allPosts))
        return thread
      })
    } else {
      return thread
    }
  })
}

function loadPost (postId) {
  return qRequest({ url: makePostURL(postId) }).then((resp) => {
    const thread = parseThreadPage(resp.body)
    const post = _.find(thread.posts, (p) => +p.id === +postId)
    if (post.index === 1) {
      post.title = thread.title
    }
    post.title = post.title || thread.title
    return post
  })
}

/**
 * @param {string} url
 * @returns {Promise}
 */
function load (url) {
  const parsedURL = parseURL(url)
  if (parsedURL.err) {
    return Promise.reject(parsedURL.err)
  }

  if (parsedURL.postId) {
    return loadPost(parsedURL.postId)
  }

  return loadThread(parsedURL.threadId, parsedURL.pageId)
}

function thanks (url) {
  qRequest({ url: `https://${HOSTNAME}/${url}`})
}

module.exports = {
  HOSTNAME,
  parseURL,
  load,
  loadPost,
  loadThread,
  makePostURL,
  thanks
}
