'use strict'

const cn = require('classnames')

module.exports = (base, mods, sep) => {
  sep = sep || '--'
  const extendedMods = {}
  if (Array.isArray(mods)) {
    mods.forEach((mod) => {
      extendedMods[base + sep + mod] = true
    })
  } else {
    Object.keys(mods).forEach((mod) => {
      extendedMods[base + sep + mod] = mods[mod]
    })
  }
  return cn(base, extendedMods)
}
