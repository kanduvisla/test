var Metalsmith    = require('metalsmith');
var markdown      = require('metalsmith-markdown');
var layouts       = require('metalsmith-layouts');
var watch         = require('metalsmith-watch');
var serve         = require('metalsmith-serve');
var postcss       = require('metalsmith-with-postcss');
var tags          = require('./app/src/tags');
var tagPages      = require('metalsmith-tags');
var permalinks    = require('metalsmith-permalinks');
var ignore        = require('metalsmith-ignore');
var tidy          = require('metalsmith-html-tidy');
var striptags     = require('striptags');
var wordcount     = require("metalsmith-word-count");
var dateFormatter = require('metalsmith-date-formatter');
var lunr          = require('./app/src/lunr');
var buildInfo     = require('metalsmith-build-info');
var prism         = require('metalsmith-prism');
var disqus        = require('metalsmith-disqus');
// var languageDetect = require('./app/src/language-detect');

var site = Metalsmith(__dirname)
      .source('app')
      .destination('build')
      .use(ignore('articles/_*.md'))    // Ignore markdown files that start with an underscore
      .use(tagPages({
        'handle': 'tags',
        'path'  : 'tag/:tag.html',
        'layout': 'tag.html'
      }))
      .use(postcss({
        plugins       : {
          'postcss-import' : {},
          'postcss-mixins' : {},
          'postcss-cssnext': {
            browsers: ['last 2 versions', '> 5%']
          }
        },
        removeExcluded: true
      }))
      .use(lunr())
      .use(markdown({
        langPrefix: 'language-',
//    smartypants: true,
        tables    : true
      }))
      //.use(languageDetect())
      .use(prism())
      .use(buildInfo())
      .use(tags())
      .use(dateFormatter())
      .use(wordcount())
      .use(permalinks())
      .use(disqus({
        siteurl  : 'https://giel.berkers.online',
        shortname: 'giel-berkers-online'
      }))
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
} else {
  site
    .use(tidy());
}

site.build(function (err) {
  if (err) {
    throw err;
  }

  console.log('Build Succeeded');
});