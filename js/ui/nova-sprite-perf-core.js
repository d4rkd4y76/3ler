/* Sprite / mağaza / ana ekran — görünürlük, FPS sınırı, güvenli unmount (boyut değiştirmez). */
(function () {
  'use strict';

  var storeIo = null;
  var observedHosts = new WeakMap();

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

  window.novaSpritePerfInstall = function (Engine) {
    if (!Engine || Engine.__novaPerfInstalled) return;
    Engine.__novaPerfInstalled = true;
    var p = Engine.prototype;

    p.loop = function () {
      if (!this.running) return;
      if (!document.body.contains(this.wrap)) {
        this.stop();
        return;
      }
      if (!window.novaSpritePerfCanAnimate(this.wrap)) {
        this.raf = requestAnimationFrame(this.loop);
        return;
      }
      var now = performance.now();
      var gap = (this.frameMs || 83) * 0.92;
      if (!this._novaLastPaint || now - this._novaLastPaint >= gap) {
        this._novaLastPaint = now;
        if (typeof this.draw === 'function') this.draw();
      }
      this.raf = requestAnimationFrame(this.loop);
    };

    var baseDraw = p.draw;
    if (typeof baseDraw === 'function') {
      p.draw = function () {
        if (this.ctx) {
          try {
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = window.novaSpritePerfIsUltra()
              ? 'medium'
              : 'high';
          } catch (_) {}
        }
        return baseDraw.apply(this, arguments);
      };
    }

    var baseResize = p.resize;
    if (typeof baseResize === 'function') {
      p.resize = function () {
        var ow = this.lastCw;
        var oh = this.lastCh;
        baseResize.apply(this, arguments);
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

  window.novaSpriteDefer = function (fn, timeoutMs) {
    var t = timeoutMs == null ? 2400 : timeoutMs;
    if (typeof fn !== 'function') return;
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(function () { try { fn(); } catch (e) { console.warn('[nova perf defer]', e); } }, { timeout: t });
    } else {
      setTimeout(function () { try { fn(); } catch (e) { console.warn('[nova perf defer]', e); } }, Math.min(t, 1600));
    }
  };

  window.novaSpritePreloadForHero = function (heroId) {
    var id = heroId || window.__novaEquippedHeroId || '';
    var jobs = [];
    if (id === 'star_fairy' && typeof window.novaYildizPerisiPreloadSprite === 'function') {
      jobs.push(window.novaYildizPerisiPreloadSprite());
    }
    if (id === 'firtina_okcu' && typeof window.novaFirtinaOkcuPreloadSprite === 'function') {
      jobs.push(window.novaFirtinaOkcuPreloadSprite());
    }
    if (id === 'tas_muhafiz' && typeof window.novaTasMuhafizPreloadSprite === 'function') {
      jobs.push(window.novaTasMuhafizPreloadSprite());
    }
    if (id && typeof window.novaEpicDragonPreloadSprite === 'function') {
      jobs.push(window.novaEpicDragonPreloadSprite(id));
    }
    return jobs.length ? Promise.all(jobs.map(function (p) { return p.catch(function () {}); })) : Promise.resolve();
  };

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
          } else if (st.mounted) {
            st.mounted = false;
            window.novaSpriteUnmountHost(host, heroId);
          }
        });
      },
      { root: root || null, rootMargin: '100px 0px', threshold: 0.08 }
    );
    return storeIo;
  }

  window.novaStoreLazyMountHero = function (host, heroId, mountFn) {
    if (!host || typeof mountFn !== 'function') return;
    if (!isStoreOpen()) return;

    function run() {
      if (!host.isConnected || !isStoreOpen()) return;
      var rect = host.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) {
        requestAnimationFrame(run);
        return;
      }
      mountFn(host, heroId);
    }

    var io = ensureStoreIo();
    if (!io) {
      requestAnimationFrame(run);
      return;
    }
    observedHosts.set(host, {
      mounted: false,
      mount: function (h) {
        requestAnimationFrame(function () { mountFn(h, heroId); });
      }
    });
    io.observe(host);
    if (isInViewport(host, 80) && isStoreOpen()) {
      var st = observedHosts.get(host);
      if (st && !st.mounted) {
        st.mounted = true;
        st.mount(host, heroId);
      }
    }
  };

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) return;
  });
})();
