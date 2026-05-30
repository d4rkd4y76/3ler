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
    this.frameIndex = 0;
    this.totalFrames = clip.frameCount || clip.loopEnd || 48;
    this.fps = clip.fps || 20;
    this.frameMs = 1000 / this.fps;
    this.accum = 0;
    this.lastTick = 0;
    this.onComplete = null;
    this.resizeObs = null;
    this.lastCw = 0;
    this.lastCh = 0;
    this.scaleMul = (rootManifest().scale && rootManifest().scale.sp) || 1;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
  }

  TrueClipEngine.prototype.resize = function () {
    var clip = this.clip;
    var maxCssW = Math.min(window.innerWidth * 0.94, 720);
    var cssW = Math.max(200, Math.round(maxCssW));
    var cssH = Math.max(120, Math.round(cssW * (clip.frameHeight / clip.frameWidth)));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.max(8, Math.round(cssW * dpr));
    var ch = Math.max(8, Math.round(cssH * dpr));
    if (cw === this.lastCw && ch === this.lastCh) return;
    this.lastCw = cw;
    this.lastCh = ch;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.wrap.style.width = cssW + 'px';
    this.wrap.style.height = cssH + 'px';
  };

  TrueClipEngine.prototype.tick = function () {
    var now = performance.now();
    if (!this.lastTick) this.lastTick = now;
    var delta = now - this.lastTick;
    this.lastTick = now;
    if (delta > this.frameMs * 3) {
      this.accum = 0;
      this.lastTick = now;
      delta = 0;
    }
    this.accum += delta;
    if (this.accum >= this.frameMs) {
      this.accum -= this.frameMs;
      if (this.frameIndex < this.totalFrames - 1) {
        this.frameIndex += 1;
      } else {
        this.done = true;
      }
    }
  };

  TrueClipEngine.prototype.draw = function () {
    if (!this.ctx || !this.img || !this.clip) return;
    this.tick();
    var clip = this.clip;
    var r = frameRect(clip, this.frameIndex);
    var ctx = this.ctx;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, 0, 0, cw, ch);
  };

  TrueClipEngine.prototype.loop = function () {
    if (!this.running) return;
    this.draw();
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
    this.frameIndex = 0;
    this.accum = 0;
    this.lastTick = 0;
    this.resize();
    this.draw();
    this.loop();
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
            eng.draw();
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
    rootManifest().clips.forEach(function (clip) {
      if (!clip || !clip.sheet || sheetCache[clip.sheet]) return;
      loadClipAssets(clip).catch(function () {});
    });
  }

  window.novaBuzEjderHasTrueClips = hasTrueClips;
  window.novaBuzEjderPlayTrueClip = playTrueClip;
  window.novaBuzEjderTrueUnmount = unmount;
  window.novaBuzEjderPreloadTrueClips = preloadTrueClips;
})();
