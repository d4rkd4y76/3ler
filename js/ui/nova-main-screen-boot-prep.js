/* Ana ekran UI — öncelikli HUD/lig + garantili yenileme */
(function () {
  'use strict';

  var stabilizePromise = null;
  var ensureReadyPromise = null;
  var BOOT_STRICT_MAX_MS = 32000;

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
      var limit = maxMs == null ? 12000 : maxMs;
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
        window.novaPrefetchMainScreenAssets(true).finally(function () {
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
    var txt = String(cred.textContent || '').trim();
    return txt !== '';
  }

  function studentNameReady() {
    var student = getStoredStudent();
    if (!student || !student.studentName) return true;
    var el = document.getElementById('student-name');
    if (!el) return true;
    return String(el.textContent || '').trim().length > 0;
  }

  function profilePhotoReady() {
    if (window.__novaMainScreenProfileApplied !== true) return false;
    var el = document.getElementById('student-photo');
    if (!el) return true;
    var expected = String(window.__novaMainScreenExpectedPhoto || '').trim();
    if (!expected) return true;
    if (el.style.display === 'none') return false;
    if (!el.complete || el.naturalWidth < 1) return false;
    try {
      var cur = el.currentSrc || el.src || '';
      return cur.indexOf(expected.split('?')[0]) >= 0 || cur === expected;
    } catch (_) {
      return el.naturalWidth > 0;
    }
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

  async function kickMainScreenElementLoads() {
    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}
    try {
      if (typeof window.novaApplyMainScreenProfileUi === 'function') {
        await window.novaApplyMainScreenProfileUi();
      }
    } catch (_) {}
    if (!heroReady() && typeof window.novaRefreshMainScreenHero === 'function') {
      try {
        await window.novaRefreshMainScreenHero({ urgent: true });
      } catch (_) {}
    }
    try {
      if (typeof window.fetchAndDisplayGameCup === 'function') window.fetchAndDisplayGameCup(true);
    } catch (_) {}
  }

  window.novaWaitUntilMainScreenElementsReady = async function (opts) {
    opts = opts || {};
    var maxMs = opts.maxMs == null ? BOOT_STRICT_MAX_MS : opts.maxMs;
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

      if (Date.now() - lastKick > 120) {
        lastKick = Date.now();
        await kickMainScreenElementLoads();
      }

      await new Promise(function (r) {
        requestAnimationFrame(function () {
          requestAnimationFrame(r);
        });
      });
    }

    return mainScreenElementsReady();
  };

  async function stabilizeMainScreenCore(opts) {
    opts = opts || {};
    var student = getStoredStudent();
    if (!student) return false;
    var strict = !!(opts.strict || opts.boot);

    revealMainForBoot();

    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}

    var prefetchP =
      typeof window.novaPrefetchMainScreenAssets === 'function'
        ? strict
          ? window.novaPrefetchMainScreenAssets(true)
          : Promise.race([
              window.novaPrefetchMainScreenAssets(opts.force),
              new Promise(function (r) {
                setTimeout(r, 6000);
              })
            ])
        : Promise.resolve();

    await Promise.all([prefetchP, ensureMainScreenLayout()]);

    try {
      if (typeof window.novaApplyMainScreenProfileUi === 'function') {
        await window.novaApplyMainScreenProfileUi();
      }
    } catch (_) {}

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
        if (strict) {
          await window.novaRefreshMainScreenHero({ urgent: true });
        } else {
          await Promise.race([
            window.novaRefreshMainScreenHero({ urgent: true }),
            new Promise(function (r) {
              setTimeout(r, 5500);
            })
          ]);
        }
      } catch (_) {}
    }

    try {
      if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
    } catch (_) {}
    try {
      if (typeof window.fetchAndDisplayGameCup === 'function') window.fetchAndDisplayGameCup(true);
    } catch (_) {}

    if (!strict && typeof window.novaSyncMainScreenBgVideo === 'function') {
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

    if (strict) {
      return window.novaWaitUntilMainScreenElementsReady({ maxMs: BOOT_STRICT_MAX_MS });
    }

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

    var strict = !!(opts.strict || opts.boot);

    ensureReadyPromise = (async function () {
      var student = getStoredStudent();
      if (!student) return false;

      revealMainForBoot();

      if (strict) {
        await window.novaStabilizeMainScreen({ force: true, awaitBg: false, boot: true, strict: true });
        var ok = await window.novaWaitUntilMainScreenElementsReady({ maxMs: BOOT_STRICT_MAX_MS });
        if (ok) {
          try {
            document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
          } catch (_) {}
        }
        window.__novaMainScreenBootReady = ok;
        return ok;
      }

      for (var attempt = 0; attempt < 8; attempt++) {
        try {
          if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
          if (typeof window.novaPrefetchMainScreenAssets === 'function') {
            await Promise.race([
              window.novaPrefetchMainScreenAssets(attempt > 0),
              new Promise(function (r) {
                setTimeout(r, 5000);
              })
            ]);
          }
          await window.novaStabilizeMainScreen({ force: true, awaitBg: false });
        } catch (_) {}

        if (mainScreenElementsReady()) {
          try {
            document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
          } catch (_) {}
          window.__novaMainScreenBootReady = true;
          return true;
        }
        await new Promise(function (r) {
          setTimeout(r, 60 + attempt * 35);
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

      status('Ana ekran hazırlanıyor…');
      revealMainForBoot();
      window.__novaMainScreenProfileApplied = false;

      var student = getStoredStudent();
      if (!student) {
        status('Giriş ekranı hazır…');
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        status('Profil ve lig yükleniyor…');
        await waitMainScreenPrefetch(14000);

        status('Kahraman ve arayüz hazırlanıyor…');
        var ok = await window.novaEnsureMainScreenReady({ force: true, boot: true, strict: true });

        status(ok ? 'Hazır!' : 'Son kontroller…');
        if (!ok) {
          ok = await window.novaWaitUntilMainScreenElementsReady({ maxMs: 10000 });
        }

        window.__novaMainScreenBootReady = ok;
        return ok;
      } finally {
        window.__novaBootMainPrep = false;
      }
    })().catch(function (e) {
      console.warn('[nova main boot prep]', e);
      window.__novaMainScreenBootReady = false;
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
