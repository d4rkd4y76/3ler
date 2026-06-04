/* Hikaye videosu — Bunny Stream (admin /hikayeVideo), boot sonrası tam ekran */
(function () {
  'use strict';

  var SESSION_KEY = 'nova_hikaye_story_seen_v2';
  var CONFIG_TTL_MS = 120000;

  var state = {
    active: false,
    queued: false,
    config: null,
    configAt: 0,
    prefetchStarted: false
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

  function getStoredStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
        return selectedStudent;
      }
    } catch (_) {}
    try {
      if (window.selectedStudent && window.selectedStudent.studentId) return window.selectedStudent;
    } catch (_) {}
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && o.studentId ? o : null;
    } catch (_) {
      return null;
    }
  }

  function isMainScreenReady() {
    if (window.__novaMainScreenBootReady) return true;
    var main = document.getElementById('main-screen');
    if (!main) return false;
    try {
      return window.getComputedStyle(main).display !== 'none';
    } catch (_) {
      return main.style.display !== 'none';
    }
  }

  function isBootIdle() {
    if (window.__novaSpriteBootActive) return false;
    try {
      if (document.body.classList.contains('nova-sprite-boot-active')) return false;
      if (document.body.classList.contains('nova-screen-loader-active')) return false;
    } catch (_) {}
    var ov = document.getElementById('nova_sprite_boot_overlay');
    if (!ov) return true;
    if (ov.hidden) return true;
    try {
      if (ov.classList.contains('is-exiting')) return false;
      var st = window.getComputedStyle(ov);
      if (st.visibility === 'hidden' || parseFloat(st.opacity || '1') < 0.05) return true;
    } catch (_) {}
    return false;
  }

  function waitForBootIdle(maxMs) {
    return new Promise(function (resolve) {
      var start = Date.now();
      function tick() {
        if (isBootIdle()) {
          resolve();
          return;
        }
        if (Date.now() - start >= (maxMs || 12000)) {
          resolve();
          return;
        }
        setTimeout(tick, 80);
      }
      tick();
    });
  }

  function setSkipVisible(els, on) {
    if (!els.skip) return;
    if (on) {
      els.skip.hidden = false;
      els.skip.removeAttribute('hidden');
    } else {
      els.skip.hidden = true;
      els.skip.setAttribute('hidden', '');
    }
  }

  function setOverlayReady(els, on) {
    if (!els.overlay) return;
    if (on) {
      els.overlay.classList.add('is-ready');
      setSkipVisible(els, true);
    } else {
      els.overlay.classList.remove('is-ready');
      setSkipVisible(els, false);
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

  function isUsableLibraryHost(host) {
    if (!host) return false;
    if (/^vz[-_]?x{4,}$/i.test(host)) return false;
    if (host.toLowerCase() === 'vz-xxxxxxxx') return false;
    return host.length >= 8;
  }

  function buildBunnyEmbedUrl(libraryId, videoId) {
    return (
      'https://iframe.mediadelivery.net/embed/' +
      libraryId +
      '/' +
      videoId +
      '?autoplay=true&loop=false&muted=false&preload=true&responsive=true&rememberPosition=false'
    );
  }

  function buildBunnyMp4Candidates(host, videoId) {
    var base = 'https://' + host + '.b-cdn.net/' + videoId + '/';
    return [
      base + 'play_1080p.mp4',
      base + 'play_720p.mp4',
      base + 'play_480p.mp4',
      base + 'play_360p.mp4'
    ];
  }

  function pickPlayback(cfg) {
    if (!cfg) return null;
    var videoId = String(cfg.videoId || '').trim();
    if (!videoId) return null;

    var libraryId = String(cfg.libraryId || '').trim();
    if (libraryId) {
      return {
        mode: 'iframe',
        src: buildBunnyEmbedUrl(libraryId, videoId)
      };
    }

    var host = normalizeLibraryName(cfg.libraryName);
    if (isUsableLibraryHost(host)) {
      return {
        mode: 'video',
        src: buildBunnyMp4Candidates(host, videoId)[1]
      };
    }

    return null;
  }

  function isHikayeConfiguredAndEnabled(cfg) {
    return isConfigPlayable(cfg);
  }

  window.novaHikayeStoryWillPlay = function () {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return Promise.resolve(false);
    } catch (_) {}
    if (!getStoredStudent()) return Promise.resolve(false);
    return fetchHikayeConfig(false).then(function (cfg) {
      return isHikayeConfiguredAndEnabled(cfg);
    });
  };

  function isConfigPlayable(cfg) {
    if (!cfg || cfg.show === false) return false;
    return !!pickPlayback(cfg);
  }

  function fetchHikayeConfig(force) {
    var now = Date.now();
    if (!force && state.config && now - state.configAt < CONFIG_TTL_MS) {
      return Promise.resolve(state.config);
    }
    var db = getDatabase();
    if (!db) return Promise.resolve(null);
    return db
      .ref('platformMeta/hikayeVideo')
      .once('value')
      .then(function (snap) {
        if (snap.exists()) {
          var cfg = snap.val() || {};
          state.config = cfg;
          state.configAt = now;
          return cfg;
        }
        return db.ref('hikayeVideo').once('value');
      })
      .then(function (snap) {
        if (!snap || typeof snap.exists !== 'function') return state.config;
        var cfg = snap.exists() ? snap.val() || {} : null;
        state.config = cfg;
        state.configAt = now;
        return cfg;
      })
      .catch(function () {
        return null;
      });
  }

  function shouldPlayStory() {
    if (!getStoredStudent()) return Promise.resolve(false);
    if (!isMainScreenReady()) return Promise.resolve(false);
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return Promise.resolve(false);
    } catch (_) {}
    return fetchHikayeConfig(false).then(function (cfg) {
      return isConfigPlayable(cfg);
    });
  }

  function markStorySeen() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_) {}
  }

  function getElements() {
    return {
      overlay: document.getElementById('nova-hikaye-video-overlay'),
      video: document.getElementById('nova-hikaye-video-el'),
      iframeWrap: document.getElementById('nova-hikaye-video-iframe-wrap'),
      iframe: document.getElementById('nova-hikaye-video-iframe'),
      skip: document.getElementById('nova-hikaye-video-skip'),
      loading: document.getElementById('nova-hikaye-video-loading')
    };
  }

  function setLoadingVisible(els, on) {
    if (!els.loading) return;
    if (on) {
      els.loading.hidden = false;
      els.loading.removeAttribute('hidden');
    } else {
      els.loading.hidden = true;
      els.loading.setAttribute('hidden', '');
    }
  }

  function hideAllPlayers(els) {
    if (els.video) {
      els.video.hidden = true;
      els.video.setAttribute('hidden', '');
    }
    if (els.iframeWrap) {
      els.iframeWrap.hidden = true;
      els.iframeWrap.setAttribute('hidden', '');
    }
    if (els.iframe) {
      try {
        els.iframe.removeAttribute('src');
      } catch (_) {}
    }
  }

  function closeStoryOverlay() {
    var els = getElements();
    if (!els.overlay) return;
    state.active = false;
    els.overlay.classList.remove('open', 'is-ready');
    els.overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nova-hikaye-video-active');
    document.body.removeEventListener('keydown', onEscapeKey);
    setSkipVisible(els, false);
    if (els.skip) els.skip.onclick = null;
    if (els.video) {
      try {
        els.video.pause();
        els.video.currentTime = 0;
        els.video.onended = null;
        els.video.removeAttribute('src');
        els.video.load();
      } catch (_) {}
    }
    if (els.iframe) {
      try {
        els.iframe.removeAttribute('src');
      } catch (_) {}
    }
    hideAllPlayers(els);
    setLoadingVisible(els, false);
  }

  function onEscapeKey(ev) {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      markStorySeen();
      closeStoryOverlay();
    }
  }

  function tryPlayVideo(video, overlay) {
    try {
      video.controls = false;
      video.muted = false;
      video.volume = 1;
      video.playsInline = true;
    } catch (_) {}
    var p;
    try {
      p = video.play();
    } catch (_) {
      p = null;
    }
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        try {
          video.controls = true;
          if (typeof window.showAlert === 'function') {
            window.showAlert('Hikaye videosu için ekrana dokunup oynatın.');
          }
          var unlock = function () {
            try {
              video.muted = false;
              video.volume = 1;
              var p2 = video.play();
              if (p2 && typeof p2.catch === 'function') p2.catch(function () {});
            } catch (_) {}
            overlay.removeEventListener('click', unlock);
          };
          overlay.addEventListener('click', unlock, { once: true });
        } catch (_) {}
      });
    }
  }

  function loadVideoSource(video, srcOrList) {
    var list = Array.isArray(srcOrList) ? srcOrList.slice() : [srcOrList];
    return new Promise(function (resolve, reject) {
      if (!video || !list.length) {
        reject(new Error('no-video'));
        return;
      }
      var idx = 0;
      function tryNext() {
        if (idx >= list.length) {
          reject(new Error('video-error'));
          return;
        }
        var src = list[idx];
        idx += 1;
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
          tryNext();
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
      tryNext();
    });
  }

  function startPrefetch() {
    if (state.prefetchStarted) return;
    shouldPlayStory().then(function (ok) {
      if (!ok) return;
      state.prefetchStarted = true;
      fetchHikayeConfig(false).then(function (cfg) {
        var play = pickPlayback(cfg);
        var els = getElements();
        if (!play || play.mode !== 'video' || !els.video) return;
        loadVideoSource(els.video, play.src).catch(function () {});
      });
    });
  }

  function showHikayeStoryVideo() {
    if (state.active) return Promise.resolve(false);
    if (!isBootIdle()) {
      return waitForBootIdle(12000).then(function () {
        return showHikayeStoryVideo();
      });
    }

    return shouldPlayStory().then(function (ok) {
      if (!ok) return false;

      return fetchHikayeConfig(false).then(function (cfg) {
        var play = pickPlayback(cfg);
        var els = getElements();
        if (!play || !els.overlay || !els.skip) return false;

        state.active = true;

        return new Promise(function (resolve) {
          var finished = false;
          function done() {
            if (finished) return;
            finished = true;
            markStorySeen();
            closeStoryOverlay();
            resolve(true);
          }

          els.skip.onclick = function () {
            done();
          };
          document.body.addEventListener('keydown', onEscapeKey);
          setOverlayReady(els, false);
          setLoadingVisible(els, true);
          hideAllPlayers(els);

          function revealStoryUi() {
            if (finished) return;
            setLoadingVisible(els, false);
            document.body.classList.add('nova-hikaye-video-active');
            els.overlay.classList.add('open');
            els.overlay.setAttribute('aria-hidden', 'false');
            setOverlayReady(els, true);
          }

          if (play.mode === 'iframe') {
            if (els.iframeWrap) {
              els.iframeWrap.hidden = false;
              els.iframeWrap.removeAttribute('hidden');
            }
            if (els.iframe) {
              els.iframe.setAttribute(
                'allow',
                'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen'
              );
              els.iframe.onload = function () {
                revealStoryUi();
              };
              els.iframe.onerror = function () {
                revealStoryUi();
              };
              els.iframe.src = play.src;
            } else {
              revealStoryUi();
            }
            setTimeout(function () {
              revealStoryUi();
            }, 4500);
            return;
          }

          if (els.video) {
            els.video.hidden = false;
            els.video.removeAttribute('hidden');
          }

          function onReady() {
            revealStoryUi();
            els.video.onended = function () {
              done();
            };
            tryPlayVideo(els.video, els.overlay);
          }

          if (els.video.src === play.src && els.video.readyState >= 2) {
            onReady();
            return;
          }

          var mp4List =
            cfg.libraryName && isUsableLibraryHost(normalizeLibraryName(cfg.libraryName))
              ? buildBunnyMp4Candidates(normalizeLibraryName(cfg.libraryName), cfg.videoId)
              : [play.src];
          loadVideoSource(els.video, mp4List)
            .then(onReady)
            .catch(function () {
              var fallbackCfg = {
                show: cfg.show,
                videoId: cfg.videoId,
                libraryId: cfg.libraryId,
                libraryName: ''
              };
              var embed = pickPlayback(fallbackCfg);
              if (embed && embed.mode === 'iframe' && els.iframe) {
                setLoadingVisible(els, false);
                if (els.video) {
                  els.video.hidden = true;
                  els.video.setAttribute('hidden', '');
                }
                if (els.iframeWrap) {
                  els.iframeWrap.hidden = false;
                  els.iframeWrap.removeAttribute('hidden');
                }
                els.iframe.src = embed.src;
                return;
              }
              done();
            });
        });
      });
    });
  }

  function queueStoryAfterBoot() {
    if (state.queued || state.active) return;
    state.queued = true;
    waitForBootIdle(14000).then(function () {
      state.queued = false;
      if (!isBootIdle() || !isMainScreenReady()) return;
      setTimeout(function () {
        showHikayeStoryVideo();
      }, 350);
    });
  }

  function bindEvents() {
    document.addEventListener(
      'nova:main-screen-visible',
      function () {
        startPrefetch();
      },
      { passive: true }
    );
    document.addEventListener(
      'nova:sprite-boot-complete',
      function () {
        queueStoryAfterBoot();
      },
      { passive: true }
    );
  }

  window.novaShowHikayeStoryVideo = showHikayeStoryVideo;
  window.novaHikayeStoryPrefetch = startPrefetch;
  window.novaFetchHikayeVideoConfig = fetchHikayeConfig;
  window.novaBuildHikayePlayback = pickPlayback;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindEvents, { once: true });
  } else {
    bindEvents();
  }

  if (window.__novaSpriteBootDone) {
    shouldPlayStory().then(function (ok) {
      if (ok) queueStoryAfterBoot();
    });
  }
})();
