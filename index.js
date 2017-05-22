var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var layouts    = require('metalsmith-layouts');
var watch      = require('metalsmith-watch');

Metalsmith(__dirname)
  .source('app')
  .destination('build')
  .use(watch({
    paths     : {
      "${source}/**/*": true
    },
    livereload: true
  }))
  .use(markdown())
  .use(layouts({
    engine: 'handlebars'
  }))
  .build(function (err) {
    if (err) {
      throw err;
    }

    console.log('Build Succeeded');
  });