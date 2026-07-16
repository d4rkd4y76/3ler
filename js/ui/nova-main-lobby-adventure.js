/**
 * Ana lobby — MACERA açılır (TEK / DÜELLO) + BİRLEŞTİR kısayolu
 * Flyout body'ye taşınır (rail overflow/mask altında kaybolmasın)
 */
(function () {
  'use strict';

  var root = null;
  var maceraBtn = null;
  var flyout = null;
  var flyoutHome = null;
  var birlesBtn = null;
  var open = false;

  function qs(id) {
    return document.getElementById(id);
  }

  function placeAboveLobby() {
    if (!flyout) return;
    var lobby = qs('nova-main-lobby');
    var gap = 20;
    var bottom = 160;
    try {
      if (lobby) {
        var r = lobby.getBoundingClientRect();
        bottom = Math.max(72, Math.round(window.innerHeight - r.top + gap));
      }
    } catch (_) {}
    flyout.style.setProperty('--macera-clearance', bottom + 'px');
  }

  function mountFlyout() {
    if (!flyout || !document.body) return;
    if (flyout.parentElement !== document.body) {
      flyoutHome = flyout.parentElement;
      document.body.appendChild(flyout);
    }
  }

  function restoreFlyout() {
    if (!flyout || !flyoutHome) return;
    if (flyout.parentElement !== flyoutHome) {
      flyoutHome.appendChild(flyout);
    }
  }

  function setOpen(next) {
    open = !!next;
    if (!root || !maceraBtn || !flyout) return;
    root.classList.toggle('is-open', open);
    maceraBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.classList.toggle('nova-macera-open', open);
    if (document.body) document.body.classList.toggle('nova-macera-open', open);

    if (open) {
      mountFlyout();
      placeAboveLobby();
      flyout.hidden = false;
      flyout.removeAttribute('hidden');
      flyout.classList.add('is-open');
      requestAnimationFrame(function () {
        placeAboveLobby();
        flyout.classList.add('is-anim');
        root.classList.add('is-anim');
      });
    } else {
      root.classList.remove('is-anim');
      flyout.classList.remove('is-anim', 'is-open');
      flyout.hidden = true;
      flyout.setAttribute('hidden', '');
      restoreFlyout();
    }
  }

  function syncBirlestirVisibility() {
    if (!birlesBtn) return;
    var show = true;
    try {
      if (typeof window.novaIsBirlestirelimGrade1 === 'function') {
        show = !!window.novaIsBirlestirelimGrade1();
      }
    } catch (_) {
      show = true;
    }
    if (show) {
      birlesBtn.hidden = false;
      birlesBtn.removeAttribute('hidden');
    } else {
      birlesBtn.hidden = true;
      birlesBtn.setAttribute('hidden', '');
    }
  }

  function bind() {
    root = qs('nova_lobby_adventure');
    maceraBtn = qs('nova_macera_btn');
    flyout = qs('nova_macera_flyout');
    birlesBtn = qs('nova_birlestir_lobby_btn');
    if (!root || !maceraBtn || !flyout) return;
    flyoutHome = flyout.parentElement;

    if (maceraBtn.dataset.novaMaceraBound !== '1') {
      maceraBtn.dataset.novaMaceraBound = '1';
      maceraBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      });
    }

    if (flyout.dataset.novaMaceraBound !== '1') {
      flyout.dataset.novaMaceraBound = '1';
      flyout.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('[data-macera-close]')) {
          setOpen(false);
          return;
        }
        if (t && t.closest && t.closest('.single-player, .find-duel-button')) {
          setTimeout(function () {
            setOpen(false);
          }, 120);
        }
      });
    }

    if (!document.documentElement.dataset.novaMaceraDocBound) {
      document.documentElement.dataset.novaMaceraDocBound = '1';
      document.addEventListener(
        'keydown',
        function (e) {
          if (e.key === 'Escape' && open) setOpen(false);
        },
        true
      );
      document.addEventListener(
        'nova:main-screen-visible',
        function () {
          setOpen(false);
          syncBirlestirVisibility();
        },
        { passive: true }
      );
      window.addEventListener(
        'resize',
        function () {
          if (open) placeAboveLobby();
        },
        { passive: true }
      );
    }

    if (birlesBtn && birlesBtn.dataset.novaBirlesBound !== '1') {
      birlesBtn.dataset.novaBirlesBound = '1';
      birlesBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        try {
          if (typeof window.novaOpenBirlestirelim === 'function') {
            window.novaOpenBirlestirelim();
          }
        } catch (_) {}
      });
    }

    syncBirlestirVisibility();
    setTimeout(syncBirlestirVisibility, 400);
    setTimeout(syncBirlestirVisibility, 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

  window.novaLobbyMaceraClose = function () {
    setOpen(false);
  };
  window.novaLobbySyncBirlestir = syncBirlestirVisibility;
})();
