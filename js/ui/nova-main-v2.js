/* Ana ekran v2 — layout senkronu, performans, FAB yerleşimi */
(function () {
  'use strict';

  var main = document.getElementById('main-screen');
  if (!main || !main.classList.contains('nova-main-v2')) return;

  function syncV2Layout() {
    try {
      if (typeof window.novaFixHudFabLayout === 'function') {
        window.novaFixHudFabLayout();
      }
    } catch (_) {}
    try {
      if (typeof window.novaSpriteRefreshMainHeroCanvases === 'function') {
        window.novaSpriteRefreshMainHeroCanvases();
      }
    } catch (_) {}
  }

  function onVisible() {
    main.classList.add('nova-main-v2-ready');
    requestAnimationFrame(function () {
      requestAnimationFrame(syncV2Layout);
    });
  }

  document.addEventListener('nova:main-screen-visible', onVisible, { passive: true });
  document.addEventListener('nova:sprite-boot-complete', onVisible, { passive: true });

  window.addEventListener(
    'resize',
    function () {
      if (main.style.display === 'none') return;
      syncV2Layout();
    },
    { passive: true }
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncV2Layout, { once: true });
  } else {
    syncV2Layout();
  }
})();
