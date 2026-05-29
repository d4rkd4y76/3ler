/* Buz Ejderi — sprite (mağaza + ana ekran ayrı sheet). */
(function () {
  'use strict';

  var engines = new WeakMap();
  var sheetCache = {
    store: { promise: null, manifest: null, img: null },
    main: { promise: null, manifest: null, img: null }
  };

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

  function profileManifest(root, profile) {
    if (!root) return null;
    if (profile === 'main' && root.main) {
      return {
        base: root.base || 'hero/ice_dragon/sprite/',
        sheet: root.main.sheet,
        frameWidth: root.main.frameWidth,
        frameHeight: root.main.frameHeight,
        cols: root.main.cols,
        rows: root.main.rows,
        frameCount: root.main.frameCount,
        loopEnd: root.main.loopEnd,
        fps: root.main.fps || root.fps || 12,
        blendFrames: root.main.blendFrames || 0,
        sheetWidth: root.main.sheetWidth,
        sheetHeight: root.main.sheetHeight,
        anchor: root.main.anchor || 'bottom',
        scale: root.scale
      };
    }
    return root;
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

  function getRootManifest() {
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

  function loadAssets(profile, force) {
    var p = profile === 'main' ? 'main' : 'store';
    var cache = sheetCache[p];
    if (cache.promise && !force) return cache.promise;
    cache.promise = getRootManifest().then(function (root) {
      var manifest = profileManifest(root, p);
      if (!manifest || !manifest.sheet) {
        return Promise.reject(new Error('buz-manifest-profile:' + p));
      }
      cache.manifest = manifest;
      var urls = sheetUrlCandidates(manifest);
      return loadSheetFromUrls(urls, 0).then(function (res) {
        cache.img = res.img;
        return manifest;
      });
    });
    return cache.promise;
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
    this.anchorBottom = this.profile === 'main' || manifest.anchor === 'bottom';
    var sc = manifest.scale && manifest.scale[this.profile];
    var def = { store: 1.14, detail: 1.16, main: 1.32 };
    this.scaleMul = (opts && opts.scale) || sc || def[this.profile] || 1.12;
    this.dead = !this.ctx;
    this.running = false;
    this.raf = 0;
    this.resizeObs = null;
    this.lastCw = 0;
    this.lastCh = 0;
    this.fps = manifest.fps || 12;
    this.frameMs = 1000 / this.fps;
    this.frameIndex = 0;
    this.accum = 0;
    this.lastTick = 0;
    this.playFrames = manifest.frameCount || manifest.loopEnd || 36;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
  }

  SpriteEngine.prototype.tick = function () {
    var now = performance.now();
    if (!this.lastTick) this.lastTick = now;
    var delta = now - this.lastTick;
    this.lastTick = now;
    if (delta > this.frameMs * 4) delta = this.frameMs;
    this.accum += delta;
    while (this.accum >= this.frameMs) {
      this.frameIndex += 1;
      if (this.frameIndex >= this.playFrames) this.frameIndex = 0;
      this.accum -= this.frameMs;
    }
  };

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
    this.tick();
    var m = this.manifest;
    if (!m.frameWidth || !m.frameHeight) return;
    var fi = this.frameIndex;
    var r = frameRect(m, fi);
    var ctx = this.ctx;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    var fit = Math.min(cw / m.frameWidth, ch / m.frameHeight);
    var scale = fit * this.scaleMul;
    var dw = m.frameWidth * scale;
    var dh = m.frameHeight * scale;
    if (dw > cw * 0.97 || dh > ch * 0.97) {
      scale = fit;
      dw = m.frameWidth * scale;
      dh = m.frameHeight * scale;
    }
    dw = Math.round(dw);
    dh = Math.round(dh);
    var dx = Math.round((cw - dw) * 0.5);
    var dy = this.anchorBottom ? Math.round(ch - dh) : Math.round((ch - dh) * 0.5);
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

  function startEngine(host, wrap, canvas, manifest, img, opts) {
    var eng = new SpriteEngine(wrap, canvas, manifest, img, opts);
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
      loadAssets(profile, tries > 1).then(function (manifest) {
        if (!document.body.contains(host)) return;
        var p = profile === 'main' ? 'main' : 'store';
        var img = sheetCache[p].img;
        startEngine(host, wrap, canvas, manifest, img, opts);
      }).catch(function (err) {
        console.error('[buz sprite] yüklenemedi. Profil:', profile, 'Deneme:', tries, err);
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
  window.novaBuzEjderPreloadSprite = function () {
    return Promise.all([
      loadAssets('store', false).catch(function () {}),
      loadAssets('main', false).catch(function () {})
    ]);
  };
  window.novaBuzEjderIsSpriteReady = function () {
    return !!(sheetCache.store.img && sheetCache.main.img);
  };

  function bootPreload() {
    try { window.novaBuzEjderPreloadSprite(); } catch (e) {
      console.warn('[buz sprite] preload', e);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPreload);
  } else {
    bootPreload();
  }
})();
