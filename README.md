
# ecstacy

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![Gittip][gittip-image]][gittip-url]

The perfect middleware between your static file server and the browser.
Minifies, compresses, and caches files served to the client.
If it's JS or CSS, it also transpiles unsupported features of the target browser.
You may also use this in your build process to create browser-specific builds.
It's [traceur](https://github.com/google/traceur-compiler) and [myth](http://github.com/segmentio/myth) on steroids.

The goal of this project is to create a frontend flow where:

- JS, CSS, and HTML are written using the latest specifications (ES6, HTML imports, etc.)
- The server resolves the dependencies tree
- The server uses Ecstacy to transpile each file according to the target client and caches
- The server HTTP2 pushes the files to the client

Combined with [polyfills](https://github.com/polyfills/polyfills),
you can use most of the latest features of browsers with relative ease.

There's no:

- Build step to transpile your JS/CSS
- Build step to concatenate your assets
- Deploy step to create builds for every supported platform
- Very little difference between the development and production environments

Features:

- Supports CSS and JS
- Supports source maps, even inlined ones
- Caching

## API

```js
var Ecstacy = require('ecstacy')
```

### Builders

There are two builders.

- `Ecstacy.js`
- `Ecstacy.css`

Both inherit from `Ecstacy`, defined below.

### Ecstacy.clean()

Delete the entire cache folder.

### Ecstacy

All `Ecstacy` constructors have the following API:

#### var ecstacy = new Ecstacy(options)

Create a new instance. Some options are:

- `name` - the name of the file, specifically for source maps
- `code` - source code
- `map` - the source map, if any

### ecstacy.build(agents).then( data => )

"Builds" a version of the file according to `agents`.
`agents` is simply passed tp [polyfills-db](https://github.com/polyfills/db).
`data` is an object with the following properties:

- `hash` - the build hash
- `code` - the filename for the code
- `map` - the filename for the map

### var filename = ecstacy.filename(name)

Get the absolute filename of a file.

### ecstacy.read(name, encoding).then( buf => )

Read a file by its name.
Returns a `Buffer`, so you need to `.toString()` it yourself.

```js
var ecstacy = Ecstacy.js({
  code: 'var a = b;'
})
ecstacy.build(useragent).then(function (data) {
  return ecstacy.read(data.code, 'utf8')
}).then(function (js) {

})
```

### ecstacy.stream(name)

Create a read stream for a file and extension instead of buffering it.
Useful when serving files to the client.

[npm-image]: https://img.shields.io/npm/v/ecstacy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ecstacy
[github-tag]: http://img.shields.io/github/tag/polyfills/ecstacy.svg?style=flat-square
[github-url]: https://github.com/polyfills/ecstacy/tags
[travis-image]: https://img.shields.io/travis/polyfills/ecstacy.svg?style=flat-square
[travis-url]: https://travis-ci.org/polyfills/ecstacy
[coveralls-image]: https://img.shields.io/coveralls/polyfills/ecstacy.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/polyfills/ecstacy?branch=master
[david-image]: http://img.shields.io/david/polyfills/ecstacy.svg?style=flat-square
[david-url]: https://david-dm.org/polyfills/ecstacy
[license-image]: http://img.shields.io/npm/l/ecstacy.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/ecstacy.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/ecstacy
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat-square
[gittip-url]: https://www.gittip.com/jonathanong/
