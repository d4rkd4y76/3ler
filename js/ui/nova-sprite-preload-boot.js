/* Boot — tek görsel, blur→net (5–6 sn), %99'da hazır olunca anında geçiş */

(function () {

  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v9';

  var BOOT_IMAGE_URL =

    'https://dlxstore.b-cdn.net/A_highly_detailed%2C_cinematic_masterpiece%2C_202606081224%20(1).jpeg';

  var MAX_BLUR_PX = 32;

  var MAX_SCALE_EXTRA = 0.08;

  var MAX_WAIT_MS = 45000;

  var MAX_WAIT_PHONE_MS = 32000;

  var EXIT_FADE_MS = 850;

  var CINEMATIC_MS = 5800;

  var CINEMATIC_PHONE_MS = 5200;

  var PROGRESS_CAP = 0.99;

  var MAX_WAIT_AT_99_MS = 3500;

  var IMAGE_READY_PROGRESS = 0.08;

  window.__novaSpriteBootManaged = true;

  var state = {

    smoothPct: 0,

    exiting: false,

    handoffReady: false,

    bootAnimAllowed: false,

    downloadTicker: 0,

    revealTicker: 0,

    revealComplete: false,

    downloadProgressRatio: 0.02,

    animDone: false

  };

  var bootImage = { img: null, promise: null };

  var progressDomCache = null;

  var bootSideWorkPromise = null;

  var bootRunPromise = null;

  var handoffInFlight = null;

  function isPhoneBoot() {

    if (typeof window.novaSpritePerfIsPhone === 'function') {

      return window.novaSpritePerfIsPhone();

    }

    return (window.innerWidth || 0) <= 768;

  }

  function cinematicMs() {

    return isPhoneBoot() ? CINEMATIC_PHONE_MS : CINEMATIC_MS;

  }

  function easeOutCubic(t) {

    var x = Math.max(0, Math.min(1, t));

    return 1 - Math.pow(1 - x, 3);

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

      ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out', 'is-finishing-wait');

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

      ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out', 'is-finishing-wait');

    }

    window.__novaSpriteBootActive = true;

  }

  function markBootDone() {

    var ready = mainElementsReadyNow() || mainShellReadyNow() || bootHandoffReadyNow();

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

      ratio = Math.max(Number(ratio) || 0, state.downloadProgressRatio || 0.02);

    }

    if (!state.handoffReady && !state.revealComplete && ratio >= 1 && !opts.forceComplete) {

      ratio = Math.min(ratio, PROGRESS_CAP);

    }

    if (!state.handoffReady && !state.revealComplete && !opts.forceComplete) {

      ratio = Math.min(Number(ratio) || 0, PROGRESS_CAP);

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

      dom.bar.classList.toggle('is-full', pct >= 99);

      dom.bar.classList.toggle('is-waiting', pct >= 99 && !state.handoffReady && !state.revealComplete);

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

  function mainShellReadyNow() {

    if (typeof window.novaMainScreenShellReady === 'function') {

      try {

        return window.novaMainScreenShellReady();

      } catch (_) {}

    }

    return bootHandoffReadyNow();

  }

  function canHandoffNow(elapsed) {

    var shellReady = mainShellReadyNow() || bootHandoffReadyNow();

    if (shellReady && elapsed >= cinematicMs() * 0.42) return true;

    if (bootReadinessProgress() >= 0.72 && elapsed >= cinematicMs() * 0.55) return true;

    if (elapsed >= cinematicMs() * 0.985) return true;

    if (elapsed >= cinematicMs() + MAX_WAIT_AT_99_MS) return true;

    return false;

  }

  function finishRevealProgress(resolve, statusText) {

    stopRevealProgress();

    state.revealComplete = true;

    state.handoffReady = true;

    var ov = getOverlay();

    if (ov) ov.classList.remove('is-finishing-wait');

    var dom = ov ? getProgressDom(ov) : null;

    if (dom && dom.status) dom.status.classList.remove('is-finishing');

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

  function revealStatusForProgress(progress, elapsed) {
    if (progress < 0.22) return 'Kaynaklar hazırlanıyor…';

    if (progress < 0.48) return 'Arayüz hazırlanıyor…';

    if (progress < 0.72) return 'Kahramanlar ve profil yükleniyor…';

    if (progress < PROGRESS_CAP - 0.01) return 'Ana ekran hazırlanıyor…';

    if (elapsed >= cinematicMs() && !mainShellReadyNow()) return 'Ana ekran hazırlanıyor…';

    return 'Neredeyse hazır…';

  }

  function startCinematicProgress() {

    stopRevealProgress();

    stopDownloadProgress();

    state.revealComplete = false;

    state.bootAnimAllowed = true;

    var start = performance.now();

    var totalMs = cinematicMs();

    setProgress(0, 'Görsel hazır…', { allowDuringDownload: true });

    return new Promise(function (resolve) {

      function tick(now) {

        if (state.exiting) {

          stopRevealProgress();

          resolve();

          return;

        }

        var t = now || performance.now();

        var elapsed = t - start;

        var timeRatio = Math.min(1, elapsed / totalMs);

        var progress = easeOutCubic(timeRatio) * PROGRESS_CAP;

        var atCap = timeRatio >= 0.995 || progress >= PROGRESS_CAP - 0.002;

        if (atCap) progress = PROGRESS_CAP;

        var status = revealStatusForProgress(progress, elapsed);

        setProgress(progress, status, { allowDuringDownload: true });

        var ov = getOverlay();

        if (ov) {

          var waitingAt99 = atCap && !canHandoffNow(elapsed);

          ov.classList.toggle('is-finishing-wait', waitingAt99);

          var dom = getProgressDom(ov);

          if (dom.status) dom.status.classList.toggle('is-finishing', waitingAt99);

        }

        if (canHandoffNow(elapsed)) {

          finishRevealProgress(resolve, 'Hazır!');

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

  function kickBootHandoffLayout() {

    applyMainScreenLayoutShell();

    if (typeof window.novaFixHudFabLayout === 'function') {

      try {

        window.novaFixHudFabLayout();

      } catch (_) {}

    }

    if (
      !mainElementsReadyNow() &&
      typeof window.novaRefreshMainScreenHero === 'function' &&
      !document.documentElement.classList.contains('nova-boot-pending')
    ) {

      try {

        window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});

      } catch (_) {}

    }

    return Promise.resolve(true);

  }

  function kickMainHeroAfterVisible() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (typeof window.novaSpriteRefreshMainHeroCanvases === 'function') {
          try {
            window.novaSpriteRefreshMainHeroCanvases();
          } catch (_) {}
        }
        if (typeof window.novaRefreshMainScreenHero === 'function') {
          try {
            window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
          } catch (_) {}
        }
      });
    });
  }

  function isBootOverlayVisible() {

    var ov = getOverlay();

    if (!ov || ov.hidden) return false;

    try {

      return window.getComputedStyle(ov).visibility !== 'hidden';

    } catch (_) {

      return true;

    }

  }

  function forceBootHandoff(reason) {

    if (window.__novaSpriteBootDone && !isBootOverlayVisible()) return Promise.resolve();

    stopRevealProgress();

    stopDownloadProgress();

    state.handoffReady = true;

    state.revealComplete = true;

    state.exiting = false;

    try {

      console.warn('[nova boot] zorunlu handoff', reason || '');

    } catch (_) {}

    return playExitTransition().then(function () {

      if (!window.__novaSpriteBootDone) {

        markBootDone();

        dispatchBootComplete();

      }

    });

  }

  window.novaForceBootHandoff = forceBootHandoff;

  function playExitTransition() {

    if (handoffInFlight) return handoffInFlight;

    var overlayStillVisible = isBootOverlayVisible();

    if (!overlayStillVisible && window.__novaSpriteBootDone) return Promise.resolve();

    if (state.exiting && !overlayStillVisible) return Promise.resolve();

    if (state.exiting && overlayStillVisible) state.exiting = false;

    state.exiting = true;

    window.__novaBootVideoPhase = false;

    var ov = getOverlay();

    var main = document.getElementById('main-screen');

    stopRevealProgress();

    stopDownloadProgress();

    setProgress(1, 'Hazır!', { forceComplete: true, allowDuringDownload: true });

    if (typeof window.novaActivateMainSlotPlaceholders === 'function') {

      try {

        window.novaActivateMainSlotPlaceholders();

      } catch (_) {}

    } else if (typeof window.novaSyncMainSlotPlaceholders === 'function') {

      try {

        window.novaSyncMainSlotPlaceholders();

      } catch (_) {}

    }

    applyMainScreenLayoutShell();

    try {
      document.documentElement.classList.remove('nova-boot-pending');
    } catch (_) {}

    revealMainScreenUnderOverlay({ fadeIn: true });

    if (main) {

      main.style.visibility = 'visible';

      main.style.removeProperty('display');

    }

    try {

      document.body.classList.add('nova-boot-handoff-active');

    } catch (_) {}

    handoffInFlight = new Promise(function (resolve) {

      requestAnimationFrame(function () {

        requestAnimationFrame(function () {

          if (main) main.style.opacity = '1';

          if (ov) {

            ov.classList.remove('is-finishing-wait');

            ov.classList.add('is-handoff', 'is-fade-out');

            requestAnimationFrame(function () {

              ov.classList.add('is-exiting');

            });

          }

          kickMainHeroAfterVisible();

        });

      });

      setTimeout(function () {

        if (ov) {

          ov.hidden = true;

          ov.classList.remove('is-handoff', 'is-fade-out', 'is-exiting', 'is-finishing-wait');

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

        if (typeof window.novaContinueMainSlotLoading === 'function') {

          try {

            window.novaContinueMainSlotLoading();

          } catch (_) {}

        }

        resolve();

      }, EXIT_FADE_MS);

    });

    return handoffInFlight.finally(function () {

      handoffInFlight = null;

      state.exiting = false;

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

        state.downloadProgressRatio = IMAGE_READY_PROGRESS;

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

      state.bootImageReady = true;

      throw err;

    });

    return bootImage.promise;

  }

  function waitBootImageReady() {

    return preloadBootImage().catch(function () {

      bootImage.promise = null;

      return preloadBootImage(true).catch(function () {

        state.bootImageReady = true;

        return null;

      });

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

    if (typeof window.novaActivateMainSlotPlaceholders === 'function') {

      try {

        window.novaActivateMainSlotPlaceholders();

      } catch (_) {}

    }

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

        window.__novaMainScreenBootReady = mainShellReadyNow() || bootHandoffReadyNow() || mainElementsReadyNow();

      } finally {

        window.__novaBootMainPrep = false;

        if (typeof window.novaSyncMainSlotPlaceholders === 'function') {

          try {

            window.novaSyncMainSlotPlaceholders();

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

    ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out', 'is-finishing-wait');

    state.exiting = false;

    state.handoffReady = false;

    state.bootAnimAllowed = false;

    state.revealComplete = false;

    window.__novaSpriteBootActive = true;

    var login = document.getElementById('student-selection-screen');

    if (login) login.style.display = 'none';

    var heroImg = ov.querySelector('.nova-sprite-boot-hero-img');

    if (heroImg) heroImg.classList.remove('is-loaded');

    setProgress(0, 'Açılış görseli indiriliyor…', { allowDuringDownload: true });

    var prepPromise = scheduleBootSideWork();

    prepPromise.catch(function () {});

    return waitBootImageReady()
      .then(function () {
        if (heroImg) heroImg.classList.add('is-loaded');
        state.animDone = true;
        return startCinematicProgress();
      })
      .then(function () {
        return kickBootHandoffLayout();
      });

  }

  function dispatchBootComplete() {

    if (window.__novaSpriteBootHandoffDispatched) return;

    window.__novaSpriteBootHandoffDispatched = true;

    try {

      document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));

    } catch (_) {}

    if (!mainElementsReadyNow() && typeof window.novaEnsureMainScreenReady === 'function') {

      window.novaEnsureMainScreenReady({ afterBoot: true, force: false }).catch(function () {});

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

      forceBootHandoff('max-wait');

    }, isPhoneBoot() ? MAX_WAIT_PHONE_MS : MAX_WAIT_MS);

    var handoffGuard = setTimeout(function () {

      if (!window.__novaSpriteBootDone && isBootOverlayVisible()) {

        forceBootHandoff('handoff-guard');

      }

    }, cinematicMs() + MAX_WAIT_AT_99_MS + 1200);

    return runCinematicBoot()

      .then(function () {

        clearTimeout(timeout);

        clearTimeout(handoffGuard);

        state.handoffReady = true;

        if (window.__novaSpriteBootDone && !isBootOverlayVisible()) return;

        return playExitTransition();

      })

      .then(function () {

        if (!window.__novaSpriteBootDone) markBootDone();

        dispatchBootComplete();

      })

      .catch(function () {

        clearTimeout(timeout);

        clearTimeout(handoffGuard);

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

    window.__novaSpriteBootHandoffDispatched = false;

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

