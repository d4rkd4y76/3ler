/* Sinematik boot — WebP sprite (tam indir → akıcı oynat → %100 ana ekran geçişi) */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v6';
  var VIDEO_FALLBACK = ['yeni_loading.mp4', 'kaynaklar_yukleniyor.mp4', 'kaynaklar_y\u00fckleniyor.mp4'];
  var TARGET_DURATION_MS = 6000;
  var MAX_WAIT_MS = 90000;
  var MAX_WAIT_PHONE_MS = 28000;
  var stateBootStartedAt = 0;
  var EXIT_HOLD_MS = 380;
  var HANDOFF_PAINT_MS = 64;
  var POST_ANIM_VISUAL_MS = 2800;

  window.__novaSpriteBootManaged = true;

  var state = {
    raf: 0,
    videoDone: false,
    animDone: false,
    exiting: false,
    smoothPct: 0,
    finishingPulse: false,
    finishingTimer: 0,
    heavyMainDone: false,
    bootSheetReady: false,
    bootAnimStarted: false,
    bootDownloadPhase: false,
    handoffReady: false,
    bootAnimAllowed: false,
    postAnimTicker: 0,
    postAnimStarted: false,
    downloadProgressRatio: 0.03,
    _bootResizeOff: null,
    _bootBlobUrl: null
  };

  var bootSheet = { img: null, manifest: null, promise: null };
  var bootCanvasCache = { canvas: null, ctx: null, w: 0, h: 0 };
  var progressDomCache = null;
  var bootSideWorkPromise = null;

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

  function getOverlay() {
    return document.getElementById('nova_sprite_boot_overlay');
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

  function setProgress(ratio, statusText, opts) {
    var ov = getOverlay();
    if (!ov) return;
    opts = opts || {};
    if (opts.throttle && state.bootAnimStarted && !state.animDone) {
      var now = performance.now();
      if (now - (state._lastProgressPaint || 0) < 110) return;
      state._lastProgressPaint = now;
    }
    if ((state.bootDownloadPhase || !state.bootAnimAllowed) && !opts.allowDuringDownload && !opts.forceComplete) {
      ratio = Math.max(Number(ratio) || 0, state.downloadProgressRatio || 0.03);
    }
    if (!state.handoffReady && ratio >= 1 && !opts.forceComplete) {
      ratio = Math.min(ratio, 0.99);
    }
    var progress = Math.max(0, Math.min(1, ratio || 0));
    var pct = Math.round(progress * 100);
    if (opts.throttle && pct === state.smoothPct && !statusText) return;
    state.smoothPct = pct;
    ov.style.setProperty('--nova-boot-progress', String(progress));
    ov.style.setProperty('--nova-boot-pct', String(pct));

    var dom = getProgressDom(ov);
    var bar = dom.bar;
    var label = dom.label;
    var wrap = dom.wrap;
    var status = dom.status;
    if (bar) {
      bar.setAttribute('aria-valuenow', String(pct));
      bar.classList.toggle('is-full', pct >= 100);
      bar.classList.toggle('is-waiting', !!opts.finishingWait || (pct >= 100 && state.finishingPulse));
    }
    if (wrap) {
      wrap.classList.toggle('has-progress', pct > 0);
      wrap.setAttribute('aria-valuenow', String(pct));
    }
    if (label) label.textContent = pct + '%';
    if (status && statusText) {
      status.textContent = statusText;
      status.classList.toggle('is-finishing', !!opts.finishingWait || (pct >= 100 && state.finishingPulse));
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

  function stopPostAnimProgress() {
    if (state.postAnimTicker) cancelAnimationFrame(state.postAnimTicker);
    state.postAnimTicker = 0;
    state.postAnimStarted = false;
  }

  function bootReadinessProgress() {
    if (typeof window.novaMainScreenReadinessRatio === 'function') {
      try {
        return window.novaMainScreenReadinessRatio();
      } catch (_) {}
    }
    return state.heavyMainDone ? 1 : 0.35;
  }

  function startPostAnimProgress(statusText) {
    if (state.postAnimStarted) return;
    state.postAnimStarted = true;
    var postStart = performance.now();
    var status = statusText || 'Ana ekran hazırlanıyor…';

    function tick(now) {
      if (state.exiting || state.handoffReady) {
        stopPostAnimProgress();
        return;
      }
      var t = now || performance.now();
      var readiness = bootReadinessProgress();
      var elapsed = t - postStart;
      var timeRatio = Math.min(1, elapsed / POST_ANIM_VISUAL_MS);
      var combined = 0.88 + Math.min(0.11, readiness * 0.06 + timeRatio * 0.05);
      setProgress(combined, status, { allowDuringDownload: true });
      if (!state.handoffReady && combined < 0.985) {
        state.postAnimTicker = requestAnimationFrame(tick);
      }
    }

    setProgress(0.88, status, { allowDuringDownload: true });
    state.postAnimTicker = requestAnimationFrame(tick);
  }

  function mainElementsReadyNow() {
    if (typeof window.novaMainScreenElementsReady === 'function') {
      try {
        return window.novaMainScreenElementsReady();
      } catch (_) {}
    }
    return !!window.__novaMainScreenBootReady;
  }

  function stopRenderLoop() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    if (typeof state._bootResizeOff === 'function') {
      try {
        state._bootResizeOff();
      } catch (_) {}
      state._bootResizeOff = null;
    }
  }

  function revokeBootBlobUrl() {
    if (!state._bootBlobUrl) return;
    try {
      URL.revokeObjectURL(state._bootBlobUrl);
    } catch (_) {}
    state._bootBlobUrl = null;
  }

  function ensureBootOverlayDismissed() {
    var ov = getOverlay();
    stopFinishingPulse();
    stopRenderLoop();
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
    stopRenderLoop();
    if (ov) {
      ov.classList.add('is-exiting', 'is-handoff');
      var vid = ov.querySelector('.nova-sprite-boot-video-src');
      if (vid) {
        try {
          vid.pause();
        } catch (_) {}
      }
    }
    setTimeout(function () {
      stopFinishingPulse();
      if (ov) ov.hidden = true;
      try {
        document.body.classList.remove('nova-sprite-boot-active');
      } catch (_) {}
      revokeBootBlobUrl();
      try {
        if (typeof window.novaResetMainScreenScroll === 'function') window.novaResetMainScreenScroll();
      } catch (_) {}
      try {
        if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
      } catch (_) {}
      if (typeof cb === 'function') cb();
    }, EXIT_HOLD_MS);
  }

  function resolveAssetUrl(path) {
    if (typeof window.novaResolveAssetUrl === 'function') {
      return window.novaResolveAssetUrl(path);
    }
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function getBootManifest() {
    return window.NOVA_BOOT_SPRITE_MANIFEST || null;
  }

  function frameRect(m, index) {
    var col = index % m.cols;
    var row = (index / m.cols) | 0;
    return {
      sx: col * m.frameWidth,
      sy: row * m.frameHeight,
      sw: m.frameWidth,
      sh: m.frameHeight
    };
  }

  function drawBootFrame(canvas, fi) {
    var m = bootSheet.manifest;
    var img = bootSheet.img;
    if (!canvas || !m || !img) return false;

    var dpr = getBootCanvasDpr();
    var w = bootCanvasCache.w;
    var h = bootCanvasCache.h;
    if (!w || !h || bootCanvasCache.canvas !== canvas) {
      var layer = canvas.closest('.nova-sprite-boot-video-layer');
      var rect = layer
        ? layer.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      w = Math.max(160, Math.round(rect.width * dpr));
      h = Math.max(160, Math.round(rect.height * dpr));
      bootCanvasCache.w = w;
      bootCanvasCache.h = h;
      bootCanvasCache.canvas = canvas;
      bootCanvasCache.ctx = null;
    }

    var ctx = bootCanvasCache.ctx;
    if (!ctx || bootCanvasCache.canvas !== canvas) {
      ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return false;
      bootCanvasCache.ctx = ctx;
      bootCanvasCache.canvas = canvas;
      ctx.imageSmoothingEnabled = true;
      try {
        ctx.imageSmoothingQuality = isPhoneBoot() ? 'medium' : 'low';
      } catch (_) {}
    }

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.fillStyle = '#080c1c';
    ctx.fillRect(0, 0, w, h);

    var r = frameRect(m, fi);
    var fit = Math.min(w / m.frameWidth, h / m.frameHeight);
    var dw = Math.round(m.frameWidth * fit);
    var dh = Math.round(m.frameHeight * fit);
    var dx = Math.round((w - dw) * 0.5);
    var dy = Math.round((h - dh) * 0.5);

    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
    return true;
  }

  function invalidateBootCanvasCache() {
    bootCanvasCache.canvas = null;
    bootCanvasCache.ctx = null;
    bootCanvasCache.w = 0;
    bootCanvasCache.h = 0;
  }

  function preloadBootSheet(force) {
    if (bootSheet.promise && bootSheet.img && bootSheet.manifest && !force) {
      state.bootSheetReady = true;
      return bootSheet.promise;
    }
    if (force) {
      bootSheet.promise = null;
      bootSheet.img = null;
      bootSheet.manifest = null;
      state.bootSheetReady = false;
      revokeBootBlobUrl();
    }
    if (bootSheet.promise && !force) return bootSheet.promise;

    var m = getBootManifest();
    if (!m || !m.sheet) {
      bootSheet.promise = Promise.reject(new Error('no-boot-manifest'));
      return bootSheet.promise;
    }

    var url = resolveAssetUrl((m.base || 'assets/boot-loading/') + m.sheet);
    state.bootDownloadPhase = true;
    state.bootSheetReady = false;
    state.bootAnimStarted = false;
    state.downloadProgressRatio = 0.05;
    setProgress(0.05, 'Açılış animasyonu indiriliyor…', { allowDuringDownload: true });

    var fetchOpts = { cache: 'force-cache' };
    try {
      if (/^https?:\/\//i.test(url)) fetchOpts.credentials = 'omit';
      else fetchOpts.credentials = 'same-origin';
    } catch (_) {}

    bootSheet.promise = fetch(url, fetchOpts)
      .then(function (res) {
        if (!res.ok) throw new Error('boot-sheet-fetch-fail');
        return res.blob();
      })
      .then(function (blob) {
        if (!blob || blob.size < 4096) throw new Error('boot-sheet-empty');
        state.downloadProgressRatio = 0.14;
        setProgress(0.14, 'Animasyon hazırlanıyor…', { allowDuringDownload: true });
        return new Promise(function (resolve, reject) {
          var img = new Image();
          revokeBootBlobUrl();
          state._bootBlobUrl = URL.createObjectURL(blob);
          try {
            img.fetchPriority = 'high';
          } catch (_) {}
          function finish() {
            if (!img.naturalWidth || !img.naturalHeight) {
              reject(new Error('boot-sheet-decode-fail'));
              return;
            }
            bootSheet.img = img;
            bootSheet.manifest = m;
            state.bootSheetReady = true;
            state.bootDownloadPhase = false;
            resolve(bootSheet);
          }
          img.onload = function () {
            if (img.decode) img.decode().then(finish).catch(finish);
            else finish();
          };
          img.onerror = function () {
            reject(new Error('boot-sheet-load-fail'));
          };
          img.src = state._bootBlobUrl;
        });
      })
      .catch(function (err) {
        state.bootDownloadPhase = false;
        bootSheet.promise = null;
        throw err;
      });

    return bootSheet.promise;
  }

  function bootRetryDelay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function waitBootSheetFullyReady(maxMs) {
    var limit = maxMs == null ? 60000 : maxMs;
    return preloadBootSheet()
      .catch(function () {
        bootSheet.promise = null;
        return bootRetryDelay(1800).then(function () {
          return preloadBootSheet(true);
        });
      })
      .catch(function () {
        bootSheet.promise = null;
        return bootRetryDelay(4500).then(function () {
          return preloadBootSheet(true);
        });
      })
      .then(function (pack) {
        if (!pack || !pack.img || !pack.img.complete || !pack.img.naturalWidth) {
          throw new Error('boot-sheet-not-ready');
        }
        if (pack.img.decode && !pack.img._novaBootDecoded) {
          return pack.img.decode().then(function () {
            pack.img._novaBootDecoded = true;
            return pack;
          }).catch(function () {
            return pack;
          });
        }
        return pack;
      });
  }

  function primeBootCanvas(ov) {
    var canvas = ov && ov.querySelector('#nova_sprite_boot_canvas');
    if (!canvas || !bootSheet.img) return Promise.resolve();
    canvas.hidden = false;
    canvas.removeAttribute('hidden');
    drawBootFrame(canvas, 0);
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function warmBootSheet() {
    if (!hasStoredStudentSession()) return;
    if (!bootSheet.promise) preloadBootSheet().catch(function () {});
  }

  function getBootCanvasDpr() {
    if (isPhoneBoot()) return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  function bootDurationMs() {
    var m = bootSheet.manifest || getBootManifest();
    if (!m) return TARGET_DURATION_MS;
    var frames = m.loopEnd || m.frameCount || 1;
    var fps = m.fps || 24;
    return Math.max(2000, Math.round((frames / fps) * 1000));
  }

  function startBootSpriteRender(ov, onFrame, onLastFrame) {
    var canvas = ov.querySelector('#nova_sprite_boot_canvas');
    var m = bootSheet.manifest;
    var img = bootSheet.img;
    if (!canvas || !m || !img) return;

    var fps = m.fps || 24;
    var frameMs = 1000 / fps;
    var frames = m.loopEnd || m.frameCount || 1;
    var startWall = performance.now();
    var lastFrameFired = false;
    var fi = 0;
    var backupTimer = 0;

    function onResize() {
      invalidateBootCanvasCache();
      drawBootFrame(canvas, fi);
    }
    window.addEventListener('resize', onResize);
    state._bootResizeOff = function () {
      window.removeEventListener('resize', onResize);
      if (backupTimer) clearInterval(backupTimer);
      backupTimer = 0;
    };

    var lastPaint = performance.now();

    function paintFrame(now) {
      if (state.exiting) return;
      lastPaint = now || performance.now();
      var elapsed = lastPaint - startWall;
      fi = Math.min(frames - 1, Math.max(0, Math.floor(elapsed / frameMs)));
      drawBootFrame(canvas, fi);

      if (typeof onFrame === 'function') {
        try {
          onFrame(fi / Math.max(1, frames - 1), fi);
        } catch (_) {}
      }

      if (!lastFrameFired && (fi >= frames - 1 || elapsed >= frames * frameMs)) {
        lastFrameFired = true;
        if (typeof onLastFrame === 'function') {
          try {
            onLastFrame();
          } catch (_) {}
        }
      }
    }

    function draw(now) {
      paintFrame(now);
      if (!state.exiting && !lastFrameFired) state.raf = requestAnimationFrame(draw);
    }

    function onVis() {
      if (!document.hidden && !state.exiting && !lastFrameFired) paintFrame(performance.now());
    }
    document.addEventListener('visibilitychange', onVis);

    var oldOff = state._bootResizeOff;
    state._bootResizeOff = function () {
      document.removeEventListener('visibilitychange', onVis);
      if (typeof oldOff === 'function') oldOff();
    };

    backupTimer = setInterval(function () {
      if (state.exiting || lastFrameFired) return;
      if (performance.now() - lastPaint > frameMs * 1.35) {
        paintFrame(performance.now());
      }
    }, Math.max(28, Math.floor(frameMs * 0.85)));

    canvas.hidden = false;
    canvas.removeAttribute('hidden');
    drawBootFrame(canvas, 0);
    state.raf = requestAnimationFrame(draw);
  }

  function playBootSprite(ov) {
    if (!bootSheet.img || !bootSheet.manifest) {
      return Promise.reject(new Error('boot-sheet-missing'));
    }

    ov.classList.remove('nova-sprite-boot--no-video', 'nova-sprite-boot--plain-video');
    window.__novaBootVideoPhase = true;
    state.bootAnimStarted = true;
    state.bootDownloadPhase = false;
    state.animDone = false;
    setProgress(0, 'Başlıyor…', { allowDuringDownload: true });

    var durationMs = bootDurationMs();
    var safetyMs = durationMs + 800;

    return new Promise(function (resolve) {
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        window.__novaBootVideoPhase = false;
        state.videoDone = true;
        state.animDone = true;
        stopRenderLoop();
        startPostAnimProgress('Ana ekran hazırlanıyor…');
        resolve();
      }

      startBootSpriteRender(
        ov,
        function (ratio) {
          var display = Math.min(0.88, 0.05 + ratio * 0.83);
          setProgress(
            display,
            ratio < 0.35
              ? 'Dünyalar hazırlanıyor…'
              : ratio < 0.72
                ? 'Kahramanlar uyanıyor…'
                : 'Son dokunuşlar…',
            { allowDuringDownload: true }
          );
        },
        done
      );

      setTimeout(done, safetyMs);
    });
  }

  function resolveVideoUrl(file) {
    var path = String(file || '');
    if (typeof window.novaCdnIsEnabled === 'function' && window.novaCdnIsEnabled()) {
      path = 'video/' + path.replace(/^video\//, '');
    }
    return resolveAssetUrl(path);
  }

  function playBootVideoPlain(ov) {
    var video = ov.querySelector('.nova-sprite-boot-video-src');
    var canvas = ov.querySelector('#nova_sprite_boot_canvas');
    if (!video) return Promise.resolve();

    ov.classList.add('nova-sprite-boot--plain-video');
    ov.classList.remove('nova-sprite-boot--no-video');
    if (canvas) {
      canvas.hidden = true;
      canvas.setAttribute('hidden', '');
    }
    video.hidden = false;
    video.removeAttribute('hidden');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    function trySrc(i) {
      if (i >= VIDEO_FALLBACK.length) return Promise.reject(new Error('video-not-found'));
      video.src = resolveVideoUrl(VIDEO_FALLBACK[i]);
      return new Promise(function (resolve, reject) {
        function ok() {
          video.removeEventListener('canplay', ok);
          video.removeEventListener('error', err);
          resolve();
        }
        function err() {
          video.removeEventListener('canplay', ok);
          video.removeEventListener('error', err);
          trySrc(i + 1).then(resolve, reject);
        }
        video.addEventListener('canplay', ok, { once: true });
        video.addEventListener('error', err, { once: true });
        try {
          video.load();
        } catch (e) {
          err();
        }
      });
    }

    window.__novaBootVideoPhase = true;
    state.bootAnimStarted = true;
    setProgress(0, 'Yedek video başlıyor…', { allowDuringDownload: true });

    return trySrc(0)
      .then(function () {
        state.bootDownloadPhase = false;
        state.bootAnimAllowed = true;
        scheduleBootSideWork();
        setProgress(0, 'Başlıyor…', { allowDuringDownload: true });
        try {
          video.currentTime = 0;
        } catch (_) {}
        var p;
        try {
          p = video.play();
        } catch (_) {
          p = null;
        }
        if (p && typeof p.catch === 'function') p.catch(function () {});
        return waitForBootEnd(video, bootDurationMs());
      })
      .finally(function () {
        window.__novaBootVideoPhase = false;
        state.videoDone = true;
        state.animDone = true;
        startPostAnimProgress('Ana ekran hazırlanıyor…');
      });
  }

  function waitForBootEnd(video, durationMs) {
    return new Promise(function (resolve) {
      var maxMs = durationMs || TARGET_DURATION_MS;
      if (video && video.duration && isFinite(video.duration)) {
        maxMs = video.duration * 1000;
      }
      var start = performance.now();
      function tick() {
        var ratio = maxMs > 0 ? Math.min(1, (performance.now() - start) / maxMs) : 0;
        if (video && video.duration) {
          ratio = Math.min(1, (video.currentTime || 0) / video.duration);
        }
        setProgress(
          Math.min(0.94, 0.08 + ratio * 0.86),
          ratio < 0.35
            ? 'Dünyalar hazırlanıyor…'
            : ratio < 0.72
              ? 'Kahramanlar uyanıyor…'
              : 'Son dokunuşlar…',
          { allowDuringDownload: true }
        );
        if (performance.now() - start >= maxMs + 80 || (video && video.ended)) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      }
      if (video) video.addEventListener('ended', resolve, { once: true });
      requestAnimationFrame(tick);
      setTimeout(resolve, maxMs + 200);
    });
  }

  function updateLightBootProgress(ratio) {
    if (!state.bootAnimStarted && !state.videoDone) return;
    if (!state.animDone) return;

    var pr = Math.max(0, Math.min(1, ratio || 0));
    var base = 0.88;
    var p = base + pr * (0.99 - base);

    if (!state.heavyMainDone) {
      if (!state.postAnimStarted) startPostAnimProgress('Ana ekran hazırlanıyor…');
      return;
    }

    stopPostAnimProgress();
    setProgress(0.99, 'Hazır!', { allowDuringDownload: true });
  }

  function runLightBootWork() {
    state.heavyMainDone = false;
    return runMainScreenPrep(function (msg) {
      if (!state.animDone) return;
      startPostAnimProgress(msg || 'Ana ekran hazırlanıyor…');
    }).then(function () {
      state.heavyMainDone = mainElementsReadyNow();
      stopPostAnimProgress();
      if (state.heavyMainDone) updateLightBootProgress(1);
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
        stopPostAnimProgress();
        setProgress(0.96, 'Ana ekran açılıyor…', { allowDuringDownload: true });

        if (typeof window.novaActivateMainSlotPlaceholders === 'function') {
          try {
            window.novaActivateMainSlotPlaceholders();
          } catch (_) {}
        }

        revealMainScreenUnderOverlay();
        await waitForMainScreenPaint(360);

        state.handoffReady = true;
        stopFinishingPulse();
        stopPostAnimProgress();
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
    ov.classList.remove('is-exiting', 'is-handoff');
    state.bootDownloadPhase = !(bootSheet.img && bootSheet.manifest);
    state.bootAnimStarted = false;
    state.bootSheetReady = !!(bootSheet.img && bootSheet.manifest);
    state.videoDone = false;
    state.animDone = false;
    state.heavyMainDone = false;
    state.handoffReady = false;
    state.bootAnimAllowed = false;
    state.exiting = false;
    state.postAnimStarted = false;
    stopPostAnimProgress();
    window.__novaMainScreenBootPromise = null;
    window.__novaMainScreenBootReady = false;
    window.__novaMainScreenLoadDone = false;
    window.__novaBootInstantCacheApplied = false;
    bootSideWorkPromise = null;
    setProgress(0, bootSheet.img ? 'Animasyon hazırlanıyor…' : 'Açılış animasyonu indiriliyor…');

    stateBootStartedAt = Date.now();
    var sheetWaitMs = isPhoneBoot() ? 18000 : 60000;

    function beginBootAnimation() {
      state.bootAnimAllowed = true;
      setProgress(0, 'Başlıyor…', { allowDuringDownload: true });
      scheduleBootSideWork();
      return playBootSprite(ov);
    }

    function sheetToAnim() {
      setProgress(0, 'Animasyon hazır…');
      return primeBootCanvas(ov).then(beginBootAnimation);
    }

    if (isPhoneBoot()) {
      if (bootSheet.img && bootSheet.manifest) {
        state.bootDownloadPhase = false;
        return primeBootCanvas(ov)
          .then(beginBootAnimation)
          .then(function () {
            return finishBootHandoff();
          });
      }
      return playBootVideoPlain(ov)
        .then(function () {
          state.bootAnimAllowed = true;
          return scheduleBootSideWork();
        })
        .then(function () {
          return finishBootHandoff();
        })
        .catch(function () {
          return waitBootSheetFullyReady(sheetWaitMs).then(sheetToAnim).then(function () {
            return finishBootHandoff();
          });
        });
    }

    return waitBootSheetFullyReady(sheetWaitMs)
      .then(sheetToAnim)
      .then(function () {
        return finishBootHandoff();
      })
      .catch(function () {
        state.bootDownloadPhase = false;
        setProgress(0, 'Yedek video yükleniyor…', { allowDuringDownload: true });
        return playBootVideoPlain(ov).then(function () {
          return finishBootHandoff();
        });
      })
      .catch(function () {
        ov.classList.add('nova-sprite-boot--no-video');
        state.videoDone = true;
        state.animDone = true;
        state.bootAnimAllowed = true;
        return finishBootHandoff();
      });
  }

  var bootRunPromise = null;

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
        if (!state.handoffReady) {
          return finishBootHandoff();
        }
      })
      .then(function () {
        if (!state.handoffReady && isPhoneBoot()) {
          state.handoffReady = true;
        }
        if (!state.handoffReady) {
          throw new Error('boot-handoff-incomplete');
        }
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

  window.novaPreloadBootSheet = preloadBootSheet;
  window.novaWaitBootSheetReady = waitBootSheetFullyReady;

  function tryAutoStartForRememberedSession() {
    if (!hasStoredStudentSession()) return;
    warmBootSheet();
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
      sessionStorage.removeItem('nova_sprite_boot_done_v5');
      sessionStorage.removeItem('nova_sprite_boot_done_v4');
    } catch (_) {}
    bootRunPromise = null;
    bootSheet.promise = null;
    bootSheet.img = null;
    revokeBootBlobUrl();
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
    state.videoDone = false;
    state.animDone = false;
    state.heavyMainDone = false;
    state.bootSheetReady = false;
    state.bootAnimStarted = false;
    state.bootDownloadPhase = false;
    state.handoffReady = false;
    state.postAnimStarted = false;
    stopPostAnimProgress();
    stopFinishingPulse();
    stopRenderLoop();
    invalidateBootCanvasCache();
    progressDomCache = null;
    bootSideWorkPromise = null;
  };

  window.novaSpriteBootHasSession = hasStoredStudentSession;

  hideOverlayInitially();
  if (hasStoredStudentSession()) warmBootSheet();
  applyBootGameTitle();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAutoStartForRememberedSession, { once: true });
  } else {
    tryAutoStartForRememberedSession();
  }
})();
