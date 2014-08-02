
Let's suppose you have some JS file and you want to serve it to the client.
This library is too low level for convenience.
For a framework like Koa, your code will look like:

```js
var ecstacy = new Ecstacy({
  code: fs.readFileSync('index.js', 'utf8'),
  name: 'index', // without the .js
});

app.use(function* (next) {
  if (this.request.path !== '/index.js') return yield* next;

  var ua = this.get('user-agent');
  // get data about the version for this user agent
  var data = yield ecstacy.build(ua)
  if (!('.min.js' in data.length)) {
    // minify if not already minified
    // we also want to gzip as well so we can compare sizes
    yield ecstacy.minify(data.name);
    yield ecstacy.gzip(data.name);
    data = yield ecstacy.build(ua); // we need to refresh the data
  }

  // set content headers
  this.response.type = 'js';
  this.response.lastModified = data.date;
  this.response.etag = data.hash;

  // don't bother sending data if it's fresh
  if (this.request.fresh) return this.response.status = 304;

  // we only want to serve the gzipped version if
  // both of the following conditions are satisfied:
  // - the client accepts gzip
  // - the gzipped size is smaller than the minified size
  if (this.request.accepts('gzip') && data.length['.min.js.gz'] < data.length['.min.js']) {
    this.response.set('Content-Encoding', 'gzip')
    this.response.length = data.length['.min.js.gz']
    this.response.body = ecstacy.stream(data.name, '.min.js.gz')
  } else {
    // I only set this to tell upstream compression middleware
    // to not gzip this response. Otherwise, it's completely unnecessary
    this.response.set('Content-Encoding', 'identity')
    this.response.length = data.length['.min.js']
    this.response.body = ecstacy.stream(data.name, '.min.js')
  }
})
```
