var lunr = require('lunr');
var slug = require('slug');

module.exports = function (opts) {
  return function (files, metalsmith, done) {
    // Reference of Path => title
    var reference = {};

    // Create an index:
    var idx = lunr(function () {
      this.field('title');
      this.field('content');
      this.ref('path');

      // Index the documents:
      for (file in files) {
        if (files[file].lunr) {
          var path  = file.replace(/\.md$/, '');
          var title = files[file].title;

          this.add({
            'title'  : title,
            'content': files[file].contents.toString(),
            'path'   : path
          });

          reference[path] = {title: title};
        }
      }
    });

    // Save Search Index to file:
    var data                  = idx.toJSON();
    data.reference            = reference;
    files['searchIndex.json'] = {contents: new Buffer(JSON.stringify(data))};

    done();
  }
};