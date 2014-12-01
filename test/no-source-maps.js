
describe('.sourcemaps = false', function () {
  before(function () {
    Ecstacy.clean()
  })

  describe('Ecstacy.js(code, map)', function () {
    describe('arrows.js', function () {
      var ecstacy
      var data

      before(function () {
        ecstacy = Ecstacy.js({
          name: 'arrow',
          code: fixture('arrow.js'),
          sourcemaps: false,
          transforms: true,
        })
      })

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(!data.map)
        })
      })

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(!data.map)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code)
      })

      it('.read(data.code) again', function () {
        return ecstacy.read(data.code)
      })
    })
  })

  describe('Ecstacy.css(code, map)', function () {
    describe('calc.css', function () {
      var ecstacy
      var data

      before(function () {
        ecstacy = Ecstacy.css({
          name: 'calc',
          code: fixture('calc.css')
        })
        ecstacy.use('calc')
        ecstacy.sourcemaps = false
      })

      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(!data.map)
        })
      })

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(!data.map)
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
    })
  })
})

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')
}
