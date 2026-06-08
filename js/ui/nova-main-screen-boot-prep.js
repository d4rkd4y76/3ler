/* Ana ekran UI — öncelikli HUD/lig + garantili yenileme */
(function () {
  'use strict';

  var stabilizePromise = null;
  var ensureReadyPromise = null;
  var BOOT_WAIT_MAX_MS = 2800;
  var BOOT_WAIT_PHONE_MS = 1800;

  function isPhoneBoot() {
    if (typeof window.novaSpritePerfIsPhone === 'function') {
      return window.novaSpritePerfIsPhone();
    }
    return (window.innerWidth || 0) <= 768;
  }

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
      if (host.querySelector('svg')) return true;
      return false;
    }
    if (window.__novaBootMainPrep || window.__novaSpriteBootActive) return false;
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

  function profilePhotoBootReady() {
    var student = getStoredStudent();
    if (!student || !student.photo) return true;
    var el = document.getElementById('student-photo');
    if (!el) return true;
    if (el.complete && el.naturalWidth > 0) return true;
    if (window.__novaMainScreenProfileApplied === true) return true;
    var src = String(el.currentSrc || el.src || '').trim();
    return src.indexOf('http') === 0;
  }

  function heroBootReady() {
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return true;
    var host = slot.querySelector('[data-nova-main-hero]');
    if (!host) return false;
    var c = host.querySelector('canvas');
    if (c && c.width > 8 && c.height > 8) return true;
    return !!host.querySelector('svg');
  }

  function isMainScreenDisplayed() {
    try {
      if (document.documentElement.classList.contains('nova-boot-pending')) return false;
    } catch (_) {}
    var main = document.getElementById('main-screen');
    if (!main || !main.isConnected) return false;
    try {
      return window.getComputedStyle(main).display !== 'none';
    } catch (_) {
      return true;
    }
  }

  function cupCacheAvailable() {
    var student = getStoredStudent();
    if (!student) return false;
    try {
      if (student.gameCup != null && isFinite(Number(student.gameCup))) return true;
    } catch (_) {}
    try {
      var raw = localStorage.getItem('nova_main_game_cup_v1');
      if (!raw) return false;
      var o = JSON.parse(raw);
      var key = String(student.classId || '') + ':' + String(student.studentId || '');
      return !!(o && o.key === key);
    } catch (_) {
      return false;
    }
  }

  function bootHandoffReady() {
    return (
      studentNameReady() &&
      creditsReady() &&
      (cupHudReady() || leagueBadgeReady() || cupCacheAvailable())
    );
  }

  window.novaBootHandoffReady = bootHandoffReady;

  function mainScreenShellReady() {
    if (!studentNameReady()) return false;
    if (!creditsReady()) {
      var cred = document.getElementById('duel-credits-value');
      if (cred && String(cred.textContent || '').trim() === '') {
        cred.textContent = '0';
      }
    }
    return studentNameReady() && creditsReady();
  }

  window.novaMainScreenShellReady = mainScreenShellReady;

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
    var booting = !!(window.__novaSpriteBootActive || window.__novaBootMainPrep);
    var checks = [
      leagueBadgeReady(),
      cupHudReady(),
      starsReady(),
      creditsReady(),
      booting ? heroBootReady() : heroReady(),
      studentNameReady(),
      booting ? profilePhotoBootReady() : profilePhotoReady()
    ];
    var n = 0;
    for (var i = 0; i < checks.length; i++) if (checks[i]) n += 1;
    return n / checks.length;
  }

  window.novaMainScreenElementsReady = mainScreenElementsReady;
  window.novaMainScreenReadinessRatio = mainScreenReadinessRatio;

  function heroDisplayReady() {
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return true;
    var host = slot.querySelector('[data-nova-main-hero]');
    if (!host) return false;
    var c = host.querySelector('canvas');
    if (c && c.width > 8 && c.height > 8) return true;
    return !!host.querySelector('svg');
  }

  window.novaMainScreenSlotStatus = function () {
    return {
      photo: profilePhotoReady(),
      name: studentNameReady(),
      rank: leagueBadgeReady(),
      cup: cupHudReady(),
      credits: creditsReady(),
      hero: heroDisplayReady(),
      diamond: (function () {
        var el = document.getElementById('diamond-value');
        if (!el) return true;
        return String(el.textContent || '').trim() !== '';
      })()
    };
  };

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
    var kicks = [];
    if (!heroReady() && typeof window.novaRefreshMainScreenHero === 'function') {
      kicks.push(
        Promise.race([
          window.novaRefreshMainScreenHero({ urgent: true, force: true }),
          new Promise(function (r) {
            setTimeout(r, 2200);
          })
        ]).catch(function () {})
      );
    }
    if (!profilePhotoReady() && typeof window.novaApplyMainScreenProfileUi === 'function') {
      kicks.push(window.novaApplyMainScreenProfileUi().catch(function () {}));
    }
    if (kicks.length) await Promise.all(kicks);
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

  function heroSlotAlreadyReady() {
    try {
      if (typeof window.novaMainScreenSlotStatus === 'function') {
        return !!window.novaMainScreenSlotStatus().hero;
      }
    } catch (_) {}
    return heroReady();
  }

  async function stabilizeMainScreenCore(opts) {
    opts = opts || {};
    var student = getStoredStudent();
    if (!student) return false;
    var light = !!opts.afterBoot && !opts.force;
    var skipPrefetch = light || (!opts.force && window.__novaMainScreenPrefetchDone);
    var skipHero = light || (!opts.force && heroSlotAlreadyReady());

    revealMainForBoot();

    if (!light) {
      if (typeof window.novaBootApplyInstantCache === 'function') {
        try {
          await window.novaBootApplyInstantCache();
        } catch (_) {}
      } else if (typeof window.novaApplyMainScreenHudInstant === 'function') {
        window.novaApplyMainScreenHudInstant();
      }
    }

    var parallel = [ensureMainScreenLayout()];
    if (!skipPrefetch && typeof window.novaPrefetchMainScreenAssets === 'function') {
      parallel.push(
        Promise.race([
          window.novaPrefetchMainScreenAssets(opts.force),
          new Promise(function (r) {
            setTimeout(r, opts.boot ? 5500 : 6000);
          })
        ]).catch(function () {})
      );
    }
    await Promise.all(parallel);

    if (!skipHero && typeof window.novaRefreshMainScreenHero === 'function') {
      try {
        await Promise.race([
          window.novaRefreshMainScreenHero({ urgent: true }),
          new Promise(function (r) {
            setTimeout(r, opts.boot ? 3500 : 5500);
          })
        ]);
      } catch (_) {}
    }

    if (!light) {
      try {
        if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
      } catch (_) {}
    }
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

    if (typeof window.onMainScreenLoad === 'function' && !window.__novaMainScreenLoadDone) {
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
    if (stabilizePromise) return stabilizePromise;
    stabilizePromise = stabilizeMainScreenCore(opts).finally(function () {
      setTimeout(function () {
        stabilizePromise = null;
      }, 300);
    });
    return stabilizePromise;
  };

  window.novaEnsureMainScreenReady = function (opts) {
    opts = opts || {};
    if (window.__novaSpriteBootActive && !opts.afterBoot) return Promise.resolve(!!window.__novaMainScreenBootReady);
    if (ensureReadyPromise) return ensureReadyPromise;

    ensureReadyPromise = (async function () {
      var student = getStoredStudent();
      if (!student) return false;

      revealMainForBoot();

      try {
        await window.novaStabilizeMainScreen({
          awaitBg: false,
          boot: !!opts.boot,
          light: !!opts.afterBoot && !opts.force,
          force: !!opts.force
        });
      } catch (_) {}

      if (!mainScreenElementsReady()) {
        await window.novaWaitUntilMainScreenElementsReady({
          maxMs: opts.boot ? (isPhoneBoot() ? BOOT_WAIT_PHONE_MS : BOOT_WAIT_MAX_MS) : 5000,
          kickMs: 64
        });
      }

      var ok = mainScreenElementsReady();
      if (ok) {
        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
        } catch (_) {}
      }
      window.__novaMainScreenBootReady = ok;
      return ok;
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
        if (typeof window.novaActivateMainSlotPlaceholders === 'function') {
          window.novaActivateMainSlotPlaceholders();
        }

        status('Arayüz hazırlanıyor…');
        var prepTasks = [ensureMainScreenLayout()];

        if (typeof window.novaBootApplyInstantCache === 'function' && !window.__novaBootInstantCacheApplied) {
          prepTasks.push(window.novaBootApplyInstantCache().catch(function () {}));
        } else if (typeof window.novaApplyMainScreenHudInstant === 'function') {
          window.novaApplyMainScreenHudInstant();
        }

        if (!window.__novaMainScreenPrefetchStarted && typeof window.novaPrefetchMainScreenAssets === 'function') {
          prepTasks.push(
            Promise.race([
              window.novaPrefetchMainScreenAssets(true).catch(function () {}),
              new Promise(function (r) {
                setTimeout(r, isPhoneBoot() ? 2200 : 2800);
              })
            ])
          );
        }

        if (
          isMainScreenDisplayed() &&
          !heroSlotAlreadyReady() &&
          typeof window.novaRefreshMainScreenHero === 'function'
        ) {
          status('Kahramanlar yükleniyor…');
          prepTasks.push(
            Promise.race([
              window.novaRefreshMainScreenHero({ urgent: true, force: true }),
              new Promise(function (r) {
                setTimeout(r, isPhoneBoot() ? 1600 : 2000);
              })
            ]).catch(function () {})
          );
        }

        if (!profilePhotoBootReady() && typeof window.novaApplyMainScreenProfileUi === 'function') {
          prepTasks.push(
            Promise.race([
              window.novaApplyMainScreenProfileUi().catch(function () {}),
              new Promise(function (r) {
                setTimeout(r, 1200);
              })
            ])
          );
        }

        await Promise.all(prepTasks);

        if (typeof window.novaSyncMainSlotPlaceholders === 'function') {
          window.novaSyncMainSlotPlaceholders();
        }

        if (typeof window.onMainScreenLoad === 'function' && !window.__novaMainScreenLoadDone) {
          try {
            window.onMainScreenLoad();
          } catch (_) {}
        }

        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
        } catch (_) {}

        if (!mainScreenShellReady() && !bootHandoffReady()) {
          await window.novaWaitUntilMainScreenElementsReady({
            maxMs: isPhoneBoot() ? 1200 : 1600,
            kickMs: 48
          });
        }

        window.__novaMainScreenBootReady =
          mainScreenShellReady() || bootHandoffReady() || mainScreenElementsReady();
        return window.__novaMainScreenBootReady;
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
        if (!getStoredStudent() || window.__novaMainScreenBootReady) return;
        window.novaEnsureMainScreenReady({ afterBoot: true });
        if (typeof window.novaBonusDrawerSetOpen === 'function') {
          try {
            window.novaBonusDrawerSetOpen(false);
          } catch (_) {}
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'pageshow',
      function (ev) {
        if (!getStoredStudent()) return;
        if (ev && ev.persisted) {
          window.novaEnsureMainScreenReady({ afterBoot: true });
          return;
        }
      },
      { passive: true }
    );
  }

  bindMainScreenRecovery();
})();
