/* Boot — tek görsel, blur→net, ana ekran hazır olunca yumuşak geçiş */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v9';
  var BOOT_IMAGE_URL =
    'https://dlxstore.b-cdn.net/A_highly_detailed%2C_cinematic_masterpiece%2C_202606081224%20(1).jpeg';
  var MAX_BLUR_PX = 32;
  var MAX_SCALE_EXTRA = 0.08;
  var MAX_WAIT_MS = 45000;
  var MAX_WAIT_PHONE_MS = 32000;
  var EXIT_FADE_MS = 1200;
  var DOWNLOAD_PROGRESS_MAX = 0.12;
  var IMAGE_READY_PROGRESS = 0.12;
  var REVEAL_END_PROGRESS = 1;
  var MIN_REVEAL_MS = 900;
  var MIN_REVEAL_PHONE_MS = 700;
  var MIN_REVEAL_READY_MS = 400;
  var MIN_REVEAL_READY_PHONE_MS = 300;
  var MAX_REVEAL_MS = 3600;
  var MAX_REVEAL_PHONE_MS = 2800;

  window.__novaSpriteBootManaged = true;

  var state = {
    smoothPct: 0,
    exiting: false,
    handoffReady: false,
    bootAnimAllowed: false,
    downloadTicker: 0,
    revealTicker: 0,
    revealComplete: false,
    downloadProgressRatio: 0.03,
    animDone: false
  };

  var bootImage = { img: null, promise: null };
  var progressDomCache = null;
  var bootSideWorkPromise = null;
  var bootRunPromise = null;

  function isPhoneBoot() {
    if (typeof window.novaSpritePerfIsPhone === 'function') {
      return window.novaSpritePerfIsPhone();
    }
    return (window.innerWidth || 0) <= 768;
  }

  function hasStoredStudentSession() {
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o.studentId && o.classId);
    } catch (_) {
      return false;
    }
  }

  function isHardReload() {
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type === 'reload') return true;
    } catch (_) {}
    try {
      if (performance.navigation && performance.navigation.type === 1) return true;
    } catch (_) {}
    return false;
  }

  function shouldRunBoot() {
    if (isHardReload()) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('nova_sprite_boot_done_v8');
        sessionStorage.removeItem('nova_sprite_boot_done_v7');
        sessionStorage.removeItem('nova_sprite_boot_done_v6');
      } catch (_) {}
      return true;
    }
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return false;
    } catch (_) {}
    return true;
  }

  function getOverlay() {
    return document.getElementById('nova_sprite_boot_overlay');
  }

  function hideOverlayInitially() {
    var ov = getOverlay();
    if (ov) {
      ov.hidden = true;
      ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out');
    }
    try {
      document.body.classList.remove('nova-sprite-boot-active', 'nova-boot-handoff-active');
    } catch (_) {}
  }

  function applyMainScreenLayoutShell() {
    var login = document.getElementById('student-selection-screen');
    var main = document.getElementById('main-screen');
    if (login) login.style.display = 'none';
    if (main) main.style.removeProperty('display');
    try {
      document.documentElement.classList.add('nova-has-session', 'nova-main-screen-visible');
      document.body.classList.remove('nova-login-fast-visible');
      document.body.classList.add('nova-main-screen-visible');
    } catch (_) {}
    try {
      if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
    } catch (_) {}
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}
    try {
      if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
    } catch (_) {}
    try {
      if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
    } catch (_) {}
    try {
      if (typeof window.novaSyncPerfRuntime === 'function') window.novaSyncPerfRuntime();
    } catch (_) {}
  }

  window.novaPrepareMainScreenLayoutShell = applyMainScreenLayoutShell;

  function prepareBootShellEarly() {
    if (!hasStoredStudentSession() || !shouldRunBoot()) {
      hideOverlayInitially();
      return;
    }
    applyMainScreenLayoutShell();
    var ov = getOverlay();
    var main = document.getElementById('main-screen');
    if (main) {
      main.style.visibility = 'hidden';
      main.style.opacity = '0';
    }
    try {
      document.documentElement.classList.add('nova-boot-pending');
      document.body.classList.add('nova-sprite-boot-active');
      document.body.classList.remove('nova-boot-handoff-active');
    } catch (_) {}
    if (ov) {
      ov.hidden = false;
      ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out');
    }
    window.__novaSpriteBootActive = true;
  }

  function markBootDone() {
    var ready = mainElementsReadyNow();
    try {
      if (ready) sessionStorage.setItem(SESSION_KEY, '1');
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    window.__novaSpriteBootDone = true;
    window.__novaMainScreenBootReady = ready;
    window.__novaBootVideoPhase = false;
    if (typeof window.novaSpriteBootFlushDefer === 'function') {
      window.novaSpriteBootFlushDefer();
    }
    scheduleDeferredAssetPreload();
  }

  function scheduleDeferredAssetPreload() {
    if (window.__novaSpriteDeferredPreloadStarted) return;
    window.__novaSpriteDeferredPreloadStarted = true;
    if (typeof window.novaPrefetchMainScreenDeferredExtras === 'function') {
      window.novaPrefetchMainScreenDeferredExtras().catch(function () {});
    }
    if (typeof window.novaSpritePreloadAll === 'function') {
      window.novaSpritePreloadAll().catch(function () {}).finally(function () {
        window.__novaSpriteAssetsReady = true;
      });
    }
  }

  function applyBootGameTitle() {
    var h1 = document.querySelector('.nova-sprite-boot-game');
    if (!h1) return;
    var title = 'D\u00DCELLOX';
    try {
      if (typeof window.NOVA_GAME_NAME === 'string' && window.NOVA_GAME_NAME) {
        title = window.NOVA_GAME_NAME.toLocaleUpperCase('tr');
      }
    } catch (_) {}
    h1.textContent = title;
    h1.setAttribute('lang', 'tr');
    h1.style.textTransform = 'none';
    h1.style.fontVariant = 'normal';
  }

  function getProgressDom(ov) {
    if (!progressDomCache || progressDomCache.ov !== ov) {
      progressDomCache = {
        ov: ov,
        bar: ov.querySelector('.nova-sprite-boot-bar'),
        label: ov.querySelector('.nova-sprite-boot-pct'),
        wrap: ov.querySelector('.nova-sprite-boot-bar-wrap'),
        status: ov.querySelector('.nova-sprite-boot-status')
      };
    }
    return progressDomCache;
  }

  function updateBootVisualVars(ov, progress) {
    var remain = Math.max(0, 1 - progress);
    ov.style.setProperty('--nova-boot-blur', (remain * MAX_BLUR_PX).toFixed(2) + 'px');
    ov.style.setProperty('--nova-boot-scale', String(1 + remain * MAX_SCALE_EXTRA));
    ov.style.setProperty('--nova-boot-brightness', String(0.68 + progress * 0.32));
    ov.style.setProperty('--nova-boot-saturate', String(0.82 + progress * 0.18));
  }

  function setProgress(ratio, statusText, opts) {
    var ov = getOverlay();
    if (!ov) return;
    opts = opts || {};
    if (!state.bootAnimAllowed && !opts.allowDuringDownload && !opts.forceComplete) {
      ratio = Math.max(Number(ratio) || 0, state.downloadProgressRatio || 0.03);
    }
    if (!state.handoffReady && !state.revealComplete && ratio >= 1 && !opts.forceComplete) {
      ratio = Math.min(ratio, 0.97);
    }
    var progress = Math.max(0, Math.min(1, ratio || 0));
    var pct = Math.round(progress * 100);
    state.smoothPct = pct;
    ov.style.setProperty('--nova-boot-progress', String(progress));
    ov.style.setProperty('--nova-boot-pct', String(pct));
    updateBootVisualVars(ov, progress);

    var dom = getProgressDom(ov);
    if (dom.bar) {
      dom.bar.setAttribute('aria-valuenow', String(pct));
      dom.bar.classList.toggle('is-full', pct >= 100);
    }
    if (dom.wrap) {
      dom.wrap.classList.toggle('has-progress', pct > 0);
      dom.wrap.setAttribute('aria-valuenow', String(pct));
    }
    if (dom.label) dom.label.textContent = pct + '%';
    if (dom.status && statusText) dom.status.textContent = statusText;
  }

  function stopDownloadProgress() {
    if (state.downloadTicker) cancelAnimationFrame(state.downloadTicker);
    state.downloadTicker = 0;
  }

  function stopRevealProgress() {
    if (state.revealTicker) cancelAnimationFrame(state.revealTicker);
    state.revealTicker = 0;
  }

  function bootHandoffReadyNow() {
    if (typeof window.novaBootHandoffReady === 'function') {
      try {
        return window.novaBootHandoffReady();
      } catch (_) {}
    }
    return mainElementsReadyNow();
  }

  function canProceedToHandoff(elapsed, readiness) {
    var minReadyMs = isPhoneBoot() ? MIN_REVEAL_READY_PHONE_MS : MIN_REVEAL_READY_MS;
    if (elapsed < minReadyMs) return false;
    if (mainElementsReadyNow() || bootHandoffReadyNow()) return true;
    if (readiness >= 0.82) return true;
    return false;
  }

  function finishRevealProgress(resolve, statusText) {
    stopRevealProgress();
    state.revealComplete = true;
    state.handoffReady = true;
    setProgress(1, statusText || 'Hazır!', { forceComplete: true, allowDuringDownload: true });
    resolve();
  }

  function bootReadinessProgress() {
    if (typeof window.novaMainScreenReadinessRatio === 'function') {
      try {
        return window.novaMainScreenReadinessRatio();
      } catch (_) {}
    }
    return mainElementsReadyNow() ? 1 : 0.2;
  }

  function revealStatusForProgress(progress) {
    if (progress < 0.35) return 'Açılış görseli hazırlanıyor…';
    if (progress < 0.62) return 'Kahramanlar ve profil yükleniyor…';
    if (progress < 0.88) return 'Ana ekran hazırlanıyor…';
    return 'Neredeyse hazır…';
  }

  function startDownloadProgress() {
    stopDownloadProgress();
    var dlStart = performance.now();
    function tick(now) {
      if (state.bootImageReady || state.exiting) {
        stopDownloadProgress();
        return;
      }
      var elapsed = (now || performance.now()) - dlStart;
      var p = Math.min(DOWNLOAD_PROGRESS_MAX, 0.02 + (elapsed / 4000) * (DOWNLOAD_PROGRESS_MAX - 0.02));
      state.downloadProgressRatio = p;
      setProgress(p, 'Açılış görseli indiriliyor…', { allowDuringDownload: true });
      state.downloadTicker = requestAnimationFrame(tick);
    }
    state.downloadTicker = requestAnimationFrame(tick);
  }

  function startAdaptiveReveal() {
    stopRevealProgress();
    state.revealComplete = false;
    var revealStart = performance.now();
    var minMs = isPhoneBoot() ? MIN_REVEAL_PHONE_MS : MIN_REVEAL_MS;
    var minReadyMs = isPhoneBoot() ? MIN_REVEAL_READY_PHONE_MS : MIN_REVEAL_READY_MS;
    var maxMs = isPhoneBoot() ? MAX_REVEAL_PHONE_MS : MAX_REVEAL_MS;
    var span = REVEAL_END_PROGRESS - IMAGE_READY_PROGRESS;

    setProgress(IMAGE_READY_PROGRESS, revealStatusForProgress(IMAGE_READY_PROGRESS), {
      allowDuringDownload: true
    });

    return new Promise(function (resolve) {
      function tick(now) {
        if (state.exiting) {
          stopRevealProgress();
          resolve();
          return;
        }
        var t = now || performance.now();
        var elapsed = t - revealStart;
        var readiness = bootReadinessProgress();
        var timeRatio = Math.min(1, elapsed / minMs);
        var blend = Math.min(1, timeRatio * 0.15 + readiness * 0.85);
        var progress = IMAGE_READY_PROGRESS + span * blend;
        if (canProceedToHandoff(elapsed, readiness)) {
          finishRevealProgress(resolve, 'Hazır!');
          return;
        }
        setProgress(progress, revealStatusForProgress(progress), { allowDuringDownload: true });

        if (elapsed >= maxMs) {
          finishRevealProgress(resolve, 'Ana ekran açılıyor…');
          return;
        }
        state.revealTicker = requestAnimationFrame(tick);
      }
      state.revealTicker = requestAnimationFrame(tick);
    });
  }

  function mainElementsReadyNow() {
    if (typeof window.novaMainScreenElementsReady === 'function') {
      try {
        return window.novaMainScreenElementsReady();
      } catch (_) {}
    }
    return !!window.__novaMainScreenBootReady;
  }

  function revealMainScreenUnderOverlay(opts) {
    opts = opts || {};
    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) {
      main.style.removeProperty('display');
      if (opts.keepHidden) {
        main.style.visibility = 'hidden';
        main.style.opacity = '0';
      } else {
        main.style.visibility = 'visible';
        if (opts.fadeIn) {
          main.style.opacity = '0';
        } else {
          main.style.opacity = '1';
        }
      }
    }
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}
    if (!opts.keepHidden) {
      try {
        document.body.classList.add('nova-main-screen-visible');
      } catch (_) {}
    }
  }

  function waitForMainScreenReady(maxMs) {
    if (mainElementsReadyNow()) return Promise.resolve(true);
    if (typeof window.novaWaitUntilMainScreenElementsReady === 'function') {
      return window.novaWaitUntilMainScreenElementsReady({
        maxMs: maxMs == null ? (isPhoneBoot() ? 8000 : 12000) : maxMs,
        kickMs: 64
      });
    }
    return Promise.resolve(false);
  }

  function kickBootHandoffLayout() {
    applyMainScreenLayoutShell();
    if (typeof window.novaFixHudFabLayout === 'function') {
      try {
        window.novaFixHudFabLayout();
      } catch (_) {}
    }
    if (!mainElementsReadyNow() && typeof window.novaRefreshMainScreenHero === 'function') {
      try {
        window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
      } catch (_) {}
    }
    return Promise.resolve(true);
  }

  function playExitTransition() {
    if (state.exiting) return Promise.resolve();
    state.exiting = true;
    window.__novaBootVideoPhase = false;

    var ov = getOverlay();
    var main = document.getElementById('main-screen');

    stopRevealProgress();
    stopDownloadProgress();
    setProgress(1, 'Hazır!', { forceComplete: true, allowDuringDownload: true });

    if (typeof window.novaDeactivateMainSlotPlaceholders === 'function') {
      try {
        window.novaDeactivateMainSlotPlaceholders();
      } catch (_) {}
    }

    applyMainScreenLayoutShell();

    revealMainScreenUnderOverlay({ fadeIn: true });
    if (main) {
      main.style.visibility = 'visible';
      main.style.removeProperty('display');
    }
    try {
      document.body.classList.add('nova-boot-handoff-active');
    } catch (_) {}

    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (main) main.style.opacity = '1';
          if (ov) {
            ov.classList.add('is-handoff', 'is-fade-out');
            requestAnimationFrame(function () {
              ov.classList.add('is-exiting');
            });
          }
        });
      });

      setTimeout(function () {
        if (ov) {
          ov.hidden = true;
          ov.classList.remove('is-handoff', 'is-fade-out', 'is-exiting');
        }
        if (main) {
          main.style.removeProperty('opacity');
        }
        try {
          document.body.classList.remove('nova-sprite-boot-active', 'nova-boot-handoff-active');
          document.body.classList.add('nova-main-screen-visible');
          document.documentElement.classList.add('nova-main-screen-visible');
          document.documentElement.classList.remove('nova-boot-pending');
          document.body.style.removeProperty('touch-action');
        } catch (_) {}
        try {
          if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
        } catch (_) {}
        try {
          if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
        } catch (_) {}
        try {
          if (typeof window.novaSyncMainScreenBgVideo === 'function') {
            window.novaSyncMainScreenBgVideo(false).catch(function () {});
          }
        } catch (_) {}
        resolve();
      }, EXIT_FADE_MS);
    });
  }

  function preloadBootImage(force) {
    if (bootImage.promise && bootImage.img && bootImage.img.complete && !force) {
      state.bootImageReady = true;
      return bootImage.promise;
    }
    if (force) {
      bootImage.promise = null;
      bootImage.img = null;
      state.bootImageReady = false;
    }
    if (bootImage.promise && !force) return bootImage.promise;

    state.downloadProgressRatio = 0.02;
    setProgress(0.02, 'Açılış görseli indiriliyor…', { allowDuringDownload: true });
    startDownloadProgress();

    bootImage.promise = new Promise(function (resolve, reject) {
      var img = new Image();
      try {
        img.fetchPriority = 'high';
      } catch (_) {}
      img.decoding = 'async';

      function finish() {
        if (!img.naturalWidth || !img.naturalHeight) {
          reject(new Error('boot-image-decode-fail'));
          return;
        }
        bootImage.img = img;
        state.bootImageReady = true;
        stopDownloadProgress();
        state.downloadProgressRatio = IMAGE_READY_PROGRESS;
        setProgress(IMAGE_READY_PROGRESS, 'Görsel hazır…', { allowDuringDownload: true });
        resolve(bootImage);
      }

      img.onload = function () {
        if (img.decode) img.decode().then(finish).catch(finish);
        else finish();
      };
      img.onerror = function () {
        reject(new Error('boot-image-load-fail'));
      };
      img.src = BOOT_IMAGE_URL;
    }).catch(function (err) {
      bootImage.promise = null;
      throw err;
    });

    return bootImage.promise;
  }

  function waitBootImageReady() {
    return preloadBootImage().catch(function () {
      bootImage.promise = null;
      return preloadBootImage(true);
    });
  }

  function warmBootImage() {
    if (!hasStoredStudentSession()) return;
    if (!bootImage.promise) preloadBootImage().catch(function () {});
    if (typeof window.novaApplyMainScreenHudInstant === 'function') {
      try {
        window.novaApplyMainScreenHudInstant();
      } catch (_) {}
    }
    if (typeof window.novaPrefetchMainScreenAssets === 'function' && !window.__novaMainScreenPrefetchDone) {
      window.novaPrefetchMainScreenAssets(true).catch(function () {});
    }
  }

  function scheduleBootSideWork() {
    if (bootSideWorkPromise) return bootSideWorkPromise;
    window.__novaBootMainPrep = true;
    bootSideWorkPromise = (async function () {
      try {
        revealMainScreenUnderOverlay({ keepHidden: true });
        if (typeof window.novaApplyMainScreenHudInstant === 'function') {
          window.novaApplyMainScreenHudInstant();
        }
        if (typeof window.novaPrepareMainScreenForBoot === 'function') {
          await window.novaPrepareMainScreenForBoot();
        } else if (typeof window.novaPrefetchMainScreenAssets === 'function') {
          await window.novaPrefetchMainScreenAssets(true).catch(function () {});
        }
        window.__novaMainScreenBootReady = mainElementsReadyNow() || bootHandoffReadyNow();
      } finally {
        window.__novaBootMainPrep = false;
        if (typeof window.novaDeactivateMainSlotPlaceholders === 'function') {
          try {
            window.novaDeactivateMainSlotPlaceholders();
          } catch (_) {}
        }
      }
    })().finally(function () {
      setTimeout(function () {
        bootSideWorkPromise = null;
      }, 200);
    });
    return bootSideWorkPromise;
  }

  function runCinematicBoot() {
    var ov = getOverlay();
    if (!ov) return Promise.resolve();

    applyMainScreenLayoutShell();
    document.body.classList.add('nova-sprite-boot-active');
    ov.hidden = false;
    ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out');
    state.exiting = false;
    state.handoffReady = false;
    state.bootAnimAllowed = false;
    state.revealComplete = false;
    window.__novaSpriteBootActive = true;

    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';

    setProgress(0, 'Kaynaklar hazırlanıyor…');

    var heroImg = ov.querySelector('.nova-sprite-boot-hero-img');
    if (heroImg) heroImg.classList.remove('is-loaded');

    var prepPromise = scheduleBootSideWork();

    return waitBootImageReady()
      .then(function () {
        if (heroImg) heroImg.classList.add('is-loaded');
        state.bootAnimAllowed = true;
        state.animDone = true;
        return Promise.all([startAdaptiveReveal(), prepPromise]);
      })
      .then(function () {
        return kickBootHandoffLayout();
      });
  }

  function dispatchBootComplete() {
    try {
      document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));
    } catch (_) {}
    if (!mainElementsReadyNow() && typeof window.novaEnsureMainScreenReady === 'function') {
      window.novaEnsureMainScreenReady({ afterBoot: true, force: true }).catch(function () {});
    }
  }

  function runBootPipeline() {
    applyBootGameTitle();

    if (!shouldRunBoot()) {
      return (async function () {
        applyMainScreenLayoutShell();
        revealMainScreenUnderOverlay();
        if (typeof window.novaEnsureMainScreenReady === 'function') {
          await window.novaEnsureMainScreenReady({ force: true, afterBoot: true }).catch(function () {});
        }
        markBootDone();
        var ov = getOverlay();
        if (ov) ov.hidden = true;
        try {
          document.body.classList.remove('nova-sprite-boot-active');
          document.documentElement.classList.remove('nova-boot-pending');
          document.body.classList.add('nova-main-screen-visible');
        } catch (_) {}
        dispatchBootComplete();
      })();
    }

    var timeout = setTimeout(function () {
      state.handoffReady = true;
    }, isPhoneBoot() ? MAX_WAIT_PHONE_MS : MAX_WAIT_MS);

    return runCinematicBoot()
      .then(function () {
        clearTimeout(timeout);
        state.handoffReady = true;
        return playExitTransition();
      })
      .then(function () {
        markBootDone();
        dispatchBootComplete();
      })
      .catch(function () {
        clearTimeout(timeout);
        state.handoffReady = true;
        return playExitTransition().then(function () {
          markBootDone();
          dispatchBootComplete();
        });
      });
  }

  window.novaStartSpriteBoot = function (opts) {
    if (bootRunPromise) return bootRunPromise;
    opts = opts || {};
    if (hasStoredStudentSession()) {
      applyMainScreenLayoutShell();
      if (shouldRunBoot()) prepareBootShellEarly();
    }
    window.__novaSpriteBootTriggered = opts.trigger || 'manual';
    bootRunPromise = runBootPipeline().finally(function () {
      window.__novaSpriteBootActive = false;
      bootRunPromise = null;
    });
    return bootRunPromise;
  };

  window.novaWaitSpriteBootComplete = function (maxMs) {
    if (window.__novaSpriteBootDone) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      var t = setTimeout(finish, maxMs || MAX_WAIT_MS);
      document.addEventListener(
        'nova:sprite-boot-complete',
        function () {
          clearTimeout(t);
          finish();
        },
        { once: true }
      );
    });
  };

  window.novaPreloadBootSheet = preloadBootImage;
  window.novaWaitBootSheetReady = waitBootImageReady;

  function tryAutoStartForRememberedSession() {
    if (!hasStoredStudentSession()) return;
    warmBootImage();
    if (!shouldRunBoot()) {
      runBootPipeline();
      return;
    }
    window.novaStartSpriteBoot({ trigger: 'remembered' });
  }

  window.novaSpriteBootReset = function () {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('nova_sprite_boot_done_v7');
    } catch (_) {}
    if (typeof window.novaResetMainScreenPrefetch === 'function') {
      window.novaResetMainScreenPrefetch();
    }
    window.__novaSpriteBootDone = false;
    window.__novaMainScreenBootReady = false;
    bootRunPromise = null;
    bootSideWorkPromise = null;
    bootImage.promise = null;
    state.exiting = false;
    stopRevealProgress();
    stopDownloadProgress();
  };

  window.novaSpriteBootHasSession = hasStoredStudentSession;

  prepareBootShellEarly();
  if (hasStoredStudentSession()) warmBootImage();
  applyBootGameTitle();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAutoStartForRememberedSession, { once: true });
  } else {
    tryAutoStartForRememberedSession();
  }
})();
