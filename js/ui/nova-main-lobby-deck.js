/**
 * Ana ekran lobby — yatay kaydırma kenar ipuçları
 */
(function () {
  'use strict';

  function bindRailScroll() {
    var host = document.querySelector('#main-screen .nova-lobby-rail-host');
    var rail = document.getElementById('nova_lobby_rail');
    if (!host || !rail || host.dataset.novaRailBound === '1') return;
    host.dataset.novaRailBound = '1';

    function syncEdges() {
      var max = rail.scrollWidth - rail.clientWidth;
      var scrollable = max > 8;
      host.classList.toggle('is-scrollable', scrollable);
      host.classList.toggle('at-start', rail.scrollLeft <= 4);
      host.classList.toggle('at-end', rail.scrollLeft >= max - 4);
    }

    rail.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges, { passive: true });
    syncEdges();
    requestAnimationFrame(syncEdges);
    setTimeout(syncEdges, 400);
    setTimeout(syncEdges, 1200);
  }

  function boot() {
    bindRailScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('nova:main-screen-visible', boot);
  document.addEventListener('nova:sprite-boot-complete', function () {
    setTimeout(boot, 200);
  });
})();
