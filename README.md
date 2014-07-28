
# ecstacy

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gittip][gittip-image]][gittip-url]

The ideal JS development environment that'll make writing JS actually fun.
Write your JS in the latest ES syntax,
then serve compiled JS specific to the browser.
If your code as generators,
it compiles your JS to ES6 using [regenerator](https://github.com/facebook/regenerator),
otherwise it just serves it as is.

The end goal of this project is to create a frontend flow where:

- Dependencies are written with ES6 modules or HTML imports
- Files are SPDY pushed to the client
- If JS uses an unsupported feature for the browser, it will be transpiled down

There's no build step to transpile your JS or a deploy step to create builds for every supported platform.

Features:

- Transpiles, minifies, and gzips all the JS and caches them
- Supports source maps, even inlined ones
- Last-Modified and ETag header support

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

### var ecstacy = new Ecstacy(js, [map])

Create a new instance based on `js` with an optional source `map`.
Inline source maps are also supported.

Some public properties:

- `.code` - the JS without source maps
- `.map` - the source map, if any
- `.hash` - the `sha256` sum of the JS

### ecstacy.build(useragent).then( data => )

Transpiles the JS and returns metadata on them.

- `name` - the name of the build
- `date` - the date this build was created for `Last-Modified` headers
- `hash` - a `sha256` sha sum of the JS file in `hex` encoding for `ETag` headers
- `transforms[]` - an array of all the transform names used
- `length[extension]` - the byte size of each build for `Content-Length` headers

If no transforms were used, then `name === hash` and `hash === ecstacy.hash`.
The possible extensions are:

- `.json` - the returns data
- `.js`
- `.js.gz`
- `.js.map`
- `.js.map.gz`
- `.min.js`
- `.min.js.gz`
- `.min.js.map`
- `.min.js.map.gz`

### ecstacy.read(name, extension).then( buf => )

Read a file by its `data.name` and `extension`.
Returns a `Buffer`, so you need to `.toString()` it yourself.

```js
var ecstacy = Ecstacy(code)
ecstacy.build(useragent).then(function (data) {
  return ecstacy.read(data.name, '.min.js.gz')
}).then(function (buf) {
  return buf.toString()
})
```

You may want to serve the smallest of `data.length['.min.js.gz']`
and `data.length['.min.js']` if you like to over-optimize.
You also probably don't need to stringify the buffer to send it to the client.

### ecstacy.use(transform)

Use a custom transform in additional to the included ones.

## Notes

- UglifyJS currently does not support ES6 syntax, so JS with ES6 syntax
  will not be minified. If not minified, `data.length['min.js']` will be `0`.
- Runtimes for any transforms are __not included__.
  Still need to figure out a good story for this.
- Source maps are __not tested__. Please add tests!

[npm-image]: https://img.shields.io/npm/v/ecstacy.svg?style=flat
[npm-url]: https://npmjs.org/package/ecstacy
[travis-image]: https://img.shields.io/travis/polyfills/ecstacy.svg?style=flat
[travis-url]: https://travis-ci.org/polyfills/ecstacy
[coveralls-image]: https://img.shields.io/coveralls/polyfills/ecstacy.svg?style=flat
[coveralls-url]: https://coveralls.io/r/polyfills/ecstacy?branch=master
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat
[gittip-url]: https://www.gittip.com/jonathanong/
