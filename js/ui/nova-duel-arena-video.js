/* Düello soru ekranı — duelloarka.mp4 arka plan (mobil: tek loop, masaüstü: crossfade) */
(function () {
  if (window.__novaDuelArenaVideoInstalled) return;
  window.__novaDuelArenaVideoInstalled = true;

  var SRC = 'duelloarka.mp4';
  var layer, vA, vB, front, back, crossfading, rafId, crossfadeRaf, running, liteMode;
  var crossfadeSec = 1.35;
  var crossfadeStarted = false;
  var liteTimeBound = false;

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) {
      return false;
    }
  }

  function isArenaVideoLite() {
    if (prefersReducedMotion()) return true;
    var perf = window.__novaPerfMode || 'normal';
    if (perf === 'performance' || perf === 'ultra') return true;
    try {
      if (window.matchMedia('(pointer: coarse)').matches) return true;
      if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
    } catch (_) {}
    return false;
  }

  function getGameScreen() {
    return document.getElementById('duel-game-screen');
  }

  function ensureLayer() {
    var game = getGameScreen();
    if (!game) return null;

    layer = game.querySelector('.ndg-arena-video-layer');
    if (layer) {
      vA = document.getElementById('ndg-arena-video-a');
      vB = document.getElementById('ndg-arena-video-b');
      return layer;
    }

    layer = document.createElement('div');
    layer.className = 'ndg-arena-video-layer';
    layer.setAttribute('aria-hidden', 'true');

    var scrim = document.createElement('div');
    scrim.className = 'ndg-arena-video-scrim';

    vA = document.createElement('video');
    vB = document.createElement('video');
    vA.id = 'ndg-arena-video-a';
    vB.id = 'ndg-arena-video-b';

    [vA, vB].forEach(function (v) {
      v.className = 'ndg-arena-video';
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.preload = 'auto';
      v.disablePictureInPicture = true;
      v.controls = false;
      v.loop = false;
      v.src = SRC;
    });

    layer.appendChild(vA);
    layer.appendChild(vB);
    layer.appendChild(scrim);
    game.insertBefore(layer, game.firstChild);
    return layer;
  }

  function calcCrossfadeSec(duration) {
    if (!duration || !isFinite(duration)) return 1.35;
    return Math.min(2.0, Math.max(1.1, duration * 0.24));
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function resetVideoStyle(v) {
    if (!v) return;
    v.style.transition = 'none';
    v.style.opacity = '';
    v.style.filter = '';
  }

  function setFront(video) {
    front = video;
    back = front === vA ? vB : vA;
    resetVideoStyle(vA);
    resetVideoStyle(vB);
    vA.classList.toggle('is-front', front === vA);
    vB.classList.toggle('is-front', front === vB);
    if (front === vA) {
      vA.style.opacity = '1';
      vB.style.opacity = '0';
    } else {
      vB.style.opacity = '1';
      vA.style.opacity = '0';
    }
    crossfadeStarted = false;
  }

  function onLiteTimeupdate() {
    if (!running || !liteMode || !vA || !layer) return;
    var d = vA.duration;
    if (!d || !isFinite(d)) return;
    var remain = d - vA.currentTime;
    if (remain < 0.28 && remain > 0.02) {
      layer.classList.add('ndg-arena-loop-mask');
    } else if (remain > 0.32 || vA.currentTime < 0.12) {
      layer.classList.remove('ndg-arena-loop-mask');
    }
  }

  function bindLiteTimeupdate() {
    if (!vA || liteTimeBound) return;
    liteTimeBound = true;
    vA.addEventListener('timeupdate', onLiteTimeupdate, { passive: true });
  }

  function unbindLiteTimeupdate() {
    if (!vA || !liteTimeBound) return;
    liteTimeBound = false;
    vA.removeEventListener('timeupdate', onLiteTimeupdate);
  }

  function runCrossfade() {
    if (crossfading || !running || !front || !back || liteMode) return;
    crossfading = true;
    crossfadeStarted = true;
    if (layer) layer.classList.add('ndg-arena-crossfade');

    var durMs = crossfadeSec * 1000;
    back.pause();
    try {
      back.currentTime = 0;
    } catch (_) {}
    back.style.opacity = '0';
    var playP = back.play();
    if (playP && playP.catch) playP.catch(function () {});

    var t0 = performance.now();

    function frame(now) {
      if (!running) {
        crossfading = false;
        if (layer) layer.classList.remove('ndg-arena-crossfade');
        return;
      }
      var raw = Math.min(1, (now - t0) / durMs);
      var ease = easeInOutCubic(raw);

      back.style.opacity = String(ease);
      front.style.opacity = String(1 - ease);

      if (raw < 1) {
        crossfadeRaf = requestAnimationFrame(frame);
        return;
      }

      try {
        front.pause();
        front.currentTime = 0;
      } catch (_) {}
      resetVideoStyle(front);
      resetVideoStyle(back);
      if (layer) layer.classList.remove('ndg-arena-crossfade');
      setFront(back);
      crossfading = false;
    }

    if (crossfadeRaf) cancelAnimationFrame(crossfadeRaf);
    crossfadeRaf = requestAnimationFrame(frame);
  }

  function tickLoop() {
    if (!running || liteMode) {
      rafId = null;
      return;
    }

    if (!front) {
      rafId = requestAnimationFrame(tickLoop);
      return;
    }

    if (front.duration && isFinite(front.duration)) {
      crossfadeSec = calcCrossfadeSec(front.duration);
    }

    if (!crossfading && front.duration && front.duration > 0) {
      var remain = front.duration - front.currentTime;
      if (remain <= crossfadeSec && remain > 0.05 && !crossfadeStarted) {
        runCrossfade();
      }
    }

    rafId = requestAnimationFrame(tickLoop);
  }

  function onVisibility() {
    if (!running || !front) return;
    if (document.hidden) {
      try {
        if (vA) vA.pause();
        if (vB) vB.pause();
      } catch (_) {}
    } else if (!crossfading) {
      try {
        var p = front.play();
        if (p && p.catch) p.catch(function () {});
      } catch (_) {}
    }
  }

  function bindEndedFallback(v) {
    if (!v || v.dataset.ndepEndedBound) return;
    v.dataset.ndepEndedBound = '1';
    v.addEventListener('ended', function () {
      if (!running || crossfading || liteMode) return;
      runCrossfade();
    });
  }

  function playWithGestureFallback(video) {
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        var retry = function () {
          document.removeEventListener('pointerdown', retry, true);
          if (running && front) {
            var p2 = front.play();
            if (p2 && p2.catch) p2.catch(function () {});
          }
        };
        document.addEventListener('pointerdown', retry, true);
      });
    }
  }

  function startLite(game) {
    liteMode = true;
    game.classList.add('ndg-arena-video-on', 'ndg-arena-video-lite');
    if (layer) layer.classList.add('ndg-arena-video-lite');

    vA.loop = true;
    vB.loop = false;
    vB.pause();
    vB.style.display = 'none';

    vA.classList.add('is-front');
    vA.style.opacity = '1';
    front = vA;

    bindLiteTimeupdate();
    playWithGestureFallback(vA);
  }

  function startFull(game) {
    liteMode = false;
    game.classList.remove('ndg-arena-video-lite');
    if (layer) layer.classList.remove('ndg-arena-video-lite', 'ndg-arena-loop-mask');

    vA.loop = false;
    vB.loop = false;
    vB.style.display = '';

    bindEndedFallback(vA);
    bindEndedFallback(vB);

    vA.pause();
    vB.pause();
    try {
      vA.currentTime = 0;
      vB.currentTime = 0;
    } catch (_) {}

    setFront(vA);
    back.style.opacity = '0';

    playWithGestureFallback(front);

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tickLoop);
  }

  window.novaDuelArenaVideoStart = function novaDuelArenaVideoStart() {
    if (prefersReducedMotion()) return;
    var game = getGameScreen();
    if (!game) return;

    ensureLayer();
    if (!vA || !vB) return;

    running = true;
    crossfading = false;
    crossfadeStarted = false;

    if (isArenaVideoLite()) startLite(game);
    else startFull(game);
  };

  window.novaDuelArenaVideoStop = function novaDuelArenaVideoStop() {
    running = false;
    crossfading = false;
    crossfadeStarted = false;
    liteMode = false;

    unbindLiteTimeupdate();

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (crossfadeRaf) {
      cancelAnimationFrame(crossfadeRaf);
      crossfadeRaf = null;
    }

    var game = getGameScreen();
    if (game) {
      game.classList.remove('ndg-arena-video-on', 'ndg-arena-video-lite');
    }
    if (layer) {
      layer.classList.remove('ndg-arena-crossfade', 'ndg-arena-video-lite', 'ndg-arena-loop-mask');
    }

    if (vB) vB.style.display = '';
    if (vA) vA.loop = false;
    if (vB) vB.loop = false;

    try {
      if (vA) vA.pause();
      if (vB) vB.pause();
    } catch (_) {}
  };

  document.addEventListener('visibilitychange', onVisibility, { passive: true });
})();
