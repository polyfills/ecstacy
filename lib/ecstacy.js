
var fs = require('mz/fs')
var path = require('path')
var lru = require('lru-cache')
var assert = require('assert')
var recast = require('recast')
var crypto = require('mz/crypto')
var minify = require('uglify-js').minify
var convert = require('convert-source-map')

// folder where everything is saved
var folder =
Ecstacy.folder = path.resolve(process.env.ECSTACY_CACHE
  || path.join(__dirname, '../cache'))
require('mkdirp').sync(folder)

var utils = require('./utils')

module.exports = Ecstacy

// clean the cache folder
Ecstacy.clean = function () {
  require('rimraf').sync(Ecstacy.folder)
  require('mkdirp').sync(Ecstacy.folder)
}

Ecstacy.cache = {
  max: 100,
  maxAge: Infinity,
}

function Ecstacy(code, map) {
  if (!(this instanceof Ecstacy)) return new Ecstacy(code, map)

  assert('string', typeof code)
  assert('string', typeof name)

  // custom transforms to use
  this.transforms = []

  // remove the source map if it exists
  if (map) {
    // keep it a string
    this.map = convert.fromObject(map).toJSON()
  } else if (map = convert.fromSource(code)) {
    code = convert.removeComments(code)
    this.map = map.toJSON()
  }

  this.code = code

  // files will be saved as <sha256sum>.<build hash>.js
  this.hash = this.calculate(this.code)
}

// lazily parse the AST, allowing developers to set the AST
// themselves if they wish
Object.defineProperties(Ecstacy.prototype, {
  ast: {
    get: function () {
      if (this._ast) return this._ast
      return this._ast = recast.parse(this.code, {
        sourceFileName: this.hash + '.js'
      })
    },
    set: function (ast) {
      // particularly important if you already have an AST
      // that you can use to avoid double parsing
      this._ast = ast
    }
  },
  cache: {
    // useragent -> bundle cache
    get: function () {
      if (this._cache) return this._cache
      return this._cache = lru(Ecstacy.cache)
    }
  }
})

// add custom transforms
Ecstacy.prototype.use = function (transform) {
  assert(transform.name)
  assert(transform.detect)
  assert(transform.filter)
  assert('transform' in transform)
  this.transforms.push(transform)
  return this
}

// out minify function, which develoeprs may override
Ecstacy.prototype.minify = function (code, mapName, map) {
  var result
  try {
    result = minify(code, {
      outSourceMap: mapName,
      fromString: true
    })
  } catch (err) {
    // only because uglifyjs doesn't support ES6 yet
    return {
      code: '',
      map: '',
    }
  }

  map = map || this.map

  return {
    code: result.code,
    map: map
      ? utils.applySourceMap(result.map, map)
      : JSON.stringify(result.map)
  }
}

// calculate the sha256sum of a string
Ecstacy.prototype.calculate = function (string) {
  return crypto.createHash('sha256').update(string).digest('hex')
}

// read a cached file's name and extension
Ecstacy.prototype.read = function (name, ext) {
  return fs.readFile(path.join(Ecstacy.folder, name + ext))
}

// write a file to the cache
Ecstacy.prototype.write = function (name, ext, data) {
  return fs.writeFile(path.join(Ecstacy.folder, name + ext), data)
}
