/* Gece Ejderi — tek kişilik doğru cevap sprite klipleri (Buz Ejderi mantığı) */
(function () {
  'use strict';

  var engines = new WeakMap();
  var sheetCache = {};
  var preloadAllPromise = null;
  var shuffleDeck = [];

  function rootManifest() {
    return window.NOVA_GECE_EJDER_TRUE_MANIFEST || null;
  }

  function scriptBase() {
    if (window.NOVA_GECE_EJDER_TRUE_BASE) return window.NOVA_GECE_EJDER_TRUE_BASE;
    return 'hero/dark_dragon/sprite/true/';
  }

  function getEquippedHeroId() {
    if (typeof window.novaGetEquippedBattleHeroId === 'function') {
      return window.novaGetEquippedBattleHeroId();
    }
    try {
      var s = JSON.parse(localStorage.getItem('selectedStudent') || '{}');
      return String(s.battleHero || '').trim();
    } catch (_) {
      return '';
    }
  }

  function isGeceEquipped() {
    return getEquippedHeroId() === 'gece_ejder';
  }

  function resolveUrl(file) {
    var base = scriptBase();
    if (base.charAt(base.length - 1) !== '/') base += '/';
    var path = base + file;
    if (typeof window.novaResolveAssetUrl === 'function') return window.novaResolveAssetUrl(path);
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function refillShuffleDeck() {
    shuffleDeck = [];
    var root = rootManifest();
    if (!root || !root.clips) return;
    for (var i = 0; i < root.clips.length; i++) {
      shuffleDeck.push(root.clips[i].routine);
    }
    for (var j = shuffleDeck.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = shuffleDeck[j];
      shuffleDeck[j] = shuffleDeck[k];
      shuffleDeck[k] = tmp;
    }
  }

  function pickTrueClipRoutine() {
    if (!shuffleDeck.length) refillShuffleDeck();
    if (!shuffleDeck.length) return 0;
    return shuffleDeck.pop();
  }

  function clipForRoutine(routine) {
    var root = rootManifest();
    if (!root || !root.clips || !root.clips.length) return null;
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

  function preloadAllTrueClips(force) {
    if (!hasTrueClips()) return Promise.resolve(false);
    if (preloadAllPromise && !force) return preloadAllPromise;
    var clips = rootManifest().clips;
    preloadAllPromise = Promise.all(clips.map(function (clip) {
      return loadClipAssets(clip);
    })).then(function () {
      refillShuffleDeck();
      return true;
    }).catch(function () { return false; });
    return preloadAllPromise;
  }

  function preloadTrueClipsIfEquipped(force) {
    if (!isGeceEquipped() || !hasTrueClips()) return Promise.resolve(false);
    return preloadAllTrueClips(force);
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
    this.layoutW = 0;
    this.layoutH = 0;
    this.dest = null;
    this.scaleMul = (rootManifest().scale && rootManifest().scale.sp) || 1;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
  }

  TrueClipEngine.prototype.resize = function () {
    var rect = this.wrap.getBoundingClientRect();
    var parent = this.wrap.parentElement ? this.wrap.parentElement.getBoundingClientRect() : rect;
    var w = Math.max(200, Math.round(rect.width || parent.width || 944));
    var h = Math.max(240, Math.round(rect.height || parent.height || 944));
    if (w === this.layoutW && h === this.layoutH) return;
    this.layoutW = w;
    this.layoutH = h;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(8, Math.round(w * dpr));
    this.canvas.height = Math.max(8, Math.round(h * dpr));
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.updateDestRect();
  };

  TrueClipEngine.prototype.updateDestRect = function () {
    var clip = this.clip;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    var fit = Math.min(cw / clip.frameWidth, ch / clip.frameHeight) * this.scaleMul;
    var dw = clip.frameWidth * fit;
    var dh = clip.frameHeight * fit;
    var lift = ch * 0.16;
    this.dest = {
      dx: (cw - dw) * 0.5,
      dy: Math.max(0, ch - dh - lift),
      dw: dw,
      dh: dh
    };
  };

  TrueClipEngine.prototype.advance = function (delta) {
    if (delta > this.frameMs * 2.5) {
      this.accum = 0;
      return;
    }
    this.accum += delta;
    while (this.accum >= this.frameMs) {
      this.accum -= this.frameMs;
      if (this.frameIndex < this.totalFrames - 1) {
        this.frameIndex += 1;
      } else {
        this.done = true;
        return;
      }
    }
  };

  TrueClipEngine.prototype.draw = function (delta) {
    if (!this.ctx || !this.img || !this.clip || !this.dest) return;
    if (typeof delta === 'number') this.advance(delta);

    var r = frameRect(this.clip, this.frameIndex);
    var d = this.dest;
    var ctx = this.ctx;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, d.dx, d.dy, d.dw, d.dh);
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
    this.frameIndex = 0;
    this.accum = 0;
    this.lastTick = 0;
    this.resize();
    this.draw(0);
    this.raf = requestAnimationFrame(this.loop);
  };

  TrueClipEngine.prototype.stop = function () {
    this.running = false;
    this.done = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  function unmount(host) {
    if (!host) return;
    var eng = engines.get(host);
    if (eng) {
      eng.stop();
      engines.delete(host);
    }
    host.innerHTML = '';
    host.classList.remove('nova-hero-gece-true-ready', 'nova-sp-fx-true-sprite', 'nova-hero-mount--gece-ejder');
  }

  function waitMs(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function mountAndPlay(host, assets) {
    var wrap = document.createElement('div');
    wrap.className = 'nova-hero-gece-true-wrap';
    var canvas = document.createElement('canvas');
    canvas.className = 'nova-hero-gece-true-sprite__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    wrap.appendChild(canvas);
    host.appendChild(wrap);
    host.classList.add('nova-hero-gece-true-ready');

    return new Promise(function (resolve) {
      var eng = new TrueClipEngine(wrap, canvas, assets.clip, assets.img);
      engines.set(host, eng);
      eng.onComplete = function () { resolve(); };
      eng.resize();
      eng.draw(0);
      eng.start();
    });
  }

  function playTrueClip(host, routine) {
    if (!host || !rootManifest()) return waitMs(400);
    var routineId = typeof routine === 'number' ? routine : pickTrueClipRoutine();
    var clipMeta = clipForRoutine(routineId);
    if (!clipMeta) return waitMs(400);

    unmount(host);
    host.classList.add('nova-sp-fx-true-sprite', 'nova-hero-mount--gece-ejder');

    var cached = sheetCache[clipMeta.sheet];
    if (cached && typeof cached.then === 'function') {
      return cached.then(function (assets) {
        if (!document.body.contains(host)) return waitMs(0);
        return mountAndPlay(host, assets);
      });
    }

    return preloadAllTrueClips().then(function () {
      return loadClipAssets(clipMeta);
    }).then(function (assets) {
      if (!document.body.contains(host)) return waitMs(0);
      return mountAndPlay(host, assets);
    }).catch(function (err) {
      console.warn('gece true clip', err);
      return waitMs(300);
    });
  }

  function hasTrueClips() {
    return !!(rootManifest() && rootManifest().clips && rootManifest().clips.length);
  }

  function preloadTrueClips() {
    return preloadTrueClipsIfEquipped(false);
  }

  if (hasTrueClips()) refillShuffleDeck();

  window.novaGeceEjderHasTrueClips = hasTrueClips;
  window.novaGeceEjderPlayTrueClip = playTrueClip;
  window.novaGeceEjderTrueUnmount = unmount;
  window.novaGeceEjderPreloadTrueClips = preloadTrueClips;
  window.novaGeceEjderPreloadTrueClipsIfEquipped = preloadTrueClipsIfEquipped;
  window.novaGeceEjderEnsureTrueClipsReady = preloadAllTrueClips;
  window.novaGeceEjderPickTrueClipRoutine = pickTrueClipRoutine;
})();
