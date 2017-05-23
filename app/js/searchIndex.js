/**
 * Search Index
 */
function SearchIndex() {
  "use strict";

  var request = new XMLHttpRequest();
  request.overrideMimeType("application/json");
  request.open('GET', '/searchIndex.json', true); // Replace 'my_data' with the path to your file
  request.onreadystatechange = function () {
    if (request.readyState == 4 && request.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      this.searchIndexLoaded(request);
    }
  }.bind(this);
  request.send(null);

  this.totalResults = ko.observable(0);
  this.results      = ko.observable([]);
  this.reference    = {};
}

/**
 * Method fired when the search index is loaded
 * @param request
 */
SearchIndex.prototype.searchIndexLoaded = function (request) {
  var data       = JSON.parse(request.response);
  this.reference = data.reference;
  window.idx     = lunr.Index.load(data);
};

/**
 * Method fired when entering search
 *
 * @param obj
 * @param event
 * @returns {boolean}
 */
SearchIndex.prototype.performSearch = function (obj, event) {
  var searchResults = window.idx.search(event.target.value);
  this.totalResults(searchResults.length);
  this.results(searchResults);
  return true;
}