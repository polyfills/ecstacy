
var fs = require('fs')
var path = require('path')
var assert = require('assert')
var rimraf = require('rimraf')

var Ecstacy = require('..')
Ecstacy.clean()

var ff30mobile = 'Mozilla/5.0 (Android; Mobile; rv:30.0) Gecko/30.0 Firefox/30.0'

describe('Ecstacy.js(code, map)', function () {
  describe('.build()', function () {
    describe('arrows.js', function () {
      var ecstacy = Ecstacy.js({
        name: 'arrow',
        code: fixture('arrow')
      })
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.name)
          assert(data.date)
          assert(data.hash)
          assert(data.length)
          assert(data.length['.js'])
        })
      })

      it('.read(name, .js)', function () {
        return ecstacy.read(data.name, '.js')
      })

      it('.read(name, .min.js)', function () {
        return ecstacy.minify(data.name).then(function () {
          return ecstacy.read(data.name, '.min.js')
        })
      })

      it('.read(name, .min.js.gz)', function () {
        return ecstacy.gzip(data.name, '.min.js').then(function () {
          return ecstacy.read(data.name, '.min.js.gz')
        })
      })
    })

    describe('es5', function () {
      var ecstacy = Ecstacy.js({
        name: 'es5',
        code: fixture('es5'),
      })
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.date)
          assert.equal(data.hash, ecstacy.hash)
          assert(data.length)
          assert(data.length['.js'])
        })
      })

      it('.read(name, .js)', function () {
        return ecstacy.read(data.name, '.js')
      })

      it('.read(name, .min.js)', function () {
        return ecstacy.minify(data.name).then(function () {
          return ecstacy.read(data.name, '.min.js')
        })
      })

      it('.read(name, .min.js.gz)', function () {
        return ecstacy.gzip(data.name, '.min.js').then(function () {
          return ecstacy.read(data.name, '.min.js.gz')
        })
      })
    })
  })
})

describe('Ecstacy.js Features', function () {
  describe('class', function () {

  })

  describe('arrow', function () {

  })

  describe('generators', function () {
    var code = fixture('generators')
    var ecstacy = Ecstacy.js({
      name: 'generators',
      code: code
    })
    var data

    describe('.build()', function () {
      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
        })
      })

      it('.read(name, .js)', function () {
        return ecstacy.read(data.name, '.js').then(function (js) {
          assert(!/\*/.test(js.toString()))
        })
      })
    })

    describe('.build(ff30)', function () {
      it('.then( data => )', function () {
        return ecstacy.build(ff30mobile).then(function (_data) {
          assert(data = _data)
        })
      })

      it('.read(name, .js)', function () {
        return ecstacy.read(data.name, '.js').then(function (js) {
          assert(/\*/.test(js.toString()))
        })
      })
    })
  })

  describe('templates', function () {

  })

  describe('default-params', function () {

  })

  describe('rest-params', function () {

  })

  describe('spread', function () {

  })

  describe('comprehensions', function () {

  })
})

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name + '.js'), 'utf8')
}
