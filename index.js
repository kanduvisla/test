var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var watch      = require('metalsmith-watch');
var serve      = require('metalsmith-serve');
var postcss    = require('metalsmith-with-postcss');
var tags       = require('./app/src/tags');
var tagPages   = require('metalsmith-tags');
var permalinks = require('metalsmith-permalinks');
var ignore     = require('metalsmith-ignore');
var tidy       = require('metalsmith-html-tidy');
var lunr       = require('metalsmith-lunr');
var lunr_      = require('lunr');
var striptags  = require('striptags');
// var articles   = require('./app/src/articles');

require('lunr-languages/lunr.stemmer.support')(lunr_);
// require('lunr-languages/lunr.en')(lunr_);

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
      'postcss-mixins' : {},
      'postcss-cssnext': {
        browsers: ['last 2 versions', '> 5%']
      }
    },
    removeExcluded: true
  }))
  .use(lunr({
    ref              : 'title',
    pipelineFunctions: [
      lunr_.trimmer,
      lunr_.stopWordFilter,
      lunr_.stemmer
    ],
    preprocess       : function (content) {
      // Strip code blocks (we only want to search through content:
      content = content.replace(/<pre><code>[\s\S]*?<\/code><\/pre>/gm, '');

      // Strip markdown code blocks:
      content = content.replace(/^\s{4}.*/gm, '');

      // Strip numbers (nobody searches on numbers):
      content = content.replace(/\d/gm, '');

      // Strip words that have backslashes (probably classes, don't index that):
      content = content.replace(/(\w+\\)/gm, '');

      // Strip backticks:
      content = content.replace(/\`/gm, '')

      return striptags(content);
    }
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
} else {
  site
    .use(tidy({
      //tidyOptions: {
      //  'tidy-mark'        : false,
      //  'output-html'      : true,
      //  'indent'           : true,
      //  'indent-spaces'    : 4,
      //  'indent-attributes': true
      //}
    }));
}

site.build(function (err) {
  if (err) {
    throw err;
  }

  console.log('Build Succeeded');
});