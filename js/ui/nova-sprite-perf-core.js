/* Sprite / mağaza / ana ekran — global RAF, ön yükleme, görünürlük, güvenli unmount. */
(function () {
  'use strict';

  var storeIo = null;
  var observedHosts = new WeakMap();
  var globalRegistry = new Set();
  var globalRaf = 0;
  var globalLoopRunning = false;

  var STORE_HERO_IDS = [
    'star_fairy',
    'firtina_okcu',
    'tas_muhafiz',
    'golge_parsi',
    'bilge_baykus',
    'buz_ejder',
    'alev_ejder',
    'gece_ejder'
  ];

  var PRELOAD_FN = {
    star_fairy: 'novaYildizPerisiPreloadSprite',
    firtina_okcu: 'novaFirtinaOkcuPreloadSprite',
    tas_muhafiz: 'novaTasMuhafizPreloadSprite',
    golge_parsi: 'novaGolgeParsiPreloadSprite',
    bilge_baykus: 'novaBilgeBaykusPreloadSprite',
    buz_ejder: 'novaBuzEjderPreloadSprite',
    alev_ejder: 'novaAlevEjderPreloadSprite',
    gece_ejder: 'novaGeceEjderPreloadSprite'
  };

  function isPhoneDevice() {
    try {
      if (window.matchMedia) {
        return window.matchMedia('(max-width: 768px), (max-width: 1024px) and (hover: none) and (pointer: coarse)').matches;
      }
    } catch (_) {}
    return (window.innerWidth || 0) <= 768;
  }

  window.novaSpritePerfIsPhone = isPhoneDevice;

  /**
   * KAHRAMAN sekmesi — her kahraman için ayrı telefon / masaüstü sığdırma.
   * scale: fit * scale (1.0 = kenara değmeden sığ, >1 hafif doldurur)
   * ox/oy: host CSS translate yüzdesi (kesilmeden ince ayar)
   */
  var KAHRAMAN_LAYOUT = {
    star_fairy: {
      phone: { scale: 1.2, maxFill: 1.08, oy: '2%', ox: '0%' },
      desk: { scale: 1.08, maxFill: 1.04, oy: '0%', ox: '0%' }
    },
    tas_muhafiz: {
      phone: { scale: 1.16, maxFill: 1.07, oy: '5%', ox: '0%' },
      desk: { scale: 1.06, maxFill: 1.03, oy: '2%', ox: '0%' }
    },
    golge_parsi: {
      phone: { scale: 1.26, maxFill: 1.1, oy: '-1%', ox: '0%' },
      desk: { scale: 1.12, maxFill: 1.05, oy: '0%', ox: '0%' }
    },
    bilge_baykus: {
      phone: { scale: 1.24, maxFill: 1.09, oy: '3%', ox: '0%' },
      desk: { scale: 1.1, maxFill: 1.04, oy: '1%', ox: '0%' }
    },
    firtina_okcu: {
      phone: { scale: 1.18, maxFill: 1.08, oy: '4%', ox: '0%' },
      desk: { scale: 1.07, maxFill: 1.04, oy: '2%', ox: '0%' }
    },
    buz_ejder: {
      phone: { scale: 1.22, maxFill: 1.09, oy: '2%', ox: '0%' },
      desk: { scale: 1.1, maxFill: 1.05, oy: '1%', ox: '0%' }
    },
    alev_ejder: {
      phone: { scale: 1.22, maxFill: 1.09, oy: '2%', ox: '0%' },
      desk: { scale: 1.1, maxFill: 1.05, oy: '1%', ox: '0%' }
    },
    gece_ejder: {
      phone: { scale: 1.22, maxFill: 1.09, oy: '2%', ox: '0%' },
      desk: { scale: 1.1, maxFill: 1.05, oy: '1%', ox: '0%' }
    }
  };

  function resolveKahramanHeroId(eng) {
    try {
      var wrap = eng && eng.wrap;
      if (!wrap) return '';
      if (wrap.getAttribute && wrap.getAttribute('data-nova-main-hero')) {
        return String(wrap.getAttribute('data-nova-main-hero') || '').trim();
      }
      var host = wrap.closest ? wrap.closest('[data-nova-main-hero]') : null;
      if (host) return String(host.getAttribute('data-nova-main-hero') || '').trim();
      var slot = wrap.closest ? wrap.closest('#nova-main-hero-slot, [class*="nova-main-hero-slot--"]') : null;
      if (slot) {
        var h2 = slot.querySelector('[data-nova-main-hero]');
        if (h2) return String(h2.getAttribute('data-nova-main-hero') || '').trim();
      }
    } catch (_) {}
    try {
      return String(window.__novaEquippedHeroId || '').trim();
    } catch (_) {
      return '';
    }
  }

  function resolveKahramanLayout(eng) {
    var phone =
      (typeof window.novaSpritePerfIsPhone === 'function' && window.novaSpritePerfIsPhone()) ||
      (window.innerWidth || 0) <= 900;
    var id = resolveKahramanHeroId(eng);
    var pack = KAHRAMAN_LAYOUT[id] || null;
    var cfg = pack ? (phone ? pack.phone : pack.desk) : null;
    if (!cfg) {
      cfg = phone
        ? { scale: 1.2, maxFill: 1.08, oy: '2%', ox: '0%' }
        : { scale: 1.08, maxFill: 1.04, oy: '0%', ox: '0%' };
    }
    return {
      heroId: id,
      phone: phone,
      scale: cfg.scale,
      maxFill: cfg.maxFill,
      oy: cfg.oy || '0%',
      ox: cfg.ox || '0%',
      anchorBottom: false
    };
  }

  function applyKahramanHostNudge(eng, layout) {
    try {
      var wrap = eng && eng.wrap;
      if (!wrap) return;
      var host =
        (wrap.getAttribute && wrap.getAttribute('data-nova-main-hero') && wrap) ||
        (wrap.closest && wrap.closest('[data-nova-main-hero]')) ||
        wrap;
      if (!host || !host.style) return;
      var ox = layout.ox || '0%';
      var oy = layout.oy || '0%';
      host.style.transform = 'translate3d(' + ox + ', ' + oy + ', 0)';
      host.style.transformOrigin = 'center center';
      host.dataset.novaKahramanNudge = '1';
    } catch (_) {}
  }

  function isVisibleEl(el) {
    if (!el || !el.isConnected) return false;
    try {
      var st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) < 0.02) return false;
      var r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    } catch (_) {
      return false;
    }
  }

  function isMainScreenVisible() {
    var main = document.getElementById('main-screen');
    if (!main) return false;
    return isVisibleEl(main);
  }

  function isStoreOpen() {
    var ov = document.getElementById('profileChangeOverlay');
    if (!ov) return false;
    return isVisibleEl(ov);
  }

  function hostRoot(wrap) {
    if (!wrap) return null;
    return wrap.closest(
      '[data-nova-hero-host], [data-nova-main-hero], .nova-main-hero-host, #nova-main-hero-slot'
    ) || wrap;
  }

  function isInViewport(el, margin) {
    var m = margin == null ? 96 : margin;
    var r = el.getBoundingClientRect();
    var h = window.innerHeight || 0;
    var w = window.innerWidth || 0;
    return r.bottom > -m && r.top < h + m && r.right > -m && r.left < w + m;
  }

  window.novaSpritePerfIsPhone = isPhoneDevice;

  window.novaSpritePerfGetDpr = function (wrap, profile) {
    var p = profile || 'store';
    var ultra = window.novaSpritePerfIsUltra && window.novaSpritePerfIsUltra();
    var inStore = wrap && wrap.closest && wrap.closest('#profileChangeOverlay, #nova-store-detail-overlay');
    var inMain = wrap && wrap.closest && wrap.closest('#main-screen, .nova-main-hero-host');
    if (inMain || p === 'main' || p === 'detail') {
      if (ultra && isPhoneDevice()) return Math.min(window.devicePixelRatio || 1, 1.5);
      return Math.min(window.devicePixelRatio || 1, isPhoneDevice() ? 1.75 : 2);
    }
    if (inStore || p === 'store') {
      if (ultra && isPhoneDevice()) return Math.min(window.devicePixelRatio || 1, 1.2);
      return Math.min(window.devicePixelRatio || 1, isPhoneDevice() ? 1.35 : 1.85);
    }
    return Math.min(window.devicePixelRatio || 1, 2);
  };

  window.novaSpritePerfCanAnimate = function (wrap) {
    if (document.hidden) return false;
    if (!wrap || !wrap.isConnected) return false;
    var root = hostRoot(wrap);
    if (!root || !isInViewport(root, 120)) return false;

    if (root.closest('#main-screen') || root.classList.contains('nova-main-hero-host')) {
      return isMainScreenVisible();
    }
    if (root.closest('#profileChangeOverlay')) {
      return isStoreOpen();
    }
    if (root.closest('#nova-store-detail-overlay')) {
      var det = document.getElementById('nova-store-detail-overlay');
      return det && det.classList.contains('is-open');
    }
    if (root.closest('#single-player-screen, #duel-game-screen, .nova-sp-hero-arena')) {
      return isVisibleEl(root.closest('#single-player-screen, #duel-game-screen') || root);
    }
    return true;
  };

  window.novaSpritePerfIsUltra = function () {
    try {
      return (window.__novaPerfMode || '') === 'ultra';
    } catch (_) {
      return false;
    }
  };

  function bootVideoBlocksSprites() {
    try {
      if (window.__novaBootMainPrep === true) return false;
      return (
        window.__novaBootVideoPhase === true &&
        isPhoneDevice() &&
        document.body.classList.contains('nova-sprite-boot-active')
      );
    } catch (_) {
      return false;
    }
  }

  function globalAnimationLoop(now) {
    globalRaf = requestAnimationFrame(globalAnimationLoop);
    if (!globalRegistry.size) {
      globalLoopRunning = false;
      globalRaf = 0;
      return;
    }
    if (bootVideoBlocksSprites()) return;
    var t = now || performance.now();
    globalRegistry.forEach(function (eng) {
      if (!eng.running) return;
      if (!document.body.contains(eng.wrap)) {
        eng.stop();
        return;
      }
      if (!window.novaSpritePerfCanAnimate(eng.wrap)) return;

      if (typeof eng._novaPerfTick === 'function') eng._novaPerfTick(t);

      var gap = (eng.frameMs || 83) * (window.novaSpritePerfIsUltra() && isPhoneDevice() ? 0.98 : 0.92);
      if (!eng._novaLastPaint || t - eng._novaLastPaint >= gap) {
        eng._novaLastPaint = t;
        eng._novaTickPaused = true;
        try {
          if (typeof eng.draw === 'function') eng.draw();
        } catch (_) {}
        eng._novaTickPaused = false;
      }
    });
  }

  function ensureGlobalLoop() {
    if (globalLoopRunning) return;
    globalLoopRunning = true;
    globalRaf = requestAnimationFrame(globalAnimationLoop);
  }

  function registerEngine(eng) {
    globalRegistry.add(eng);
    ensureGlobalLoop();
  }

  function unregisterEngine(eng) {
    globalRegistry.delete(eng);
  }

  window.novaSpritePerfInstall = function (Engine) {
    if (!Engine || Engine.__novaPerfInstalled) return;
    Engine.__novaPerfInstalled = true;
    var p = Engine.prototype;

    p._novaPerfTick = function (now) {
      if (this._novaTickPaused) return;
      if (!this.lastTick) this.lastTick = now;
      var delta = now - this.lastTick;
      this.lastTick = now;
      var frameMs = this.frameMs || 83;
      var maxDelta = frameMs * 10;
      if (delta > maxDelta) delta = maxDelta;
      this.accum = (this.accum || 0) + delta;
      var cap = 8;
      while (this.accum >= frameMs && cap-- > 0) {
        this.accum -= frameMs;
        this.frameIndex += 1;
        if (this.frameIndex >= this.playFrames) this.frameIndex = 0;
      }
    };

    var baseTick = p.tick;
    if (typeof baseTick === 'function') {
      p.tick = function () {
        if (this._novaTickPaused) return;
        return this._novaPerfTick(performance.now());
      };
    }

    var baseStart = p.start;
    p.start = function () {
      if (this.dead || this.running) return;
      this.running = true;
      registerEngine(this);
      if (typeof baseStart === 'function') {
        var self = this;
        var origLoop = this.loop;
        this.loop = function () {};
        try {
          baseStart.call(this);
        } finally {
          this.loop = origLoop;
          if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = 0;
          }
        }
      }
    };

    var baseStop = p.stop;
    p.stop = function () {
      this.running = false;
      unregisterEngine(this);
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
      if (typeof baseStop === 'function') baseStop.call(this);
    };

    p.loop = function () {
      if (!this.running) return;
      ensureGlobalLoop();
    };

    var baseComputeDrawScale = p.computeDrawScale;
    if (typeof baseComputeDrawScale === 'function') {
      p.computeDrawScale = function () {
        if (this._novaKahramanFitActive && this.manifest && this.canvas) {
          var m = this.manifest;
          var cw = this.canvas.width;
          var ch = this.canvas.height;
          if (!m.frameWidth || !m.frameHeight || !cw || !ch) {
            return baseComputeDrawScale.apply(this, arguments);
          }
          var fit = Math.min(cw / m.frameWidth, ch / m.frameHeight);
          var mul = typeof this.scaleMul === 'number' && this.scaleMul > 0 ? this.scaleMul : 1;
          var maxFill = typeof this._novaKahramanMaxFill === 'number' ? this._novaKahramanMaxFill : 1.06;
          var scale = fit * mul;
          var maxScale = Math.min(cw / m.frameWidth, ch / m.frameHeight) * maxFill;
          if (scale > maxScale) scale = maxScale;
          return scale;
        }
        return baseComputeDrawScale.apply(this, arguments);
      };
    }

    var baseDraw = p.draw;
    if (typeof baseDraw === 'function') {
      p.draw = function () {
        var wasPaused = this._novaTickPaused;
        if (!wasPaused && typeof this._novaPerfTick === 'function') {
          this._novaPerfTick(performance.now());
        }
        this._novaTickPaused = true;
        if (this.ctx) {
          try {
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = window.novaSpritePerfIsUltra()
              ? 'medium'
              : 'high';
          } catch (_) {}
        }
        var prevAnchor = this.anchorBottom;
        var prevScale = this.scaleMul;
        var prevDrawScale = this.drawScale;
        var prevFit = this._novaKahramanFitActive;
        var prevMaxFill = this._novaKahramanMaxFill;
        var inKahramanFrame =
          this.wrap &&
          this.wrap.closest &&
          this.wrap.closest('.nova-main-tab-hero-body .nova-main-hero-showcase');

        if (inKahramanFrame) {
          var layout = resolveKahramanLayout(this);
          this._novaKahramanFitActive = true;
          this._novaKahramanMaxFill = layout.maxFill;
          this.anchorBottom = !!layout.anchorBottom;
          this.scaleMul = layout.scale;
          /* Her karede yeniden ölç — sabit küçük drawScale kullanma */
          this.drawScale = 0;
          applyKahramanHostNudge(this, layout);
        } else {
          this._novaKahramanFitActive = false;
        }

        try {
          return baseDraw.apply(this, arguments);
        } finally {
          this.anchorBottom = prevAnchor;
          this.scaleMul = prevScale;
          this.drawScale = inKahramanFrame ? 0 : prevDrawScale;
          this._novaKahramanFitActive = prevFit;
          this._novaKahramanMaxFill = prevMaxFill;
          this._novaTickPaused = wasPaused;
        }
      };
    }

    var baseResize = p.resize;
    if (typeof baseResize === 'function') {
      p.resize = function () {
        var ow = this.lastCw;
        var oh = this.lastCh;
        var wrap = this.wrap;
        var profile = this.profile || 'store';
        var rect = wrap ? wrap.getBoundingClientRect() : null;
        var w = rect ? Math.max(40, Math.round(rect.width || 0)) : 0;
        var h = rect ? Math.max(40, Math.round(rect.height || 0)) : 0;
        if (w && h && typeof window.novaSpritePerfGetDpr === 'function') {
          this._novaPerfDpr = window.novaSpritePerfGetDpr(wrap, profile);
        }
        baseResize.apply(this, arguments);
        if (this._novaPerfDpr && wrap && w && h) {
          var dpr = this._novaPerfDpr;
          var cw = Math.max(4, Math.round(w * dpr));
          var ch = Math.max(4, Math.round(h * dpr));
          if (cw !== this.lastCw || ch !== this.lastCh) {
            this.lastCw = cw;
            this.lastCh = ch;
            this.canvas.width = cw;
            this.canvas.height = ch;
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
            this._novaLastPaint = 0;
          }
        }
        if (this.lastCw !== ow || this.lastCh !== oh) {
          this._novaLastPaint = 0;
        }
      };
    }
  };

  var UNMOUNT_BY_HERO = {
    star_fairy: ['novaYildizPerisiUnmountSprite', 'novaYildizPerisiUnmountVitrinVideo'],
    firtina_okcu: ['novaFirtinaOkcuUnmountSprite', 'novaFirtinaOkcuUnmountVitrinVideo'],
    tas_muhafiz: ['novaTasMuhafizUnmountSprite', 'novaTasMuhafizUnmountVitrinVideo'],
    golge_parsi: ['novaGolgeParsiUnmountSprite', 'novaGolgeParsiUnmountVitrinVideo'],
    bilge_baykus: ['novaBilgeBaykusUnmountSprite', 'novaBilgeBaykusUnmountVitrinVideo'],
    buz_ejder: ['novaBuzEjderUnmountSprite', 'novaEpicDragonUnmountSprite'],
    alev_ejder: ['novaAlevEjderUnmountSprite', 'novaEpicDragonUnmountSprite'],
    gece_ejder: ['novaGeceEjderUnmountSprite', 'novaEpicDragonUnmountSprite']
  };

  window.novaSpriteUnmountHost = function (host, heroId) {
    if (!host) return;
    try {
      host.querySelectorAll('canvas').forEach(function (c) {
        var p = c.parentElement;
        if (p && p.className && String(p.className).indexOf('sprite') >= 0) {
          p.remove();
        }
      });
    } catch (_) {}
    var id = heroId || host.getAttribute('data-hero-id') || host.getAttribute('data-nova-main-hero') || '';
    var names = UNMOUNT_BY_HERO[id] || [];
    names.forEach(function (fn) {
      if (typeof window[fn] === 'function') {
        try { window[fn](host); } catch (_) {}
      }
    });
    if (id === 'buz_ejder' && typeof window.novaBuzEjderUnmountWebGL === 'function') {
      try { window.novaBuzEjderUnmountWebGL(host); } catch (_) {}
    }
    if (typeof window.novaEpicDragonUnmountSprite === 'function' && id.indexOf('_ejder') > 0) {
      try { window.novaEpicDragonUnmountSprite(host, id); } catch (_) {}
    }
    try { host.innerHTML = ''; } catch (_) {}
  };

  window.novaSpriteUnmountContainer = function (container) {
    if (!container) return;
    container.querySelectorAll('[data-nova-hero-host], [data-nova-main-hero]').forEach(function (host) {
      window.novaSpriteUnmountHost(host, host.getAttribute('data-hero-id') || host.getAttribute('data-nova-main-hero'));
    });
    try { container.innerHTML = ''; } catch (_) {}
  };

  var deferQueue = [];

  window.novaSpriteDefer = function (fn, timeoutMs) {
    if (window.__novaSpriteBootManaged && !window.__novaSpriteBootDone) {
      if (typeof fn === 'function') deferQueue.push(fn);
      return;
    }
    var t = timeoutMs == null ? 2400 : timeoutMs;
    if (typeof fn !== 'function') return;
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(function () { try { fn(); } catch (e) { console.warn('[nova perf defer]', e); } }, { timeout: t });
    } else {
      setTimeout(function () { try { fn(); } catch (e) { console.warn('[nova perf defer]', e); } }, Math.min(t, 1600));
    }
  };

  function flushDeferQueue() {
    var q = deferQueue.splice(0, deferQueue.length);
    q.forEach(function (fn) {
      try { fn(); } catch (e) { console.warn('[nova perf defer flush]', e); }
    });
  }

  window.novaSpritePreloadForHero = function (heroId) {
    var id = heroId || window.__novaEquippedHeroId || '';
    var fn = PRELOAD_FN[id];
    if (fn && typeof window[fn] === 'function') {
      return window[fn]().catch(function () {});
    }
    return Promise.resolve();
  };

  window.novaEpicDragonPreloadSprite = function (heroId) {
    return window.novaSpritePreloadForHero(heroId);
  };

  var preloadAllPromise = null;

  window.novaSpritePreloadAll = function (onProgress) {
    if (preloadAllPromise && !window.__novaSpriteForcePreload) return preloadAllPromise;

    var total = STORE_HERO_IDS.length;
    var done = 0;

    function report() {
      if (typeof onProgress === 'function') {
        try { onProgress(Math.min(1, done / total), done, total); } catch (_) {}
      }
    }

    preloadAllPromise = Promise.all(
      STORE_HERO_IDS.map(function (id) {
        var fnName = PRELOAD_FN[id];
        var p =
          fnName && typeof window[fnName] === 'function'
            ? Promise.resolve(window[fnName]())
            : Promise.resolve();
        return p
          .catch(function () {})
          .then(function () {
            done += 1;
            report();
          });
      })
    ).then(function () {
      window.__novaSpriteAssetsReady = true;
      try {
        document.dispatchEvent(new CustomEvent('nova:sprite-assets-ready'));
      } catch (_) {}
      return true;
    });

    report();
    return preloadAllPromise;
  };

  window.novaSpritePreloadHero = function (heroId) {
    var fnName = PRELOAD_FN[heroId];
    if (fnName && typeof window[fnName] === 'function') {
      return Promise.resolve(window[fnName]()).catch(function () {});
    }
    return Promise.resolve();
  };

  window.novaSpriteBootFlushDefer = flushDeferQueue;

  window.novaSpriteRefreshMainHeroCanvases = function () {
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return;
    globalRegistry.forEach(function (eng) {
      if (!eng || !eng.wrap || !eng.canvas) return;
      if (!slot.contains(eng.wrap)) return;
      eng.lastCw = 0;
      eng.lastCh = 0;
      eng.drawScale = 0;
      try {
        if (typeof eng.resize === 'function') eng.resize();
        if (typeof eng.draw === 'function') eng.draw();
      } catch (_) {}
    });
  };

  function refreshMainHeroWhenVisible() {
    if (!isMainScreenVisible()) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.novaSpriteRefreshMainHeroCanvases();
        if (typeof window.novaRefreshMainScreenHero === 'function') {
          window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
        }
      });
    });
  }

  document.addEventListener('nova:sprite-boot-complete', refreshMainHeroWhenVisible, { passive: true });
  document.addEventListener('nova:main-screen-visible', refreshMainHeroWhenVisible, { passive: true });

  function storeIoMargin() {
    return isPhoneDevice() ? '48px 0px' : '72px 0px';
  }

  window.novaStoreShouldEagerMount = function () {
    try {
      return window.novaSpritePerfIsUltra && window.novaSpritePerfIsUltra();
    } catch (_) {
      return false;
    }
  };

  function storeHostHasLivePreview(host) {
    if (!host) return false;
    var c = host.querySelector('canvas');
    return !!(c && c.width > 8 && c.height > 8);
  }

  function ensureStoreIo() {
    if (storeIo || typeof IntersectionObserver === 'undefined') return storeIo;
    var root = document.getElementById('profilePhotosContainer');
    storeIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          var host = en.target;
          var heroId = host.getAttribute('data-hero-id') || '';
          var st = observedHosts.get(host);
          if (!st) return;
          if (en.isIntersecting) {
            if (!st.mounted && typeof st.mount === 'function' && isStoreOpen()) {
              st.mounted = true;
              st.mount(host, heroId);
            }
          } else if (st.mounted && !st.keepMounted) {
            st.mounted = false;
            window.novaSpriteUnmountHost(host, heroId);
          }
        });
      },
      { root: root || null, rootMargin: storeIoMargin(), threshold: 0.12 }
    );
    return storeIo;
  }

  function registerStoreHost(host, heroId, mountFn) {
    observedHosts.set(host, {
      mounted: false,
      keepMounted: true,
      mount: function (h) {
        if (storeHostHasLivePreview(h)) {
          return;
        }
        requestAnimationFrame(function () {
          if (!h.isConnected || !isStoreOpen()) return;
          mountFn(h, heroId);
        });
      }
    });
  }

  window.novaStoreLazyMountHero = function (host, heroId, mountFn) {
    if (!host || typeof mountFn !== 'function') return;
    if (!isStoreOpen()) return;

    registerStoreHost(host, heroId, mountFn);

    if (window.novaStoreShouldEagerMount()) {
      var stEager = observedHosts.get(host);
      if (stEager && !stEager.mounted) {
        stEager.mounted = true;
        stEager.mount(host, heroId);
      }
      return;
    }

    var io = ensureStoreIo();
    if (!io) {
      var stDirect = observedHosts.get(host);
      if (stDirect && !stDirect.mounted) {
        stDirect.mounted = true;
        stDirect.mount(host, heroId);
      }
      return;
    }
    io.observe(host);
    if (isInViewport(host, 60) && isStoreOpen()) {
      var st = observedHosts.get(host);
      if (st && !st.mounted) {
        st.mounted = true;
        st.mount(host, heroId);
      }
    }
  };

  window.novaStoreMountAllHeroCards = function (container) {
    if (!isStoreOpen()) return;
    var root = container || document.getElementById('profilePhotosContainer');
    if (!root) return;
    var eager = window.novaStoreShouldEagerMount();
    root.querySelectorAll('[data-nova-hero-host]').forEach(function (host) {
      var st = observedHosts.get(host);
      if (!st || st.mounted) return;
      if (eager || isInViewport(host, 96)) {
        st.mounted = true;
        st.mount(host, host.getAttribute('data-hero-id') || '');
      }
    });
  };

  window.novaStoreMountPendingHeroes = function () {
    if (!isStoreOpen()) return;
    window.novaStoreMountAllHeroCards();
  };

  window.novaStoreRemountVisibleHeroes = function () {
    window.novaStoreMountPendingHeroes();
  };

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) ensureGlobalLoop();
  });

  document.addEventListener('nova:sprite-assets-ready', function () {
    if (isStoreOpen()) {
      requestAnimationFrame(function () {
        try {
          window.novaStoreMountPendingHeroes();
        } catch (_) {}
      });
    }
  });

  var cdnSpriteRetryTimer = 0;

  function remountVisibleSpriteHosts() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          window.novaSpriteRefreshMainHeroCanvases();
        } catch (_) {}
        try {
          if (typeof window.novaRefreshMainScreenHero === 'function') {
            window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
          }
        } catch (_) {}
        try {
          window.novaStoreMountPendingHeroes();
        } catch (_) {}
        try {
          window.novaStoreRemountVisibleHeroes();
        } catch (_) {}
      });
    });
  }

  function retrySpritesAfterCdnReady() {
    if (typeof window.novaCdnIsEnabled !== 'function' || !window.novaCdnIsEnabled()) return;
    clearTimeout(cdnSpriteRetryTimer);
    cdnSpriteRetryTimer = setTimeout(function () {
      window.__novaSpriteForcePreload = true;
      preloadAllPromise = null;
      if (typeof window.novaSpritePreloadAll !== 'function') {
        remountVisibleSpriteHosts();
        return;
      }
      window
        .novaSpritePreloadAll()
        .catch(function () {})
        .finally(function () {
          window.__novaSpriteForcePreload = false;
          try {
            var clipFns = [
              'novaYildizPerisiEnsureTrueClipsReady',
              'novaFirtinaOkcuEnsureTrueClipsReady',
              'novaTasMuhafizEnsureTrueClipsReady',
              'novaGolgeParsiEnsureTrueClipsReady',
              'novaBilgeBaykusEnsureTrueClipsReady',
              'novaBuzEjderEnsureTrueClipsReady',
              'novaAlevEjderEnsureTrueClipsReady',
              'novaGeceEjderEnsureTrueClipsReady'
            ];
            clipFns.forEach(function (fnName) {
              if (typeof window[fnName] === 'function') {
                window[fnName](true).catch(function () {});
              }
            });
          } catch (_) {}
          remountVisibleSpriteHosts();
        });
    }, 40);
  }

  window.addEventListener('nova-cdn-ready', retrySpritesAfterCdnReady);

  document.addEventListener('nova:main-tab-activate', function (e) {
    var tab = e && e.detail && e.detail.tab;
    if (tab !== 'kahraman') return;
    remountVisibleSpriteHosts();
  });
})();
