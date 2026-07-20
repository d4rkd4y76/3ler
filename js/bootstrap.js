/*
 * Central bootstrap point for modular build.
 * Existing feature scripts are loaded in index.html order;
 * this file runs final sync hooks after all modules are available.
 */
(function () {
  function safeCall(fnName) {
    try {
      var fn = window[fnName];
      if (typeof fn === 'function') fn();
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    safeCall('novaWireCharacterInventoryUi');
    safeCall('refreshDuelEntryGateNote');
    safeCall('novaSyncMainScreenScrollLock');
  });
})();
