var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var watch      = require('metalsmith-watch');

var site = Metalsmith(__dirname)
  .source('app')
  .destination('build')
  .use(markdown())
  .use(layouts({
    engine: 'handlebars'
  }));

if (process.argv.indexOf('--watch') !== -1) {
  site.use(watch({
    paths     : {
      "${source}/**/*": true
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