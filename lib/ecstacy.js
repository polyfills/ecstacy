
var fs = require('mz/fs')
var path = require('path')
var lru = require('lru-cache')
var crypto = require('mz/crypto')
var inherits = require('util').inherits
var convert = require('convert-source-map')

module.exports = Ecstacy

// set the folder
var folder =
Ecstacy.folder = path.resolve(process.env.ECSTACY_CACHE
  || path.join(__dirname, '../cache'))
require('mkdirp').sync(folder)

// clean the cache folder
Ecstacy.clean = function () {
  require('rimraf').sync(Ecstacy.folder)
  require('mkdirp').sync(Ecstacy.folder)
}

function Ecstacy() {}

Ecstacy.extend = function (constructor) {
  inherits(constructor, Ecstacy)
  return constructor
}

// default LRU cache options
Ecstacy.cache = {
  max: 100,
  maxAge: Infinity,
}

Object.defineProperties(Ecstacy.prototype, {
  cache: {
    // useragent -> bundle cache
    get: function () {
      if (this._cache) return this._cache
      return this._cache = lru(Ecstacy.cache)
    }
  }
})

Ecstacy.prototype.parseSourceMap = function (code, map) {
  // remove the source map if it exists
  if (map) {
    // keep it a string
    this.map = convert.fromObject(map).toJSON()
  } else if (map = convert.fromSource(code)) {
    code = convert.removeComments(code)
    this.map = map.toJSON()
  }

  return code
}

// calculate the sha256sum of a string or buffer
Ecstacy.calculate =
Ecstacy.prototype.calculate = function (string) {
  return crypto.createHash('sha256').update(string).digest('hex')
}

// read a cached file's name and extension
Ecstacy.read =
Ecstacy.prototype.read = function (name, ext) {
  return fs.readFile(path.join(Ecstacy.folder, name + ext))
}

// write a file to the cache
Ecstacy.write =
Ecstacy.prototype.write = function (name, ext, data) {
  return fs.writeFile(path.join(Ecstacy.folder, name + ext), data)
}
