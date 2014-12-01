
var transforms = require('polyfills-db').postcss.transform

describe('Ecstacy.css(code, map)', function () {
  describe('.build()', function () {
    describe('an empty file', function () {
      // postcss adds a space - whatever
      var ecstacy

      it('should still build', function () {
        ecstacy = Ecstacy.css({
          name: 'fleempty',
          code: fixture('empty'),
          transforms: true,
        })

        return ecstacy.build()
      })

      it('should build again', function () {
        return ecstacy.build()
      })
    })

    describe('with no transforms', function () {
      var ecstacy

      it('should still build', function () {
        ecstacy = Ecstacy.css({
          name: 'flex',
          code: fixture('flex'),
        })

        return ecstacy.build()
      })

      it('should build again', function () {
        return ecstacy.build()
      })
    })

    describe('calc.css', function () {
      var ecstacy = Ecstacy.css({
        name: 'calc',
        code: fixture('calc'),
        transforms: true,
      })
      ecstacy.use('calc')
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(data.map)
        })
      })

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(data.map)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code, 'utf8').then(function (css) {
          assert(!~css.indexOf('calc'))
        })
      })

      it('.read(data.code) again', function () {
        return ecstacy.read(data.code)
      })

      it('.read(data.map)', function () {
        return ecstacy.read(data.map)
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
          assert(data.hash)
          assert(data.code)
          assert(data.map)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code, 'utf8').then(function (css) {
          assert(~css.indexOf('-webkit'))
        })
      })
    })
  })
})

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name + '.css'), 'utf8')
}
