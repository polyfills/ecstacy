
var mocha = require('fs').readFileSync(require.resolve('mocha/mocha.js'), 'utf8')
var profile = require('debug')('ecstacy:profile')

var Ecstacy = require('..')

Ecstacy.clean()
dryRun().then(function () {
  Ecstacy.clean()
  return withSourcemaps()
}).then(function () {
  Ecstacy.clean()
  return withoutSourcemaps()
}).catch(function (err) {
  throw err
})

function dryRun() {
  return Ecstacy.js({
    name: 'klajsdf',
    code: '',
  }).build()
}

function withSourcemaps() {
  profile('profiling mocha.js with sourcemaps')
  return Ecstacy.js({
    name: 'mocha1',
    code: mocha,
    transforms: true,
  }).build().then(function () {
    profile('built mocha.js with sourcemaps')
  })
}

function withoutSourcemaps() {
  profile('profiling mocha.js without sourcemaps')
  return Ecstacy.js({
    name: 'mocha2',
    code: mocha,
    sourcemaps: false,
    transforms: true,
  }).build().then(function () {
    profile('built mocha.js without sourcemaps')
  })
}
