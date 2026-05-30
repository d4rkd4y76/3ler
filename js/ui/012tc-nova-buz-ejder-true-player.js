/* Buz Ejderi — tek kişilik doğru cevap sprite klipleri (tek seferlik oynat) */
(function () {
  'use strict';

  var engines = new WeakMap();
  var sheetCache = {};
  var preloadAllPromise = null;
  var lastTrueRoutine = -1;

  function rootManifest() {
    return window.NOVA_BUZ_EJDER_TRUE_MANIFEST || null;
  }

  function scriptBase() {
    if (window.NOVA_BUZ_EJDER_TRUE_BASE) return window.NOVA_BUZ_EJDER_TRUE_BASE;
    return 'hero/ice_dragon/sprite/true/';
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

  function isBuzEquipped() {
    return getEquippedHeroId() === 'buz_ejder';
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

  function clipCount() {
    var root = rootManifest();
    return root && root.clips ? root.clips.length : 0;
  }

  function clipForRoutine(routine) {
    var root = rootManifest();
    if (!root || !root.clips || !root.clips.length) return null;
    var n = root.clips.length;
    if (typeof routine === 'number' && routine >= 0 && routine < n) {
      for (var i = 0; i < root.clips.length; i++) {
        if (root.clips[i].routine === routine) return root.clips[i];
      }
      return root.clips[routine];
    }
    routine = ((routine == null ? 0 : routine) % n + n) % n;
    for (var j = 0; j < root.clips.length; j++) {
      if (root.clips[j].routine === routine) return root.clips[j];
    }
    return root.clips[routine] || root.clips[0];
  }

  function pickTrueClipRoutine() {
    var n = clipCount();
    if (n < 1) return 0;
    if (n === 1) return rootManifest().clips[0].routine || 0;
    var r;
    var tries = 0;
    do {
      r = Math.floor(Math.random() * n);
      tries += 1;
    } while (r === lastTrueRoutine && tries < 8);
    lastTrueRoutine = r;
    var clip = rootManifest().clips[r];
    return clip && typeof clip.routine === 'number' ? clip.routine : r;
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
    })).then(function () { return true; }).catch(function () { return false; });
    return preloadAllPromise;
  }

  function preloadTrueClipsIfEquipped(force) {
    if (!isBuzEquipped() || !hasTrueClips()) return Promise.resolve(false);
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
    this.fps = clip.fps || 18;
    this.frameMs = 1000 / this.fps;
    this.accum = 0;
    this.lastTick = 0;
    this.onComplete = null;
    this.lastCw = 0;
    this.lastCh = 0;
    this.layoutW = 0;
    this.layoutH = 0;
    this.scaleMul = (rootManifest().scale && rootManifest().scale.sp) || 1;
    this.loop = this.loop.bind(this);
    this.resize = this.resize.bind(this);
  }

  TrueClipEngine.prototype.resize = function () {
    var rect = this.wrap.getBoundingClientRect();
    var parent = this.wrap.parentElement ? this.wrap.parentElement.getBoundingClientRect() : rect;
    var w = Math.max(120, Math.round(rect.width || parent.width || this.wrap.clientWidth || 280));
    var h = Math.max(160, Math.round(rect.height || parent.height || this.wrap.clientHeight || 320));
    if (w < 80 && parent.width > w) w = Math.round(parent.width);
    if (h < 80 && parent.height > h) h = Math.round(parent.height);
    if (w === this.layoutW && h === this.layoutH) return;
    this.layoutW = w;
    this.layoutH = h;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.max(8, Math.round(w * dpr));
    var ch = Math.max(8, Math.round(h * dpr));
    this.lastCw = cw;
    this.lastCh = ch;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
  };

  TrueClipEngine.prototype.advance = function (delta) {
    if (delta > this.frameMs * 2) {
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
        break;
      }
    }
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
    var dx = ((cw - dw) / 2) | 0;
    var dy = (ch - dh) | 0;
    var r = frameRect(clip, this.frameIndex);

    ctx.clearRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
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
    var clipMeta = clipForRoutine(typeof routine === 'number' ? routine : pickTrueClipRoutine());
    if (!clipMeta) return waitMs(680);

    unmount(host);
    host.classList.add('nova-sp-fx-true-sprite', 'nova-hero-mount--buz-ejder');

    var ready = preloadAllTrueClips().then(function () {
      return loadClipAssets(clipMeta);
    });

    return ready.then(function (assets) {
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
    return preloadTrueClipsIfEquipped(false);
  }

  window.novaBuzEjderHasTrueClips = hasTrueClips;
  window.novaBuzEjderPlayTrueClip = playTrueClip;
  window.novaBuzEjderTrueUnmount = unmount;
  window.novaBuzEjderPreloadTrueClips = preloadTrueClips;
  window.novaBuzEjderPreloadTrueClipsIfEquipped = preloadTrueClipsIfEquipped;
  window.novaBuzEjderEnsureTrueClipsReady = preloadAllTrueClips;
  window.novaBuzEjderPickTrueClipRoutine = pickTrueClipRoutine;
})();
