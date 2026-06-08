/* Sinematik boot — tek görsel, yüzdeyle blur → net geçiş */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v7';
  var BOOT_IMAGE_URL =
    'https://dlxstore.b-cdn.net/A_highly_detailed%2C_cinematic_masterpiece%2C_202606081224%20(1).jpeg';
  var MAX_BLUR_PX = 32;
  var MAX_SCALE_EXTRA = 0.08;
  var MAX_WAIT_MS = 90000;
  var MAX_WAIT_PHONE_MS = 28000;
  var EXIT_HOLD_MS = 380;
  var HANDOFF_PAINT_MS = 64;
  var DOWNLOAD_PROGRESS_MAX = 0.12;
  var IMAGE_READY_PROGRESS = 0.15;
  var REVEAL_END_PROGRESS = 0.99;
  var REVEAL_DURATION_MS = 6500;
  var REVEAL_DURATION_PHONE_MS = 5000;

  window.__novaSpriteBootManaged = true;

  var state = {
    smoothPct: 0,
    exiting: false,
    finishingPulse: false,
    finishingTimer: 0,
    heavyMainDone: false,
    bootImageReady: false,
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
        sessionStorage.removeItem('nova_sprite_boot_done_v6');
        sessionStorage.removeItem('nova_sprite_boot_done_v5');
        sessionStorage.removeItem('nova_sprite_boot_done_v4');
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
      ov.classList.remove('is-exiting', 'is-handoff');
    }
    try {
      document.body.classList.remove('nova-sprite-boot-active');
    } catch (_) {}
  }

  function markBootDone() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_) {}
    window.__novaSpriteBootDone = true;
    window.__novaBootVideoPhase = false;
    if (typeof window.novaSpriteBootFlushDefer === 'function') {
      window.novaSpriteBootFlushDefer();
    }
    scheduleDeferredAssetPreload();
  }

  function scheduleDeferredAssetPreload() {
    if (window.__novaSpriteAssetsReady || window.__novaSpriteDeferredPreloadStarted) return;
    window.__novaSpriteDeferredPreloadStarted = true;

    if (!window.__novaMainScreenPrefetchDone && typeof window.novaPrefetchMainScreenAssets === 'function') {
      window.novaPrefetchMainScreenAssets();
    }
    if (typeof window.novaPrefetchMainScreenDeferredExtras === 'function') {
      window.novaPrefetchMainScreenDeferredExtras().catch(function () {});
    }

    function runAllHeroSprites() {
      if (typeof window.novaSpritePreloadAll !== 'function') return;
      window.novaSpritePreloadAll().catch(function () {}).finally(function () {
        window.__novaSpriteAssetsReady = true;
        try {
          document.dispatchEvent(new CustomEvent('nova:sprite-assets-ready'));
        } catch (_) {}
      });
    }

    function runEquippedHero() {
      var heroAlreadyReady = false;
      try {
        if (typeof window.novaMainScreenSlotStatus === 'function') {
          heroAlreadyReady = !!window.novaMainScreenSlotStatus().hero;
        }
      } catch (_) {}
      if (heroAlreadyReady) return;

      var student = null;
      try {
        var raw = localStorage.getItem('selectedStudent');
        if (raw) student = JSON.parse(raw);
      } catch (_) {}
      var heroId = student && (student.battleHero || window.__novaEquippedHeroId);
      if (heroId && typeof window.novaSpritePreloadForHero === 'function') {
        try {
          window.novaSpritePreloadForHero(heroId);
        } catch (_) {}
      }
      if (typeof window.novaRefreshMainScreenHero === 'function') {
        try {
          window.novaRefreshMainScreenHero({ urgent: true });
        } catch (_) {}
      }
    }

    runEquippedHero();

    function scheduleBackgroundHeroPreload() {
      if (window.__novaMainScreenReadyDone) {
        runAllHeroSprites();
        return;
      }
      document.addEventListener(
        'nova:main-screen-ready',
        function () {
          window.__novaMainScreenReadyDone = true;
          runAllHeroSprites();
        },
        { once: true }
      );
      setTimeout(function () {
        if (!window.__novaSpriteAssetsReady) runAllHeroSprites();
      }, 12000);
    }

    scheduleBackgroundHeroPreload();
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
    if (!state.handoffReady && ratio >= 1 && !opts.forceComplete) {
      ratio = Math.min(ratio, 0.99);
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
      dom.bar.classList.toggle('is-waiting', !!opts.finishingWait || (pct >= 100 && state.finishingPulse));
    }
    if (dom.wrap) {
      dom.wrap.classList.toggle('has-progress', pct > 0);
      dom.wrap.setAttribute('aria-valuenow', String(pct));
    }
    if (dom.label) dom.label.textContent = pct + '%';
    if (dom.status && statusText) {
      dom.status.textContent = statusText;
      dom.status.classList.toggle('is-finishing', !!opts.finishingWait || (pct >= 100 && state.finishingPulse));
    }
    ov.classList.toggle('is-finishing-wait', !!opts.finishingWait || (pct >= 100 && state.finishingPulse));
  }

  function stopFinishingPulse() {
    state.finishingPulse = false;
    if (state.finishingTimer) {
      clearTimeout(state.finishingTimer);
      state.finishingTimer = 0;
    }
    var ov = getOverlay();
    if (ov) ov.classList.remove('is-finishing-wait');
    var status = ov && ov.querySelector('.nova-sprite-boot-status');
    if (status) status.classList.remove('is-finishing');
    var bar = ov && ov.querySelector('.nova-sprite-boot-bar');
    if (bar) bar.classList.remove('is-waiting');
  }

  function stopDownloadProgress() {
    if (state.downloadTicker) cancelAnimationFrame(state.downloadTicker);
    state.downloadTicker = 0;
  }

  function stopRevealProgress() {
    if (state.revealTicker) cancelAnimationFrame(state.revealTicker);
    state.revealTicker = 0;
  }

  function revealStatusForProgress(progress) {
    if (progress < 0.38) return 'Dünyalar hazırlanıyor…';
    if (progress < 0.62) return 'Kahramanlar uyanıyor…';
    if (progress < 0.86) return 'Son dokunuşlar…';
    return 'Ana ekran hazırlanıyor…';
  }

  function startDownloadProgress() {
    stopDownloadProgress();
    var dlStart = performance.now();

    function tick(now) {
      if (state.bootImageReady || state.exiting || state.handoffReady) {
        stopDownloadProgress();
        return;
      }
      var elapsed = (now || performance.now()) - dlStart;
      var p = Math.min(
        DOWNLOAD_PROGRESS_MAX,
        0.02 + (elapsed / 5000) * (DOWNLOAD_PROGRESS_MAX - 0.02)
      );
      state.downloadProgressRatio = p;
      setProgress(p, 'Açılış görseli indiriliyor…', { allowDuringDownload: true });
      state.downloadTicker = requestAnimationFrame(tick);
    }

    state.downloadTicker = requestAnimationFrame(tick);
  }

  function startLinearReveal() {
    stopRevealProgress();
    state.revealComplete = false;
    var revealStart = performance.now();
    var duration = isPhoneBoot() ? REVEAL_DURATION_PHONE_MS : REVEAL_DURATION_MS;
    var span = REVEAL_END_PROGRESS - IMAGE_READY_PROGRESS;

    setProgress(IMAGE_READY_PROGRESS, revealStatusForProgress(IMAGE_READY_PROGRESS), {
      allowDuringDownload: true
    });

    return new Promise(function (resolve) {
      function tick(now) {
        if (state.exiting || state.handoffReady) {
          stopRevealProgress();
          resolve();
          return;
        }
        var elapsed = (now || performance.now()) - revealStart;
        var t = Math.min(1, elapsed / duration);
        var progress = IMAGE_READY_PROGRESS + span * t;
        setProgress(progress, revealStatusForProgress(progress), { allowDuringDownload: true });

        if (t < 1) {
          state.revealTicker = requestAnimationFrame(tick);
          return;
        }

        stopRevealProgress();
        state.revealComplete = true;
        setProgress(REVEAL_END_PROGRESS, 'Ana ekran hazırlanıyor…', { allowDuringDownload: true });
        resolve();
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

  function ensureBootOverlayDismissed() {
    var ov = getOverlay();
    stopFinishingPulse();
    window.__novaBootVideoPhase = false;
    window.__novaBootMainPrep = false;
    if (ov) {
      ov.hidden = true;
      ov.classList.add('is-exiting', 'is-handoff');
      ov.style.pointerEvents = 'none';
    }
    try {
      document.body.classList.remove('nova-sprite-boot-active');
      document.body.style.removeProperty('touch-action');
    } catch (_) {}
  }

  function hideOverlayImmediate() {
    ensureBootOverlayDismissed();
  }

  function playExitTransition(cb) {
    if (state.exiting) {
      if (typeof cb === 'function') cb();
      return;
    }
    state.exiting = true;
    window.__novaBootVideoPhase = false;
    var ov = getOverlay();
    stopFinishingPulse();
    setProgress(1, 'Hazır!', { forceComplete: true, allowDuringDownload: true });
    if (ov) ov.classList.add('is-exiting', 'is-handoff');
    setTimeout(function () {
      stopFinishingPulse();
      if (ov) ov.hidden = true;
      try {
        document.body.classList.remove('nova-sprite-boot-active');
      } catch (_) {}
      try {
        if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
      } catch (_) {}
      try {
        if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
      } catch (_) {}
      if (typeof cb === 'function') cb();
    }, EXIT_HOLD_MS);
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
        setProgress(IMAGE_READY_PROGRESS, 'Görsel hazır — netleşiyor…', { allowDuringDownload: true });
        var heroImg = getOverlay() && getOverlay().querySelector('.nova-sprite-boot-hero-img');
        if (heroImg && !heroImg.complete) {
          heroImg.src = BOOT_IMAGE_URL;
        }
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

  function waitBootImageReady(maxMs) {
    return preloadBootImage()
      .catch(function () {
        bootImage.promise = null;
        return new Promise(function (resolve) {
          setTimeout(resolve, 1200);
        }).then(function () {
          return preloadBootImage(true);
        });
      })
      .catch(function () {
        bootImage.promise = null;
        return preloadBootImage(true);
      });
  }

  function warmBootImage() {
    if (!hasStoredStudentSession()) return;
    if (!bootImage.promise) preloadBootImage().catch(function () {});
  }

  function runLightBootWork() {
    state.heavyMainDone = false;
    return runMainScreenPrep(function (msg) {
      if (!state.revealComplete) return;
      setProgress(REVEAL_END_PROGRESS, msg || 'Ana ekran hazırlanıyor…', { allowDuringDownload: true });
    }).then(function () {
      state.heavyMainDone = mainElementsReadyNow();
    });
  }

  function scheduleBootSideWork() {
    if (bootSideWorkPromise) return bootSideWorkPromise;
    bootSideWorkPromise = (async function () {
      window.__novaBootMainPrep = true;
      try {
        if (typeof window.novaBootApplyInstantCache === 'function') {
          await window.novaBootApplyInstantCache().catch(function () {});
        }
        if (typeof window.novaPrefetchMainScreenAssets === 'function') {
          if (window.__novaMainScreenPrefetchStarted && !window.__novaMainScreenPrefetchDone) {
            window.novaPrefetchMainScreenAssets();
          } else if (!window.__novaMainScreenPrefetchDone) {
            window.novaPrefetchMainScreenAssets(true);
          }
        }
        await runLightBootWork();
      } finally {
        if (typeof window.novaSyncMainSlotPlaceholders === 'function') {
          try {
            window.novaSyncMainSlotPlaceholders();
          } catch (_) {}
        }
      }
    })().finally(function () {
      setTimeout(function () {
        bootSideWorkPromise = null;
      }, 400);
    });
    return bootSideWorkPromise;
  }

  function runMainScreenPrep(onStatus) {
    if (typeof window.novaPrepareMainScreenForBoot !== 'function') {
      return Promise.resolve();
    }
    return window.novaPrepareMainScreenForBoot(onStatus);
  }

  function revealMainScreenUnderOverlay() {
    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) {
      main.style.removeProperty('display');
      main.style.visibility = 'visible';
      main.style.opacity = '1';
    }
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}
    try {
      document.body.classList.add('nova-main-screen-visible');
    } catch (_) {}
    try {
      if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
    } catch (_) {}
    try {
      if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
    } catch (_) {}
  }

  function mainScreenPaintReady() {
    var main = document.getElementById('main-screen');
    if (!main) return false;
    try {
      var st = window.getComputedStyle(main);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      var r = main.getBoundingClientRect();
      return r.width > 20 && r.height > 20;
    } catch (_) {
      return main.offsetWidth > 20 && main.offsetHeight > 20;
    }
  }

  function waitForMainScreenPaint(maxMs) {
    var limit = maxMs == null ? 2000 : maxMs;
    return new Promise(function (resolve) {
      var start = Date.now();
      function tick() {
        revealMainScreenUnderOverlay();
        if (mainScreenPaintReady() || Date.now() - start >= limit) {
          requestAnimationFrame(function () {
            requestAnimationFrame(resolve);
          });
          return;
        }
        requestAnimationFrame(tick);
      }
      tick();
    });
  }

  function finishBootHandoff() {
    return new Promise(function (resolve) {
      (async function () {
        stopRevealProgress();
        stopDownloadProgress();
        setProgress(0.99, 'Ana ekran açılıyor…', { allowDuringDownload: true });

        if (typeof window.novaActivateMainSlotPlaceholders === 'function') {
          try {
            window.novaActivateMainSlotPlaceholders();
          } catch (_) {}
        }

        revealMainScreenUnderOverlay();
        await waitForMainScreenPaint(360);

        state.handoffReady = true;
        stopFinishingPulse();
        setProgress(1, 'Hazır!', { forceComplete: true, allowDuringDownload: true });

        await new Promise(function (r) {
          setTimeout(r, HANDOFF_PAINT_MS);
        });
        resolve();
      })();
    });
  }

  function runCinematicBoot() {
    var ov = getOverlay();
    if (!ov) return Promise.resolve();

    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';

    document.body.classList.add('nova-sprite-boot-active');
    ov.hidden = false;
    ov.classList.remove('is-exiting', 'is-handoff', 'nova-sprite-boot--no-video', 'nova-sprite-boot--plain-video');
    state.bootImageReady = false;
    state.animDone = false;
    state.heavyMainDone = false;
    state.handoffReady = false;
    state.bootAnimAllowed = false;
    state.exiting = false;
    state.revealComplete = false;
    stopRevealProgress();
    stopDownloadProgress();
    window.__novaMainScreenBootPromise = null;
    window.__novaMainScreenBootReady = false;
    window.__novaMainScreenLoadDone = false;
    window.__novaBootInstantCacheApplied = false;
    bootSideWorkPromise = null;
    setProgress(0, 'Kaynaklar hazırlanıyor…');

    var heroImg = ov.querySelector('.nova-sprite-boot-hero-img');
    if (heroImg) heroImg.classList.remove('is-loaded');

    return waitBootImageReady(isPhoneBoot() ? 22000 : 60000)
      .then(function () {
        if (heroImg) heroImg.classList.add('is-loaded');
        state.bootAnimAllowed = true;
        state.animDone = true;
        window.__novaBootVideoPhase = false;
        var prepPromise = scheduleBootSideWork();
        return Promise.all([startLinearReveal(), prepPromise]);
      })
      .then(function () {
        return finishBootHandoff();
      })
      .catch(function () {
        state.bootAnimAllowed = true;
        state.animDone = true;
        if (heroImg) heroImg.classList.add('is-loaded');
        return finishBootHandoff();
      });
  }

  function dispatchBootComplete() {
    try {
      document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));
    } catch (_) {}
  }

  function safeExitBoot() {
    return finishBootHandoff().then(function () {
      markBootDone();
      return new Promise(function (resolve) {
        playExitTransition(function () {
          dispatchBootComplete();
          resolve();
        });
      });
    });
  }

  function runBootPipeline() {
    applyBootGameTitle();
    if (!shouldRunBoot()) {
      markBootDone();
      hideOverlayImmediate();
      if (typeof window.novaActivateMainSlotPlaceholders === 'function') {
        try {
          window.novaActivateMainSlotPlaceholders();
        } catch (_) {}
      }
      dispatchBootComplete();
      return Promise.resolve();
    }

    var maxWait = isPhoneBoot() ? MAX_WAIT_PHONE_MS : MAX_WAIT_MS;
    var timeout = setTimeout(function () {
      state.handoffReady = true;
      safeExitBoot();
    }, maxWait);

    var overlayWatch = setInterval(function () {
      if (window.__novaSpriteBootDone) ensureBootOverlayDismissed();
    }, 1500);

    return runCinematicBoot()
      .then(function () {
        clearTimeout(timeout);
        clearInterval(overlayWatch);
        if (!state.handoffReady) return finishBootHandoff();
      })
      .then(function () {
        if (!state.handoffReady && isPhoneBoot()) state.handoffReady = true;
        if (!state.handoffReady) throw new Error('boot-handoff-incomplete');
        markBootDone();
        ensureBootOverlayDismissed();
        return new Promise(function (resolve) {
          playExitTransition(function () {
            ensureBootOverlayDismissed();
            dispatchBootComplete();
            resolve();
          });
        });
      })
      .catch(function () {
        clearTimeout(timeout);
        clearInterval(overlayWatch);
        state.handoffReady = true;
        return safeExitBoot();
      })
      .finally(function () {
        clearInterval(overlayWatch);
        ensureBootOverlayDismissed();
      });
  }

  window.novaStartSpriteBoot = function (opts) {
    if (bootRunPromise) return bootRunPromise;
    opts = opts || {};
    window.__novaSpriteBootTriggered = opts.trigger || 'manual';
    window.__novaSpriteBootActive = true;
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
      if (typeof window.novaPrefetchMainScreenAssets === 'function') {
        window.novaPrefetchMainScreenAssets();
      }
      if (typeof window.novaPrefetchMainScreenBgMedia === 'function') {
        window.novaPrefetchMainScreenBgMedia().catch(function () {});
      }
      markBootDone();
      if (typeof window.novaEnsureMainScreenReady === 'function') {
        window.novaEnsureMainScreenReady({ force: true });
      } else if (typeof window.novaStabilizeMainScreen === 'function') {
        window.novaStabilizeMainScreen({ force: true });
      }
      return;
    }
    window.novaStartSpriteBoot({ trigger: 'remembered' });
  }

  window.novaSpriteBootReset = function () {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('nova_sprite_boot_done_v6');
      sessionStorage.removeItem('nova_sprite_boot_done_v5');
      sessionStorage.removeItem('nova_sprite_boot_done_v4');
    } catch (_) {}
    bootRunPromise = null;
    bootImage.promise = null;
    bootImage.img = null;
    window.__novaSpriteBootDone = false;
    window.__novaSpriteAssetsReady = false;
    window.__novaBootVideoPhase = false;
    window.__novaSpriteBootActive = false;
    window.__novaMainScreenBootPromise = null;
    window.__novaMainScreenBootReady = false;
    window.__novaMainScreenLoadDone = false;
    if (typeof window.novaResetMainScreenPrefetch === 'function') {
      window.novaResetMainScreenPrefetch();
    }
    state.exiting = false;
    state.animDone = false;
    state.heavyMainDone = false;
    state.bootImageReady = false;
    state.handoffReady = false;
    state.revealComplete = false;
    stopRevealProgress();
    stopDownloadProgress();
    stopFinishingPulse();
    progressDomCache = null;
    bootSideWorkPromise = null;
  };

  window.novaSpriteBootHasSession = hasStoredStudentSession;

  hideOverlayInitially();
  if (hasStoredStudentSession()) warmBootImage();
  applyBootGameTitle();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAutoStartForRememberedSession, { once: true });
  } else {
    tryAutoStartForRememberedSession();
  }
})();
