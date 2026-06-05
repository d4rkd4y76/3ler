/* Ana ekran UI — öncelikli HUD/lig + garantili yenileme */
(function () {
  'use strict';

  var stabilizePromise = null;
  var ensureReadyPromise = null;

  function getStoredStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
        return selectedStudent;
      }
    } catch (_) {}
    try {
      if (window.selectedStudent && window.selectedStudent.studentId) return window.selectedStudent;
    } catch (_) {}
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && o.studentId ? o : null;
    } catch (_) {
      return null;
    }
  }

  function waitMainScreenPrefetch(maxMs) {
    if (window.__novaMainScreenPrefetchDone) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      var limit = maxMs == null ? 4500 : maxMs;
      var t = setTimeout(finish, limit);
      document.addEventListener(
        'nova:main-screen-prefetch-done',
        function () {
          clearTimeout(t);
          finish();
        },
        { once: true }
      );
      if (typeof window.novaPrefetchMainScreenAssets === 'function') {
        window.novaPrefetchMainScreenAssets().finally(function () {
          clearTimeout(t);
          finish();
        });
      }
    });
  }

  function ensureMainScreenLayout() {
    return new Promise(function (resolve) {
      var passes = 0;
      function pass() {
        passes += 1;
        try {
          if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
        } catch (_) {}
        try {
          if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
        } catch (_) {}
        try {
          if (typeof window.novaSyncPerfRuntime === 'function') window.novaSyncPerfRuntime();
        } catch (_) {}
        try {
          if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
        } catch (_) {}
        if (passes >= 2) {
          resolve();
          return;
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(pass);
        });
      }
      pass();
    });
  }

  function leagueBadgeReady() {
    var rk = document.getElementById('student-rank');
    return !!(rk && rk.querySelector('.nova-lig'));
  }

  function cupHudReady() {
    var cup = document.getElementById('game-cup-score');
    if (!cup) return false;
    var txt = String(cup.textContent || '').trim();
    return txt !== '' && txt !== '-';
  }

  function heroReady() {
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return true;
    var host = slot.querySelector('[data-nova-main-hero]');
    if (host) {
      var c = host.querySelector('canvas');
      if (c && c.width > 8 && c.height > 8) return true;
      return !!host.querySelector('svg');
    }
    if (window.__novaEquippedHeroId) return false;
    return true;
  }

  function creditsReady() {
    var cred = document.getElementById('duel-credits-value');
    if (!cred) return true;
    var txt = String(cred.textContent || '').trim();
    return txt !== '';
  }

  function mainScreenElementsReady() {
    return leagueBadgeReady() && cupHudReady() && creditsReady() && heroReady();
  }

  async function stabilizeMainScreenCore(opts) {
    opts = opts || {};
    var student = getStoredStudent();
    if (!student) return false;

    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) main.style.removeProperty('display');

    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}

    var prefetchP =
      typeof window.novaPrefetchMainScreenAssets === 'function'
        ? window.novaPrefetchMainScreenAssets(opts.force)
        : Promise.resolve();

    await Promise.all([prefetchP, ensureMainScreenLayout()]);

    if (typeof window.onMainScreenLoad === 'function') {
      try {
        window.onMainScreenLoad();
      } catch (_) {}
    } else if (typeof window.novaRequestHudFabRelayout === 'function') {
      try {
        window.novaRequestHudFabRelayout();
      } catch (_) {}
    }

    if (typeof window.novaRefreshMainScreenHero === 'function') {
      try {
        await window.novaRefreshMainScreenHero({ urgent: true });
      } catch (_) {}
    }

    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}
    try {
      if (typeof window.fetchAndDisplayGameCup === 'function') window.fetchAndDisplayGameCup(true);
    } catch (_) {}

    if (typeof window.novaSyncMainScreenBgVideo === 'function') {
      var bgP = window.novaSyncMainScreenBgVideo(false);
      if (opts.awaitBg) {
        try {
          await bgP;
        } catch (_) {}
      } else if (bgP && typeof bgP.catch === 'function') {
        bgP.catch(function () {});
      }
    }

    try {
      document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
    } catch (_) {}

    window.__novaMainScreenBootReady = true;
    return mainScreenElementsReady();
  }

  window.novaStabilizeMainScreen = function (opts) {
    if (stabilizePromise && !(opts && opts.force)) return stabilizePromise;
    stabilizePromise = stabilizeMainScreenCore(opts).finally(function () {
      setTimeout(function () {
        stabilizePromise = null;
      }, 300);
    });
    return stabilizePromise;
  };

  window.novaEnsureMainScreenReady = function (opts) {
    opts = opts || {};
    if (ensureReadyPromise && !opts.force) return ensureReadyPromise;

    ensureReadyPromise = (async function () {
      var student = getStoredStudent();
      if (!student) return false;

      for (var attempt = 0; attempt < 8; attempt++) {
        try {
          if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
          if (typeof window.novaPrefetchMainScreenAssets === 'function') {
            await window.novaPrefetchMainScreenAssets(attempt > 0);
          }
          await window.novaStabilizeMainScreen({ force: true, awaitBg: false });
        } catch (_) {}

        if (mainScreenElementsReady()) {
          try {
            document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
          } catch (_) {}
          return true;
        }
        await new Promise(function (r) {
          setTimeout(r, 60 + attempt * 35);
        });
      }

      try {
        document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
      } catch (_) {}
      return mainScreenElementsReady();
    })().finally(function () {
      setTimeout(function () {
        ensureReadyPromise = null;
      }, 500);
    });

    return ensureReadyPromise;
  };

  window.novaPrepareMainScreenForBoot = function (onStatus) {
    if (window.__novaMainScreenBootPromise) return window.__novaMainScreenBootPromise;

    window.__novaMainScreenBootPromise = (async function () {
      function status(msg) {
        if (typeof onStatus === 'function') {
          try {
            onStatus(msg);
          } catch (_) {}
        }
      }

      status('Ana ekran indiriliyor…');
      if (typeof window.novaPrefetchMainScreenAssets === 'function') {
        window.novaPrefetchMainScreenAssets();
      }

      var student = getStoredStudent();
      if (!student) {
        status('Giriş ekranı hazır…');
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        status('Lig ve arayüz hazırlanıyor…');
        await waitMainScreenPrefetch(4500);
        await window.novaEnsureMainScreenReady({ force: true });
        status('Hazır!');
        return true;
      } finally {
        window.__novaBootMainPrep = false;
      }
    })().catch(function (e) {
      console.warn('[nova main boot prep]', e);
      window.__novaMainScreenBootReady = true;
      return false;
    });

    return window.__novaMainScreenBootPromise;
  };

  function bindMainScreenRecovery() {
    if (document.__novaMainScreenRecoveryBound) return;
    document.__novaMainScreenRecoveryBound = true;

    document.addEventListener(
      'nova:sprite-boot-complete',
      function () {
        if (getStoredStudent()) window.novaEnsureMainScreenReady({ force: true });
      },
      { passive: true }
    );

    window.addEventListener(
      'pageshow',
      function () {
        if (!getStoredStudent()) return;
        window.novaEnsureMainScreenReady({ force: true });
      },
      { passive: true }
    );

    document.addEventListener(
      'visibilitychange',
      function () {
        if (document.hidden || !getStoredStudent()) return;
        window.novaEnsureMainScreenReady();
      },
      { passive: true }
    );
  }

  bindMainScreenRecovery();
})();
