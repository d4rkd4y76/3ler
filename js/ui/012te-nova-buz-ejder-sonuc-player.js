/* Buz Ejderi — son soru sonrası tam ekran sonuç geçişi */
(function () {
  'use strict';

  var sheetPromise = null;
  var playing = false;

  function manifest() {
    return window.NOVA_BUZ_EJDER_SONUC_MANIFEST || null;
  }

  function baseUrl() {
    if (window.NOVA_BUZ_EJDER_SONUC_BASE) return window.NOVA_BUZ_EJDER_SONUC_BASE;
    return 'hero/ice_dragon/sprite/sonuc/';
  }

  function sheetUrl() {
    var m = manifest();
    if (!m || !m.sheet) return '';
    var base = baseUrl();
    if (base.charAt(base.length - 1) !== '/') base += '/';
    try {
      return new URL(base + m.sheet, window.location.href).href;
    } catch (_) {
      return base + m.sheet;
    }
  }

  function loadSheet() {
    if (!manifest()) return Promise.reject(new Error('sonuc-manifest'));
    if (sheetPromise) return sheetPromise;
    sheetPromise = new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        var done = function () { resolve(img); };
        if (img.decode) img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = function () { reject(new Error('sonuc-img')); };
      img.src = sheetUrl();
    });
    return sheetPromise;
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

  function ensureOverlay() {
    var el = document.getElementById('nova-buz-sonuc-overlay');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'nova-buz-sonuc-overlay';
    el.className = 'nova-buz-sonuc-overlay';
    el.setAttribute('aria-hidden', 'true');
    var canvas = document.createElement('canvas');
    canvas.className = 'nova-buz-sonuc-overlay__canvas';
    el.appendChild(canvas);
    document.body.appendChild(el);
    return el;
  }

  function removeOverlay(el) {
    if (!el || !el.parentNode) return;
    el.parentNode.removeChild(el);
  }

  function playTransition(img, m) {
    return new Promise(function (resolve) {
      var overlay = ensureOverlay();
      var canvas = overlay.querySelector('canvas');
      var ctx = canvas.getContext('2d', { alpha: false });
      var total = m.frameCount || m.loopEnd || 72;
      var fps = m.fps || 18;
      var frameMs = 1000 / fps;
      var frameIndex = 0;
      var accum = 0;
      var last = 0;
      var raf = 0;
      var done = false;

      function layout() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = window.innerWidth;
        var h = window.innerHeight;
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
      }

      function drawFrame() {
        var cw = canvas.width;
        var ch = canvas.height;
        var r = frameRect(m, frameIndex);
        var scale = Math.max(cw / r.sw, ch / r.sh);
        var dw = r.sw * scale;
        var dh = r.sh * scale;
        var dx = (cw - dw) * 0.5;
        var dy = (ch - dh) * 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, cw, ch);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
      }

      function finish() {
        if (done) return;
        done = true;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', layout);
        overlay.classList.remove('is-visible');
        overlay.classList.add('is-fading-out');
        setTimeout(function () {
          removeOverlay(overlay);
          playing = false;
          resolve();
        }, 520);
      }

      function loop(now) {
        if (done) return;
        if (!last) last = now;
        var delta = now - last;
        last = now;
        if (delta > frameMs * 2.5) delta = frameMs;
        accum += delta;
        while (accum >= frameMs) {
          accum -= frameMs;
          if (frameIndex < total - 1) {
            frameIndex += 1;
          } else {
            finish();
            return;
          }
        }
        drawFrame();
        raf = requestAnimationFrame(loop);
      }

      playing = true;
      layout();
      overlay.classList.remove('is-fading-out');
      overlay.classList.add('is-visible');
      drawFrame();
      window.addEventListener('resize', layout, { passive: true });
      requestAnimationFrame(function () {
        last = 0;
        raf = requestAnimationFrame(loop);
      });
    });
  }

  function hasSonucTransition() {
    return !!(manifest() && manifest().sheet);
  }

  function preloadSonucTransition() {
    if (!hasSonucTransition()) return Promise.resolve(false);
    return loadSheet().then(function () { return true; }).catch(function () { return false; });
  }

  function playSonucTransition() {
    if (playing) return Promise.resolve();
    if (!hasSonucTransition()) return Promise.resolve();
    return loadSheet().then(function (img) {
      return playTransition(img, manifest());
    }).catch(function () {
      playing = false;
      return Promise.resolve();
    });
  }

  window.novaBuzEjderHasSonucTransition = hasSonucTransition;
  window.novaBuzEjderPreloadSonucTransition = preloadSonucTransition;
  window.novaBuzEjderPlaySonucTransition = playSonucTransition;
})();
