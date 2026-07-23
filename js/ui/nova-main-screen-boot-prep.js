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
    var el = document.getElementById('student-name');
    if (!el) return false;
    var painted = String(el.textContent || '').trim().length > 0;
    var student = getStoredStudent();
    if (!student || !student.studentName) {
      return painted || window.__novaMainScreenProfileApplied === true;
    }
    return painted;
  }

  function profilePhotoDecoded() {
    var el = document.getElementById('student-photo');
    if (!el) return false;
    try {
      if (el.complete && el.naturalWidth > 0) return true;
    } catch (_) {}
    return false;
  }

  function profilePhotoReady() {
    var student = getStoredStudent();
    var expected = String(
      window.__novaMainScreenExpectedPhoto || (student && student.photo) || ''
    ).trim();
    if (!expected) return true;
    return profilePhotoDecoded();
  }

  function profilePhotoBootReady() {
    return profilePhotoReady();
  }

  function mainChromeReady() {
    var dock = document.getElementById('main-screen-top-bar');
    var lobby = document.getElementById('nova-main-lobby');
    var tabs = document.getElementById('nova-main-tabs');
    if (!dock || !lobby || !tabs) return false;
    try {
      var dr = dock.getBoundingClientRect();
      var lr = lobby.getBoundingClientRect();
      if (dr.width < 40 || dr.height < 16) return false;
      if (lr.width < 40 || lr.height < 16) return false;
    } catch (_) {
      return false;
    }
    return true;
  }

  function mainBgPaintReady() {
    try {
      if (window.__novaMainBgPaintReady) return true;
    } catch (_) {}
    try {
      if (document.body.classList.contains('nova-main-bg-video-on')) return true;
      if (document.body.classList.contains('nova-main-bg-gradient-fallback')) return true;
    } catch (_) {}
    var img = document.getElementById('nova-main-bg-image');
    if (img && !img.hidden && img.complete && img.naturalWidth > 0) return true;
    var layer = document.getElementById('nova-main-bg-video-layer');
    if (layer && (layer.classList.contains('is-active') || layer.classList.contains('is-gradient-fallback'))) {
      return true;
    }
    return false;
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
      if (document.documentElement.classList.contains('nova-main-gate-on')) return false;
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

  function lazyTabsActive() {
    try {
      return typeof window.novaMainTabsLazyEnabled === 'function' && window.novaMainTabsLazyEnabled();
    } catch (_) {
      return false;
    }
  }

  function bootHandoffReady() {
    return (
      mainChromeReady() &&
      studentNameReady() &&
      profilePhotoBootReady() &&
      mainBgPaintReady()
    );
  }

  window.novaBootHandoffReady = bootHandoffReady;

  function mainScreenShellReady() {
    if (!studentNameReady() || !mainChromeReady()) return false;
    if (!creditsReady()) {
      var cred = document.getElementById('duel-credits-value');
      if (cred && String(cred.textContent || '').trim() === '') {
        cred.textContent = '0';
      }
    }
    return studentNameReady() && creditsReady();
  }

  window.novaMainScreenShellReady = mainScreenShellReady;

  function lobbyTilesReady() {
    var lobby = document.getElementById('nova-main-lobby');
    if (!lobby) return false;
    try {
      var tiles = lobby.querySelectorAll(
        '.nova-lobby-tile, .nova-main-lobby__tile, button, a, [data-nova-lobby]'
      );
      if (tiles.length < 2) {
        /* Lazy / alternatif yapı — en az lobby boyutu yeterli */
        var lr = lobby.getBoundingClientRect();
        return lr.width >= 80 && lr.height >= 80;
      }
      var visible = 0;
      for (var i = 0; i < tiles.length && i < 12; i++) {
        var r = tiles[i].getBoundingClientRect();
        if (r.width >= 24 && r.height >= 24) visible += 1;
      }
      return visible >= 2;
    } catch (_) {
      return true;
    }
  }

  function mainScreenElementsReady() {
    /* Kapı kapanması: iskelet + lobby oturmuş olsun (bg/foto oranını doldurur) */
    if (!mainChromeReady() || !studentNameReady()) return false;
    if (!creditsReady()) {
      var cred = document.getElementById('duel-credits-value');
      if (cred && String(cred.textContent || '').trim() === '') cred.textContent = '0';
    }
    if (!lobbyTilesReady()) return false;
    return true;
  }

  function mainScreenReadinessRatio() {
    var checks = [
      mainChromeReady(),
      studentNameReady(),
      creditsReady(),
      mainBgPaintReady(),
      profilePhotoBootReady(),
      lobbyTilesReady()
    ];
    var n = 0;
    for (var i = 0; i < checks.length; i++) if (checks[i]) n += 1;
    return n / checks.length;
  }

  window.novaMainScreenElementsReady = mainScreenElementsReady;
  window.novaMainScreenReadinessRatio = mainScreenReadinessRatio;

  function heroDisplayReady() {
    if (lazyTabsActive()) return true;
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return true;
    var host = slot.querySelector('[data-nova-main-hero]');
    if (!host) return false;
    var c = host.querySelector('canvas');
    if (c && c.width > 8 && c.height > 8) return true;
    return !!host.querySelector('svg');
  }

  window.novaMainScreenSlotStatus = function () {
    if (lazyTabsActive()) {
      return {
        photo: profilePhotoReady(),
        name: studentNameReady(),
        rank: true,
        cup: true,
        credits: true,
        hero: true,
        diamond: true
      };
    }
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
    /* Medyayı await etme — Firebase/HUD ile aynı bağlantı sırasını doldurmasın */
    if (!lazyTabsActive() && !heroReady() && typeof window.novaRefreshMainScreenHero === 'function') {
      window.novaRefreshMainScreenHero({ urgent: true }).catch(function () {});
    }
    if (!profilePhotoReady() && typeof window.novaApplyMainScreenProfileUi === 'function') {
      window.novaApplyMainScreenProfileUi().catch(function () {});
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
    var skipHero = lazyTabsActive() || light || (!opts.force && heroSlotAlreadyReady());

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

    /* Kahraman + arka plan: fire-and-forget — diğer ağ isteklerini bekletme */
    if (!skipHero && typeof window.novaRefreshMainScreenHero === 'function') {
      window.novaRefreshMainScreenHero({ urgent: true }).catch(function () {});
    }

    if (!light) {
      try {
        if (typeof window.novaApplyMainScreenHudInstant === 'function') window.novaApplyMainScreenHudInstant();
      } catch (_) {}
    }
    if (typeof window.novaSyncMainScreenBgVideo === 'function') {
      try {
        window.novaSyncMainScreenBgVideo(false);
      } catch (_) {}
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
          afterBoot: !!opts.afterBoot,
          boot: !!opts.boot,
          force: !!opts.force
        });
      } catch (_) {}

      if (!mainScreenElementsReady()) {
        await window.novaWaitUntilMainScreenElementsReady({
          maxMs: opts.boot || opts.afterBoot ? (isPhoneBoot() ? 2800 : 4000) : 3500,
          kickMs: 80
        });
      }

      var ok = mainScreenElementsReady();
      window.__novaMainScreenBootReady = ok;
      if (ok) {
        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-ready'));
        } catch (_) {}
      }
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
          !lazyTabsActive() &&
          !heroSlotAlreadyReady() &&
          typeof window.novaRefreshMainScreenHero === 'function'
        ) {
          status('Kahramanlar yükleniyor…');
          /* Await etme — sprite indirmesi Firebase'i bloke etmesin */
          window.novaRefreshMainScreenHero({ urgent: true }).catch(function () {});
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

  function isBootOverlayBlocking() {
    var ov = document.getElementById('nova_sprite_boot_overlay');
    if (!ov || ov.hidden) return false;
    try {
      return window.getComputedStyle(ov).visibility !== 'hidden';
    } catch (_) {
      return true;
    }
  }

  window.novaReturnToMainScreen = function (opts) {
    opts = opts || {};
    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');

    if (login) login.style.display = 'none';
    try {
      document.body.classList.remove('nova-sp-screen-open', 'nova-sp-game-open', 'roborox-reader-open');
      document.body.classList.add('nova-main-screen-visible');
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    } catch (_) {}

    if (main) {
      main.style.removeProperty('display');
      main.style.removeProperty('visibility');
      main.style.removeProperty('opacity');
      main.style.setProperty('display', 'flex', 'important');
      main.style.setProperty('visibility', 'visible', 'important');
      main.style.setProperty('opacity', '1', 'important');
      main.removeAttribute('aria-hidden');
    }

    try {
      document.documentElement.classList.remove('nova-boot-pending');
      document.documentElement.classList.remove('roborox-reader-open');
    } catch (_) {}

    if (isBootOverlayBlocking()) {
      try {
        if (typeof window.novaForceBootHandoff === 'function') {
          window.novaForceBootHandoff('return-main');
        }
      } catch (_) {}
    }

    if (!opts.skipPerf && typeof window.novaPerfBeforeMainScreen === 'function') {
      try {
        window.novaPerfBeforeMainScreen();
      } catch (_) {}
    }

    function relayoutPass() {
      try {
        if (typeof window.novaEnsureLoggedInUi === 'function') {
          window.novaEnsureLoggedInUi({ light: true });
        }
      } catch (_) {}
      try {
        if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
      } catch (_) {}
      try {
        if (typeof window.novaSyncPerfRuntime === 'function') window.novaSyncPerfRuntime();
      } catch (_) {}
      try {
        if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
      } catch (_) {}
      try {
        if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
      } catch (_) {}
      try {
        if (typeof window.novaSpriteRefreshMainHeroCanvases === 'function') {
          window.novaSpriteRefreshMainHeroCanvases();
        }
      } catch (_) {}
      if (!lazyTabsActive() && opts.hero !== false && typeof window.novaRefreshMainScreenHero === 'function') {
        window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
      }
      try {
        document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
      } catch (_) {}
    }

    relayoutPass();
    requestAnimationFrame(function () {
      requestAnimationFrame(relayoutPass);
    });
    setTimeout(relayoutPass, 160);

    if (typeof window.novaStabilizeMainScreen === 'function') {
      window.novaStabilizeMainScreen({
        afterBoot: true,
        force: !!opts.force,
        awaitBg: false
      }).catch(function () {});
    }
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
