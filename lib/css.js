
var lazy = require('lazyrequire')(require)
var postcss = lazy('postcss')
var convert = require('convert-source-map')
var db = require('polyfills-db').postcss

var Ecstacy = require('./ecstacy')

module.exports = CSS

Ecstacy.extend(CSS)
CSS.db = db
CSS.transform = db.transform
CSS.transforms = db.transforms
CSS.type =
CSS.prototype.type = 'css'
CSS.ext =
CSS.prototype.ext = '.css'

function CSS(options) {
  if (!(this instanceof CSS)) return new CSS(options)

  Ecstacy.call(this, options)
}

CSS.prototype._transform = function (code, map, transforms) {
  var processor = postcss()()
  transforms.forEach(function (transform) {
    processor.use(transform.transform())
  })
  var useSourcemaps = this.sourcemaps
  var result = processor.process(code, useSourcemaps ? {
    map: map
      ? { prev: map }
      : true,
    from: this.name + '.css',
    to: this.name + '.css',
  } : {})
  return {
    code: convert.removeMapFileComments(result.css),
    map: useSourcemaps
      ? JSON.stringify(result.map) // test to make sure it's not a string already
      : ''
  }
}
