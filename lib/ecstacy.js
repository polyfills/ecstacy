
var os = require('os')
var fs = require('mz/fs')
var path = require('path')
var assert = require('assert')
var lru = require('lru-cache')
var memo = require('memorizer')
var db = require('polyfills-db')
var inherits = require('util').inherits
var Promise = require('native-or-bluebird')
var convert = require('convert-source-map')
var debug = require('debug')('ecstacy:ecstacy')

var utils = require('./utils')

module.exports = Ecstacy

/**
 * Setup the cache folder where builds are cached.
 */

{
  // TODO: take into account dependency versions
  var pkg = require('../package.json')
  var title = utils.hash('ecstacy-' + JSON.stringify(pkg))
  var tmpdir = os.tmpdir ? os.tmpdir() : os.tmpDir()
  var folder = path.resolve(tmpdir, title)
  require('mkdirp').sync(folder)

  // clean the cache folder
  Ecstacy.clean = function () {
    require('rimraf').sync(folder)
    require('mkdirp').sync(folder)
  }
}

/**
* Default LRU cache options for
* user-agent -> transforms lookups
* Note that this is per-ecstacy-instance,
* so this might become a memory leak if there are
* too many ecstacy instances being used.
*/

{
  Ecstacy.cache = {
    max: 100,
    maxAge: Infinity,
  }

  memo(Ecstacy.prototype, 'cache', function () {
    return lru(Ecstacy.cache)
  })
}

function Ecstacy(options) {
  options = options || {}

  this.code = this._parseSourceMap(options.code, options.map)
  // name of the file without extensions
  this.name = options.name || ('anonymous' + this.ext)
  this.sourcemaps = options.sourcemaps !== false
  this.transforms = this._defaultTransforms(options.transforms)
  this.hash = utils.hash([
    this.type,
    this.code,
    this.map,
    this.name,
    this.sourcemaps,
  ].join('|'))
}

/**
 * Create a new constructor based on `Ecstacy`.
 */

Ecstacy.extend = function (constructor) {
  inherits(constructor, Ecstacy)
  Object.keys(Ecstacy).forEach(function (key) {
    if (!constructor[key]) constructor[key] = Ecstacy[key]
  })
  return constructor
}

/**
* Use a transform.
*/

Ecstacy.prototype.use = function (transform) {
  if (typeof transform === 'string') {
    transform = this.constructor.transform[transform]
    assert(transform, 'could not find by the name of ' + arguments[0])
    this.transforms.push(transform)
  }
  this.transforms.push(transform)
  return this
}

/**
 * Get absolute location of a file
 */

Ecstacy.filename =
Ecstacy.prototype.filename = function (name) {
  return path.join(folder, name)
}

/**
 * Write a file to the cache
 */

Ecstacy.write =
Ecstacy.prototype.write = function (name, data) {
  return fs.writeFile(this.filename(name), data)
}

/**
 * Read a cached file's name and extension
 */

Ecstacy.read =
Ecstacy.prototype.read = function (name, encoding) {
  return fs.readFile(this.filename(name), encoding)
}

/**
 * Create a read stream from a file
 */

Ecstacy.stream =
Ecstacy.prototype.stream = function (name) {
  return fs.createReadStream(this.filename(name))
}

/**
 * Builds a specific transform and returns the file locations of the results.
 */

Ecstacy.prototype.build = function (agents) {
  var self = this
  var sourcemaps = this.sourcemaps
  var transforms = this._filter(agents)
  if (!transforms.length) { // no transforms
    debug('building %o -> %o', agents, transforms.hash)
    return this._initialize.then(function () {
      return {
        hash: self.hash,
        code: self.hash + self.ext,
        map: sourcemaps
          ? (self.hash + '.map')
          : '',
      }
    })
  }

  var hash = utils.hash(this.hash + transforms.hash)
  debug(transforms.hash)
  debug(hash)
  var result = {
    hash: hash,
    code: hash + self.ext,
    map: sourcemaps
      ? (hash + '.map')
      : '',
  }
  return fs.exists(this.filename(hash + this.ext)).then(function (exists) {
    debug('exists: ' + exists)
    if (exists) return result
    return self._getOriginal().then(function (og) {
      var out = self._transform(og.code, og.map, transforms)
      var promises = [self.write(hash + self.ext, out.code)]
      if (sourcemaps) promises.push(self.write(hash + '.map', out.map))
      return Promise.all(promises).then(function () {
        debug('built')
        return result
      })
    })
  })
}

/**
 * Parse the source map and make sure it's JSON.
 */

Ecstacy.prototype._parseSourceMap = function (code, map) {
  // remove the source map if it exists
  if (map) {
    // keep it a string
    if (typeof map === 'string') this.map = map
    else this.map = convert.fromObject(map).toJSON()
  } else if (map = convert.fromSource(code)) {
    code = convert.removeComments(code)
    this.map = map.toJSON()
  }

  this.map = this.map || ''

  return code
}

/**
 * Filter the transforms by useragents
 */

Ecstacy.prototype._filter = function (agents) {
  var transforms = this.transforms
  if (!transforms.length) return []

  // setup agents
  agents = agents || '' // count no agents as "default"
  var val
  var ua
  if (typeof agents === 'string') {
    // useragent
    val = this.cache.get(ua = agents)
    if (val) return val
  }

  // filter transforms
  if (agents) {
    agents = db.agents.parse(agents)
    val = db.agents.filter(transforms, agents)
  } else {
    val = transforms.slice()
  }

  val.hash = utils.hash(val.map(toHash).join('-'))
  if (ua != null) this.cache.set(ua, val)
  return val
}

/**
* What to hash the transform as.
* Each transform could have a custom hash.
*/

function toHash(x) {
  return x.hash || x.shortName || x.name
}

/**
 * Checks the transform options.
 */

Ecstacy.prototype._defaultTransforms = function (transforms) {
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
      return transforms[transform.name]
        || transforms[transform.shortName]
    })
  }
  return []
}

/**
* The initial step is to save the file to disk.
* Any future compilations will read the file to disk.
* The main purpose of this is to avoid additional memory usage during runtime.
* You don't want/need to keep all your files in memory in production.
*/

memo(Ecstacy.prototype, '_initialize', function () {
  var self = this
  var promises = [this.write(this.hash + this.ext, this.code)]
  if (this.sourcemaps) promises.push(this.write(this.hash + '.map', this.map))
  return Promise.all(promises).then(function () {
    delete self.code
    delete self.map
  })
})

/**
* Get the original code and map so we can do transforms on it.
*/

Ecstacy.prototype._getOriginal = function () {
  var self = this
  var sourcemaps = this.sourcemaps
  return this._initialize.then(function () {
    var promises = [self.read(self.hash + self.ext, 'utf8')]
    if (sourcemaps) promises.push(self.read(self.hash + '.map', 'utf8'))
    return Promise.all(promises)
  }).then(toResult)
}

function toResult(x) {
  return {
    code: x[0],
    map: x.length > 1 ? x[1] : ''
  }
}
