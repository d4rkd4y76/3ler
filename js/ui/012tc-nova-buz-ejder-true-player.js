/* Buz Ejderi — tek kişilik doğru cevap sprite klipleri (tek seferlik oynat) */
(function () {
  'use strict';

  var engines = new WeakMap();
  var sheetCache = {};

  function rootManifest() {
    return window.NOVA_BUZ_EJDER_TRUE_MANIFEST || null;
  }

  function scriptBase() {
    if (window.NOVA_BUZ_EJDER_TRUE_BASE) return window.NOVA_BUZ_EJDER_TRUE_BASE;
    return 'hero/ice_dragon/sprite/true/';
  }

  function resolveUrl(file) {
    var base = scriptBase();
    if (base.charAt(base.length - 1) !== '/') base += '/';
    var path = base + file;
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function clipForRoutine(routine) {
    var root = rootManifest();
    if (!root || !root.clips) return null;
    routine = ((routine == null ? 0 : routine) % 3 + 3) % 3;
    for (var i = 0; i < root.clips.length; i++) {
      if (root.clips[i].routine === routine) return root.clips[i];
    }
    return root.clips[routine] || root.clips[0];
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        var done = function () { resolve(img); };
        if (img.decode) img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = function () { reject(new Error('img-fail:' + url)); };
      img.src = url;
    });
  }

  function loadClipAssets(clip) {
    if (!clip) return Promise.reject(new Error('clip-missing'));
    if (sheetCache[clip.sheet]) return sheetCache[clip.sheet];
    sheetCache[clip.sheet] = loadImage(resolveUrl(clip.sheet)).then(function (img) {
      return { clip: clip, img: img };
    });
    return sheetCache[clip.sheet];
  }

  function frameRect(clip, index) {
    var col = index % clip.cols;
    var row = (index / clip.cols) | 0;
    return {
      sx: col * clip.frameWidth,
      sy: row * clip.frameHeight,
      sw: clip.frameWidth,
      sh: clip.frameHeight
    };
  }

  function TrueClipEngine(wrap, canvas, clip, img) {
    this.wrap = wrap;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.clip = clip;
    this.img = img;
    this.running = false;
    this.done = false;
    this.raf = 0;
    this.frameFloat = 0;
    this.totalFrames = clip.frameCount || clip.loopEnd || 48;
    this.fps = clip.fps || 18;
    this.frameMs = 1000 / this.fps;
    this.lastTick = 0;
    this.onComplete = null;
    this.resizeObs = null;
    this.lastCw = 0;
    this.lastCh = 0;
    this.scaleMul = (rootManifest().scale && rootManifest().scale.sp) || 1;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.draw = this.draw.bind(this);
  }

  TrueClipEngine.prototype.resize = function () {
    var rect = this.wrap.getBoundingClientRect();
    var parent = this.wrap.parentElement ? this.wrap.parentElement.getBoundingClientRect() : rect;
    var w = Math.max(120, Math.round(rect.width || parent.width || this.wrap.clientWidth || 280));
    var h = Math.max(160, Math.round(rect.height || parent.height || this.wrap.clientHeight || 320));
    if (w < 80 && parent.width > w) w = Math.round(parent.width);
    if (h < 80 && parent.height > h) h = Math.round(parent.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.max(8, Math.round(w * dpr));
    var ch = Math.max(8, Math.round(h * dpr));
    if (cw === this.lastCw && ch === this.lastCh) return;
    this.lastCw = cw;
    this.lastCh = ch;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  };

  TrueClipEngine.prototype.advance = function (delta) {
    if (delta > this.frameMs * 3) delta = this.frameMs;
    this.frameFloat = Math.min(this.totalFrames - 1, this.frameFloat + delta / this.frameMs);
    if (this.frameFloat >= this.totalFrames - 1) this.done = true;
  };

  TrueClipEngine.prototype.drawFrame = function (index, alpha, dx, dy, dw, dh) {
    if (alpha <= 0.001 || index < 0 || index >= this.totalFrames) return;
    var r = frameRect(this.clip, index);
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
  };

  TrueClipEngine.prototype.draw = function (delta) {
    if (!this.ctx || !this.img || !this.clip) return;
    if (typeof delta === 'number') this.advance(delta);

    var clip = this.clip;
    var ctx = this.ctx;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    var fit = Math.min(cw / clip.frameWidth, ch / clip.frameHeight);
    var scale = fit * this.scaleMul;
    var dw = Math.round(clip.frameWidth * scale);
    var dh = Math.round(clip.frameHeight * scale);
    var dx = Math.round((cw - dw) * 0.5);
    var dy = Math.round(ch - dh);
    var fi = Math.floor(this.frameFloat);
    var frac = this.frameFloat - fi;

    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (frac > 0.02 && fi < this.totalFrames - 1) {
      this.drawFrame(fi, 1 - frac, dx, dy, dw, dh);
      this.drawFrame(fi + 1, frac, dx, dy, dw, dh);
    } else {
      this.drawFrame(fi, 1, dx, dy, dw, dh);
    }
    ctx.globalAlpha = 1;
  };

  TrueClipEngine.prototype.loop = function (now) {
    if (!this.running) return;
    if (!this.lastTick) this.lastTick = now;
    var delta = now - this.lastTick;
    this.lastTick = now;
    this.draw(delta);
    if (this.done) {
      this.running = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      if (typeof this.onComplete === 'function') this.onComplete();
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  TrueClipEngine.prototype.start = function () {
    if (this.running || !this.ctx) return;
    this.running = true;
    this.done = false;
    this.frameFloat = 0;
    this.lastTick = 0;
    this.resize();
    this.draw(0);
    this.raf = requestAnimationFrame(this.loop);
    if (typeof ResizeObserver !== 'undefined' && !this.resizeObs) {
      var self = this;
      this.resizeObs = new ResizeObserver(function () { self.resize(); });
      this.resizeObs.observe(this.wrap);
    }
  };

  TrueClipEngine.prototype.stop = function () {
    this.running = false;
    this.done = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.resizeObs) {
      try { this.resizeObs.disconnect(); } catch (_) {}
      this.resizeObs = null;
    }
  };

  function unmount(host) {
    if (!host) return;
    var eng = engines.get(host);
    if (eng) {
      eng.stop();
      engines.delete(host);
    }
    host.innerHTML = '';
    host.classList.remove('nova-hero-buz-true-ready', 'nova-sp-fx-true-sprite', 'nova-hero-mount--buz-ejder');
  }

  function waitMs(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function waitForHostLayout(host, attempt) {
    attempt = attempt || 0;
    return new Promise(function (resolve) {
      if (!host || !document.body.contains(host)) {
        resolve(false);
        return;
      }
      var rect = host.getBoundingClientRect();
      if ((rect.width >= 48 && rect.height >= 48) || attempt > 36) {
        resolve(rect.width >= 20 && rect.height >= 20);
        return;
      }
      requestAnimationFrame(function () {
        waitForHostLayout(host, attempt + 1).then(resolve);
      });
    });
  }

  function playTrueClip(host, routine) {
    if (!host || !rootManifest()) return waitMs(680);
    var clipMeta = clipForRoutine(routine);
    if (!clipMeta) return waitMs(680);

    unmount(host);
    host.classList.add('nova-sp-fx-true-sprite', 'nova-hero-mount--buz-ejder');

    return loadClipAssets(clipMeta).then(function (assets) {
      return waitForHostLayout(host).then(function (ok) {
        if (!ok || !document.body.contains(host)) return waitMs(400);

        var wrap = document.createElement('div');
        wrap.className = 'nova-hero-buz-true-wrap';
        var canvas = document.createElement('canvas');
        canvas.className = 'nova-hero-buz-true-sprite__canvas';
        canvas.setAttribute('aria-hidden', 'true');
        wrap.appendChild(canvas);
        host.appendChild(wrap);
        host.classList.add('nova-hero-buz-true-ready');

        return new Promise(function (resolve) {
          var eng = new TrueClipEngine(wrap, canvas, assets.clip, assets.img);
          engines.set(host, eng);
          eng.onComplete = function () { resolve(); };
          requestAnimationFrame(function () {
            if (!document.body.contains(host)) { resolve(); return; }
            eng.resize();
            eng.draw(0);
            eng.start();
          });
        });
      });
    }).catch(function (err) {
      console.warn('buz true clip', err);
      return waitMs(400);
    });
  }

  function hasTrueClips() {
    return !!(rootManifest() && rootManifest().clips && rootManifest().clips.length);
  }

  function preloadTrueClips() {
    if (!rootManifest() || !rootManifest().clips) return;
    var clips = rootManifest().clips;
    if (clips[0] && clips[0].sheet && !sheetCache[clips[0].sheet]) {
      loadClipAssets(clips[0]).catch(function () {});
    }
    setTimeout(function () {
      for (var i = 1; i < clips.length; i++) {
        if (!clips[i] || !clips[i].sheet || sheetCache[clips[i].sheet]) continue;
        loadClipAssets(clips[i]).catch(function () {});
      }
    }, 2000);
  }

  window.novaBuzEjderHasTrueClips = hasTrueClips;
  window.novaBuzEjderPlayTrueClip = playTrueClip;
  window.novaBuzEjderTrueUnmount = unmount;
  window.novaBuzEjderPreloadTrueClips = preloadTrueClips;
})();
