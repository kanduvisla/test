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
    if (window.location.hash != '') {
      var path = window.location.hash.replace('#', '');
      setTimeout(function () {
        document.querySelector('select[name="task"]').value = path;
      }.bind(this), 50);
      this.loadArticle(null, {target: {value: path}});
    }
  }

  /**
   * @param obj
   * @param event
   */
  MageHelper.prototype.changeVersion = function (obj, event) {
    this.articles(articleData[event.target.value]);
  }

  /**
   * @param obj
   * @param event
   */
  MageHelper.prototype.loadArticle = function (obj, event) {
    if (event.target.value) {
      var request                = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          document.getElementById("mage-answer").innerHTML = request.responseText;

        }
      }
      request.open('GET', '/' + event.target.value, true);
      window.location.hash = event.target.value;
      request.send();
    }
  }

  ko.applyBindings(new MageHelper(), document.querySelector('.mage-helper'));
})();