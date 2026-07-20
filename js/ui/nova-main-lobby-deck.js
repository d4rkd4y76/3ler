/**
 * Ana ekran — yatay kaydırma şeritleri (hub + lobby) + masaüstü ok navigasyonu
 */
(function () {
  'use strict';

  function isDesktopNav() {
    try {
      return window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)').matches;
    } catch (_) {
      return window.innerWidth >= 901;
    }
  }

  function ensureLobbyNavButtons(host) {
    if (!host || host.querySelector('.nova-lobby-rail-nav--prev')) return;
    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'nova-lobby-rail-nav nova-lobby-rail-nav--prev';
    prev.setAttribute('aria-label', 'Menüde sola kaydır');
    prev.innerHTML = '<span class="nova-lobby-rail-nav__chev" aria-hidden="true"></span>';

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'nova-lobby-rail-nav nova-lobby-rail-nav--next';
    next.setAttribute('aria-label', 'Menüde sağa kaydır');
    next.innerHTML = '<span class="nova-lobby-rail-nav__chev" aria-hidden="true"></span>';

    var rail = host.querySelector('.nova-lobby-rail');
    if (!rail) return;
    host.insertBefore(prev, rail);
    host.insertBefore(next, rail.nextSibling);
  }

  function bindScrollHost(host, scrollEl, opts) {
    if (!host || !scrollEl || host.dataset.novaScrollBound === '1') return;
    host.dataset.novaScrollBound = '1';

    opts = opts || {};
    var prevBtn = opts.prevBtn || null;
    var nextBtn = opts.nextBtn || null;

    function scrollStep(dir) {
      var tile = scrollEl.querySelector('.nova-lobby-tile, .nova-hub-quick-chip, button');
      var gap = 12;
      try {
        gap = parseFloat(window.getComputedStyle(scrollEl).gap) || gap;
      } catch (_) {}
      var step = tile ? tile.offsetWidth + gap : Math.max(120, scrollEl.clientWidth * 0.72);
      scrollEl.scrollBy({ left: dir * step, behavior: 'smooth' });
    }

    if (prevBtn && prevBtn.dataset.novaNavBound !== '1') {
      prevBtn.dataset.novaNavBound = '1';
      prevBtn.addEventListener('click', function () {
        scrollStep(-1);
      });
    }
    if (nextBtn && nextBtn.dataset.novaNavBound !== '1') {
      nextBtn.dataset.novaNavBound = '1';
      nextBtn.addEventListener('click', function () {
        scrollStep(1);
      });
    }

    function sync() {
      var max = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
      var scrollable = max > 6;
      host.classList.toggle('is-scrollable', scrollable);
      host.classList.toggle('at-start', scrollEl.scrollLeft <= 2);
      host.classList.toggle('at-end', scrollEl.scrollLeft >= max - 2);
      if (scrollEl.scrollLeft < 0) scrollEl.scrollLeft = 0;

      if (prevBtn) prevBtn.disabled = !scrollable || scrollEl.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = !scrollable || scrollEl.scrollLeft >= max - 2;
    }

    scrollEl.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
    requestAnimationFrame(sync);
    setTimeout(sync, 300);
    setTimeout(sync, 1200);
  }

  function bindLobbyRail() {
    var host = document.querySelector('#main-screen .nova-lobby-rail-host');
    var scrollEl = document.getElementById('nova_lobby_rail');
    if (!host || !scrollEl) return;

    if (isDesktopNav()) ensureLobbyNavButtons(host);

    if (host.dataset.novaScrollBound !== '1') {
      bindScrollHost(host, scrollEl, {
        prevBtn: host.querySelector('.nova-lobby-rail-nav--prev'),
        nextBtn: host.querySelector('.nova-lobby-rail-nav--next')
      });
      return;
    }

    try {
      scrollEl.dispatchEvent(new Event('scroll'));
    } catch (_) {
      var max = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
      host.classList.toggle('is-scrollable', max > 6);
    }
  }

  function boot() {
    bindScrollHost(
      document.getElementById('nova-hub-quick-bar'),
      document.getElementById('nova_hub_scroll')
    );
    bindLobbyRail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('nova:main-screen-visible', boot);
  document.addEventListener('nova:sprite-boot-complete', function () {
    setTimeout(boot, 200);
    setTimeout(boot, 800);
  });
})();
