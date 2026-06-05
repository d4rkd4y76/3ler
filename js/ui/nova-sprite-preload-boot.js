/* Sinematik boot — WebP sprite (tam indir → akıcı oynat → %100 ana ekran geçişi) */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v6';
  var VIDEO_FALLBACK = ['yeni_loading.mp4', 'kaynaklar_yukleniyor.mp4', 'kaynaklar_y\u00fckleniyor.mp4'];
  var TARGET_DURATION_MS = 6000;
  var MAX_WAIT_MS = 90000;
  var EXIT_HOLD_MS = 380;
  var HANDOFF_PAINT_MS = 64;
  var POST_ANIM_VISUAL_MS = 5200;

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
    postAnimTicker: 0,
    postAnimStarted: false,
    _bootResizeOff: null,
    _bootBlobUrl: null
  };

  var bootSheet = { img: null, manifest: null, promise: null };

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

    if (typeof window.novaPrefetchMainScreenAssets === 'function') {
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

  function setProgress(ratio, statusText, opts) {
    var ov = getOverlay();
    if (!ov) return;
    opts = opts || {};
    if (state.bootDownloadPhase && !opts.allowDuringDownload) {
      ratio = 0;
    }
    if (!state.handoffReady && ratio >= 1 && !opts.forceComplete) {
      ratio = Math.min(ratio, 0.99);
    }
    var pct = Math.max(0, Math.min(100, Math.round((ratio || 0) * 100)));
    state.smoothPct = pct;
    var bar = ov.querySelector('.nova-sprite-boot-bar');
    var label = ov.querySelector('.nova-sprite-boot-pct');
    var glow = ov.querySelector('.nova-sprite-boot-bar-glow');
    var wrap = ov.querySelector('.nova-sprite-boot-bar-wrap');
    var status = ov.querySelector('.nova-sprite-boot-status');
    if (bar) {
      bar.style.width = pct + '%';
      bar.classList.toggle('is-full', pct >= 100);
      bar.classList.toggle('is-waiting', !!opts.finishingWait || (pct >= 100 && state.finishingPulse));
    }
    if (glow) glow.style.left = pct + '%';
    if (wrap) wrap.classList.toggle('has-progress', pct > 2);
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

  function startPostAnimProgress(statusText) {
    if (state.postAnimStarted) return;
    state.postAnimStarted = true;
    var start = performance.now();
    var startPct = 0.88;
    var endPct = 0.985;

    function tick(now) {
      if (state.exiting || state.handoffReady) {
        stopPostAnimProgress();
        return;
      }
      var elapsed = now - start;
      var t = Math.min(1, elapsed / POST_ANIM_VISUAL_MS);
      var ratio = startPct + t * (endPct - startPct);
      if (state.heavyMainDone) ratio = Math.min(0.99, ratio + 0.008);
      var msg =
        statusText ||
        (state.heavyMainDone ? 'Ana ekran açılıyor…' : 'Ana ekran hazırlanıyor…');
      setProgress(ratio, msg, { allowDuringDownload: true });
      if (!state.handoffReady) state.postAnimTicker = requestAnimationFrame(tick);
    }

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

  function hideOverlayImmediate() {
    var ov = getOverlay();
    if (!ov) return;
    stopFinishingPulse();
    stopRenderLoop();
    window.__novaBootVideoPhase = false;
    ov.hidden = true;
    ov.classList.add('is-exiting');
    try {
      document.body.classList.remove('nova-sprite-boot-active');
    } catch (_) {}
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
      if (typeof cb === 'function') cb();
    }, EXIT_HOLD_MS);
  }

  function resolveAssetUrl(path) {
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
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return false;

    var layer = canvas.closest('.nova-sprite-boot-video-layer');
    var rect = layer
      ? layer.getBoundingClientRect()
      : { width: window.innerWidth, height: window.innerHeight };
    var dpr = getBootCanvasDpr();
    var w = Math.max(160, Math.round(rect.width * dpr));
    var h = Math.max(160, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    var r = frameRect(m, fi);
    var fit = Math.min(w / m.frameWidth, h / m.frameHeight);
    var dw = Math.round(m.frameWidth * fit);
    var dh = Math.round(m.frameHeight * fit);
    var dx = Math.round((w - dw) * 0.5);
    var dy = Math.round((h - dh) * 0.5);

    ctx.fillStyle = '#080c1c';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    try {
      ctx.imageSmoothingQuality = isPhoneBoot() ? 'medium' : 'high';
    } catch (_) {}
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
    return true;
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

    bootSheet.promise = fetch(url, { cache: 'force-cache', credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('boot-sheet-fetch-fail');
        return res.blob();
      })
      .then(function (blob) {
        if (!blob || blob.size < 4096) throw new Error('boot-sheet-empty');
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

  function waitBootSheetFullyReady(maxMs) {
    var limit = maxMs == null ? 60000 : maxMs;
    return preloadBootSheet()
      .catch(function () {
        bootSheet.promise = null;
        return preloadBootSheet(true);
      })
      .then(function (pack) {
        if (!pack || !pack.img || !pack.img.complete || !pack.img.naturalWidth) {
          throw new Error('boot-sheet-not-ready');
        }
        return pack;
      })
      .then(function (pack) {
        return new Promise(function (resolve, reject) {
          var t = setTimeout(function () {
            reject(new Error('boot-sheet-ready-timeout'));
          }, limit);
          function done() {
            clearTimeout(t);
            resolve(pack);
          }
          if (pack.img.decode) pack.img.decode().then(done).catch(done);
          else done();
        });
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

    var fi = 0;
    var accum = 0;
    var last = 0;
    var fps = m.fps || 24;
    var frameMs = 1000 / fps;
    var frames = m.loopEnd || m.frameCount || 1;
    var lastFrameFired = false;

    function onResize() {
      drawBootFrame(canvas, fi);
    }
    window.addEventListener('resize', onResize);
    state._bootResizeOff = function () {
      window.removeEventListener('resize', onResize);
    };

    function draw(now) {
      if (state.exiting) return;
      if (!last) last = now;
      var delta = now - last;
      last = now;
      if (delta > frameMs * 2) delta = frameMs;
      accum += delta;
      while (accum >= frameMs && fi < frames - 1) {
        accum -= frameMs;
        fi += 1;
      }

      drawBootFrame(canvas, fi);

      if (typeof onFrame === 'function') {
        try {
          onFrame(fi / Math.max(1, frames - 1), fi);
        } catch (_) {}
      }

      if (!lastFrameFired && fi >= frames - 1) {
        lastFrameFired = true;
        if (typeof onLastFrame === 'function') {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              try {
                onLastFrame();
              } catch (_) {}
            });
          });
        }
      }

      if (!state.exiting) state.raf = requestAnimationFrame(draw);
    }

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
    return resolveAssetUrl(file);
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
    var limit = maxMs == null ? 8000 : maxMs;
    return new Promise(function (resolve) {
      var start = Date.now();
      function tick() {
        revealMainScreenUnderOverlay();
        var painted = mainScreenPaintReady();
        var elements = mainElementsReadyNow();
        if ((painted && elements) || Date.now() - start >= limit) {
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
        setProgress(0.97, 'Ana ekran hazırlanıyor…', { allowDuringDownload: true });

        if (typeof window.novaWaitUntilMainScreenElementsReady === 'function') {
          try {
            await window.novaWaitUntilMainScreenElementsReady({ maxMs: 32000 });
          } catch (_) {}
        } else if (typeof window.novaEnsureMainScreenReady === 'function') {
          try {
            await window.novaEnsureMainScreenReady({ force: true, boot: true, strict: true });
          } catch (_) {}
        }

        if (!mainElementsReadyNow()) {
          setProgress(0.98, 'Son öğeler yükleniyor…', { allowDuringDownload: true });
          if (typeof window.novaWaitUntilMainScreenElementsReady === 'function') {
            try {
              await window.novaWaitUntilMainScreenElementsReady({ maxMs: 12000 });
            } catch (_) {}
          }
        }

        if (!mainElementsReadyNow()) {
          throw new Error('main-screen-not-ready');
        }

        revealMainScreenUnderOverlay();
        await waitForMainScreenPaint(6000);

        state.handoffReady = true;
        stopFinishingPulse();
        stopPostAnimProgress();
        setProgress(1, 'Hazır!', { forceComplete: true, allowDuringDownload: true });

        await new Promise(function (r) {
          setTimeout(r, HANDOFF_PAINT_MS);
        });
        resolve();
      })().catch(function () {
        (async function () {
          setProgress(0.99, 'Son öğeler yükleniyor…', { allowDuringDownload: true });
          if (typeof window.novaWaitUntilMainScreenElementsReady === 'function') {
            try {
              await window.novaWaitUntilMainScreenElementsReady({ maxMs: 20000 });
            } catch (_) {}
          }
          revealMainScreenUnderOverlay();
          await waitForMainScreenPaint(6000);
          state.handoffReady = mainElementsReadyNow();
          stopPostAnimProgress();
          if (state.handoffReady) {
            setProgress(1, 'Hazır!', { forceComplete: true, allowDuringDownload: true });
            await new Promise(function (r) {
              setTimeout(r, HANDOFF_PAINT_MS);
            });
          }
          resolve();
        })();
      });
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
    state.bootDownloadPhase = true;
    state.bootAnimStarted = false;
    state.bootSheetReady = false;
    state.videoDone = false;
    state.animDone = false;
    state.heavyMainDone = false;
    state.handoffReady = false;
    state.exiting = false;
    state.postAnimStarted = false;
    stopPostAnimProgress();
    window.__novaMainScreenBootPromise = null;
    window.__novaMainScreenBootReady = false;
    if (typeof window.novaResetMainScreenPrefetch === 'function') {
      window.novaResetMainScreenPrefetch();
    }
    setProgress(0, 'Açılış animasyonu indiriliyor…');

    if (typeof window.novaPrefetchMainScreenAssets === 'function') {
      window.novaPrefetchMainScreenAssets(true);
    }

    var prepPromise = runLightBootWork();

    return waitBootSheetFullyReady(60000)
      .then(function () {
        setProgress(0, 'Animasyon hazır…');
        return primeBootCanvas(ov);
      })
      .then(function () {
        setProgress(0, 'Başlıyor…', { allowDuringDownload: true });
        return playBootSprite(ov);
      })
      .then(function () {
        return prepPromise;
      })
      .then(function () {
        return finishBootHandoff();
      })
      .catch(function () {
        state.bootDownloadPhase = false;
        setProgress(0, 'Yedek video yükleniyor…', { allowDuringDownload: true });
        if (!prepPromise) prepPromise = runLightBootWork();
        return playBootVideoPlain(ov)
          .then(function () {
            return prepPromise;
          })
          .then(function () {
            return finishBootHandoff();
          });
      })
      .catch(function () {
        ov.classList.add('nova-sprite-boot--no-video');
        state.videoDone = true;
        state.animDone = true;
        return runLightBootWork().then(function () {
          return finishBootHandoff();
        });
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
      dispatchBootComplete();
      return Promise.resolve();
    }

    var timeout = setTimeout(function () {
      safeExitBoot();
    }, MAX_WAIT_MS);

    return runCinematicBoot()
      .then(function () {
        clearTimeout(timeout);
        if (!state.handoffReady) {
          return finishBootHandoff();
        }
      })
      .then(function () {
        if (!state.handoffReady) {
          throw new Error('boot-handoff-incomplete');
        }
        markBootDone();
        return new Promise(function (resolve) {
          playExitTransition(function () {
            dispatchBootComplete();
            resolve();
          });
        });
      })
      .catch(function () {
        clearTimeout(timeout);
        return safeExitBoot();
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
    if (typeof window.novaPrefetchMainScreenAssets === 'function') {
      window.novaPrefetchMainScreenAssets();
    }
    if (!shouldRunBoot()) {
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
  };

  window.novaSpriteBootHasSession = hasStoredStudentSession;

  hideOverlayInitially();
  warmBootSheet();
  applyBootGameTitle();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAutoStartForRememberedSession, { once: true });
  } else {
    tryAutoStartForRememberedSession();
  }
})();
