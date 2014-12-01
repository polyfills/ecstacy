
var lazy = require('lazyrequire')(require)
var recast = lazy('recast')
var esprima = lazy('esprima-fb')
var profile = require('debug')('ecstacy:js:profile')
var applySourceMap = require('apply-source-map')
var convert = require('convert-source-map')
var db = require('polyfills-db').recast

var Ecstacy = require('./ecstacy')

module.exports = JS

Ecstacy.extend(JS)
JS.db = db
JS.transform = db.transform
JS.transforms = db.transforms
JS.type =
JS.prototype.type = 'js'
JS.ext =
JS.prototype.ext = '.js'

function JS(options) {
  if (!(this instanceof JS)) return new JS(options)

  Ecstacy.call(this, options)
}

JS.prototype._transform = function (code, map, transforms) {
  // i wish there was a way to cache this
  profile('profiling %s', this.name)
  profile('recasting AST')
  var useSourcemaps = this.sourcemaps
  var ast = recast().parse(code, {
    esprima: esprima(),
    sourceFileName: useSourcemaps
    ? this.name + '.js'
    : null
  })
  profile('recasted AST')
  transforms.forEach(function (transform) {
    ast = transform.transform(ast)
    profile('performed transform "%s"', transform.name)
  })
  var result = recast().print(ast, {
    sourceMapName: useSourcemaps
    ? this.name + '.js'
    : null
  })
  profile('stringified AST')
  return {
    code: convert.removeMapFileComments(result.code),
    map: !useSourcemaps
    ? null
    : (map
      ? applySourceMap(result.map, map)
      : JSON.stringify(result.map)
    )
  }
}
