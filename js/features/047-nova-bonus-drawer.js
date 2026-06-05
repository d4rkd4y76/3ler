(function () {
  'use strict';

  function syncDrawerA11y(drawer, open) {
    var toggle = document.getElementById('nova_bonus_drawer_toggle');
    var panel = document.getElementById('nova_bonus_drawer_panel');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) {
      panel.hidden = !open;
      if (open) panel.removeAttribute('inert');
      else panel.setAttribute('inert', '');
      var buttons = panel.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].id === 'nova_bonus_drawer_toggle') continue;
        buttons[i].disabled = false;
      }
    }
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
    if (!document.__novaBonusFabAutoOpenBound) {
      document.__novaBonusFabAutoOpenBound = true;
      document.addEventListener(
        'click',
        function (ev) {
          var fab = ev.target && ev.target.closest('#puzzle_fab, #fillblank_fab, #match_fab');
          if (!fab || !drawer) return;
          if (drawer.classList.contains('is-open')) return;
          ev.preventDefault();
          ev.stopPropagation();
          setDrawerOpen(true);
          setTimeout(function () {
            try {
              fab.click();
            } catch (_) {}
          }, 60);
        },
        true
      );
    }
    setDrawerOpen(false);
  }

  window.novaBonusDrawerSetOpen = setDrawerOpen;

  document.addEventListener(
    'nova:sprite-boot-complete',
    function () {
      setDrawerOpen(false);
    },
    { passive: true }
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBonusDrawer, { once: true });
  } else {
    initBonusDrawer();
  }
  window.addEventListener('load', initBonusDrawer, { once: true });
})();
