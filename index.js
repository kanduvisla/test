var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var watch      = require('metalsmith-watch');
var serve      = require('metalsmith-serve');
var postcss    = require('metalsmith-with-postcss');

var site = Metalsmith(__dirname)
  .source('app')
  .destination('build')
  .use(postcss({
    plugins: {
      'postcss-import':{},
      'postcss-cssnext':{},
      'autoprefixer':{}
    }
  }))
  .use(markdown())
  .use(layouts({
    engine: 'handlebars'
  }));

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