
// http://kangax.github.io/compat-table/es6/
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/ECMAScript_6_support_in_Mozilla

module.exports = Transform

/**
 * We create a transform object for convenience.
 * Essentially, all it does is provide a default user-agent filter
 * defaulting to all browsers, and lazy loads the modules.
 *
 * The idea behind `.detect` is to be able to skip transforms
 * and perhaps skip parsing entirely if no transforms are needed.
 */

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options)

  this.name = options.name || options.module.replace(/^es6-/, '')
  this.moduleName = options.module
  this.detect = options.detect
  this.filter = options.filter || this.filter
}

// by default, always include this transform
Transform.prototype.filter = always

// .transform(ast) with lazy laoding
Transform.prototype.transform = function (ast) {
  var module = this.module = this.module || require(this.moduleName)
  return module.transform(ast)
}

Transform.transforms = []
Transform.register = function (obj) {
  Transform.transforms.push(new Transform(obj))
}

Transform.register({
  module: 'es6-class',
  detect: function (string) {
    return /\bclass[\s\w]+\{/.test(string)
  }
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/arrow_functions
Transform.register({
  module: 'es6-arrow-function',
  detect: function (string) {
    return /\([^\)]*=>[^\(]*\)/.test(string)
  },
  filter: ff('22')
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
Transform.register({
  name: 'generators',
  module: 'regenerator',
  detect: function (string) {
    return /\bfunction *\* *[^\(]* *\([^\)]*\)\s*\{/.test(string)
  },
  filter: function (agent) {
    if (/chrome/i.test(agent.family)) return agent.satisfies('< 29')
    if (/firefox/i.test(agent.family)) return agent.satisfies('< 26')
    return true
  }
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings
Transform.register({
  module: 'es6-templates',
  detect: function (string) {
    // lol we need to make this better
    return /`/.test(string)
  }
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/default_parameters
Transform.register({
  module: 'es6-default-params',
  detect: function (string) {
    // checks if there's a `=` anywhere before the opening bracket
    return /\bfunction[^\{]*=/.test(string)
  },
  filter: ff('15')
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/rest_parameters
Transform.register({
  module: 'es6-rest-params',
  detect: function (string) {
    return /\nfunction[^\)]*\.\.\.\s*\w+\s\)/.test(string)
  },
  filter: ff('15')
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator
Transform.register({
  module: 'es6-spread',
  detect: function (string) {
    // lol, not sure how to differentiate with rest-params
    return /\.\.\./.test(string)
  },
  filter: ff('27')
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Array_comprehensions
Transform.register({
  module: 'es6-comprehensions',
  detect: function (string) {
    return /\[\s*for/.test(string)
  },
  filter: ff('30')
})

function always() {
  return true
}

function ff(version) {
  return function (agent) {
    if (/firefox/i.test(agent.family)) return agent.satisfies('< ' + version)
    return true
  }
}
