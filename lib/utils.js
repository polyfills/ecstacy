
var crypto = require('crypto')

exports.hash = function (string) {
  return crypto.createHash('sha1').update(string).digest('hex')
}
