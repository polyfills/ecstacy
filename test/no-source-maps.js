
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
          assert(data.length['.js'])
          assert(!data.length['.js.map'])
        })
      })

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.length['.js'])
          assert(!data.length['.js.map'])
        })
      })

      it('.read(name, .js)', function () {
        return ecstacy.read(data.name, '.js')
      })

      it('.read(name, .js) again', function () {
        return ecstacy.read(data.name, '.js')
      })

      it('.read(name, .js.map)', function () {
        return ecstacy.read(data.name, '.js.map').then(function () {
          throw new Error('boom')
        }).catch(function (err) {
          assert.equal(err.code, 'ENOENT')
        })
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
          assert(data.length['.css'])
          assert(!data.length['.css.map'])
        })
      })

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.length['.css'])
          assert(!data.length['.css.map'])
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
        return ecstacy.read(data.name, '.css.map').then(function () {
          throw new Error('boom')
        }).catch(function (err) {
          assert.equal(err.code, 'ENOENT')
        })
      })
    })
  })
})

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')
}
