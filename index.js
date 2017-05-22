var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var watch      = require('metalsmith-watch');
var serve      = require('metalsmith-serve');
var postcss    = require('metalsmith-with-postcss');
var tags       = require('./app/src/tags');
var tagPages   = require('metalsmith-tags');
var permalinks = require('metalsmith-permalinks');
var ignore=require('metalsmith-ignore');
// var articles   = require('./app/src/articles');

var site = Metalsmith(__dirname)
  .source('app')
  .destination('build')
    .use(ignore('articles/_*.md'))
    .use(tagPages({
      'handle': 'tags',
      'path'  : 'tag/:tag.html',
      'layout': 'tag.html'
    }))
  .use(tags())
  .use(postcss({
    plugins       : {
      'postcss-import' : {},
      'postcss-cssnext': {
        browsers: ['last 2 versions', '> 5%']
      }
    },
    removeExcluded: true
  }))
  .use(markdown())
  .use(permalinks())
  .use(layouts({
    engine  : 'handlebars',
    partials: 'layouts/partials'
  }))
;

if (process.argv.indexOf('--watch') !== -1) {
  site
    .use(serve({port: 9000}))
    .use(watch({
      paths     : {
        "${source}/**/*": "**/*",
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