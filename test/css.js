
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
        transforms: true,
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
