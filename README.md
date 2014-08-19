
# ecstacy

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gittip][gittip-image]][gittip-url]

The perfect middleware between your static file server and the browser.
Minifies, compresses, and caches files served to the client.
If it's JS or CSS, it also transpiles unsupported features of the target browser.
You may also use this in your build process to create browser-specific builds.
It's [traceur](https://github.com/google/traceur-compiler) and [myth](http://github.com/segmentio/myth) on steroids.

The goal of this project is to create a frontend flow where:

- JS, CSS, and HTML are written using the latest specifications (ES6, HTML imports, etc.)
- The server resolves the dependencies tree
- The server uses Ecstacy to transpile each file according to the target client
- The server uses Ecstacy to minify, compress, and cache each file
- The server SPDY pushes the files to the client

Combined with [polyfills](https://github.com/polyfills/polyfills),
you can use most of the latest features of browsers with relative ease.

There's no:

- Build step to transpile your JS/CSS
- Build step to concatenate your assets
- Deploy step to create builds for every supported platform
- Very little difference between the development and production environments

Features:

- Currently only supports JS, but will support CSS, HTML, etc.
- Supports source maps, even inlined ones
- Last-Modified and ETag (sha256 sum) header support
- Globally caches based on sha256 sums

## API

```js
var Ecstacy = require('ecstacy')
```

### Ecstacy.folder

The cache folder where all the transpiled JS, minified, and gzipped files are saved.
This build folder is __global__, but because code is cached based on a
`sha256` sum, there should not be any conflicts.

### Ecstacy.clean()

Delete the entire cache folder.

### Ecstacy.cache = {}

Per-file `lru` cache options. Defaults to:

- `max` - `100`
- `maxAge` - `Infinity`

These cache `useragent -> transforms` lookups per instance.
Each cached object is pretty low memory since they are simply references to objects already in memory.

### Ecstacy

All `Ecstacy` constructors have the following API:

#### var ecstacy = new Ecstacy(options)

Create a new instance. Some options are:

- `name` - the name of the file, specifically for source maps
- `map` - the source map, if any

### ecstacy.build(agents).then( data => )

"Builds" a version of the file according to `agents`.
`agents` is simply passed tp [polyfills-db](https://github.com/polyfills/db).
`data` is an object with the following properties:

- `name` - the name of the file of the build
- `date` - the date this build was created for `Last-Modified` headers
- `hash` - a `sha256` sha sum of the JS file in `hex` encoding for `ETag` headers
- `transforms[]` - an array of all the transform names used
- `length[extension]` - the byte size of each build for `Content-Length` headers

### ecstacy.read(name, extension, encoding).then( buf => )

Read a file by its `data.name` and `extension`.
Returns a `Buffer`, so you need to `.toString()` it yourself.

```js
var ecstacy = Ecstacy(code)
ecstacy.build(useragent).then(function (data) {
  return ecstacy.read(data.name, '.js', 'utf8')
}).then(function (js) {

})
```

You may want to serve the smallest of `data.length['.min.js.gz']`
and `data.length['.min.js']` if you like to over-optimize.
You also probably don't need to stringify the buffer to send it to the client.

### ecstacy.stream(name, extension)

Create a read stream for a file and extension instead of buffering it.
Useful when serving files to the client.

### ecstacy.minify(name).then( => )

Minify the asset and add its content length to `data.length`.

### ecstacy.gzip(name, ext).then( => )

Minify an already existing file by its name and extension,
and add its content length to `data.length`.

### ecstacy.sourcemaps = <Boolean>

By default, source maps are always enabled.
However, there is a performance penalty when using source maps.
You may opt out of source maps by setting `ecstacy.sourcemaps = false`
on every `Ecstacy` instance.

Switching `.sourcemaps` between `true` or `false` is not supported
as files will be cached differently every time.
Everytime you switch `.sourcemaps`' value,
you must run `Ecstacy.clean()` to clean the cache.

## JS

### var ecstacy = new Ecstacy.js(options)

Some additional options are:

- `code` - the JS code

#### ecstacy.build(agents).then( data => )

Some additional fields:

- `transforms[]` - an array of all the transform names used

All the possible extensions:

- `.json` - the returns data
- `.js`
- `.js.gz`
- `.js.map`
- `.js.map.gz`
- `.min.js`
- `.min.js.gz`
- `.min.js.map`
- `.min.js.map.gz`

## Notes

- UglifyJS currently does not support ES6 syntax.
- Source maps are __not currently tested__.

[npm-image]: https://img.shields.io/npm/v/ecstacy.svg?style=flat
[npm-url]: https://npmjs.org/package/ecstacy
[travis-image]: https://img.shields.io/travis/polyfills/ecstacy.svg?style=flat
[travis-url]: https://travis-ci.org/polyfills/ecstacy
[coveralls-image]: https://img.shields.io/coveralls/polyfills/ecstacy.svg?style=flat
[coveralls-url]: https://coveralls.io/r/polyfills/ecstacy?branch=master
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat
[gittip-url]: https://www.gittip.com/jonathanong/
