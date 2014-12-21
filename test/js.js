
describe('Ecstacy.js.prototype._defaultTransforms', function () {
  it('([names...])', function () {
    var names = ['arrowfn']
    var transforms = Ecstacy.js.prototype._defaultTransforms(names)
    assert(transforms.length === 1)
  })

  it('({ name: true })', function () {
    var names = {
      arrowfn: true,
      gens: true,
    }
    var transforms = Ecstacy.js.prototype._defaultTransforms(names)
    assert(transforms.length === 2)
  })
})

describe('Ecstacy.js(code, map)', function () {
  describe('.build()', function () {
    describe('with an empty file', function () {
      var ecstacy

      it('should still build', function () {
        ecstacy = Ecstacy.js({
          name: 'empty',
          code: fixture('empty'),
          transforms: true,
        })

        return ecstacy.build().then(function (data) {
          return ecstacy.read(data.code, 'utf8')
        }).then(function (js) {
          assert(!js)
        })
      })

      it('should build again', function () {
        return ecstacy.build().then(function (data) {
          return ecstacy.read(data.code, 'utf8')
        }).then(function (js) {
          assert(!js)
        })
      })
    })

    describe('with no transforms', function () {
      var ecstacy

      it('should still build', function () {
        ecstacy = Ecstacy.js({
          name: 'arrow',
          code: fixture('arrow'),
          transforms: [],
        })

        return ecstacy.build().then(function (data) {
          return ecstacy.read(data.code, 'utf8')
        }).then(function (js) {
          assert.equal(js, fixture('arrow'))
        })
      })

      it('should build again', function () {
        return ecstacy.build().then(function (data) {
          return ecstacy.read(data.code, 'utf8')
        }).then(function (js) {
          assert.equal(js, fixture('arrow'))
        })
      })
    })

    describe('destruct.js', function () {
      var ecstacy = Ecstacy.js({
        name: 'destruct',
        code: fixture('destruct'),
        transforms: true
      })
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function( _data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(data.map)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code, 'utf8').then(function (js) {
          assert(!~js.indexOf('var [a, b]'))
        })
      })
    })

    describe('destruct-stuff.js', function () {
      var ecstacy = Ecstacy.js({
        name: 'destruct-stuff',
        code: fixture('destruct-stuff'),
        transforms: true
      })
      var data

      it('.then( data => )', function () {
        return ecstacy.build().then(function( _data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(data.map)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code, 'utf8').then(function (js) {
          assert(!~js.indexOf('var [a, b]'))
        })
      })
    })

    describe('arrows.js', function () {
      var ecstacy = Ecstacy.js({
        name: 'arrow',
        code: fixture('arrow'),
        transforms: true,
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

      it('.then( data => ) again', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
          assert(data.hash)
          assert(data.code)
          assert(data.map)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code)
      })

      it('.read(data.code) again', function () {
        return ecstacy.read(data.code)
      })

      it('.read(data.map)', function () {
        return ecstacy.read(data.map)
      })
    })

    describe('es5', function () {
      var ecstacy = Ecstacy.js({
        name: 'es5',
        code: fixture('es5'),
        transforms: true,
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
        return ecstacy.read(data.code)
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
      code: code,
      transforms: true,
    })
    var data

    describe('.build()', function () {
      it('.then( data => )', function () {
        return ecstacy.build().then(function (_data) {
          assert(data = _data)
        })
      })

      it('.read(data.code)', function () {
        return ecstacy.read(data.code, 'utf8').then(function (js) {
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

      it('.read(data.code)', function () {
        return ecstacy.read(data.code, 'utf8').then(function (js) {
          assert(/\*/.test(js.toString()))
        })
      })

      it('.stream(data.code)', function (done) {
        var stream = ecstacy.stream(data.code)
        stream.resume()
        stream.on('error', done)
        stream.once('end', done)
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

  describe('async', function () {
    var code = fixture('async')
    var ecstacy = Ecstacy.js({
      name: 'async',
      code: code,
      transforms: true,
    })
    var data

    it('.build()', function () {
      return ecstacy.build().then(function (data) {
        return ecstacy.read(data.code, 'utf8')
      }).then(function (js) {
        assert(~js.indexOf('regeneratorRuntime'))
        assert(!~js.indexOf('asyncFnRuntime'))
      })
    })

    it('.build(ff30)', function () {
      return ecstacy.build(ff30mobile).then(function (data) {
        return ecstacy.read(data.code, 'utf8')
      }).then(function (js) {
        assert(~js.indexOf('asyncFnRuntime'))
      })
    })
  })

  describe('esprima', function () {
    it('should parse modules', function () {
      var code = fixture('module')
      var ecstacy = Ecstacy.js({
        name: 'module',
        code: code,
        transforms: true,
      })

      return ecstacy.build().then(function (data) {
        return ecstacy.read(data.code, 'utf8')
      }).then(function (js) {
        assert(/^export default /.test(js.trim()))
      })
    })
  })
})

function fixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name + '.js'), 'utf8')
}
