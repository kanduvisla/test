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
   * @param obj
   * @param event
   */
  MageHelper.prototype.changeVersion = function (obj, event) {
    this.articles(articleData[event.target.value]);
    console.log(this.articles());
  }

  /**
   * @param obj
   * @param event
   */
  MageHelper.prototype.loadArticle = function (obj, event) {
    var request                = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("mage-answer").innerHTML = request.responseText;
      }
    }
    request.open('GET', '/' + event.target.value, true);
    request.send();
  }

  ko.applyBindings(new MageHelper(), document.querySelector('.mage-helper'));
})();