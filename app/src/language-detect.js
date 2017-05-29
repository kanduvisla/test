//var lang = require('language-classifier');
var prism = require('prism');

module.exports = function (opts) {
  return function (files, metalsmith, done) {
    for (var fileName in files) {
      if (files.hasOwnProperty(fileName)) {
        if (/\.html$/.test(fileName)) {
          var text = files[fileName].contents.toString().replace(/<pre><code>([\s\S]+?)<\/code><\/pre>/g, function (match, contents, offset, s) {
            console.log(lang(contents));
          });
        }
      }
    }

    done();
  };
};