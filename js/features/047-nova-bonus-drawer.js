(function () {
  'use strict';

  var BONUS_FAB_IDS = ['puzzle_fab_wrap', 'fillblank_fab_wrap', 'match_fab_wrap'];

  function getBonusPanel() {
    return document.getElementById('nova_bonus_drawer_panel');
  }

  function ensureBonusFabsInPanel() {
    var panel = getBonusPanel();
    if (!panel) return false;
    var moved = false;
    for (var i = 0; i < BONUS_FAB_IDS.length; i++) {
      var el = document.getElementById(BONUS_FAB_IDS[i]);
      if (!el || el.parentNode === panel) continue;
      panel.appendChild(el);
      moved = true;
    }
    return moved;
  }

  function syncDrawerA11y(drawer, open) {
    var toggle = document.getElementById('nova_bonus_drawer_toggle');
    var panel = document.getElementById('nova_bonus_drawer_panel');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) {
      panel.hidden = !open;
      if (open) {
        panel.removeAttribute('hidden');
        panel.removeAttribute('inert');
      } else {
        panel.setAttribute('hidden', '');
        panel.setAttribute('inert', '');
      }
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
    ensureBonusFabsInPanel();
    drawer.classList.toggle('is-open', !!open);
    syncDrawerA11y(drawer, !!open);
  }

  function forceDrawerClosed() {
    ensureBonusFabsInPanel();
    setDrawerOpen(false);
  }

  function initBonusDrawer() {
    var drawer = document.getElementById('nova-bonus-drawer');
    var toggle = document.getElementById('nova_bonus_drawer_toggle');
    if (!drawer || !toggle) return;
    ensureBonusFabsInPanel();
    if (toggle.dataset.bound !== '1') {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', function () {
        setDrawerOpen(!drawer.classList.contains('is-open'));
      });
    }
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
    forceDrawerClosed();
  }

  window.novaBonusDrawerSetOpen = setDrawerOpen;
  window.novaEnsureBonusFabsInPanel = ensureBonusFabsInPanel;
  window.novaForceBonusDrawerClosed = forceDrawerClosed;

  function scheduleBonusDrawerSync() {
    ensureBonusFabsInPanel();
    forceDrawerClosed();
  }

  document.addEventListener('nova:sprite-boot-complete', scheduleBonusDrawerSync, { passive: true });
  document.addEventListener('nova:main-screen-visible', scheduleBonusDrawerSync, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBonusDrawer, { once: true });
  } else {
    initBonusDrawer();
  }
  window.addEventListener('load', initBonusDrawer, { once: true });
  setTimeout(scheduleBonusDrawerSync, 0);
  setTimeout(scheduleBonusDrawerSync, 400);
  setTimeout(scheduleBonusDrawerSync, 1200);
})();
