(function () {
  var idle = window.requestIdleCallback || function (cb) {
    return setTimeout(cb, 0);
  };
  idle(function () {});
})();
