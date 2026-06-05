/* Sinematik boot: %0'da açılış videosu tam indirilir, sonra akıcı oynatma + ana ekran hazırlığı */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v4';
  var VIDEO_CANDIDATES = [
    'yeni_loading.mp4',
    './yeni_loading.mp4',
    'kaynaklar_yukleniyor.mp4',
    'kaynaklar_y\u00fckleniyor.mp4'
  ];
  var TARGET_DURATION_MS = 5500;
  var MAX_WAIT_MS = 28000;
  var EXIT_AT_100_MS = 280;
  var VIDEO_FULL_DOWNLOAD_TIMEOUT_MS = 48000;
  var FINISH_WAIT_MESSAGES = [
    'Ana ekran açılıyor…',
    'Hazır!'
  ];

  window.__novaSpriteBootManaged = true;

  var state = {
    raf: 0,
    preloadDone: false,
    videoDone: false,
    exiting: false,
    smoothPct: 0,
    bootFrameParity: 0,
    lastChromaCanvas: null,
    finishingPulse: false,
    finishingMsgIdx: 0,
    finishingTimer: 0,
    heavyPreloadDone: false,
    heavyMainDone: false,
    bootVideoDownloadDone: false
  };

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

    function run() {
      if (typeof window.novaSpritePreloadAll !== 'function') return;
      window.novaSpritePreloadAll().catch(function () {}).finally(function () {
        window.__novaSpriteAssetsReady = true;
        try {
          document.dispatchEvent(new CustomEvent('nova:sprite-assets-ready'));
        } catch (_) {}
      });
    }

    run();

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

  function startFinishingPulse(ratio) {
    if (state.finishingPulse) return;
    var pctRatio = ratio == null ? state.smoothPct / 100 : ratio;
    state.finishingPulse = true;
    setProgress(pctRatio >= 1 ? 1 : Math.min(0.99, pctRatio), 'Ana ekran açılıyor…', { finishingWait: true });
  }

  function exitAt100Immediately() {
    stopFinishingPulse();
    setProgress(1, 'Hazır!');
    return new Promise(function (resolve) {
      setTimeout(resolve, EXIT_AT_100_MS);
    });
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
    if (state._bootBlobUrl) {
      try {
        URL.revokeObjectURL(state._bootBlobUrl);
      } catch (_) {}
      state._bootBlobUrl = null;
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

  function applyChromaKey(imageData) {
    var d = imageData.data;
    var len = d.length;
    for (var i = 0; i < len; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      var maxRB = Math.max(r, b);
      var greenDom = g - maxRB;
      var alpha = 255;

      if (g > 30 && greenDom > 8) {
        var keyAmt = Math.min(1, greenDom / 58);
        if (g > 140 && r < 120 && b < 120) keyAmt = Math.max(keyAmt, 0.94);
        if (g > 190 && greenDom > 32) keyAmt = 1;
        alpha = Math.round(255 * (1 - keyAmt));
      }

      if (r < 22 && g < 22 && b < 22) alpha = 0;

      d[i + 3] = alpha;

      if (alpha > 8 && alpha < 245) {
        var spillFix = greenDom / 255;
        d[i + 1] = Math.round(g - spillFix * (g - maxRB) * 0.92);
        d[i] = Math.round(r + spillFix * (maxRB - r) * 0.15);
        d[i + 2] = Math.round(b + spillFix * (maxRB - b) * 0.15);
      }
    }
    return imageData;
  }

  function getBootCanvasDpr() {
    if (isPhoneBoot()) return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  function startVideoRender(ov) {
    var video = ov.querySelector('.nova-sprite-boot-video-src');
    var canvas = ov.querySelector('#nova_sprite_boot_canvas');
    if (!video || !canvas) return null;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    try {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = isPhoneBoot() ? 'medium' : 'high';
    } catch (_) {}

    var chromaBuffer = document.createElement('canvas');
    var chromaCtx = chromaBuffer.getContext('2d', { alpha: true });
    try {
      chromaCtx.imageSmoothingEnabled = true;
      chromaCtx.imageSmoothingQuality = isPhoneBoot() ? 'low' : 'high';
    } catch (_) {}

    var phone = isPhoneBoot();
    var chromaScale = phone ? 0.5 : 1;

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
      var cw = Math.max(80, Math.round(w * chromaScale));
      var ch = Math.max(80, Math.round(h * chromaScale));
      if (chromaBuffer.width !== cw || chromaBuffer.height !== ch) {
        chromaBuffer.width = cw;
        chromaBuffer.height = ch;
      }
    }

    function drawFrame() {
      if (!state.exiting && video.readyState >= 2) {
        resizeCanvas();
        var w = canvas.width;
        var h = canvas.height;
        var cw = chromaBuffer.width;
        var ch = chromaBuffer.height;
        var vw = video.videoWidth || cw;
        var vh = video.videoHeight || ch;
        var scale = Math.max(cw / vw, ch / vh);
        var dw = vw * scale;
        var dh = vh * scale;
        var dx = (cw - dw) * 0.5;
        var dy = (ch - dh) * 0.5;

        state.bootFrameParity = (state.bootFrameParity + 1) % 2;
        var skipChroma = phone && state.bootFrameParity === 1 && state.lastChromaCanvas;

        if (!skipChroma) {
          chromaCtx.clearRect(0, 0, cw, ch);
          chromaCtx.drawImage(video, dx, dy, dw, dh);
          try {
            var frame = chromaCtx.getImageData(0, 0, cw, ch);
            applyChromaKey(frame);
            chromaCtx.putImageData(frame, 0, 0);
          } catch (_) {
            chromaCtx.clearRect(0, 0, cw, ch);
            chromaCtx.drawImage(video, dx, dy, dw, dh);
          }
          state.lastChromaCanvas = chromaBuffer;
        }

        ctx.clearRect(0, 0, w, h);
        var src = state.lastChromaCanvas || chromaBuffer;
        ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);
      }
      state.raf = requestAnimationFrame(drawFrame);
    }

    function onResize() {
      resizeCanvas();
    }
    window.addEventListener('resize', onResize);
    state._bootResizeOff = function () {
      window.removeEventListener('resize', onResize);
    };

    state.raf = requestAnimationFrame(drawFrame);
    return video;
  }

  function stopRenderLoop() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.lastChromaCanvas = null;
    if (typeof state._bootResizeOff === 'function') {
      try {
        state._bootResizeOff();
      } catch (_) {}
      state._bootResizeOff = null;
    }
  }

  function waitForVideoEnd(video, durationMs) {
    return new Promise(function (resolve) {
      var resolved = false;
      function done() {
        if (resolved) return;
        resolved = true;
        window.__novaBootVideoPhase = false;
        state.videoDone = true;
        resolve();
      }
      var maxMs = durationMs || TARGET_DURATION_MS;

      if (!video) {
        setTimeout(done, maxMs);
        return;
      }

      video.addEventListener('ended', done, { once: true });

      var start = performance.now();
      function tick() {
        if (resolved) return;
        var dur = video.duration;
        if (dur && isFinite(dur) && dur > 0.2) {
          maxMs = dur * 1000;
        }
        var t = video.currentTime || 0;
        var ratio = maxMs > 0 ? Math.min(1, (t * 1000) / maxMs) : 0;
        var display = Math.min(0.98, ratio * 0.98);
        setProgress(
          display,
          ratio < 0.35
            ? 'Dünyalar hazırlanıyor…'
            : ratio < 0.72
              ? 'Kahramanlar uyanıyor…'
              : 'Son dokunuşlar…'
        );

        if (performance.now() - start >= maxMs + 120 || (video.ended && t > 0.1)) {
          setProgress(0.97, 'Neredeyse bitti, bekle…', { finishingWait: true });
          done();
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      setTimeout(done, maxMs + 400);
    });
  }

  function resolveVideoUrl(file) {
    try {
      return new URL(file, window.location.href).href;
    } catch (_) {
      return file;
    }
  }

  function warmVideoCache() {
    if (window.__novaBootVideoWarm) return;
    window.__novaBootVideoWarm = true;
    try {
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = resolveVideoUrl(VIDEO_CANDIDATES[0]);
      link.type = 'video/mp4';
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    } catch (_) {}
    if (!state._bootVideoBlobPromise && !state.bootVideoDownloadDone) {
      state._bootVideoBlobPromise = prefetchBootVideoBlob(resolveVideoUrl(VIDEO_CANDIDATES[0])).catch(function () {
        state._bootVideoBlobPromise = null;
        return null;
      });
    }
  }

  function prefetchBootVideoBlob(url) {
    return fetch(url, { cache: 'force-cache', credentials: 'same-origin' }).then(function (res) {
      if (!res.ok) throw new Error('video-fetch-fail');
      return res.blob();
    });
  }

  function videoFullyBuffered(video) {
    if (!video) return false;
    if (video.readyState >= 4) return true;
    var dur = video.duration;
    if (!dur || !isFinite(dur) || dur < 0.15) {
      return video.readyState >= 4;
    }
    try {
      var b = video.buffered;
      if (!b || !b.length) return false;
      var end = b.end(b.length - 1);
      return end >= dur - 0.25 && end / dur >= 0.97;
    } catch (_) {
      return false;
    }
  }

  function waitVideoElementFullyBuffered(video, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var deadline = performance.now() + (timeoutMs || VIDEO_FULL_DOWNLOAD_TIMEOUT_MS);
      var settled = false;

      function finish(ok) {
        if (settled) return;
        settled = true;
        cleanup();
        if (ok) resolve();
        else reject(new Error('video-buffer-timeout'));
      }

      function cleanup() {
        video.removeEventListener('progress', tick);
        video.removeEventListener('canplaythrough', tick);
        video.removeEventListener('loadeddata', tick);
        clearInterval(pollId);
        clearTimeout(hardTimeout);
      }

      function tick() {
        if (videoFullyBuffered(video)) finish(true);
        else if (performance.now() >= deadline) finish(false);
      }

      if (videoFullyBuffered(video)) {
        finish(true);
        return;
      }

      video.addEventListener('progress', tick);
      video.addEventListener('canplaythrough', tick);
      video.addEventListener('loadeddata', tick);
      var pollId = setInterval(tick, 150);
      var hardTimeout = setTimeout(function () { finish(false); }, timeoutMs || VIDEO_FULL_DOWNLOAD_TIMEOUT_MS);
    });
  }

  function assignBootVideoBlob(video, blob) {
    if (!blob || blob.size < 512) throw new Error('empty-video-blob');
    if (state._bootBlobUrl) {
      try {
        URL.revokeObjectURL(state._bootBlobUrl);
      } catch (_) {}
    }
    state._bootBlobUrl = URL.createObjectURL(blob);
    video.src = state._bootBlobUrl;
    video.preload = 'auto';
    try {
      video.load();
    } catch (_) {}
    return waitVideoElementFullyBuffered(video, VIDEO_FULL_DOWNLOAD_TIMEOUT_MS);
  }

  function downloadBootVideoFully(video) {
    if (state.bootVideoDownloadDone && video.src) {
      return Promise.resolve(video.src);
    }

    setProgress(0, 'Açılış videosu indiriliyor…');
    window.__novaBootVideoPhase = false;

    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    function tryFetchCandidate(index) {
      if (index >= VIDEO_CANDIDATES.length) {
        return Promise.reject(new Error('video-not-found'));
      }
      var url = resolveVideoUrl(VIDEO_CANDIDATES[index]);

      function loadBlob(blob) {
        return assignBootVideoBlob(video, blob).then(function () {
          state.bootVideoDownloadDone = true;
          setProgress(0, 'Video hazır, başlıyor…');
          return video.src;
        });
      }

      if (index === 0 && state._bootVideoBlobPromise) {
        return state._bootVideoBlobPromise
          .then(function (blob) {
            if (blob && blob.size > 512) return loadBlob(blob);
            state._bootVideoBlobPromise = null;
            return prefetchBootVideoBlob(url).then(loadBlob);
          })
          .catch(function () {
            return prefetchBootVideoBlob(url).then(loadBlob);
          });
      }

      return prefetchBootVideoBlob(url)
        .then(loadBlob)
        .catch(function () {
          return tryFetchCandidate(index + 1);
        });
    }

    return tryFetchCandidate(0).catch(function () {
      return loadBootVideoSource(video, 0).then(function (src) {
        return waitVideoElementFullyBuffered(video, VIDEO_FULL_DOWNLOAD_TIMEOUT_MS).then(function () {
          state.bootVideoDownloadDone = true;
          setProgress(0, 'Video hazır, başlıyor…');
          return src;
        });
      });
    });
  }

  function loadBootVideoSource(video, index) {
    return new Promise(function (resolve, reject) {
      if (index >= VIDEO_CANDIDATES.length) {
        reject(new Error('video-not-found'));
        return;
      }
      var src = resolveVideoUrl(VIDEO_CANDIDATES[index]);
      function cleanup() {
        video.removeEventListener('canplay', onOk);
        video.removeEventListener('loadeddata', onOk);
        video.removeEventListener('error', onErr);
      }
      function onOk() {
        if (video.readyState < 2) return;
        cleanup();
        resolve(src);
      }
      function onErr() {
        cleanup();
        loadBootVideoSource(video, index + 1).then(resolve, reject);
      }
      video.addEventListener('canplay', onOk, { once: true });
      video.addEventListener('loadeddata', onOk, { once: true });
      video.addEventListener('error', onErr, { once: true });
      video.src = src;
      try {
        video.load();
      } catch (e) {
        onErr();
      }
    });
  }

  function playBootVideo(ov, opts) {
    var video = ov.querySelector('.nova-sprite-boot-video-src');
    if (!video) return Promise.resolve();
    opts = opts || {};

    ov.classList.remove('nova-sprite-boot--no-video');

    startVideoRender(ov);
    window.__novaBootVideoPhase = true;
    setProgress(0.02, 'Dünyalar hazırlanıyor…');

    return new Promise(function (resolve) {
      function startPlay() {
        if (typeof opts.onVideoPlayStart === 'function') {
          try {
            opts.onVideoPlayStart();
          } catch (_) {}
        }
        try {
          video.currentTime = 0;
        } catch (_) {}
        var p;
        try {
          p = video.play();
        } catch (_) {
          p = null;
        }
        if (p && typeof p.then === 'function') {
          p.catch(function () {});
        }
        waitForVideoEnd(video, TARGET_DURATION_MS).then(resolve);
      }

      if (video.readyState >= 3) startPlay();
      else {
        video.addEventListener('canplaythrough', startPlay, { once: true });
        video.addEventListener('loadeddata', startPlay, { once: true });
      }
    }).catch(function () {
      ov.classList.add('nova-sprite-boot--no-video');
      window.__novaBootVideoPhase = false;
      setProgress(0.1, 'Kahramanlar hazırlanıyor…');
      return waitForVideoEnd(null, TARGET_DURATION_MS);
    });
  }

  function updateLightBootProgress(ratio) {
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
    state.heavyPreloadDone = true;
    state.heavyMainDone = false;

    return runMainScreenPrep(function (msg) {
      if (msg && !state.finishingPulse && state.videoDone) {
        startFinishingPulse(1);
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

  function runPostVideoMainPhase() {
    setProgress(0.88, 'Ana ekran hazırlanıyor…');
    return runLightBootWork();
  }

  function runCinematicBoot() {
    var ov = getOverlay();
    if (!ov) return Promise.resolve();

    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';

    document.body.classList.add('nova-sprite-boot-active');
    ov.hidden = false;
    ov.classList.remove('is-exiting');
    setProgress(0, 'Açılış videosu indiriliyor…');

    if (typeof window.novaPrefetchMainScreenAssets === 'function') {
      window.novaPrefetchMainScreenAssets();
    }
    var prepPromise = runLightBootWork();

    var video = ov.querySelector('.nova-sprite-boot-video-src');
    if (!video) {
      return prepPromise.then(function () {
        return exitAt100Immediately();
      });
    }

    return downloadBootVideoFully(video)
      .then(function () {
        return Promise.all([
          playBootVideo(ov, {
            onVideoPlayStart: function () {}
          }),
          prepPromise
        ]);
      })
      .catch(function () {
        ov.classList.add('nova-sprite-boot--no-video');
        state.bootVideoDownloadDone = true;
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

  function tryAutoStartForRememberedSession() {
    if (!hasStoredStudentSession()) return;
    if (typeof window.novaPrefetchMainScreenAssets === 'function') {
      window.novaPrefetchMainScreenAssets();
    }
    if (!shouldRunBoot()) {
      markBootDone();
      if (typeof window.novaStabilizeMainScreen === 'function') {
        window.novaStabilizeMainScreen({ force: true });
      }
      return;
    }
    window.novaStartSpriteBoot({ trigger: 'remembered' });
  }

  window.novaSpriteBootReset = function () {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('nova_sprite_boot_done_v1');
      sessionStorage.removeItem('nova_sprite_boot_done_v2');
      sessionStorage.removeItem('nova_sprite_boot_done_v3');
    } catch (_) {}
    if (state._bootBlobUrl) {
      try {
        URL.revokeObjectURL(state._bootBlobUrl);
      } catch (_) {}
      state._bootBlobUrl = null;
    }
    bootRunPromise = null;
    window.__novaSpriteBootDone = false;
    window.__novaSpriteAssetsReady = false;
    window.__novaBootVideoPhase = false;
    window.__novaSpriteBootActive = false;
    window.__novaMainScreenBootPromise = null;
    window.__novaMainScreenBootReady = false;
    state.exiting = false;
    state.preloadDone = false;
    state.videoDone = false;
    state.heavyPreloadDone = false;
    state.heavyMainDone = false;
    state.bootVideoDownloadDone = false;
    state._bootVideoBlobPromise = null;
    stopFinishingPulse();
  };

  window.novaSpriteBootHasSession = hasStoredStudentSession;

  hideOverlayInitially();
  warmVideoCache();
  applyBootGameTitle();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAutoStartForRememberedSession, { once: true });
  } else {
    tryAutoStartForRememberedSession();
  }
})();
