
var ua = require('useragent')
var recast = require('recast')
var assert = require('assert')
var gzip = require('mz/zlib').gzip
var strip = require('strip-comments')
var minify = require('uglify-js').minify
var applySourceMap = require('apply-source-map')
var transforms = require('polyfills-db').recast.transforms

require('useragent/features')

require('./ecstacy').extend(JS)

module.exports = JS

function JS(code, map) {
  if (!(this instanceof JS)) return new JS(code, map)

  // custom transforms to use
  this.transforms = []

  this.code = this.parseSourceMap(code)
  // files will be saved as <sha256sum>.<build hash>.js
  this.hash = this.calculate(this.code)
}

// we have to parse on every build :(
JS.prototype.ast = function () {
  return recast.parse(this.code, {
    sourceFileName: this.hash + '.js'
  })
}

// add custom transforms
JS.prototype.use = function (transform) {
  assert(transform.name)
  assert(transform.detect)
  assert(transform.filter)
  assert('transform' in transform)
  this.transforms.push(transform)
  return this
}

// out minify function, which develoeprs may override
JS.prototype.minify = function (code, mapName, map) {
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
      ? applySourceMap(result.map, map)
      : JSON.stringify(result.map)
  }
}

JS.prototype.build = function (useragent) {
  var self = this
  var transforms = this._transform(useragent)
  if (!transforms.length) {
    return this.read(this.hash, '.json').then(stringify, function () {
      return self._buildOriginal()
    })
  }

  return this.read(this.hash + '.' + transforms.hash, '.json').then(stringify, function () {
    return self._buildTransform(transforms)
  })
}


// detect and filter which transforms to use from now on
// i.e. remove the transforms where .detect() fails
JS.prototype._detect = function () {
  if (this._transforms) return this._transforms

  var stripped = strip(this.code)
  return this._transforms = transforms.concat(this.transforms).filter(function (transform) {
    return transform.detect(stripped)
  })
}

// filter the transforms by the useragent
JS.prototype._transform = function (useragent) {
  var val = this.cache.get(useragent)
  if (val) return val

  // the case when no features were detected
  var transforms = this._detect()
  if (!transforms.length) {
    this.cache.set(useragent, [])
    return []
  }

  var agent = ua.parse(useragent)
  val = transforms.filter(function (transform) {
    return transform.filter(agent)
  })
  val.hash = val.map(toName).join('-')
  this.cache.set(useragent, val)
  return val
}

JS.prototype._buildOriginal = function () {
  var write = this.write
  var code = this.code
  var name = this.hash
  var hash = this.hash
  var map = this.map

  var minified = this.minify(code, hash + '.min.js.map')
  var compressFiles = [
    gzip(code),
    gzip(minified.code),
    gzip(minified.map)
  ]

  if (map) compressFiles.push(gzip(this.map))

  return Promise.all(compressFiles).then(function (gzipped) {
    var data = {
      name: name,
      date: new Date().toUTCString(),
      hash: hash,
      transforms: [],
      length: {
        '.js': Buffer.byteLength(code),
        '.min.js': Buffer.byteLength(minified.code),
        '.min.js.map': Buffer.byteLength(minified.map),
        '.js.gz': gzipped[0].length,
        '.min.js.gz': gzipped[1].length,
        '.min.js.map.gz': gzipped[2].length,
      }
    }

    if (map) {
      data.length['.js.map'] = Buffer.byteLength(map)
      data.length['.js.map.gz'] = gzipped[3].length
    }

    var writeFiles = [
      write(name, '.json', JSON.stringify(data)),
      write(name, '.js', code),
      write(name, '.min.js', minified.code),
      write(name, '.min.js.map', minified.map),
      write(name, '.js.gz', gzipped[0]),
      write(name, '.min.js.gz', gzipped[1]),
      write(name, '.min.js.map.gz', gzipped[2]),
    ]

    if (map) {
      writeFiles.push(write(name, '.js.map', map))
      writeFiles.push(write(name, '.js.map.gz', gzipped[3]))
    }

    return Promise.all(writeFiles).then(function () {
      return data
    })
  })
}

JS.prototype._buildTransform = function (transforms) {
  var calculate = this.calculate
  var write = this.write
  var name = this.hash + '.' + transforms.hash

  var ast = this.ast()
  transforms.forEach(function (transform) {
    ast = transform.transform(ast)
  })
  var result = recast.print(ast, {
    sourceMapName: name + '.js.map'
  })
  var result_map = this.map
    ? applySourceMap(result.map, this.map)
    : JSON.stringify(result.map)

  var minified = this.minify(result.code, name + '.min.js.map', result_map)

  return Promise.all([
    gzip(result.code),
    gzip(result_map),
    gzip(minified.code),
    gzip(minified.map),
  ]).then(function (gzipped) {
    var data = {
      name: name,
      date: new Date().toUTCString(), // last-modified
      hash: calculate(result.code), // etag
      // content-length of all the files
      transforms: transforms.map(toName),
      length: {
        '.js': Buffer.byteLength(result.code),
        '.js.map': Buffer.byteLength(result_map),
        '.min.js': Buffer.byteLength(minified.code),
        '.min.js.map': Buffer.byteLength(minified.map),
        '.js.gz': gzipped[0].length,
        '.js.map.gz': gzipped[1].length,
        '.min.js.gz': gzipped[2].length,
        '.min.js.map.gz': gzipped[3].length,
      }
    }

    return Promise.all([
      write(name, '.json', JSON.stringify(data)),
      write(name, '.js', result.code),
      write(name, '.js.map', result_map),
      write(name, '.min.js', minified.code),
      write(name, '.min.js.map', minified.map),
      write(name, '.js.gz', gzipped[0]),
      write(name, '.js.map.gz', gzipped[1]),
      write(name, '.min.js.gz', gzipped[2]),
      write(name, '.min.js.map.gz', gzipped[3]),
    ]).then(function () {
      return data
    })
  })
}

function toName(x) {
  return x.name
}

function stringify(data) {
  data = JSON.parse(data.toString())
  data.date = new Date(data.date)
  return data
}
