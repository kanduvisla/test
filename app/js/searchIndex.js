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

  this.totalResults  = ko.observable(0);
  this.results       = ko.observable([]);
  this.selectedIndex = ko.observable(0);
  this.reference     = {};
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
  // 40=down, 38=up, 13=enter
  var idx = this.selectedIndex();

  if (event.keyCode == 13) {
    // Go to page:
    window.location = document.querySelector('.search-result--active a').href;
  } else if (event.keyCode == 38) {
    // Up
    if (idx > 0) {
      idx -= 1;
    } else {
      idx = this.results().length - 1;
    }
    this.selectedIndex(idx);
  } else if (event.keyCode == 40) {
    // Down:
    if (idx < this.results().length - 1) {
      idx += 1;
    } else {
      idx = 0;
    }
    this.selectedIndex(idx);
  }
  else {
    var searchResults = window.idx.search(event.target.value);
    this.totalResults(searchResults.length);
    this.selectedIndex(0);
    this.results(searchResults);
  }
  return true;
}