
fs = require('fs')
path = require('path')
assert = require('assert')
rimraf = require('rimraf')

Ecstacy = require('..')
Ecstacy.clean()

ff30mobile = 'Mozilla/5.0 (Android; Mobile; rv:30.0) Gecko/30.0 Firefox/30.0'

require('./js')
require('./css')
