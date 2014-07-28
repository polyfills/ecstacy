
var Sauce = require('source-map')
var Consumer = Sauce.SourceMapConsumer
var Generator = Sauce.SourceMapGenerator

exports.applySourceMap = function (map, from) {
  var generator = Generator.fromSourceMap(new Consumer(map))
  generator.applySourceMap(new Consumer(from))
  return generator.toString()
}
