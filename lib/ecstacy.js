
var os = require('os')
var fs = require('mz/fs')
var path = require('path')
var assert = require('assert')
var lru = require('lru-cache')
var memo = require('memorizer')
var db = require('polyfills-db')
var crypto = require('mz/crypto')
var inherits = require('util').inherits
var convert = require('convert-source-map')
var Promise = require('native-or-bluebird')
var debug = require('debug')('ecstacy:ecstacy')

var tmpdir = os.tmpdir
  ? os.tmpdir()
  : os.tmpDir()

module.exports = Ecstacy

Ecstacy.folder =
Ecstacy.prototype.folder = path.resolve(tmpdir, 'ecstacy')
require('mkdirp').sync(path.join(Ecstacy.folder, 'js'))
require('mkdirp').sync(path.join(Ecstacy.folder, 'css'))

// clean the cache folder
Ecstacy.clean = function () {
  require('rimraf').sync(Ecstacy.folder)
  require('mkdirp').sync(path.join(Ecstacy.folder, 'js'))
  require('mkdirp').sync(path.join(Ecstacy.folder, 'css'))
}

function Ecstacy() {}

Ecstacy.extend = function (constructor) {
  inherits(constructor, Ecstacy)
  Object.keys(Ecstacy).forEach(function (key) {
    if (!constructor[key]) constructor[key] = Ecstacy[key]
  })
  return constructor
}

// default LRU cache options
Ecstacy.cache = {
  max: 100,
  maxAge: Infinity,
}

memo(Ecstacy.prototype, 'cache', function () {
  return lru(Ecstacy.cache)
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
    if (typeof map === 'string') this.map = map
    else this.map = convert.fromObject(map).toJSON()
  } else if (map = convert.fromSource(code)) {
    code = convert.removeComments(code)
    this.map = map.toJSON()
  }

  return code
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

  if (this.type === 'js') {
    var names = val.map(toName)
    var i = names.indexOf('async')
    if (~i && ~names.indexOf('generators')) val.splice(i, 1);
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

Ecstacy.filename =
Ecstacy.prototype.filename = function (name, ext) {
  return path.join(this.folder, this.type, name + ext)
}

// read a cached file's name and extension
Ecstacy.read =
Ecstacy.prototype.read = function (name, ext, encoding) {
  if (typeof name === 'object') name = name.name
  var json = ext === '.json'
  if (json) encoding = 'utf8'
  var promise = fs.readFile(this.filename(name, ext), encoding)
  if (json) promise = promise.then(JSON.parse)
  return promise
}

// .read() except it doesn't throw if the file does not exist
Ecstacy.readSafely =
Ecstacy.prototype.readSafely = function (name, ext, encoding) {
  return this.read(name, ext, encoding).catch(reject)
}

function reject(err) {
  debug('read error: "%s"', err.stack)
  if (err.code !== 'ENOENT') throw err
}

Ecstacy.stream =
Ecstacy.prototype.stream = function (name, ext) {
  if (typeof name === 'object') name = name.name
  return fs.createReadStream(this.filename(name, ext))
}

// write a file to the cache
Ecstacy.write =
Ecstacy.prototype.write = function (name, ext, data) {
  if (typeof name === 'object') name = name.name
  if (ext === '.json' && typeof data === 'object') data = JSON.stringify(data)
  return fs.writeFile(this.filename(name, ext), data)
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

Ecstacy.prototype.defaultTransforms = function (transforms) {
  var constructor = this.constructor
  var _transform = constructor.transform
  var _transforms = constructor.transforms
  // return all
  if (transforms === true) return _transforms.slice()
  // array of transforms or transform names
  if (Array.isArray(transforms)) {
    return transforms.map(function (transform) {
      if (typeof transform === 'string') return _transform[transform]
      return transform
    }).filter(Boolean)
  }
  if (typeof transforms === 'object') {
    return _transforms.filter(function (transform) {
      return _transforms[transform.name]
        || _transforms[transform.shortName]
    })
  }
  return []
}

// use a transform, but after initialization
Ecstacy.prototype.use = function (transform) {
  if (typeof transform === 'string') {
    transform = this.constructor.transform[transform]
    assert(transform, 'could not find by the name of ' + arguments[0])
    this.transforms.push(transform)
  }
  this.transforms.push(transform)
  return this
}

function toId(x) {
  return typeof x.id === 'function' ? x.id() : x.shortName || x.name
}

function toName(x) {
  return x.name;
}
