/* Sinematik boot — WebP sprite sheet (chroma yok, akıcı canvas) */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v5';
  var VIDEO_FALLBACK = ['yeni_loading.mp4', 'kaynaklar_yukleniyor.mp4', 'kaynaklar_y\u00fckleniyor.mp4'];
  var TARGET_DURATION_MS = 6000;
  var MAX_WAIT_MS = 28000;
  var EXIT_AT_100_MS = 280;

  window.__novaSpriteBootManaged = true;

  var state = {
    raf: 0,
    videoDone: false,
    exiting: false,
    smoothPct: 0,
    finishingPulse: false,
    finishingTimer: 0,
    heavyMainDone: false,
    bootSheetReady: false,
    bootAnimStarted: false,
    bootDownloadPhase: false,
    _bootResizeOff: null
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

  function shouldRunBoot() {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return false;
    } catch (_) {}
    return true;
  }

  function hideOverlayInitially() {
    var ov = getOverlay();
    if (ov) {
      ov.hidden = true;
      ov.classList.remove('is-exiting');
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
    var title = 'D\u00dcELLOX';
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

  function exitAt100Immediately() {
    stopFinishingPulse();
    setProgress(1, 'Hazır!');
    return new Promise(function (resolve) {
      setTimeout(resolve, EXIT_AT_100_MS);
    });
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
    if (state.exiting) return;
    state.exiting = true;
    window.__novaBootVideoPhase = false;
    var ov = getOverlay();
    stopFinishingPulse();
    setProgress(1, 'Hazır!');
    stopRenderLoop();
    if (ov) {
      ov.classList.add('is-exiting');
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
      if (typeof cb === 'function') cb();
    }, 420);
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
          var blobUrl = URL.createObjectURL(blob);
          img.decoding = 'sync';
          try {
            img.fetchPriority = 'high';
          } catch (_) {}
          function cleanup() {
            try {
              URL.revokeObjectURL(blobUrl);
            } catch (_) {}
          }
          function finish() {
            if (!img.naturalWidth || !img.naturalHeight) {
              cleanup();
              reject(new Error('boot-sheet-decode-fail'));
              return;
            }
            bootSheet.img = img;
            bootSheet.manifest = m;
            state.bootSheetReady = true;
            state.bootDownloadPhase = false;
            cleanup();
            resolve(bootSheet);
          }
          img.onload = function () {
            if (img.decode) {
              img.decode().then(finish).catch(finish);
            } else {
              finish();
            }
          };
          img.onerror = function () {
            cleanup();
            reject(new Error('boot-sheet-load-fail'));
          };
          img.src = blobUrl;
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
    var limit = maxMs == null ? 45000 : maxMs;
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
          if (pack.img.decode) {
            pack.img.decode().then(done).catch(done);
          } else {
            done();
          }
        });
      });
  }

  function warmBootSheet() {
    if (!bootSheet.promise) {
      preloadBootSheet().catch(function () {});
    }
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

  function startBootSpriteRender(ov, onFrame) {
    var canvas = ov.querySelector('#nova_sprite_boot_canvas');
    var m = bootSheet.manifest;
    var img = bootSheet.img;
    if (!canvas || !m || !img) return;

    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    var fi = 0;
    var accum = 0;
    var last = 0;
    var fps = m.fps || 24;
    var frameMs = 1000 / fps;
    var frames = m.loopEnd || m.frameCount || 1;

    function resizeCanvas() {
      var layer = ov.querySelector('.nova-sprite-boot-video-layer');
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
    }

    function onResize() {
      resizeCanvas();
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
      if (delta > frameMs * 3) delta = frameMs;
      accum += delta;
      while (accum >= frameMs && fi < frames - 1) {
        accum -= frameMs;
        fi += 1;
      }

      resizeCanvas();
      var r = frameRect(m, fi);
      var cw = canvas.width;
      var ch = canvas.height;
      var fit = Math.min(cw / m.frameWidth, ch / m.frameHeight);
      var dw = Math.round(m.frameWidth * fit);
      var dh = Math.round(m.frameHeight * fit);
      var dx = Math.round((cw - dw) * 0.5);
      var dy = Math.round((ch - dh) * 0.5);

      ctx.fillStyle = '#080c1c';
      ctx.fillRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = true;
      try {
        ctx.imageSmoothingQuality = isPhoneBoot() ? 'medium' : 'high';
      } catch (_) {}
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);

      if (typeof onFrame === 'function') {
        try {
          onFrame(fi / Math.max(1, frames - 1), fi);
        } catch (_) {}
      }

      state.raf = requestAnimationFrame(draw);
    }

    canvas.hidden = false;
    canvas.removeAttribute('hidden');
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
    setProgress(0, 'Başlıyor…', { allowDuringDownload: true });

    var durationMs = bootDurationMs();

    return new Promise(function (resolve) {
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        window.__novaBootVideoPhase = false;
        state.videoDone = true;
        stopRenderLoop();
        resolve();
      }

      startBootSpriteRender(ov, function (ratio) {
        var display = Math.min(0.98, ratio * 0.98);
        setProgress(
          display,
          ratio < 0.35
            ? 'Dünyalar hazırlanıyor…'
            : ratio < 0.72
              ? 'Kahramanlar uyanıyor…'
              : 'Son dokunuşlar…',
          { allowDuringDownload: true }
        );
      });

      setTimeout(done, durationMs + 100);
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

    var idx = 0;
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
    setProgress(0.02, 'Dünyalar hazırlanıyor…');

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
        var t = video ? video.currentTime || 0 : 0;
        var ratio = maxMs > 0 ? Math.min(1, (performance.now() - start) / maxMs) : 0;
        if (video && video.duration) {
          ratio = Math.min(1, t / video.duration);
        }
        setProgress(
          Math.min(0.98, ratio * 0.98),
          ratio < 0.35
            ? 'Dünyalar hazırlanıyor…'
            : ratio < 0.72
              ? 'Kahramanlar uyanıyor…'
              : 'Son dokunuşlar…'
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
    if (!state.bootAnimStarted && !state.videoDone) {
      return;
    }
    var pr = Math.max(0, Math.min(1, ratio || 0));
    var base = state.videoDone ? 0.72 : 0.55;
    var capWhileVideo = 0.88;

    if (!state.heavyMainDone) {
      var p = base + pr * (0.96 - base);
      if (!state.videoDone) p = Math.min(capWhileVideo, p);
      setProgress(p, pr < 0.5 ? 'Ana ekran hazırlanıyor…' : 'Son dokunuş…');
      return;
    }

    stopFinishingPulse();
    setProgress(1, 'Hazır!');
  }

  function runLightBootWork() {
    state.heavyMainDone = false;
    return runMainScreenPrep(function (msg) {
      if (msg && !state.finishingPulse && state.videoDone) {
        state.finishingPulse = true;
        setProgress(1, 'Ana ekran açılıyor…', { finishingWait: true });
      }
      var ov = getOverlay();
      var st = ov && ov.querySelector('.nova-sprite-boot-status');
      if (st && msg) st.textContent = msg;
      updateLightBootProgress(state.heavyMainDone ? 1 : 0.65);
    }).then(function () {
      state.heavyMainDone = true;
      updateLightBootProgress(1);
    });
  }

  function runMainScreenPrep(onStatus) {
    if (typeof window.novaPrepareMainScreenForBoot !== 'function') {
      return Promise.resolve();
    }
    return window.novaPrepareMainScreenForBoot(onStatus);
  }

  function runCinematicBoot() {
    var ov = getOverlay();
    if (!ov) return Promise.resolve();

    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';

    document.body.classList.add('nova-sprite-boot-active');
    ov.hidden = false;
    ov.classList.remove('is-exiting');
    state.bootDownloadPhase = true;
    state.bootAnimStarted = false;
    state.bootSheetReady = false;
    state.videoDone = false;
    setProgress(0, 'Açılış animasyonu indiriliyor…');

    if (typeof window.novaPrefetchMainScreenAssets === 'function') {
      window.novaPrefetchMainScreenAssets();
    }

    return waitBootSheetFullyReady(48000)
      .then(function () {
        setProgress(0, 'Animasyon hazır, başlıyor…', { allowDuringDownload: true });
        var prepPromise = runLightBootWork();
        return playBootSprite(ov).then(function () {
          return prepPromise;
        });
      })
      .catch(function () {
        state.bootDownloadPhase = false;
        setProgress(0, 'Yedek video yükleniyor…', { allowDuringDownload: true });
        var prepPromise = runLightBootWork();
        return playBootVideoPlain(ov).then(function () {
          return prepPromise;
        });
      })
      .catch(function () {
        ov.classList.add('nova-sprite-boot--no-video');
        state.videoDone = true;
        state.bootDownloadPhase = false;
        return runLightBootWork();
      })
      .then(function () {
        return exitAt100Immediately();
      });
  }

  var bootRunPromise = null;

  function dispatchBootComplete() {
    try {
      document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));
    } catch (_) {}
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
      markBootDone();
      playExitTransition(function () {
        dispatchBootComplete();
      });
    }, MAX_WAIT_MS);

    return runCinematicBoot()
      .then(function () {
        clearTimeout(timeout);
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
        markBootDone();
        playExitTransition(function () {
          dispatchBootComplete();
        });
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
      sessionStorage.removeItem('nova_sprite_boot_done_v4');
      sessionStorage.removeItem('nova_sprite_boot_done_v3');
    } catch (_) {}
    bootRunPromise = null;
    bootSheet.promise = null;
    bootSheet.img = null;
    window.__novaSpriteBootDone = false;
    window.__novaSpriteAssetsReady = false;
    window.__novaBootVideoPhase = false;
    window.__novaSpriteBootActive = false;
    window.__novaMainScreenBootPromise = null;
    window.__novaMainScreenBootReady = false;
    state.exiting = false;
    state.videoDone = false;
    state.heavyMainDone = false;
    state.bootSheetReady = false;
    state.bootAnimStarted = false;
    state.bootDownloadPhase = false;
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
