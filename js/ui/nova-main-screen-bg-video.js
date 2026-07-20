/* Ana ekran arka plan — sadece FOTO (Bunny Storage). Video/MP4 yok. */
(function () {
  'use strict';

  var CONFIG_PATH = 'platformMeta/mainScreenBgVideo';
  var CONFIG_TTL_MS = 120000;

  var state = {
    config: null,
    configAt: 0,
    currentSrc: '',
    currentMode: '',
    bound: false,
    syncPromise: null,
    prefetchPromise: null,
    prefetchedImageSrc: ''
  };

  function getDatabase() {
    try {
      if (typeof database !== 'undefined' && database) return database;
    } catch (_) {}
    try {
      if (window.database) return window.database;
    } catch (_) {}
    return null;
  }

  function getLayer() {
    return document.getElementById('nova-main-bg-video-layer');
  }

  function getVideo() {
    return document.getElementById('nova-main-bg-video');
  }

  function getImage() {
    return document.getElementById('nova-main-bg-image');
  }

  function getBackdropImage() {
    return document.getElementById('nova-main-bg-image-backdrop');
  }

  function hideVideoElements() {
    var video = getVideo();
    if (video) {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (_) {}
      video.hidden = true;
      video.setAttribute('hidden', '');
    }
    var bdVideo = document.getElementById('nova-main-bg-video-backdrop');
    if (bdVideo) {
      try {
        bdVideo.pause();
        bdVideo.removeAttribute('src');
      } catch (_) {}
      bdVideo.hidden = true;
      bdVideo.setAttribute('hidden', '');
    }
    var wrap = document.getElementById('nova-main-bg-video-iframe-wrap');
    var iframe = document.getElementById('nova-main-bg-video-iframe');
    if (iframe) {
      try {
        iframe.removeAttribute('src');
      } catch (_) {}
    }
    if (wrap) {
      wrap.hidden = true;
      wrap.setAttribute('hidden', '');
      wrap.classList.remove('is-bg-fallback');
    }
  }

  function hideBackgroundImage() {
    var img = getImage();
    if (img) {
      img.hidden = true;
      img.setAttribute('hidden', '');
      img.removeAttribute('src');
    }
    var bd = getBackdropImage();
    if (bd) {
      bd.hidden = true;
      bd.setAttribute('hidden', '');
      bd.removeAttribute('src');
    }
  }

  function syncBackdropImageFrom(img) {
    var bd = getBackdropImage();
    if (!bd || !img || img.hidden || !img.src) {
      if (bd) {
        bd.hidden = true;
        bd.setAttribute('hidden', '');
      }
      return;
    }
    bd.src = img.src;
    bd.hidden = false;
    bd.removeAttribute('hidden');
  }

  function shouldPrepareMainBg() {
    try {
      if (document.documentElement.classList.contains('nova-has-session')) {
        return !!document.getElementById('main-screen');
      }
    } catch (_) {}
    return isMainScreenVisible();
  }

  function isMainScreenVisible() {
    try {
      if (
        document.body.classList.contains('nova-sprite-boot-active') &&
        !document.body.classList.contains('nova-boot-handoff-active')
      ) {
        return false;
      }
    } catch (_) {}
    var main = document.getElementById('main-screen');
    if (!main) return false;
    try {
      var st = window.getComputedStyle(main);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      if (parseFloat(st.opacity || '1') < 0.05) return false;
      return true;
    } catch (_) {
      return main.style.display !== 'none';
    }
  }

  function normalizeLibraryName(name) {
    var n = String(name || '').trim();
    if (!n) return '';
    n = n.replace(/^https?:\/\//i, '');
    n = n.replace(/\.b-cdn\.net.*$/i, '');
    n = n.replace(/\/+$/g, '');
    return n;
  }

  function resolveImageUrl(cfg) {
    if (!cfg) return '';
    var direct = String(cfg.imageUrl || '').trim();
    if (direct) return direct;
    var path = String(cfg.imageAssetPath || '').trim();
    if (!path) return '';
    try {
      if (typeof window.novaCdnAssetUrl === 'function') {
        var asset = window.novaCdnAssetUrl(path);
        if (asset) return asset;
      }
    } catch (_) {}
    if (cfg.libraryName && path) {
      var host = normalizeLibraryName(cfg.libraryName);
      if (host) {
        return 'https://' + host + '.b-cdn.net/' + path.replace(/^\//, '');
      }
    }
    try {
      var base = window.NOVA_CDN && window.NOVA_CDN.base;
      if (base && path) {
        return String(base).replace(/\/+$/, '') + '/' + path.replace(/^\//, '');
      }
    } catch (_) {}
    return '';
  }

  function fetchConfig(force) {
    var now = Date.now();
    if (!force && state.config !== null && now - state.configAt < CONFIG_TTL_MS) {
      return Promise.resolve(state.config);
    }
    var db = getDatabase();
    if (!db) return Promise.resolve(null);
    return db
      .ref(CONFIG_PATH)
      .once('value')
      .then(function (snap) {
        state.config = snap.exists() ? snap.val() || {} : null;
        state.configAt = now;
        return state.config;
      })
      .catch(function () {
        return null;
      });
  }

  function setLayerActive(on) {
    var layer = getLayer();
    if (!layer) return;
    layer.classList.toggle('is-active', !!on);
    document.body.classList.toggle('nova-main-bg-video-on', !!on);
    try {
      window.__novaMainBgPaintReady = !!on;
    } catch (_) {}
    if (on) {
      layer.classList.remove('is-gradient-fallback');
      document.body.classList.remove('nova-main-bg-gradient-fallback');
    }
  }

  function applyGradientFallback() {
    var layer = getLayer();
    hideVideoElements();
    hideBackgroundImage();
    if (layer) {
      layer.classList.add('is-gradient-fallback', 'is-active');
    }
    document.body.classList.add('nova-main-bg-gradient-fallback', 'nova-main-bg-video-on');
    try {
      window.__novaMainBgPaintReady = true;
    } catch (_) {}
    state.currentMode = 'gradient';
    state.currentSrc = '';
  }

  function applyBackgroundImage(src) {
    var img = getImage();
    hideVideoElements();
    if (!img || !src) {
      applyGradientFallback();
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      function show() {
        img.hidden = false;
        img.removeAttribute('hidden');
        state.currentMode = 'image';
        state.currentSrc = src;
        syncBackdropImageFrom(img);
        setLayerActive(true);
        resolve(src);
      }
      if (img.src === src && img.complete && img.naturalWidth > 0) {
        show();
        return;
      }
      img.onload = function () {
        show();
      };
      img.onerror = function () {
        applyGradientFallback();
        resolve();
      };
      try {
        img.fetchPriority = 'high';
      } catch (_) {}
      img.decoding = 'async';
      img.src = src;
      if (img.complete && img.naturalWidth > 0) show();
    });
  }

  function resolvePhotoUrl(cfg) {
    if (!cfg || cfg.show === false) return '';
    var url = resolveImageUrl(cfg);
    if (url) return url;
    /* Eski video kayıtlarında bazen poster/imageUrl ayrı kalır */
    return String(cfg.posterUrl || cfg.thumbnailUrl || '').trim();
  }

  function syncMainBgImage(forceConfig) {
    if (!shouldPrepareMainBg()) {
      return Promise.resolve();
    }
    if (state.syncPromise && !forceConfig) return state.syncPromise;

    state.syncPromise = fetchConfig(!!forceConfig)
      .then(function (cfg) {
        hideVideoElements();
        var url = resolvePhotoUrl(cfg);
        if (!url) {
          applyGradientFallback();
          return;
        }
        if (state.currentSrc === url && state.currentMode === 'image') {
          var img = getImage();
          if (img && img.complete && img.naturalWidth > 0) {
            setLayerActive(true);
            return;
          }
        }
        return applyBackgroundImage(url);
      })
      .catch(function () {
        applyGradientFallback();
      })
      .finally(function () {
        state.syncPromise = null;
      });

    return state.syncPromise;
  }

  function prefetchMainScreenBgMedia() {
    if (state.prefetchPromise) return state.prefetchPromise;
    state.prefetchPromise = fetchConfig(false)
      .then(function (cfg) {
        var url = resolvePhotoUrl(cfg);
        if (!url) return;
        if (state.prefetchedImageSrc === url) return url;
        return new Promise(function (resolve) {
          var probe = new Image();
          probe.decoding = 'async';
          probe.onload = probe.onerror = function () {
            state.prefetchedImageSrc = url;
            resolve(url);
          };
          probe.src = url;
        });
      })
      .catch(function () {})
      .then(function () {
        return true;
      });
    return state.prefetchPromise;
  }

  var syncDebounceTimer = null;
  function scheduleSync(forceConfig) {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(function () {
      syncDebounceTimer = null;
      syncMainBgImage(!!forceConfig);
    }, 40);
  }

  function bindEvents() {
    if (state.bound) return;
    state.bound = true;

    document.addEventListener(
      'nova:main-screen-visible',
      function () {
        scheduleSync(false);
      },
      { passive: true }
    );
    document.addEventListener(
      'nova:sprite-boot-complete',
      function () {
        scheduleSync(false);
      },
      { passive: true }
    );
    document.addEventListener(
      'nova:app-main-ready',
      function () {
        scheduleSync(false);
      },
      { passive: true }
    );

    window.addEventListener(
      'online',
      function () {
        if (shouldPrepareMainBg()) syncMainBgImage(true);
      },
      { passive: true }
    );

    scheduleSync(false);
    setTimeout(function () {
      scheduleSync(false);
    }, 600);
  }

  window.novaSyncMainScreenBgVideo = syncMainBgImage;
  window.novaPrefetchMainScreenBgMedia = prefetchMainScreenBgMedia;
  window.novaFetchMainScreenBgVideoConfig = fetchConfig;
  window.novaPickMainScreenBgPlayback = function (cfg) {
    var url = resolvePhotoUrl(cfg);
    return url ? { mode: 'image', src: url } : null;
  };
  window.novaResolveMainScreenBgImageUrl = resolveImageUrl;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents, { once: true });
  } else {
    bindEvents();
  }
})();
