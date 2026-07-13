/**
 * BİRLEŞTİRELİM ses motoru — Bunny CDN / Stream
 * player.mediadelivery.net → iframe embed VEYA vz-… MP4
 */
(function (global) {
  "use strict";

  var mediaCache = {};
  var letterCache = {};
  var settingsCache = {};
  var audioEl = null;
  var videoEl = null;
  var embedEl = null;
  var unlocked = false;
  var lastPlayInfo = { ok: false, tried: [], detail: "" };

  function db() {
    try {
      return global.database || (global.firebase && firebase.database && firebase.database());
    } catch (_) {
      return null;
    }
  }

  function ensureAudio() {
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.setAttribute("playsinline", "");
      audioEl.setAttribute("preload", "auto");
      audioEl.controls = false;
      audioEl.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;";
      document.body.appendChild(audioEl);
    }
    try {
      audioEl.muted = false;
      audioEl.volume = 1;
    } catch (_) {}
    return audioEl;
  }

  function ensureVideo() {
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.setAttribute("playsinline", "");
      videoEl.setAttribute("preload", "auto");
      videoEl.controls = false;
      videoEl.style.cssText =
        "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:0;";
      document.body.appendChild(videoEl);
    }
    try {
      videoEl.muted = false;
      videoEl.volume = 1;
    } catch (_) {}
    return videoEl;
  }

  function ensureEmbed() {
    if (!embedEl) {
      embedEl = document.createElement("iframe");
      embedEl.setAttribute("allow", "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture");
      embedEl.setAttribute("allowfullscreen", "true");
      embedEl.setAttribute("loading", "eager");
      embedEl.style.cssText =
        "position:fixed;left:-9999px;top:0;width:320px;height:180px;opacity:0.01;border:0;pointer-events:none;z-index:0;";
      document.body.appendChild(embedEl);
    }
    return embedEl;
  }

  function unlock() {
    unlocked = true;
    try {
      var a = ensureAudio();
      a.muted = false;
      a.volume = 1;
      a.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==";
      var p = a.play();
      if (p && p.then) {
        return p
          .then(function () {
            try {
              a.pause();
            } catch (_) {}
          })
          .catch(function () {});
      }
    } catch (_) {}
    return Promise.resolve();
  }

  function stopAll() {
    try {
      if (audioEl) {
        audioEl.pause();
        audioEl.removeAttribute("src");
        audioEl.load();
      }
    } catch (_) {}
    try {
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
    } catch (_) {}
    try {
      if (embedEl) {
        embedEl.src = "about:blank";
      }
    } catch (_) {}
  }

  function normalizeHost(name) {
    var n = String(name || "").trim();
    if (!n) return "";
    n = n.replace(/^https?:\/\//i, "");
    n = n.replace(/\.b-cdn\.net.*$/i, "");
    n = n.replace(/\/+$/g, "");
    if (/^vz[-_]?x{4,}$/i.test(n) || n.toLowerCase() === "vz-xxxxxxxx") return "";
    return n;
  }

  function parseBunnyUrl(url) {
    url = String(url || "").trim();
    if (!url) return null;
    var m = url.match(/mediadelivery\.net\/(?:play|embed)\/(\d+)\/([0-9a-f-]{36})/i);
    if (m) {
      return { kind: "stream", libraryId: m[1], videoId: m[2], raw: url };
    }
    m = url.match(/([a-z0-9-]+)\.b-cdn\.net\/([0-9a-f-]{36})(?:\/|$|\?)/i);
    if (m) {
      return { kind: "cdn-guid", libraryName: m[1], videoId: m[2], raw: url };
    }
    if (/\.(mp3|wav|ogg|m4a|mp4|webm)(\?|#|$)/i.test(url)) {
      return { kind: "file", raw: url };
    }
    if (/\.b-cdn\.net\//i.test(url)) {
      return { kind: "cdn-file", raw: url };
    }
    return { kind: "unknown", raw: url };
  }

  function getLibraryHost() {
    return normalizeHost(settingsCache.libraryName || settingsCache.host || "");
  }

  function buildEmbedUrl(libraryId, videoId) {
    return (
      "https://iframe.mediadelivery.net/embed/" +
      libraryId +
      "/" +
      videoId +
      "?autoplay=true&muted=false&preload=true&responsive=true&playsinline=true"
    );
  }

  function expandPlayableUrls(url) {
    url = String(url || "").trim();
    if (!url) return [];
    var parsed = parseBunnyUrl(url);
    var out = [];
    var seen = {};

    function add(u, via) {
      u = String(u || "").trim();
      if (!u || seen[u]) return;
      seen[u] = true;
      out.push({ url: u, via: via || "direct" });
    }

    if (!parsed) return out;

    if (parsed.kind === "file" || parsed.kind === "cdn-file" || parsed.kind === "unknown") {
      add(url, "file");
      return out;
    }

    if (parsed.kind === "cdn-guid") {
      add("https://" + parsed.libraryName + ".b-cdn.net/" + parsed.videoId + "/play_720p.mp4", "mp4");
      add("https://" + parsed.libraryName + ".b-cdn.net/" + parsed.videoId + "/play_480p.mp4", "mp4");
      add("https://" + parsed.libraryName + ".b-cdn.net/" + parsed.videoId + "/play_360p.mp4", "mp4");
      add(url, "cdn");
      return out;
    }

    if (parsed.kind === "stream") {
      var host = getLibraryHost();
      if (host) {
        add("https://" + host + ".b-cdn.net/" + parsed.videoId + "/play_720p.mp4", "mp4");
        add("https://" + host + ".b-cdn.net/" + parsed.videoId + "/play_480p.mp4", "mp4");
        add("https://" + host + ".b-cdn.net/" + parsed.videoId + "/play_360p.mp4", "mp4");
      }
      add(buildEmbedUrl(parsed.libraryId, parsed.videoId), "embed");
      return out;
    }

    add(url, "direct");
    return out;
  }

  function once(el, type, ms) {
    return new Promise(function (resolve) {
      var done = false;
      function finish(val) {
        if (done) return;
        done = true;
        try {
          el.removeEventListener(type, onOk);
          el.removeEventListener("error", onErr);
        } catch (_) {}
        resolve(val);
      }
      function onOk() {
        finish(true);
      }
      function onErr() {
        finish(false);
      }
      el.addEventListener(type, onOk);
      el.addEventListener("error", onErr);
      window.setTimeout(function () {
        finish(false);
      }, ms || 8000);
    });
  }

  /** canplay bekle → play; waitUntilEnd ise ses bitene kadar bekle */
  function playHtmlMedia(el, url, label, opts) {
    opts = opts || {};
    var waitUntilEnd = !!opts.waitUntilEnd;
    return new Promise(function (resolve) {
      var finished = false;
      var playStarted = false;
      var endArmed = false;
      var endTimer = null;
      function finish(ok, why) {
        if (finished) return;
        finished = true;
        if (endTimer) {
          window.clearTimeout(endTimer);
          endTimer = null;
        }
        try {
          el.oncanplay = null;
          el.onloadeddata = null;
          el.onplaying = null;
          el.onended = null;
          el.onerror = null;
        } catch (_) {}
        lastPlayInfo.tried.push({ url: url, via: label, ok: !!ok, why: why || "" });
        resolve(!!ok);
      }

      function armEndWait() {
        if (finished) return;
        if (endArmed) return;
        endArmed = true;
        if (!waitUntilEnd) {
          finish(true, "playing");
          return;
        }
        el.onended = function () {
          finish(true, "ended");
        };
        var dur = 0;
        try {
          dur = el.duration;
        } catch (_) {}
        if (isFinite(dur) && dur > 0) {
          endTimer = window.setTimeout(function () {
            finish(true, "duration-cap");
          }, Math.min(Math.ceil(dur * 1000) + 500, 60000));
        } else {
          endTimer = window.setTimeout(function () {
            finish(true, "end-fallback");
          }, 12000);
        }
      }

      try {
        el.muted = false;
        el.volume = 1;
        el.onerror = function () {
          finish(false, "media-error");
        };
        el.onplaying = function () {
          armEndWait();
        };

        var readyTimer = window.setTimeout(function () {
          if (!finished) {
            try {
              el.pause();
            } catch (_) {}
            finish(false, "timeout-load");
          }
        }, 7000);

        function tryPlay() {
          if (finished || playStarted) return;
          playStarted = true;
          window.clearTimeout(readyTimer);
          var p;
          try {
            p = el.play();
          } catch (e) {
            finish(false, "play-throw:" + (e && e.message));
            return;
          }
          if (p && p.then) {
            p.then(function () {
              window.setTimeout(function () {
                if (finished) return;
                try {
                  if (!el.paused && el.readyState >= 2) armEndWait();
                  else finish(false, "paused-after-play");
                } catch (_) {
                  finish(false, "check-fail");
                }
              }, 400);
            }).catch(function (err) {
              finish(false, "play-reject:" + ((err && err.name) || "") + ":" + ((err && err.message) || ""));
            });
          } else {
            window.setTimeout(function () {
              if (finished) return;
              if (!el.paused) armEndWait();
              else finish(false, "no-promise-paused");
            }, 400);
          }
        }

        el.oncanplay = tryPlay;
        el.onloadeddata = function () {
          if (el.readyState >= 2) tryPlay();
        };

        el.src = url;
        try {
          el.load();
        } catch (_) {
          finish(false, "load-throw");
        }
      } catch (e) {
        finish(false, "setup:" + (e && e.message));
      }
    });
  }

  function playEmbed(embedUrl) {
    return new Promise(function (resolve) {
      var iframe = ensureEmbed();
      var done = false;
      function finish(ok, why) {
        if (done) return;
        done = true;
        lastPlayInfo.tried.push({ url: embedUrl, via: "embed", ok: !!ok, why: why || "" });
        resolve(!!ok);
      }
      try {
        iframe.onload = function () {
          /* Bunny player yüklendi — autoplay gesture ile gelmiş olmalı */
          window.setTimeout(function () {
            finish(true, "iframe-loaded");
          }, 500);
        };
        iframe.onerror = function () {
          finish(false, "iframe-error");
        };
        iframe.src = embedUrl;
        window.setTimeout(function () {
          if (!done) finish(true, "iframe-timeout-assume");
        }, 4000);
      } catch (e) {
        finish(false, "iframe-setup:" + (e && e.message));
      }
    });
  }

  async function playUrl(url, opts) {
    opts = opts || {};
    var waitUntilEnd = opts.waitUntilEnd !== false; /* varsayılan: ses bitsin */
    lastPlayInfo = { ok: false, tried: [], detail: "", host: getLibraryHost() };
    var candidates = expandPlayableUrls(url);
    if (!candidates.length) {
      lastPlayInfo.detail = "Aday URL yok";
      return false;
    }

    await unlock();

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var u = c.url;
      var via = c.via;

      if (via === "embed" || /iframe\.mediadelivery\.net\/embed\//i.test(u)) {
        var embOk = await playEmbed(u);
        if (embOk) {
          lastPlayInfo.ok = true;
          lastPlayInfo.detail = "Bunny embed ile çalınıyor";
          return true;
        }
        continue;
      }

      var isLikelyVideo =
        via === "mp4" || /\.mp4(\?|#|$)/i.test(u) || /\/play_\d+p\.mp4/i.test(u) || /b-cdn\.net\/[0-9a-f-]{36}/i.test(u);

      if (isLikelyVideo) {
        stopHtmlOnly();
        if (await playHtmlMedia(ensureVideo(), u, "video:" + via, { waitUntilEnd: waitUntilEnd })) {
          lastPlayInfo.ok = true;
          lastPlayInfo.detail = "Video elementi: " + u;
          return true;
        }
      }

      stopHtmlOnly();
      if (await playHtmlMedia(ensureAudio(), u, "audio:" + via, { waitUntilEnd: waitUntilEnd })) {
        lastPlayInfo.ok = true;
        lastPlayInfo.detail = "Audio elementi: " + u;
        return true;
      }
    }

    lastPlayInfo.ok = false;
    lastPlayInfo.detail = summarizeFail();
    return false;
  }

  function stopHtmlOnly() {
    try {
      if (audioEl) {
        audioEl.pause();
        audioEl.removeAttribute("src");
        audioEl.load();
      }
    } catch (_) {}
    try {
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
    } catch (_) {}
  }

  function summarizeFail() {
    var host = getLibraryHost();
    var parsed = null;
    try {
      var lastRaw = (lastPlayInfo.tried[0] && lastPlayInfo.tried[0].url) || "";
      parsed = parseBunnyUrl(lastRaw);
    } catch (_) {}
    var lines = [];
    if (!host) {
      lines.push("CDN hostname (vz-…) yok; embed denendi.");
    } else {
      lines.push("CDN host: " + host);
    }
    var rejects = lastPlayInfo.tried
      .filter(function (t) {
        return !t.ok;
      })
      .slice(0, 4)
      .map(function (t) {
        return (t.via || "") + "→" + (t.why || "fail");
      });
    if (rejects.length) lines.push(rejects.join(" · "));
    return lines.join(" | ") || "Tüm adaylar başarısız";
  }

  function getLastPlayInfo() {
    return lastPlayInfo;
  }

  function loadMediaFromFirebase() {
    var database = db();
    if (!database) return Promise.resolve({ media: {}, letters: {}, settings: {} });
    return database
      .ref("birlestirelim")
      .once("value")
      .then(function (snap) {
        var v = snap.val() || {};
        mediaCache = v.media && typeof v.media === "object" ? v.media : {};
        letterCache = v.letters && typeof v.letters === "object" ? v.letters : {};
        settingsCache = v.settings && typeof v.settings === "object" ? v.settings : {};
        if (settingsCache.libraryName) {
          return { media: mediaCache, letters: letterCache, settings: settingsCache };
        }
        return database
          .ref("platformMeta/hikayeVideo")
          .once("value")
          .then(function (hs) {
            var hv = (hs && hs.val && hs.val()) || {};
            if (hv.libraryName) settingsCache.libraryName = normalizeHost(hv.libraryName);
            if (!settingsCache.libraryId && hv.libraryId) settingsCache.libraryId = String(hv.libraryId);
            return { media: mediaCache, letters: letterCache, settings: settingsCache };
          })
          .catch(function () {
            return { media: mediaCache, letters: letterCache, settings: settingsCache };
          });
      })
      .catch(function () {
        return { media: mediaCache, letters: letterCache, settings: settingsCache };
      });
  }

  function setLocalMedia(map) {
    if (map && map.media) mediaCache = map.media;
    if (map && map.letters) letterCache = map.letters;
    if (map && map.settings) settingsCache = map.settings;
  }

  function getMedia(key) {
    key = String(key || "").trim();
    return (mediaCache && mediaCache[key]) || null;
  }

  function resolveAudioUrl(token) {
    token = String(token || "").trim().toLowerCase();
    if (!token) return "";
    if (token.length === 1 && letterCache[token] && letterCache[token].audioUrl) {
      return String(letterCache[token].audioUrl).trim();
    }
    if (mediaCache[token] && mediaCache[token].audioUrl) {
      return String(mediaCache[token].audioUrl).trim();
    }
    if (letterCache[token] && letterCache[token].audioUrl) {
      return String(letterCache[token].audioUrl).trim();
    }
    return "";
  }

  function hasAudio(token) {
    return !!resolveAudioUrl(token);
  }

  function describeUrlProblem(url) {
    var p = parseBunnyUrl(url);
    if (!p) return "URL boş";
    if (p.kind === "unknown") return "Doğrudan .mp3/.mp4 veya Bunny Stream /play/… linki kullanın";
    if (p.kind === "stream") return ""; /* embed ile çalınabilir */
    return "";
  }

  async function playToken(token, opts) {
    await unlock();
    stopAll();
    var url = resolveAudioUrl(token);
    if (!url) {
      lastPlayInfo = { ok: false, tried: [], detail: "Token için URL yok: " + token };
      return false;
    }
    return playUrl(url, opts);
  }

  async function speakPhoneme(letter) {
    return playToken(letter);
  }

  async function speakWord(word, mediaKey) {
    var ok = await playToken(mediaKey || word);
    if (ok) return true;
    if (mediaKey && mediaKey !== word) return playToken(word);
    return false;
  }

  async function speakNarration() {
    return false;
  }

  global.NovaKidsVoice = {
    unlock: unlock,
    stop: stopAll,
    loadMediaFromFirebase: loadMediaFromFirebase,
    setLocalMedia: setLocalMedia,
    getMedia: getMedia,
    resolveAudioUrl: resolveAudioUrl,
    hasAudio: hasAudio,
    playToken: playToken,
    playUrl: playUrl,
    parseBunnyUrl: parseBunnyUrl,
    expandPlayableUrls: expandPlayableUrls,
    describeUrlProblem: describeUrlProblem,
    getLibraryHost: getLibraryHost,
    getLastPlayInfo: getLastPlayInfo,
    speakPhoneme: speakPhoneme,
    speakWord: speakWord,
    speakNarration: speakNarration
  };
})(typeof window !== "undefined" ? window : globalThis);
