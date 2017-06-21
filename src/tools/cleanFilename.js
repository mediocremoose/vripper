'use strict'

const illegalRe = /[\/\?<:>\\\|\*\"]/g          // characters / ? < : > | * "
const controlRe = /[\x00-\x1f\x80-\x9f]/g       // control chars with code 0..31 and 128..159
const reservedRe = /(^|\/)\.+/                  // remove starting . dots "/.." or ".."
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i   // remove windows reserved names 
const trailingPeriods = /\.+$/g                 // remove trailing periods

/**
 * @param {string} original
 * @returns {string}
 */
const cleanFilename = (original) => original
  .replace(illegalRe, '')
  .replace(controlRe, '')
  .replace(reservedRe, '')
  .replace(windowsReservedRe, '')
  .replace(trailingPeriods, '')
  .replace(/\s+/g,' ')                            // shorten all whitespace only for one char long
  .trim()                                         // trim white space from both ends
  .substr(0, 99)                                  // limit max file length to 100 chars

module.exports = cleanFilename
