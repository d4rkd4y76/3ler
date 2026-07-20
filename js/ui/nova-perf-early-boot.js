/* Telefon ölçeğini ilk kareden sabitle — DOMContentLoaded beklemeden */
(function () {
  'use strict';

  var KEY = 'novaPerfMode';
  var ULTRA_SCALE = 0.74;

  function isPhoneDevice() {
    try {
      if (window.matchMedia) {
        return window.matchMedia('(max-width: 768px), (max-width: 1024px) and (hover: none) and (pointer: coarse)').matches;
      }
    } catch (_) {}
    return (window.innerWidth || 0) <= 768;
  }

  function normalizeMode(mode) {
    if (mode === 'performance') return 'ultra';
    if (mode === 'ultra' || mode === 'normal') return mode;
    return null;
  }

  function getDefaultMode() {
    try {
      var saved = normalizeMode(localStorage.getItem(KEY));
      if (saved) return saved;
    } catch (_) {}
    return isPhoneDevice() ? 'ultra' : 'normal';
  }

  function isLoginGateActive() {
    return !document.documentElement.classList.contains('nova-has-session');
  }

  function injectEarlyScaleCss() {
    if (document.getElementById('nova-perf-early-lock')) return;
    var st = document.createElement('style');
    st.id = 'nova-perf-early-lock';
    st.textContent =
      ':root{--nova-perf-scale:' + ULTRA_SCALE + ';--nova-perf-body-zoom:' + ULTRA_SCALE + ';--nova-perf-counter-zoom:1;--nova-perf-sp-boost:1}' +
      'html.nova-perf-ultra-early body{--nova-perf-scale:' + ULTRA_SCALE + ';--nova-perf-body-zoom:' + ULTRA_SCALE + ';--nova-perf-counter-zoom:1;--nova-perf-sp-boost:1}' +
      'html.nova-perf-ultra-early.nova-has-session body:not(.birles-pool-fs):not(.birles-kristal-fs):not(.nova-duel-game-open):not(.roborox-reader-open){zoom:' +
      ULTRA_SCALE +
      '!important;transform:none!important;width:auto!important;transform-origin:top left!important}' +
      'html.nova-perf-ultra-early.nova-has-session body.birles-pool-fs,' +
      'html.nova-perf-ultra-early.nova-has-session body.birles-kristal-fs,' +
      'html.nova-perf-ultra-early.nova-has-session body.nova-duel-game-open,' +
      'html.nova-perf-ultra-early.nova-has-session body.roborox-reader-open{zoom:1!important;transform:none!important;width:100%!important}' +
      'html.nova-perf-ultra-early:not(.nova-has-session) body,html:not(.nova-has-session) body{zoom:1!important;transform:none!important;width:100%!important}';
    (document.head || document.documentElement).appendChild(st);
  }

  function applyBodyEarly() {
    var body = document.body;
    if (!body || body.dataset.novaPerfEarly === '1') return;
    body.dataset.novaPerfEarly = '1';
    body.classList.add('nova-perf-ultra');
    body.style.setProperty('--nova-perf-scale', String(ULTRA_SCALE));
    body.style.setProperty('--nova-perf-body-zoom', String(ULTRA_SCALE));
    body.style.setProperty('--nova-perf-counter-zoom', '1');
    body.style.setProperty('--nova-perf-sp-boost', '1');
    if (!isLoginGateActive()) {
      body.style.zoom = String(ULTRA_SCALE);
      body.style.transform = 'none';
      body.style.width = '';
      body.style.transformOrigin = '';
    }
  }

  function boot() {
    var mode = getDefaultMode();
    window.__novaPerfMode = mode;
    if (mode !== 'ultra') return;
    document.documentElement.classList.add('nova-perf-ultra-early');
    injectEarlyScaleCss();
    applyBodyEarly();
  }

  window.novaPerfApplyBodyEarly = applyBodyEarly;
  window.novaPerfEarlySessionScale = function () {
    if ((window.__novaPerfMode || getDefaultMode()) !== 'ultra') return;
    injectEarlyScaleCss();
    applyBodyEarly();
    if (!document.body || isLoginGateActive()) return;
    try {
      document.body.style.zoom = String(ULTRA_SCALE);
      document.body.style.transform = 'none';
    } catch (_) {}
  };

  boot();
})();
