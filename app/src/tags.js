var _ = require('lodash');

module.exports = function (opts) {
  return function (files) {
    var allTags = [];
    var file;

    // Step #1 is to count all the tags:
    for (file in files) {
      if (files[file].tags) {
        _.forEach(files[file].tags, function (tag) {
          var tagObj = _.find(allTags, function (obj) {
            return obj.tag === tag;
          });

          if (tagObj === undefined) {
            allTags.push({
              tag  : tag,
              count: 1
            });
          } else {
            tagObj.count += 1;
          }
        });
      }
    }

    // Step #2 is to add the tags information to all files:
    for (file in files) {
      files[file].allTags = allTags;
    }
  }
};