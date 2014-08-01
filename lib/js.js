
var lazy = require('lazyrequire')(require)
var recast = lazy('recast')
var uglify = lazy('uglify-js')
var debug = require('debug')('ecstacy:js')
var applySourceMap = require('apply-source-map')
var transforms = require('polyfills-db').recast.transforms

require('./ecstacy').extend(JS)

module.exports = JS

function JS(options) {
  if (!(this instanceof JS)) return new JS(options)

  this.code = this.parseSourceMap(options.code || options.js || options.string, options.map)
  this.hash = this.calculate(this.code)
  this.name = options.name || 'anonymous' // name of the file without extensions
  this.transforms = this.detect(options.transforms || transforms, this.code)

  this._initialize()
}

/**
 * Lazily creates the minified version of a file.
 * Assumes the original file already exists.
 */

JS.prototype.minify = function (name) {
  var self = this
  return Promise.all([
    self.read(name, '.js', 'utf8'),
    self.read(name, '.js.map', 'utf8'),
  ]).then(function (srcs) {
    var result = self._uglify(srcs[0], srcs[1] || '')
    var code = result[0]
    var map = result[1]

    return Promise.all([
      self.write(name, '.min.js', code),
      self.write(name, '.min.js.map', map),
      self.update(name, [
        ['.min.js', Buffer.byteLength(code)],
        ['.min.js.map', Buffer.byteLength(map)],
      ])
    ])
  })
}

JS.prototype._recast = function (code, map, transforms) {
  // i wish there was a way to cache this
  var ast = recast().parse(code, {
    sourceFileName: this.name + '.js'
  })
  transforms.forEach(function (transform) {
    ast = transform.transform(ast)
  })
  var result = recast().print(ast, {
    sourceMapName: this.name + '.js.map'
  })
  return [result.code, map
    ? applySourceMap(result.map, map)
    : JSON.stringify(result.map)]
}

JS.prototype._uglify = function (code, map) {
  var result
  try {
    result = uglify().minify(code, {
      outSourceMap: this.name + '.min.js',
      fromString: true
    })
  } catch (err) {
    console.error(err.stack)
    // only because uglifyjs doesn't support ES6 yet
    return {
      code: '',
      map: '',
    }
  }

  return {
    code: result.code,
    map: map
      ? applySourceMap(result.map, map)
      : JSON.stringify(result.map)
  }
}

/**
 * The initial step is to save the file to disk.
 * Any future compilations will read the file to disk.
 * The main purpose of this is to avoid additional
 * memory usage during runtime. Ideally, this should
 * be an option, but whatever.
 */

JS.prototype._initialize = function () {
  var self = this
  var code = this.code
  var hash = this.hash
  var map = this.map || ''
  // currently resolving
  if (this._initializePromise) return this.__initializePromise
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
        '.js': Buffer.byteLength(code),
        '.js.map': Buffer.byteLength(map),
      },
    }

    return Promise.all([
      self.write(hash, '.json', json),
      self.write(hash, '.js', code),
      self.write(hash, '.js.map', map),
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

/**
 * Get the original code and map so we can do transforms on it.
 */

JS.prototype._getOriginal = function () {
  var self = this
  return this._initialize().then(function () {
    return Promise.all([
      self.read(self.hash, '.js', 'utf8'),
      self.read(self.hash, '.js.map', 'utf8'),
    ])
  })
}

/**
 * Create a build from the original code and map
 * with a custom set of transforms.
 */

JS.prototype._transform = function (transforms) {
  var self = this
  return this._getOriginal().then(function (srcs) {
    return self._recast(srcs[0], srcs[1], transforms)
  }).then(function (result) {
    var code = result[0]
    var map = result[1]
    var name = self.hash + '.' + transforms.hash

    return Promise.all([
      self.write(name, '.js', code),
      self.write(name, '.js.map', map),
      self.write(name, '.json', {
        name: name,
        date: new Date().toUTCString(),
        hash: self.calculate(code),
        transforms: transforms.map(toName),
        length: {
          '.js': Buffer.byteLength(code),
          '.js.map': Buffer.byteLength(map),
        },
      }),
    ])
  })
}

function toName(x) {
  return x.name
}
