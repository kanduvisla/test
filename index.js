var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var watch      = require('metalsmith-watch');
var serve      = require('metalsmith-serve');
var postcss    = require('metalsmith-with-postcss');
var tags       = require('./app/src/tags');
var tagPages   = require('metalsmith-tags');
// var articles   = require('./app/src/articles');

var site = Metalsmith(__dirname)
  .source('app')
  .destination('build')
  .use(tags())
  .use(postcss({
    plugins: {
      'postcss-import' : {},
      'postcss-cssnext': {}
    }
  }))
  .use(tagPages({
    'handle': 'tags',
    'path'  : 'tag/:tag.html',
    'layout': 'partials/tag.html'
  }))
  .use(markdown())
  .use(layouts({
    engine: 'handlebars'
  }))
;

if (process.argv.indexOf('--watch') !== -1) {
  site
    .use(serve({port: 9000}))
    .use(watch({
      paths     : {
        "${source}/**/*": true,
        "layouts/**/*"  : "**/*"
      },
      livereload: true
    }));
}

site.build(function (err) {
  if (err) {
    throw err;
  }

  console.log('Build Succeeded');
});