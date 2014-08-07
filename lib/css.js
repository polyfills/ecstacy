
var lazy = require('lazyrequire')(require)
var postcss = lazy('postcss')
var cleancss = lazy('clean-css')
var debug = require('debug')('ecstacy:css')
var convert = require('convert-source-map')
var db = require('polyfills-db').postcss

require('./ecstacy').extend(CSS)

module.exports = CSS

CSS.db = db
CSS.transform = db.transform
CSS.transforms = db.transforms

function CSS(options) {
  if (!(this instanceof CSS)) return new CSS(options)

  this.code = this.parseSourceMap(options.code || options.css || options.string || '', options.map)
  this.hash = this.calculate(this.code)
  this.name = options.name || 'anonymous' // name of the file without extensions
  this.transforms = this.detect(options.transforms || [], this.code)

  this._initialize()
}

CSS.prototype.lookup = function (name) {
  if (typeof name === 'string') return db.transform[name]
  return name
}

/**
 * Clean-CSS doesn't support maps yet.
 * We should either wait until they do or switch
 * minifiers.
 */

CSS.prototype.minify = function (name) {
  var self = this
  return Promise.all([
    self.read(name, '.css', 'utf8'),
    // self.read(name, '.css.map', 'utf8'),
  ]).then(function (srcs) {
    var result = self._cleancss(srcs[0], srcs[1] || '')
    var code = result.code
    // var map = result.map

    return Promise.all([
      self.write(name, '.min.css', code),
      // self.write(name, '.min.css.map', map),
      self.update(name, [
        ['.min.css', Buffer.byteLength(code)],
        // ['.min.css.map', Buffer.byteLength(map)],
      ])
    ])
  })
}

CSS.prototype._postcss = function (code, map, transforms) {
  var processor = postcss()()
  transforms.forEach(function (transform) {
    processor.use(transform.transform())
  })
  var result = processor.process(code, {
    map: map
      ? { prev: map }
      : true,
    from: this.name + '.css',
    to: this.name + '.css',
  })
  return {
    code: convert.removeMapFileComments(result.css),
    map: JSON.stringify(result.map) // test to make sure it's not a string already
  }
}

CSS.prototype._cleancss = function (code) {
  var result = cleancss()({
    keepSpecialComments: 0,
    processImport: false,
    noRebase: true
  }).minify(code)

  return {
    code: result,
    map: ''
  }
}

CSS.prototype._initialize = function () {
  var self = this
  var code = this.code
  var hash = this.hash
  var map = this.map || ''
  // currently resolving
  if (this._initializePromise) return this._initializePromise
  // already done
  if (code == null) return Promise.resolve()

  return this._initializePromise = this.readSafely(hash, '.json').then(function (json) {
    if (json) return fin() // already saved, don't do anything

    json = {
      name: hash,
      date: new Date().toUTCString(),
      hash: hash,
      transforms: [],
      length: {
        '.css': Buffer.byteLength(code),
        '.css.map': Buffer.byteLength(map),
      },
    }

    return Promise.all([
      self.write(hash, '.json', json),
      self.write(hash, '.css', code),
      self.write(hash, '.css.map', map),
    ]).then(fin, fin)
  })

  function fin(err) {
    debug('initialized %s', self.name)
    self.map =
    self.code = null
    self._initializePromise = null
    if (err instanceof Error) throw err
  }
}

CSS.prototype._getOriginal = function () {
  var self = this
  return this._initialize().then(function () {
    return Promise.all([
      self.read(self.hash, '.css', 'utf8'),
      self.read(self.hash, '.css.map', 'utf8'),
    ])
  })
}

CSS.prototype._transform = function (transforms) {
  var self = this
  return this._getOriginal().then(function (srcs) {
    return self._postcss(srcs[0], srcs[1], transforms)
  }).then(function (result) {
    var code = result.code
    var map = result.map
    var name = self.hash + '.' + transforms.hash

    return Promise.all([
      self.write(name, '.css', code),
      self.write(name, '.css.map', map),
      self.write(name, '.json', {
        name: name,
        date: new Date().toUTCString(),
        hash: self.calculate(code),
        transforms: transforms.map(toName),
        length: {
          '.css': Buffer.byteLength(code),
          '.css.map': Buffer.byteLength(map),
        },
      }),
    ])
  })
}

function toName(x) {
  return x.name
}
