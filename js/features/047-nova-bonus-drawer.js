(function () {
  'use strict';

  function syncDrawerA11y(drawer, open) {
    var toggle = document.getElementById('nova_bonus_drawer_toggle');
    var panel = document.getElementById('nova_bonus_drawer_panel');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) panel.hidden = !open;
  }

  function setDrawerOpen(open) {
    var drawer = document.getElementById('nova-bonus-drawer');
    if (!drawer) return;
    drawer.classList.toggle('is-open', !!open);
    syncDrawerA11y(drawer, !!open);
  }

  function initBonusDrawer() {
    var drawer = document.getElementById('nova-bonus-drawer');
    var toggle = document.getElementById('nova_bonus_drawer_toggle');
    if (!drawer || !toggle || toggle.dataset.bound === '1') return;
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', function () {
      setDrawerOpen(!drawer.classList.contains('is-open'));
    });
    syncDrawerA11y(drawer, false);
  }

  window.novaBonusDrawerSetOpen = setDrawerOpen;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBonusDrawer, { once: true });
  } else {
    initBonusDrawer();
  }
  window.addEventListener('load', initBonusDrawer, { once: true });
})();
