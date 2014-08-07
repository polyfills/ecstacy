
var fs = require('mz/fs')
var path = require('path')
var lru = require('lru-cache')
var db = require('polyfills-db')
var crypto = require('mz/crypto')
var gzip = require('mz/zlib').gzip
var strip = require('strip-comments')
var inherits = require('util').inherits
var convert = require('convert-source-map')
var debug = require('debug')('ecstacy:ecstacy')

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

/**
 * Builds a specific transform and returns the JSON data.
 */

Ecstacy.prototype.build = function (agents) {
  var self = this
  var transforms = this._filter(agents)
  if (!transforms.length) { // no transforms
    debug('building %o -> %o', agents, transforms.hash)
    if (this.code == null) return this.read(self.hash, '.json')
    return this._initialize().then(function () {
      return self.read(self.hash, '.json')
    })
  }
  var name = this.hash + '.' + transforms.hash
  return self.readSafely(name, '.json').then(function (json) {
    if (json) return json
    return self._transform(transforms).then(function () {
      return self.read(name, '.json')
    })
  })
}

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

// detect and filter which transforms to use from now on
// i.e. remove the transforms where .detect() fails
// we may remove this because it's pretty unnecessary
// this is only valid for strings
Ecstacy.prototype.detect = function (transforms, code) {
  code = strip(code) // don't detect within comments
  return transforms.filter(function (transform) {
    return transform.detect(code)
  })
}

// use a transform, but after initialization
// these bypass feature detection
Ecstacy.prototype.use = function (fn) {
  fn = this.lookup(fn)
  if (!fn) throw new Error('unknown transform')
  this.transforms.push(fn)
  return this
}

// filter the transforms by agents
Ecstacy.prototype._filter = function (agents) {
  var transforms = this.transforms
  if (!transforms.length) return []

  agents = agents || '' // count no agents as "default"
  var val
  var ua
  if (typeof agents === 'string') {
    // useragent
    val = this.cache.get(ua = agents)
    if (val) return val
  }

  if (agents) {
    agents = db.agents.parse(agents)
    val = db.agents.filter(transforms, agents)
  } else {
    val = transforms.slice()
  }

  val.hash = val.map(toId).join('-') // what to save the file as
  if (ua != null) this.cache.set(ua, val)
  return val
}

// calculate the sha256sum of a string or buffer
Ecstacy.calculate =
Ecstacy.prototype.calculate = function (string) {
  return crypto.createHash('sha256').update(string).digest('hex')
}

// read a cached file's name and extension
Ecstacy.read =
Ecstacy.prototype.read = function (name, ext, encoding) {
  if (typeof name === 'object') name = name.name
  var json = ext === '.json'
  if (json) encoding = 'utf8'
  var promise = fs.readFile(path.join(Ecstacy.folder, name + ext), encoding)
  if (json) promise = promise.then(JSON.parse)
  return promise
}

// .read() except it doesn't throw if the file does not exist
Ecstacy.readSafely =
Ecstacy.prototype.readSafely = function (name, ext, encoding) {
  return Ecstacy.read(name, ext, encoding).catch(reject)
}

function reject(err) {
  // XXX: bluebird wraps the Error in its own class, for some reason
  // see https://github.com/petkaantonov/bluebird#expected-and-unexpected-errors
  if (err.name === 'OperationalError' && err.cause)
    err = err.cause
  debug('read error: "%s"', err.stack)
  if (err.code !== 'ENOENT') throw err
}

Ecstacy.stream =
Ecstacy.prototype.stream = function (name, ext) {
  if (typeof name === 'object') name = name.name
  return fs.createReadStream(path.join(Ecstacy.folder, name + ext))
}

// write a file to the cache
Ecstacy.write =
Ecstacy.prototype.write = function (name, ext, data) {
  if (typeof name === 'object') name = name.name
  if (ext === '.json' && typeof data === 'object') data = JSON.stringify(data)
  return fs.writeFile(path.join(Ecstacy.folder, name + ext), data)
}

Ecstacy.prototype.gzip = function (name, ext) {
  var self = this
  if (typeof name === 'object') name = name.name
  return self.read(name, ext).then(gzip).then(function (buf) {
    return Promise.all([
      self.write(name, ext + '.gz', buf),
      self.update(name, [
        [ext + '.gz', buf.length]
      ])
    ])
  })
}

// update the .lengths in the JSON file
// we re-read then write this again to avoid any potential race conditions
Ecstacy.prototype.update = function (name, pairs) {
  var self = this
  if (typeof name === 'object') name = name.name
  return self.read(name, '.json').then(function (json) {
    for (var i = 0; i < pairs.length; i++) {
      json.length[pairs[i][0]] = pairs[i][1]
    }
    return self.write(name, '.json', json)
  })
}

function toId(x) {
  return typeof x.id === 'function' ? x.id() : x.shortName || x.name
}
