/* Sinematik kaynak yükleme: video (chroma) + sprite önbellek, 6sn senkron geçiş */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_sprite_boot_done_v4';
  var VIDEO_CANDIDATES = [
    'yeni_loading.mp4',
    './yeni_loading.mp4',
    'kaynaklar_yukleniyor.mp4',
    'kaynaklar_y\u00fckleniyor.mp4'
  ];
  var TARGET_DURATION_MS = 6000;
  var MAX_WAIT_MS = 35000;
  var EXIT_HOLD_MS = 90;

  window.__novaSpriteBootManaged = true;

  var state = {
    raf: 0,
    preloadDone: false,
    videoDone: false,
    exiting: false,
    smoothPct: 0
  };

  function shouldRunBoot() {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return false;
    } catch (_) {}
    return true;
  }

  function markBootDone() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_) {}
    window.__novaSpriteBootDone = true;
    window.__novaSpriteAssetsReady = true;
    if (typeof window.novaSpriteBootFlushDefer === 'function') {
      window.novaSpriteBootFlushDefer();
    }
  }

  function getOverlay() {
    return document.getElementById('nova_sprite_boot_overlay');
  }

  function setProgress(ratio, statusText) {
    var ov = getOverlay();
    if (!ov) return;
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
    }
    if (glow) glow.style.left = pct + '%';
    if (wrap) wrap.classList.toggle('has-progress', pct > 2);
    if (label) label.textContent = pct + '%';
    if (status && statusText) status.textContent = statusText;
  }

  function hideOverlayImmediate() {
    var ov = getOverlay();
    if (!ov) return;
    stopRenderLoop();
    ov.hidden = true;
    ov.classList.add('is-exiting');
    try {
      document.body.classList.remove('nova-sprite-boot-active');
    } catch (_) {}
  }

  function playExitTransition(cb) {
    if (state.exiting) return;
    state.exiting = true;
    var ov = getOverlay();
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
      if (ov) ov.hidden = true;
      try {
        document.body.classList.remove('nova-sprite-boot-active');
      } catch (_) {}
      if (typeof cb === 'function') cb();
    }, 720);
  }

  function waitForPreloadApi() {
    return new Promise(function (resolve) {
      var tries = 0;
      (function poll() {
        if (typeof window.novaSpritePreloadAll === 'function') return resolve(true);
        tries += 1;
        if (tries > 160) return resolve(false);
        setTimeout(poll, 40);
      })();
    });
  }

  function runAssetPreload(onRatio) {
    return waitForPreloadApi().then(function (ok) {
      if (!ok) {
        state.preloadDone = true;
        return;
      }
      return window
        .novaSpritePreloadAll(function (ratio) {
          if (typeof onRatio === 'function') onRatio(ratio);
        })
        .catch(function () {})
        .then(function () {
          state.preloadDone = true;
        });
    });
  }

  /* Yeşil ekran — agresif key + kenar yumuşatma + green spill düzeltme */
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

  function startVideoRender(ov) {
    var video = ov.querySelector('.nova-sprite-boot-video-src');
    var canvas = ov.querySelector('#nova_sprite_boot_canvas');
    if (!video || !canvas) return null;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    try {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    } catch (_) {}

    var chromaBuffer = document.createElement('canvas');
    var chromaCtx = chromaBuffer.getContext('2d', { alpha: true });
    try {
      chromaCtx.imageSmoothingEnabled = true;
      chromaCtx.imageSmoothingQuality = 'high';
    } catch (_) {}

    function resizeCanvas() {
      var layer = ov.querySelector('.nova-sprite-boot-video-layer');
      var rect = layer
        ? layer.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var w = Math.max(160, Math.round(rect.width * dpr));
      var h = Math.max(160, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        chromaBuffer.width = w;
        chromaBuffer.height = h;
      }
    }

    function drawFrame() {
      if (!state.exiting && video.readyState >= 2) {
        resizeCanvas();
        var w = canvas.width;
        var h = canvas.height;
        var vw = video.videoWidth || w;
        var vh = video.videoHeight || h;
        var scale = Math.max(w / vw, h / vh);
        var dw = vw * scale;
        var dh = vh * scale;
        var dx = (w - dw) * 0.5;
        var dy = (h - dh) * 0.5;

        chromaCtx.clearRect(0, 0, w, h);
        chromaCtx.drawImage(video, dx, dy, dw, dh);
        try {
          var frame = chromaCtx.getImageData(0, 0, w, h);
          applyChromaKey(frame);
          chromaCtx.putImageData(frame, 0, 0);
        } catch (_) {
          chromaCtx.clearRect(0, 0, w, h);
          chromaCtx.drawImage(video, dx, dy, dw, dh);
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(chromaBuffer, 0, 0, w, h);
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
    if (typeof state._bootResizeOff === 'function') {
      try { state._bootResizeOff(); } catch (_) {}
      state._bootResizeOff = null;
    }
  }

  function waitForVideoEnd(video, durationMs) {
    return new Promise(function (resolve) {
      var resolved = false;
      function done() {
        if (resolved) return;
        resolved = true;
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
        var preloadBlend = state.preloadDone ? 0 : 0.08;
        var display = Math.min(0.99, ratio * (0.94 - preloadBlend) + preloadBlend);
        setProgress(display, ratio < 0.35 ? 'Dünyalar hazırlanıyor…' : ratio < 0.72 ? 'Kahramanlar uyanıyor…' : 'Son dokunuşlar…');

        if (performance.now() - start >= maxMs + 120 || (video.ended && t > 0.1)) {
          setProgress(1, 'Hazır!');
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

  function playBootVideo(ov) {
    var video = ov.querySelector('.nova-sprite-boot-video-src');
    if (!video) return Promise.resolve();

    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.removeAttribute('src');

    startVideoRender(ov);
    ov.classList.remove('nova-sprite-boot--no-video');

    return loadBootVideoSource(video, 0)
      .then(function () {
        setProgress(0.08, 'Dünyalar hazırlanıyor…');
        return new Promise(function (resolve) {
          function startPlay() {
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
          else if (video.readyState >= 2) {
            startPlay();
          } else {
            video.addEventListener('canplay', startPlay, { once: true });
            video.addEventListener('loadeddata', startPlay, { once: true });
          }
        });
      })
      .catch(function () {
        ov.classList.add('nova-sprite-boot--no-video');
        setProgress(0.1, 'Kahramanlar hazırlanıyor…');
        return waitForVideoEnd(null, TARGET_DURATION_MS);
      });
  }

  function runCinematicBoot() {
    var ov = getOverlay();
    if (!ov) return Promise.resolve();

    document.body.classList.add('nova-sprite-boot-active');
    ov.hidden = false;
    ov.classList.remove('is-exiting');
    setProgress(0, 'Başlatılıyor…');

    var preloadPromise = runAssetPreload(function () {});

    return playBootVideo(ov)
      .then(function () {
        setProgress(1, 'Hazır!');
        return preloadPromise;
      })
      .then(function () {
        return new Promise(function (r) {
          setTimeout(r, EXIT_HOLD_MS);
        });
      });
  }

  function startBoot() {
    if (!shouldRunBoot()) {
      markBootDone();
      hideOverlayImmediate();
      if (typeof window.novaSpritePreloadAll === 'function') {
        window.novaSpritePreloadAll().catch(function () {});
      }
      return;
    }

    var timeout = setTimeout(function () {
      markBootDone();
      playExitTransition(function () {
        try {
          document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));
        } catch (_) {}
      });
    }, MAX_WAIT_MS);

    runCinematicBoot()
      .then(function () {
        clearTimeout(timeout);
        markBootDone();
        playExitTransition(function () {
          try {
            document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));
          } catch (_) {}
        });
      })
      .catch(function () {
        clearTimeout(timeout);
        markBootDone();
        playExitTransition();
      });
  }

  window.novaSpriteBootReset = function () {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('nova_sprite_boot_done_v1');
      sessionStorage.removeItem('nova_sprite_boot_done_v2');
      sessionStorage.removeItem('nova_sprite_boot_done_v3');
    } catch (_) {}
    window.__novaSpriteBootDone = false;
    window.__novaSpriteAssetsReady = false;
    state.exiting = false;
    state.preloadDone = false;
    state.videoDone = false;
  };

  warmVideoCache();
  if (shouldRunBoot() && typeof window.novaSpritePreloadAll === 'function') {
    window.novaSpritePreloadAll().catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBoot, { once: true });
  } else {
    startBoot();
  }
})();
