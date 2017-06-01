/**
 * Provide a list of Mage articles for /mage
 *
 * @param opts
 * @returns {Function}
 */
module.exports = function (opts) {
  return function (files, metalsmith, done) {
    var mageArticles = {"1": [], "2": []};

    for (var fileName in files) {
      if (/^mage\/\d/.test(fileName)) {
        mageArticles[fileName.match(/^mage\/(\d)/)[1]].push({
          title: files[fileName].title,
          path : files[fileName].path
        });
      }
    }

    // Add the mage articles to the meta data:
    metalsmith.metadata().mageArticles = mageArticles;
    done();
  }
};