
var transforms = require('polyfills-db').postcss.transform

describe('Ecstacy.css(code, map)', function () {
  describe('.build()', function () {
    describe('with no transforms', function () {
      var ecstacy

      it('should still build', function () {
        ecstacy = Ecstacy.css({
          name: 'flex',
          code: fixture('flex'),
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

    describe('calc.css', function () {
      var ecstacy = Ecstacy.css({
        name: 'calc',
        code: fixture('calc'),
      })
      ecstacy.use('calc')
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.name)
          assert(data.date)
          assert(data.hash)
          assert(data.length)
          assert(data.length['.css'])
        })
      })

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.name)
          assert(data.date)
          assert(data.hash)
          assert(data.length)
          assert(data.length['.css'])
        })
      })

      it('.read(name, .css)', function () {
        return ecstacy.read(data.name, '.css', 'utf8').then(function (css) {
          assert(!~css.indexOf('calc'))
        })
      })

      it('.read(name, .css) again', function () {
        return ecstacy.read(data.name, '.css')
      })

      it('.read(name, .css.map)', function () {
        return ecstacy.read(data.name, '.css.map')
      })

      it('.read(name, .min.css)', function () {
        return ecstacy.minify(data.name).then(function () {
          return ecstacy.read(data.name, '.min.css', 'utf8')
        }).then(function (js) {
          assert(!~js.indexOf('undefined'))
          assert(!~js.indexOf('sourceMappingURL'))
        })
      })

      it('.read(name, .min.css.gz)', function () {
        return ecstacy.gzip(data.name, '.min.css').then(function () {
          return ecstacy.read(data.name, '.min.css.gz')
        })
      })

      it('.stream(name, .min.css.gz)', function (done) {
        var stream = ecstacy.stream(data.name, '.min.css.gz')
        stream.resume()
        stream.once('end', done)
        stream.once('error', done)
      })
    })

    describe('flex.css', function () {
      var ecstacy = Ecstacy.css({
        name: 'flex',
        code: fixture('flex'),
        transforms: [transforms.autoprefixer],
      })
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.name)
          assert(data.date)
          assert(data.hash)
          assert(data.length)
          assert(data.length['.css'])
        })
      })

      it('.read(name, .css)', function () {
        return ecstacy.read(data.name, '.css', 'utf8').then(function (css) {
          assert(~css.indexOf('-webkit'))
        })
      })
    })
  })
})

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name + '.css'), 'utf8')
}
