// === NOVA Freeze Guard (v1) ===
// Amaç: Bazı cihazlarda DOM değişimleri sırasında tarayıcıyı kilitleyen aşırı MutationObserver tetiklemelerini engellemek.
(function () {
  if (window.__novaFreezeGuardInstalled) return;
  window.__novaFreezeGuardInstalled = true;

  var NativeMO = window.MutationObserver;
  if (typeof NativeMO !== 'function') return;

  function shouldBlockObserve(target, options) {
    try {
      if (!target || !options) return false;
      // En pahalı kombinasyonlar: body/html + subtree + attributes
      var isGlobal = (target === document.body) || (target === document.documentElement) || (target === document);
      if (!isGlobal) return false;
      if (options.subtree && options.attributes) return true;
      // body/html + subtree + childList da bazı akışlarda aşırı tetiklenebiliyor, yine de izin ver ama throttle ile.
      return false;
    } catch (_) {
      return false;
    }
  }

  function throttleCallback(cb) {
    var t = null;
    return function () {
      if (t) return;
      var args = arguments;
      t = setTimeout(function () {
        t = null;
        try { cb.apply(null, args); } catch (e) { try { console.warn(e); } catch (_) {} }
      }, 120);
    };
  }

  function GuardedMO(callback) {
    var wrapped = throttleCallback(callback);
    var inst = new NativeMO(wrapped);

    var nativeObserve = inst.observe.bind(inst);
    inst.observe = function (target, options) {
      if (shouldBlockObserve(target, options)) {
        // Block dangerous observers silently
        return;
      }
      // If global subtree observer, enforce throttling via wrapped callback already
      return nativeObserve(target, options);
    };
    return inst;
  }

  // Preserve prototype bits
  GuardedMO.prototype = NativeMO.prototype;
  try { window.MutationObserver = GuardedMO; } catch (_) {}
})();

