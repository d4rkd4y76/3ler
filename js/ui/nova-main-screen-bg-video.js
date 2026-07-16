/* Ana ekran arka plan — Bunny MP4 döngü (sessiz, otomatik); masaüstü + mobil */
(function () {
  'use strict';

  var CONFIG_PATH = 'platformMeta/mainScreenBgVideo';
  var CONFIG_TTL_MS = 120000;
  var PLAY_RETRY_MS = 400;
  var PLAY_RETRY_MAX_MS = 20000;
  var NETWORK_RETRY_MS = 22000;

  var state = {
    config: null,
    configAt: 0,
    currentSrc: '',
    currentMode: '',
    bound: false,
    playRetryTimer: null,
    unlockBound: false,
    blobUrl: '',
    videoBlobCache: {},
    prefetchedVideo: null,
    prefetchPromise: null,
    prefetchedImageSrc: '',
    networkRetryTimer: null,
    networkRetryBound: false
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

  function getBackdropVideo() {
    return document.getElementById('nova-main-bg-video-backdrop');
  }

  function getBackdropImage() {
    return document.getElementById('nova-main-bg-image-backdrop');
  }

  function hideBackdropMedia() {
    var bdVideo = getBackdropVideo();
    var bdImage = getBackdropImage();
    if (bdVideo) {
      try {
        bdVideo.pause();
      } catch (_) {}
      bdVideo.hidden = true;
      bdVideo.setAttribute('hidden', '');
      bdVideo.removeAttribute('src');
    }
    if (bdImage) {
      bdImage.hidden = true;
      bdImage.setAttribute('hidden', '');
      bdImage.removeAttribute('src');
    }
  }

  function syncBackdropImageFrom(img) {
    var bd = getBackdropImage();
    if (!bd || !img || img.hidden || !img.src) {
      var bdImgOnly = getBackdropImage();
      if (bdImgOnly) {
        bdImgOnly.hidden = true;
        bdImgOnly.setAttribute('hidden', '');
      }
      return;
    }
    bd.src = img.src;
    bd.hidden = false;
    bd.removeAttribute('hidden');
  }

  function syncBackdropVideoFrom(video) {
    var bd = getBackdropVideo();
    if (!bd || !video || video.hidden || !video.src) {
      if (bd) {
        try {
          bd.pause();
        } catch (_) {}
        bd.hidden = true;
        bd.setAttribute('hidden', '');
      }
      return;
    }
    prepareVideoElement(bd);
    bindSilentGuards(bd);
    if (bd.src !== video.src) {
      bd.src = video.src;
      try {
        bd.load();
      } catch (_) {}
    }
    bd.hidden = false;
    bd.removeAttribute('hidden');
    try {
      var playPromise = bd.play();
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(function () {});
    } catch (_) {}
  }

  function revokeBlobUrl() {
    if (!state.blobUrl) return;
    try {
      URL.revokeObjectURL(state.blobUrl);
    } catch (_) {}
    state.blobUrl = '';
  }

  function hideIframeLayer() {
    var wrap = document.getElementById('nova-main-bg-video-iframe-wrap');
    var iframe = document.getElementById('nova-main-bg-video-iframe');
    if (wrap) {
      wrap.hidden = true;
      wrap.setAttribute('hidden', '');
      wrap.classList.remove('is-bg-fallback');
    }
    if (iframe) {
      try {
        iframe.removeAttribute('src');
      } catch (_) {}
    }
  }

  function isMainScreenVisible() {
    try {
      if (
        document.body.classList.contains('nova-sprite-boot-active') &&
        !document.body.classList.contains('nova-boot-handoff-active')
      ) {
        return false;
      }
      if (
        document.documentElement.classList.contains('nova-boot-pending') &&
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

  function hostFromCdnBase(url) {
    var m = String(url || '').match(/https?:\/\/([a-z0-9][a-z0-9-]*)\.b-cdn\.net/i);
    return m && m[1] ? m[1] : '';
  }

  function isUsableLibraryHost(host) {
    if (!host) return false;
    if (/^vz[-_]?x{4,}$/i.test(host)) return false;
    if (host.toLowerCase() === 'vz-xxxxxxxx') return false;
    return host.length >= 8;
  }

  function resolveBunnyPullZoneHost(cfg) {
    var host = normalizeLibraryName(cfg && cfg.libraryName);
    if (isUsableLibraryHost(host)) return host;
    host = hostFromCdnBase(window.NOVA_CDN && window.NOVA_CDN.base);
    if (isUsableLibraryHost(host)) return host;
    if (cfg) {
      host = normalizeLibraryName(
        cfg.bunnyPullZone || cfg.pullZone || cfg.streamHost || cfg.cdnHost || ''
      );
      if (isUsableLibraryHost(host)) return host;
    }
    return '';
  }

  function buildBunnyMp4Candidates(host, videoId) {
    var base = 'https://' + host + '.b-cdn.net/' + videoId + '/';
    return [
      base + 'play_480p.mp4',
      base + 'play_360p.mp4',
      base + 'play_720p.mp4',
      base + 'play_240p.mp4',
      base + 'play_1080p.mp4',
      base + 'original.mp4',
      base + 'play.mp4'
    ];
  }

  function buildBunnyEmbedBgUrl(libraryId, videoId) {
    return (
      'https://player.mediadelivery.net/embed/' +
      libraryId +
      '/' +
      videoId +
      '?autoplay=true&loop=true&muted=true&preload=true&playsinline=true&responsive=true&rememberPosition=false'
    );
  }

  function ensurePullZoneHost(cfg) {
    var host = resolveBunnyPullZoneHost(cfg);
    if (host) return Promise.resolve(host);
    var db = getDatabase();
    if (!db) return Promise.resolve('');
    return db
      .ref('platformMeta/cdn')
      .once('value')
      .then(function (snap) {
        if (snap.exists()) {
          try {
            if (typeof window.novaCdnApplyMeta === 'function') {
              window.novaCdnApplyMeta(snap.val() || {});
            }
          } catch (_) {}
        }
        return resolveBunnyPullZoneHost(cfg);
      })
      .catch(function () {
        return '';
      });
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
    return '';
  }

  function pickPlayback(cfg, host) {
    if (!cfg || cfg.show === false) return null;
    var mediaType = String(cfg.mediaType || 'video').toLowerCase();
    if (mediaType === 'image') {
      var imgUrl = resolveImageUrl(cfg);
      if (!imgUrl) return null;
      return { mode: 'image', src: imgUrl };
    }
    var videoId = String(cfg.videoId || '').trim();
    if (!videoId) return null;
    if (host) {
      return {
        mode: 'video',
        srcList: buildBunnyMp4Candidates(host, videoId)
      };
    }
    var libraryId = String(cfg.libraryId || '').trim();
    if (libraryId) {
      return {
        mode: 'iframe',
        src: buildBunnyEmbedBgUrl(libraryId, videoId)
      };
    }
    return null;
  }

  function hideBackgroundImage() {
    var img = getImage();
    if (!img) return;
    img.hidden = true;
    img.setAttribute('hidden', '');
    img.removeAttribute('src');
    hideBackdropMedia();
  }

  function prefetchImageElement(src) {
    var url = String(src || '').trim();
    if (!url) return Promise.resolve();
    if (state.prefetchedImageSrc === url) return Promise.resolve(url);
    var img = getImage();
    return new Promise(function (resolve) {
      function done() {
        state.prefetchedImageSrc = url;
        resolve(url);
      }
      if (img && img.src === url && img.complete && img.naturalWidth > 0) {
        done();
        return;
      }
      var probe = new Image();
      probe.decoding = 'async';
      probe.onload = probe.onerror = done;
      try {
        probe.fetchPriority = 'high';
      } catch (_) {}
      probe.src = url;
    });
  }

  function prefetchVideoBlob(url) {
    var src = String(url || '').trim();
    if (!src) return Promise.resolve(null);
    if (state.videoBlobCache[src]) return Promise.resolve(state.videoBlobCache[src]);
    return fetch(src, { cache: 'force-cache', mode: 'cors', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('bg-fetch-fail');
        return res.blob();
      })
      .then(function (blob) {
        if (blob && blob.size > 512) {
          state.videoBlobCache[src] = blob;
          if (!state.prefetchedVideo) state.prefetchedVideo = { url: src, blob: blob };
        }
        return blob;
      })
      .catch(function () {
        return null;
      });
  }

  function assignVideoBlob(video, url, blob) {
    if (!video || !blob || blob.size < 512) {
      return tryAssignVideoSrc(video, url);
    }
    revokeBlobUrl();
    return new Promise(function (resolve, reject) {
      function cleanup() {
        video.removeEventListener('canplay', onOk);
        video.removeEventListener('loadeddata', onOk);
        video.removeEventListener('error', onErr);
      }
      function onOk() {
        if (video.readyState < 2) return;
        cleanup();
        resolve(url);
      }
      function onErr() {
        cleanup();
        tryAssignVideoSrc(video, url).then(resolve, reject);
      }
      try {
        state.blobUrl = URL.createObjectURL(blob);
        video.addEventListener('canplay', onOk, { once: true });
        video.addEventListener('loadeddata', onOk, { once: true });
        video.addEventListener('error', onErr, { once: true });
        prepareVideoElement(video);
        video.src = state.blobUrl;
        video.load();
      } catch (e) {
        onErr();
      }
    });
  }

  function prefetchMainScreenBgMedia() {
    if (state.prefetchPromise) return state.prefetchPromise;
    state.prefetchPromise = fetchConfig(false)
      .then(function (cfg) {
        if (!cfg || cfg.show === false) return;
        return ensurePullZoneHost(cfg).then(function (host) {
          var play = pickPlayback(cfg, host);
          if (!play) return;
          if (play.mode === 'image') {
            return prefetchImageElement(play.src);
          }
          if (play.mode === 'video' && play.srcList && play.srcList.length) {
            return Promise.all(play.srcList.map(prefetchVideoBlob));
          }
        });
      })
      .catch(function () {})
      .then(function () {
        return true;
      });
    return state.prefetchPromise;
  }

  function applyBackgroundImage(src) {
    var img = getImage();
    var video = getVideo();
    hideIframeLayer();
    if (video) {
      try {
        video.pause();
        video.hidden = true;
        video.setAttribute('hidden', '');
      } catch (_) {}
    }
    if (!img || !src) return Promise.resolve();
    return new Promise(function (resolve) {
      function show() {
        img.hidden = false;
        img.removeAttribute('hidden');
        state.currentMode = 'image';
        state.currentSrc = src;
        syncBackdropImageFrom(img);
        markVideoReady(img);
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
      img.src = src;
      if (img.complete && img.naturalWidth > 0) show();
    });
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
    document.body.classList.toggle('nova-main-bg-video-on', !!on && isMainScreenVisible());
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
    if (!layer || !isMainScreenVisible()) return;
    hideIframeLayer();
    hideBackgroundImage();
    hideBackdropMedia();
    var video = getVideo();
    if (video) {
      try {
        video.pause();
        video.hidden = true;
        video.setAttribute('hidden', '');
      } catch (_) {}
    }
    layer.classList.add('is-gradient-fallback', 'is-active');
    document.body.classList.add('nova-main-bg-gradient-fallback', 'nova-main-bg-video-on');
    try {
      window.__novaMainBgPaintReady = true;
    } catch (_) {}
    state.currentMode = 'gradient';
    state.currentSrc = '';
  }

  function tryPosterFallback(cfg) {
    var posterUrl = resolveImageUrl(cfg);
    if (!posterUrl) return Promise.reject(new Error('no-poster'));
    return applyBackgroundImage(posterUrl);
  }

  function handleBgLoadFailure(cfg) {
    var libraryId = String((cfg && cfg.libraryId) || '').trim();
    var videoId = String((cfg && cfg.videoId) || '').trim();
    if (
      libraryId &&
      videoId &&
      applyIframeFallback({
        mode: 'iframe',
        src: buildBunnyEmbedBgUrl(libraryId, videoId)
      })
    ) {
      return Promise.resolve();
    }
    return tryPosterFallback(cfg).catch(function () {
      applyGradientFallback();
    });
  }

  function needsBgRecovery() {
    if (!isMainScreenVisible()) return false;
    if (document.body.classList.contains('nova-main-bg-gradient-fallback')) return true;
    var layer = getLayer();
    if (layer && layer.classList.contains('is-gradient-fallback')) return true;
    return !document.body.classList.contains('nova-main-bg-video-on');
  }

  function bindNetworkRecovery() {
    if (state.networkRetryBound) return;
    state.networkRetryBound = true;
    window.addEventListener(
      'online',
      function () {
        if (isMainScreenVisible()) syncMainBgVideo(true);
      },
      { passive: true }
    );
    document.addEventListener(
      'visibilitychange',
      function () {
        if (!document.hidden && needsBgRecovery()) syncMainBgVideo(false);
      },
      { passive: true }
    );
    if (state.networkRetryTimer) clearInterval(state.networkRetryTimer);
    state.networkRetryTimer = setInterval(function () {
      if (needsBgRecovery()) syncMainBgVideo(false);
    }, NETWORK_RETRY_MS);
  }

  function enforceSilent(video) {
    if (!video) return;
    try {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      if (video.audioTracks && video.audioTracks.length) {
        for (var i = 0; i < video.audioTracks.length; i++) {
          try {
            video.audioTracks[i].enabled = false;
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  function prepareVideoElement(video) {
    if (!video) return;
    try {
      enforceSilent(video);
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.controls = false;
      video.removeAttribute('controls');
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('disablepictureinpicture', '');
      video.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
      video.preload = 'auto';
    } catch (_) {}
  }

  function bindSilentGuards(video) {
    if (!video || video.dataset.novaSilentGuard === '1') return;
    video.dataset.novaSilentGuard = '1';
    function relock() {
      enforceSilent(video);
    }
    video.addEventListener('volumechange', relock, { passive: true });
    video.addEventListener('play', relock, { passive: true });
    video.addEventListener('loadedmetadata', relock, { passive: true });
    video.addEventListener('canplay', relock, { passive: true });
  }

  function tryAssignVideoSrc(video, src) {
    return new Promise(function (resolve, reject) {
      if (!video || !src) {
        reject(new Error('no-src'));
        return;
      }
      prepareVideoElement(video);
      revokeBlobUrl();

      function attachDirect() {
        function cleanup() {
          video.removeEventListener('canplay', onOk);
          video.removeEventListener('loadeddata', onOk);
          video.removeEventListener('error', onErr);
        }
        function onOk() {
          if (video.readyState < 2) return;
          cleanup();
          resolve(src);
        }
        function onErr() {
          cleanup();
          reject(new Error('video-error'));
        }
        video.addEventListener('canplay', onOk, { once: true });
        video.addEventListener('loadeddata', onOk, { once: true });
        video.addEventListener('error', onErr, { once: true });
        video.src = src;
        try {
          video.load();
        } catch (e) {
          onErr();
        }
      }

      attachDirect();
    });
  }

  function loadVideoSource(video, srcList) {
    var list = Array.isArray(srcList) ? srcList.slice() : [srcList];
    if (!video || !list.length) {
      return Promise.reject(new Error('no-video'));
    }

    var pref = state.prefetchedVideo;
    if (pref && pref.blob && list.indexOf(pref.url) >= 0) {
      return assignVideoBlob(video, pref.url, pref.blob);
    }

    var cachedUrl = list.find(function (u) {
      return state.videoBlobCache[u];
    });
    if (cachedUrl) {
      return assignVideoBlob(video, cachedUrl, state.videoBlobCache[cachedUrl]);
    }

    return Promise.all(
      list.map(function (src) {
        return prefetchVideoBlob(src).then(function (blob) {
          return { src: src, blob: blob };
        });
      })
    ).then(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].blob) {
          return assignVideoBlob(video, entries[i].src, entries[i].blob);
        }
      }
      var idx = 0;
      function tryNext() {
        if (idx >= list.length) {
          return Promise.reject(new Error('video-error'));
        }
        var src = list[idx];
        idx += 1;
        return tryAssignVideoSrc(video, src).catch(function () {
          return tryNext();
        });
      }
      return tryNext();
    });
  }

  function clearPlayRetries() {
    if (state.playRetryTimer) {
      clearInterval(state.playRetryTimer);
      state.playRetryTimer = null;
    }
  }

  function markVideoReady(video) {
    setLayerActive(true);
    if (video) {
      video.hidden = false;
      video.removeAttribute('hidden');
      if (video.tagName === 'VIDEO') syncBackdropVideoFrom(video);
      else if (video.tagName === 'IMG') syncBackdropImageFrom(video);
    }
  }

  function tryPlay(video) {
    if (!video || !isMainScreenVisible()) return;
    prepareVideoElement(video);
    bindSilentGuards(video);
    enforceSilent(video);
    if (video.readyState >= 2) markVideoReady(video);
    var p;
    try {
      p = video.play();
    } catch (_) {
      p = null;
    }
    if (p && typeof p.then === 'function') {
      p.then(function () {
        markVideoReady(video);
      }).catch(function () {
        if (video.readyState >= 2) markVideoReady(video);
      });
    } else if (video.readyState >= 2) {
      markVideoReady(video);
    }
  }

  function schedulePlayRetries(video) {
    clearPlayRetries();
    if (!video) return;
    var start = Date.now();
    state.playRetryTimer = setInterval(function () {
      if (!video || Date.now() - start > PLAY_RETRY_MAX_MS) {
        clearPlayRetries();
        return;
      }
      if (!isMainScreenVisible()) return;
      if (!video.paused && video.readyState >= 2) {
        markVideoReady(video);
        clearPlayRetries();
        return;
      }
      tryPlay(video);
    }, PLAY_RETRY_MS);
  }

  function bindAutoplayUnlock() {
    if (state.unlockBound) return;
    state.unlockBound = true;
    function unlock() {
      var video = getVideo();
      if (video && isMainScreenVisible()) {
        if (state.currentMode === 'iframe') syncMainBgVideo(false);
        else tryPlay(video);
      }
    }
    document.addEventListener('pointerdown', unlock, { passive: true, once: false });
    document.addEventListener('click', unlock, { passive: true, once: false });
    document.addEventListener('touchstart', unlock, { passive: true, once: false });
    document.addEventListener(
      'visibilitychange',
      function () {
        if (!document.hidden) unlock();
      },
      { passive: true }
    );
    window.addEventListener('focus', unlock, { passive: true });
  }

  function stopPlayback() {
    clearPlayRetries();
    var video = getVideo();
    if (video) {
      try {
        video.pause();
      } catch (_) {}
    }
    hideBackdropMedia();
    hideIframeLayer();
    hideBackgroundImage();
    state.currentMode = '';
  }

  function applyIframeFallback(play) {
    var layer = getLayer();
    var video = getVideo();
    var wrap = document.getElementById('nova-main-bg-video-iframe-wrap');
    var iframe = document.getElementById('nova-main-bg-video-iframe');
    if (!layer || !wrap || !iframe || !play || !play.src) return false;
    revokeBlobUrl();
    hideBackgroundImage();
    if (video) {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.hidden = true;
        video.setAttribute('hidden', '');
      } catch (_) {}
    }
    wrap.hidden = false;
    wrap.removeAttribute('hidden');
    wrap.classList.add('is-bg-fallback');
    iframe.src = play.src;
    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
    state.currentMode = 'iframe';
    state.currentSrc = play.src;
    setLayerActive(true);
    return true;
  }

  function syncMainBgVideo(forceConfig) {
    var layer = getLayer();
    var video = getVideo();
    if (!layer || !video) return Promise.resolve();

    if (!isMainScreenVisible()) {
      setLayerActive(false);
      stopPlayback();
      document.body.classList.remove('nova-main-bg-video-on');
      return Promise.resolve();
    }

    return fetchConfig(!!forceConfig)
      .then(function (cfg) {
        return ensurePullZoneHost(cfg).then(function (host) {
          var play = pickPlayback(cfg, host);
          if (!play) {
            setLayerActive(false);
            stopPlayback();
            try {
              video.removeAttribute('src');
              video.load();
            } catch (_) {}
            state.currentSrc = '';
            state.currentMode = '';
            return;
          }

          if (play.mode === 'image') {
            return applyBackgroundImage(play.src);
          }

          if (play.mode === 'iframe') {
            hideIframeLayer();
            if (applyIframeFallback(play)) return;
            setLayerActive(false);
            return;
          }

          hideIframeLayer();
          hideBackgroundImage();
          state.currentMode = 'video';
          video.hidden = false;
          video.removeAttribute('hidden');

          var primary = play.srcList[0];
          if (state.currentSrc === primary && video.readyState >= 2) {
            markVideoReady(video);
            tryPlay(video);
            schedulePlayRetries(video);
            return;
          }

          return loadVideoSource(video, play.srcList)
            .then(function (src) {
              state.currentSrc = src;
              markVideoReady(video);
              tryPlay(video);
              schedulePlayRetries(video);
            })
            .catch(function () {
              return handleBgLoadFailure(cfg);
            });
        });
      });
  }

  var syncDebounceTimer = null;
  var lastSyncAt = 0;

  function scheduleSyncMainBgVideo(forceConfig) {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    var now = Date.now();
    if (!forceConfig && now - lastSyncAt < 250) {
      syncDebounceTimer = setTimeout(function () {
        syncDebounceTimer = null;
        scheduleSyncMainBgVideo(forceConfig);
      }, 250);
      return;
    }
    syncDebounceTimer = setTimeout(function () {
      syncDebounceTimer = null;
      lastSyncAt = Date.now();
      syncMainBgVideo(!!forceConfig);
    }, 60);
  }

  function bindEvents() {
    if (state.bound) return;
    state.bound = true;
    bindAutoplayUnlock();
    var video = getVideo();
    if (video) {
      prepareVideoElement(video);
      bindSilentGuards(video);
      video.addEventListener(
        'playing',
        function () {
          markVideoReady(video);
        },
        { passive: true }
      );
      video.addEventListener(
        'loadeddata',
        function () {
          if (isMainScreenVisible()) markVideoReady(video);
        },
        { passive: true }
      );
    }

    document.addEventListener(
      'nova:main-screen-visible',
      function () {
        scheduleSyncMainBgVideo(false);
      },
      { passive: true }
    );

    document.addEventListener(
      'nova:sprite-boot-complete',
      function () {
        setTimeout(function () {
          if (isMainScreenVisible()) scheduleSyncMainBgVideo(false);
        }, 120);
      },
      { passive: true }
    );

    var main = document.getElementById('main-screen');
    if (main && typeof MutationObserver !== 'undefined') {
      var mo = new MutationObserver(function () {
        if (isMainScreenVisible()) {
          document.body.classList.add('nova-main-screen-visible');
          scheduleSyncMainBgVideo(false);
        } else {
          setLayerActive(false);
          stopPlayback();
          document.body.classList.remove('nova-main-bg-video-on');
        }
      });
      mo.observe(main, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    function kick() {
      if (isMainScreenVisible()) scheduleSyncMainBgVideo(false);
    }
    bindNetworkRecovery();
    kick();
    [500, 2500, 12000].forEach(function (ms) {
      setTimeout(kick, ms);
    });
  }

  window.novaSyncMainScreenBgVideo = syncMainBgVideo;
  window.novaPrefetchMainScreenBgMedia = prefetchMainScreenBgMedia;
  window.novaFetchMainScreenBgVideoConfig = fetchConfig;
  window.novaPickMainScreenBgPlayback = function (cfg) {
    return pickPlayback(cfg, resolveBunnyPullZoneHost(cfg));
  };
  window.novaResolveMainScreenBgImageUrl = resolveImageUrl;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents, { once: true });
  } else {
    bindEvents();
  }
})();
