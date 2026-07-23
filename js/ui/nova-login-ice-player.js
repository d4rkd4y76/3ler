/* Giriş — buz çerçeve + kanat çırpan ejder spritesheet döngüsü */
(function () {
  'use strict';

  var started = false;
  var raf = 0;
  var img = null;
  var canvas = null;
  var ctx = null;
  var stage = null;
  var fi = 0;
  var accum = 0;
  var last = 0;
  var running = false;

  function manifest() {
    return window.NOVA_LOGIN_ICE_MANIFEST || null;
  }

  function hasGuestLogin() {
    try {
      if (document.documentElement.classList.contains('nova-has-session')) return false;
    } catch (_) {}
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return true;
      var o = JSON.parse(raw);
      return !(o && o.studentId && o.classId);
    } catch (_) {
      return true;
    }
  }

  function applyHoleVars(m) {
    if (!stage || !m || !m.hole) return;
    var h = m.hole;
    stage.style.setProperty('--nl-ice-hole-left', h.left * 100 + '%');
    stage.style.setProperty('--nl-ice-hole-top', h.top * 100 + '%');
    stage.style.setProperty('--nl-ice-hole-right', (1 - h.right) * 100 + '%');
    stage.style.setProperty('--nl-ice-hole-bottom', (1 - h.bottom) * 100 + '%');
    stage.style.setProperty('--nl-ice-fw', String(m.frameWidth || 360));
    stage.style.setProperty('--nl-ice-fh', String(m.frameHeight || 608));
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

  function resizeCanvas() {
    if (!canvas || !stage) return;
    var rect = stage.getBoundingClientRect();
    var w = Math.max(120, Math.round(rect.width || 320));
    var h = Math.max(180, Math.round(rect.height || 520));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  function drawFrame(m) {
    if (!ctx || !img || !m) return;
    resizeCanvas();
    var cw = canvas.width;
    var ch = canvas.height;
    var fit = Math.min(cw / m.frameWidth, ch / m.frameHeight);
    var dw = Math.round(m.frameWidth * fit);
    var dh = Math.round(m.frameHeight * fit);
    var dx = Math.round((cw - dw) * 0.5);
    var dy = Math.round((ch - dh) * 0.5);
    var n = m.loopEnd || m.frameCount || 1;
    var idx = ((fi % n) + n) % n;
    var r = frameRect(m, idx);
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
  }

  function tick(now) {
    if (!running) return;
    var m = manifest();
    if (!m || !img) {
      raf = requestAnimationFrame(tick);
      return;
    }
    if (!last) last = now;
    var delta = now - last;
    last = now;
    if (delta > 80) delta = 80;
    accum += delta;
    var frameMs = 1000 / Math.max(8, Number(m.fps) || 12);
    var n = m.loopEnd || m.frameCount || 1;
    while (accum >= frameMs) {
      accum -= frameMs;
      fi = (fi + 1) % n;
    }
    drawFrame(m);
    raf = requestAnimationFrame(tick);
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var el = new Image();
      el.decoding = 'async';
      el.onload = function () {
        resolve(el);
      };
      el.onerror = reject;
      el.src = url;
    });
  }

  function stop() {
    running = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function start() {
    if (started || !hasGuestLogin()) return;
    var m = manifest();
    stage = document.querySelector('.nova-login-ice__stage');
    canvas = document.getElementById('nova-login-ice-canvas');
    if (!m || !stage || !canvas) return;
    started = true;
    applyHoleVars(m);
    ctx = canvas.getContext('2d', { alpha: true });
    var url = String(m.base || 'assets/login-ice/') + String(m.sheet || 'login-ice-loop.webp');
    loadImage(url)
      .then(function (el) {
        img = el;
        running = true;
        last = 0;
        accum = 0;
        fi = 0;
        try {
          document.documentElement.classList.add('nova-login-ice-ready');
          document.dispatchEvent(new CustomEvent('nova:login-ice-ready'));
        } catch (_) {}
        drawFrame(m);
        raf = requestAnimationFrame(tick);
      })
      .catch(function () {
        try {
          document.documentElement.classList.add('nova-login-ice-fallback');
          document.dispatchEvent(new CustomEvent('nova:login-ice-ready'));
        } catch (_) {}
      });
  }

  window.novaStartLoginIceSprite = start;
  window.novaStopLoginIceSprite = stop;

  function boot() {
    if (!hasGuestLogin()) return;
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener(
    'resize',
    function () {
      if (!running) return;
      var m = manifest();
      if (m) drawFrame(m);
    },
    { passive: true }
  );
})();
