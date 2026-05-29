/* Buz Ejderi — video sprite (mağaza/ana ekran). SVG yedek YOK — arena ayrı. */
(function () {
  'use strict';

  var engines = new WeakMap();
  var assetCache = { promise: null, manifest: null, img: null, sheetUrl: '' };

  function scriptBase() {
    var scripts = document.getElementsByTagName('script');
    var i, src;
    for (i = scripts.length - 1; i >= 0; i--) {
      src = scripts[i].src || '';
      if (src.indexOf('012t-nova-buz-ejder') !== -1) {
        return src.replace(/js\/ui\/[^?#]+$/, 'hero/ice_dragon/sprite/');
      }
    }
    return 'hero/ice_dragon/sprite/';
  }

  function resolveUrl(base, file) {
    var b = base || 'hero/ice_dragon/sprite/';
    if (b.charAt(b.length - 1) !== '/') b += '/';
    var path = b + file;
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function sheetUrlCandidates(manifest) {
    var file = manifest.sheet || 'buz-ejder-idle.webp';
    var bases = [];
    if (window.NOVA_BUZ_EJDER_SPRITE_BASE) bases.push(window.NOVA_BUZ_EJDER_SPRITE_BASE);
    if (manifest.base) bases.push(manifest.base);
    bases.push(scriptBase());
    bases.push('hero/ice_dragon/sprite/');
    bases.push('./hero/ice_dragon/sprite/');
    var out = [];
    var seen = {};
    bases.forEach(function (b) {
      var u = resolveUrl(b, file);
      if (!seen[u]) {
        seen[u] = 1;
        out.push(u);
      }
    });
    return out;
  }

  function getManifest() {
    if (window.NOVA_BUZ_EJDER_SPRITE_MANIFEST) {
      return Promise.resolve(window.NOVA_BUZ_EJDER_SPRITE_MANIFEST);
    }
    return Promise.reject(new Error('buz-manifest-missing'));
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        var done = function () { resolve({ img: img, url: url }); };
        if (img.decode) img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = function () { reject(new Error('img-fail:' + url)); };
      img.src = url;
    });
  }

  function loadSheetFromUrls(urls, idx) {
    if (idx >= urls.length) {
      return Promise.reject(new Error('buz-sheet-all-failed'));
    }
    return loadImage(urls[idx]).catch(function () {
      return loadSheetFromUrls(urls, idx + 1);
    });
  }

  function loadAssets(force) {
    if (assetCache.promise && !force) return assetCache.promise;
    assetCache.promise = getManifest().then(function (manifest) {
      assetCache.manifest = manifest;
      var urls = sheetUrlCandidates(manifest);
      return loadSheetFromUrls(urls, 0).then(function (res) {
        assetCache.img = res.img;
        assetCache.sheetUrl = res.url;
        return manifest;
      });
    });
    return assetCache.promise;
  }

  function frameRect(manifest, index) {
    var fw = manifest.frameWidth;
    var fh = manifest.frameHeight;
    var cols = manifest.cols;
    var col = index % cols;
    var row = (index / cols) | 0;
    return { sx: col * fw, sy: row * fh, sw: fw, sh: fh };
  }

  function SpriteEngine(wrap, canvas, manifest, img, opts) {
    this.wrap = wrap;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.manifest = manifest;
    this.img = img;
    this.profile = (opts && opts.profile) || 'store';
    this.anchorBottom = this.profile === 'main';
    this.dead = !this.ctx;
    this.running = false;
    this.raf = 0;
    this.resizeObs = null;
    this.lastCw = 0;
    this.lastCh = 0;
    this.startTime = performance.now() - Math.random() * 3000;
    this.fps = manifest.fps || 12;
    this.loopFrames = manifest.frameCount || 42;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
  }

  SpriteEngine.prototype.resize = function () {
    var rect = this.wrap.getBoundingClientRect();
    var w = Math.max(40, Math.round(rect.width || this.wrap.clientWidth || 140));
    var h = Math.max(40, Math.round(rect.height || this.wrap.clientHeight || 160));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.max(4, Math.round(w * dpr));
    var ch = Math.max(4, Math.round(h * dpr));
    if (cw === this.lastCw && ch === this.lastCh) return;
    this.lastCw = cw;
    this.lastCh = ch;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  };

  SpriteEngine.prototype.draw = function () {
    if (this.dead || !this.img || !this.manifest) return;
    var m = this.manifest;
    if (!m.frameWidth || !m.frameHeight) return;
    var elapsed = (performance.now() - this.startTime) / 1000;
    var fi = Math.floor(elapsed * this.fps) % this.loopFrames;
    var r = frameRect(m, fi);
    var ctx = this.ctx;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    var scale = Math.min(cw / m.frameWidth, ch / m.frameHeight);
    var dw = Math.round(m.frameWidth * scale);
    var dh = Math.round(m.frameHeight * scale);
    var dx = Math.round((cw - dw) * 0.5);
    var dy = this.anchorBottom ? (ch - dh) : Math.round((ch - dh) * 0.5);
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
  };

  SpriteEngine.prototype.loop = function () {
    if (!this.running) return;
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  SpriteEngine.prototype.start = function () {
    if (this.dead || this.running) return;
    this.running = true;
    this.loop();
    if (typeof ResizeObserver !== 'undefined' && !this.resizeObs) {
      var self = this;
      this.resizeObs = new ResizeObserver(function () { self.resize(); });
      this.resizeObs.observe(this.wrap);
    }
  };

  SpriteEngine.prototype.stop = function () {
    this.running = false;
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
    host.classList.remove('nova-hero-buz-vitrin-ready', 'nova-hero-buz-sprite-ready', 'nova-hero-buz-vitrin-fallback');
  }

  function startEngine(host, wrap, canvas, manifest, opts) {
    var eng = new SpriteEngine(wrap, canvas, manifest, assetCache.img, opts);
    engines.set(host, eng);
    if (eng.dead) return;
    host.classList.add('nova-hero-buz-vitrin-ready', 'nova-hero-buz-sprite-ready');
    function ready(attempt) {
      if (!document.body.contains(host)) return;
      var rect = host.getBoundingClientRect();
      if ((rect.width < 10 || rect.height < 10) && attempt < 28) {
        requestAnimationFrame(function () { ready(attempt + 1); });
        return;
      }
      eng.resize();
      eng.draw();
      if (!eng.running) eng.start();
    }
    requestAnimationFrame(function () { ready(0); });
  }

  function mount(host, opts) {
    if (!host) return null;
    unmount(host);
    host.classList.add('nova-hero-mount--buz-ejder');
    host.setAttribute('data-buz-sprite', '1');

    var profile = (opts && opts.profile) || 'store';
    var wrap = document.createElement('div');
    wrap.className = 'nova-hero-buz-sprite nova-hero-buz-sprite--' + profile;
    var canvas = document.createElement('canvas');
    canvas.className = 'nova-hero-buz-sprite__canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Buz Ejderi');
    wrap.appendChild(canvas);
    host.appendChild(wrap);

    var tries = 0;
    function tryLoad() {
      tries += 1;
      loadAssets(tries > 1).then(function (manifest) {
        if (!document.body.contains(host)) return;
        startEngine(host, wrap, canvas, manifest, opts);
      }).catch(function (err) {
        console.error('[buz sprite] yüklenemedi — eski SVG gösterilmez. Deneme:', tries, err);
        if (tries < 4) {
          setTimeout(tryLoad, 400 * tries);
          return;
        }
        wrap.classList.add('nova-hero-buz-sprite--error');
      });
    }
    tryLoad();
    return wrap;
  }

  window.novaBuzEjderMountSprite = mount;
  window.novaBuzEjderUnmountSprite = unmount;
  window.novaBuzEjderMountVitrinVideo = mount;
  window.novaBuzEjderUnmountVitrinVideo = unmount;
  window.novaBuzEjderPreloadSprite = function () { return loadAssets(false); };
  window.novaBuzEjderIsSpriteReady = function () {
    return !!(assetCache.img && assetCache.manifest);
  };

  function bootPreload() {
    try { loadAssets(false); } catch (e) {
      console.warn('[buz sprite] preload', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPreload);
  } else {
    bootPreload();
  }
})();
