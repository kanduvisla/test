var pjson = require('metalsmith/package.json');

module.exports = function (opts) {
  return function (files, metalsmith, done) {
    console.log(pjson.version);

    done();
  }
};