(function () {
  "use strict";

  var articleData = JSON.parse(document.getElementById('mage-helper-data').innerHTML);

  /**
   * @constructor
   */
  function MageHelper() {
    this.articles = ko.observableArray();
    // Initial setup:
    this.changeVersion(null, {target: {value: 2}});
  }

  /**
   *
   * @param obj
   * @param event
   */
  MageHelper.prototype.changeVersion = function (obj, event) {
    this.articles(articleData[event.target.value]);
    console.log(this.articles());
  }

  ko.applyBindings(new MageHelper(), document.querySelector('.mage-helper'));
})();