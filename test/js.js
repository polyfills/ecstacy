
describe('Ecstacy.js(code, map)', function () {
  describe('.build()', function () {
    describe('with no transforms', function () {
      var ecstacy

      it('should still build', function () {
        ecstacy = Ecstacy.js({
          name: 'arrow',
          code: fixture('arrow'),
          transforms: [],
        })

        return ecstacy.build().then(function (data) {
          assert.equal(data.hash, ecstacy.hash)
        })
      })

      it('should build again', function () {
        return ecstacy.build().then(function (data) {
          assert.equal(data.hash, ecstacy.hash)
        })
      })
    })

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

      it('.then( data => ) again', function () {
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

      it('.read(name, .js) again', function () {
        return ecstacy.read(data.name, '.js')
      })

      it('.read(name, .min.js)', function () {
        return ecstacy.minify(data.name).then(function () {
          return ecstacy.read(data.name, '.min.js', 'utf8')
        }).then(function (js) {
          new Function(js)
          assert(!~js.indexOf('undefined'))
          assert(!~js.indexOf('sourceMappingURL'))
        })
      })

      it('.read(name, .min.js.gz)', function () {
        return ecstacy.gzip(data.name, '.min.js').then(function () {
          return ecstacy.read(data.name, '.min.js.gz')
        })
      })

      it('.stream(name, .min.js.gz)', function (done) {
        var stream = ecstacy.stream(data.name, '.min.js.gz')
        stream.resume()
        stream.once('end', done)
        stream.once('error', done)
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
