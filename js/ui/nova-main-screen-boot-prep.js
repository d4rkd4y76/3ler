/* Ana ekran UI — öncelikli HUD/lig + garantili yenileme */
(function () {
  'use strict';

  var stabilizePromise = null;
  var ensureReadyPromise = null;
  var BOOT_WAIT_MAX_MS = 6500;

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

  function starsReady() {
    var st = document.getElementById('student-stars');
    if (!st) return true;
    return String(st.innerHTML || '').trim().length > 0;
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
    return String(cred.textContent || '').trim() !== '';
  }

  function studentNameReady() {
    var student = getStoredStudent();
    if (!student || !student.studentName) return true;
    var el = document.getElementById('student-name');
    if (!el) return true;
    return String(el.textContent || '').trim().length > 0;
  }

  function profilePhotoReady() {
    var student = getStoredStudent();
    var expected = String(
      window.__novaMainScreenExpectedPhoto || (student && student.photo) || ''
    ).trim();
    if (!expected) return window.__novaMainScreenProfileApplied === true;
    var el = document.getElementById('student-photo');
    if (!el) return true;
    if (el.complete && el.naturalWidth > 0) return true;
    return window.__novaMainScreenProfileApplied === true && el.src && el.src.indexOf('http') === 0;
  }

  function mainScreenElementsReady() {
    return (
      leagueBadgeReady() &&
      cupHudReady() &&
      starsReady() &&
      creditsReady() &&
      heroReady() &&
      studentNameReady() &&
      profilePhotoReady()
    );
  }

  function mainScreenReadinessRatio() {
    var checks = [
      leagueBadgeReady(),
      cupHudReady(),
      starsReady(),
      creditsReady(),
      heroReady(),
      studentNameReady(),
      profilePhotoReady()
    ];
    var n = 0;
    for (var i = 0; i < checks.length; i++) if (checks[i]) n += 1;
    return n / checks.length;
  }

  window.novaMainScreenElementsReady = mainScreenElementsReady;
  window.novaMainScreenReadinessRatio = mainScreenReadinessRatio;

  function revealMainForBoot() {
    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) main.style.removeProperty('display');
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}
  }

  async function kickMainScreenElementLoads() {
    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}
    if (!heroReady() && typeof window.novaRefreshMainScreenHero === 'function') {
      try {
        await Promise.race([
          window.novaRefreshMainScreenHero({ urgent: true }),
          new Promise(function (r) {
            setTimeout(r, 1800);
          })
        ]);
      } catch (_) {}
    }
    if (!profilePhotoReady() && typeof window.novaApplyMainScreenProfileUi === 'function') {
      try {
        await window.novaApplyMainScreenProfileUi();
      } catch (_) {}
    }
  }

  window.novaWaitUntilMainScreenElementsReady = async function (opts) {
    opts = opts || {};
    var maxMs = opts.maxMs == null ? BOOT_WAIT_MAX_MS : opts.maxMs;
    var kickMs = opts.kickMs == null ? 48 : opts.kickMs;
    var start = Date.now();
    var lastKick = 0;

    revealMainForBoot();

    while (Date.now() - start < maxMs) {
      if (mainScreenElementsReady()) {
        await new Promise(function (r) {
          requestAnimationFrame(function () {
            requestAnimationFrame(r);
          });
        });
        if (mainScreenElementsReady()) return true;
      }

      if (Date.now() - lastKick > kickMs) {
        lastKick = Date.now();
        await kickMainScreenElementLoads();
      }

      await new Promise(function (r) {
        requestAnimationFrame(r);
      });
    }

    return mainScreenElementsReady();
  };

  async function stabilizeMainScreenCore(opts) {
    opts = opts || {};
    var student = getStoredStudent();
    if (!student) return false;

    revealMainForBoot();

    if (typeof window.novaBootApplyInstantCache === 'function') {
      try {
        await window.novaBootApplyInstantCache();
      } catch (_) {}
    } else if (typeof window.novaApplyMainScreenHudInstant === 'function') {
      window.novaApplyMainScreenHudInstant();
    }

    await Promise.all([
      typeof window.novaPrefetchMainScreenAssets === 'function'
        ? Promise.race([
            window.novaPrefetchMainScreenAssets(opts.force),
            new Promise(function (r) {
              setTimeout(r, opts.boot ? 5500 : 6000);
            })
          ]).catch(function () {})
        : Promise.resolve(),
      ensureMainScreenLayout()
    ]);

    if (typeof window.novaRefreshMainScreenHero === 'function') {
      try {
        await Promise.race([
          window.novaRefreshMainScreenHero({ urgent: true }),
          new Promise(function (r) {
            setTimeout(r, opts.boot ? 3500 : 5500);
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

    if (!opts.boot && typeof window.novaSyncMainScreenBgVideo === 'function') {
      var bgP = window.novaSyncMainScreenBgVideo(false);
      if (opts.awaitBg) {
        try {
          await bgP;
        } catch (_) {}
      } else if (bgP && typeof bgP.catch === 'function') {
        bgP.catch(function () {});
      }
    }

    if (typeof window.onMainScreenLoad === 'function') {
      try {
        window.onMainScreenLoad();
      } catch (_) {}
    }

    try {
      document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
    } catch (_) {}

    window.__novaMainScreenBootReady = mainScreenElementsReady();
    return window.__novaMainScreenBootReady;
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

      revealMainForBoot();

      for (var attempt = 0; attempt < (opts.boot ? 4 : 8); attempt++) {
        try {
          await window.novaStabilizeMainScreen({
            force: true,
            awaitBg: false,
            boot: !!opts.boot,
            forcePrefetch: attempt > 0
          });
        } catch (_) {}

        if (mainScreenElementsReady()) {
          try {
            document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
          } catch (_) {}
          window.__novaMainScreenBootReady = true;
          return true;
        }

        if (opts.boot) {
          var ok = await window.novaWaitUntilMainScreenElementsReady({ maxMs: 2200, kickMs: 40 });
          if (ok) {
            try {
              document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
            } catch (_) {}
            window.__novaMainScreenBootReady = true;
            return true;
          }
        }

        await new Promise(function (r) {
          setTimeout(r, opts.boot ? 24 + attempt * 16 : 60 + attempt * 35);
        });
      }

      try {
        document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
      } catch (_) {}
      window.__novaMainScreenBootReady = mainScreenElementsReady();
      return window.__novaMainScreenBootReady;
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

      revealMainForBoot();

      var student = getStoredStudent();
      if (!student) {
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        status('Arayüz hazırlanıyor…');
        if (typeof window.novaBootApplyInstantCache === 'function') {
          await window.novaBootApplyInstantCache();
        }

        status('Kahramanlar yükleniyor…');
        await Promise.all([
          typeof window.novaPrefetchMainScreenAssets === 'function'
            ? window.novaPrefetchMainScreenAssets(true).catch(function () {})
            : Promise.resolve(),
          typeof window.novaRefreshMainScreenHero === 'function'
            ? Promise.race([
                window.novaRefreshMainScreenHero({ urgent: true }),
                new Promise(function (r) {
                  setTimeout(r, 4500);
                })
              ]).catch(function () {})
            : Promise.resolve(),
          ensureMainScreenLayout()
        ]);

        status('Son dokunuşlar…');
        var ok = await window.novaWaitUntilMainScreenElementsReady({
          maxMs: BOOT_WAIT_MAX_MS,
          kickMs: 40
        });

        if (!ok) {
          ok = mainScreenElementsReady();
        }

        window.__novaMainScreenBootReady = ok;
        return ok;
      } finally {
        window.__novaBootMainPrep = false;
      }
    })().catch(function (e) {
      console.warn('[nova main boot prep]', e);
      window.__novaMainScreenBootReady = mainScreenElementsReady();
      return window.__novaMainScreenBootReady;
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
