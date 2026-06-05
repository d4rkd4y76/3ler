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

  window.novaMainScreenElementsReady = mainScreenElementsReady;

  function revealMainForBoot() {
    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) main.style.removeProperty('display');
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}
  }

  async function stabilizeMainScreenCore(opts) {
    opts = opts || {};
    var student = getStoredStudent();
    if (!student) return false;
    var fast = !!(opts.boot || opts.fast);

    revealMainForBoot();

    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}

    var prefetchP =
      typeof window.novaPrefetchMainScreenAssets === 'function'
        ? Promise.race([
            window.novaPrefetchMainScreenAssets(opts.force),
            new Promise(function (r) {
              setTimeout(r, fast ? 2400 : 6000);
            })
          ])
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
        await Promise.race([
          window.novaRefreshMainScreenHero({ urgent: true }),
          new Promise(function (r) {
            setTimeout(r, fast ? 2200 : 5500);
          })
        ]);
      } catch (_) {}
    }

    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}
    try {
      if (typeof window.fetchAndDisplayGameCup === 'function') window.fetchAndDisplayGameCup(true);
    } catch (_) {}

    if (!fast && typeof window.novaSyncMainScreenBgVideo === 'function') {
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

    var fast = !!(opts.boot || opts.fast);
    var maxAttempts = fast ? 5 : 8;
    var delayStep = fast ? 18 : 35;
    var delayBase = fast ? 16 : 60;

    ensureReadyPromise = (async function () {
      var student = getStoredStudent();
      if (!student) return false;

      revealMainForBoot();

      for (var attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
          if (typeof window.novaPrefetchMainScreenAssets === 'function') {
            await Promise.race([
              window.novaPrefetchMainScreenAssets(attempt > 0),
              new Promise(function (r) {
                setTimeout(r, fast ? 2000 : 5000);
              })
            ]);
          }
          await window.novaStabilizeMainScreen({ force: true, awaitBg: false, boot: fast, fast: fast });
        } catch (_) {}

        if (mainScreenElementsReady()) {
          try {
            document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
          } catch (_) {}
          window.__novaMainScreenBootReady = true;
          return true;
        }
        await new Promise(function (r) {
          setTimeout(r, delayBase + attempt * delayStep);
        });
      }

      try {
        document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
      } catch (_) {}
      window.__novaMainScreenBootReady = true;
      return mainScreenElementsReady();
    })().finally(function () {
      setTimeout(function () {
        ensureReadyPromise = null;
      }, 500);
    });

    return ensureReadyPromise;
  };

  window.novaPrepareMainScreenForBoot = function (onStatus) {
    if (window.__novaMainScreenBootPromise && window.__novaBootMainPrep) {
      return window.__novaMainScreenBootPromise;
    }

    window.__novaMainScreenBootPromise = (async function () {
      function status(msg) {
        if (typeof onStatus === 'function') {
          try {
            onStatus(msg);
          } catch (_) {}
        }
      }

      status('Ana ekran hazırlanıyor…');
      revealMainForBoot();

      var student = getStoredStudent();
      if (!student) {
        status('Giriş ekranı hazır…');
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        try {
          if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
        } catch (_) {}
        if (typeof window.novaPrefetchMainScreenAssets === 'function') {
          window.novaPrefetchMainScreenAssets(true);
        }

        status('Lig ve arayüz yükleniyor…');
        await Promise.race([
          waitMainScreenPrefetch(3200),
          new Promise(function (r) {
            setTimeout(r, 2800);
          })
        ]);

        status('Kahraman ve kupa hazırlanıyor…');
        await window.novaEnsureMainScreenReady({ force: true, boot: true, fast: true });

        status('Hazır!');
        return mainScreenElementsReady();
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
        if (getStoredStudent()) window.novaEnsureMainScreenReady({ force: true, fast: true });
      },
      { passive: true }
    );

    window.addEventListener(
      'pageshow',
      function (ev) {
        if (!getStoredStudent()) return;
        if (ev && ev.persisted) {
          try {
            sessionStorage.removeItem('nova_sprite_boot_done_v6');
            sessionStorage.removeItem('nova_sprite_boot_done_v5');
          } catch (_) {}
          if (typeof window.novaSpriteBootReset === 'function') window.novaSpriteBootReset();
          if (typeof window.novaStartSpriteBoot === 'function') {
            window.novaStartSpriteBoot({ trigger: 'pageshow-restore' });
            return;
          }
        }
        window.novaEnsureMainScreenReady({ force: true, fast: true });
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
