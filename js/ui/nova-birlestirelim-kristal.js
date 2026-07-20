/**
 * Kristal Mağarası — 9:16 video + 6 çerçeveli çoklu seçim
 * Admin: birlestirelim/letters/{soundId}/kristal =
 *   { activities:[{id,title?,question?,images:[{imageUrl,correct,label,glow,audioUrl}]}] }
 * Eski tek etkinlik: { question?, images:[...] } hâlâ okunur.
 */
(function (global) {
  "use strict";

  var VIDEO_SRC = "assets/birles/kristal_magarasi.mp4?v=opt1";
  var SLOT_COUNT = 6;
  var hostEl = null;
  var onDoneCb = null;
  var soundRef = null;
  var packRef = null;
  var picked = {};
  var openToken = 0;
  var warmVideoEl = null;
  var warmPromise = null;
  var finishing = false;
  var layoutBound = null;
  var nameTourAudio = null;
  var nameTourToken = 0;
  var sfxCtx = null;
  var activitiesRef = [];
  var activityIdx = 0;

  function ensureSfxCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!sfxCtx) sfxCtx = new AC();
    if (sfxCtx.state === "suspended") {
      try {
        sfxCtx.resume();
      } catch (_) {}
    }
    return sfxCtx;
  }

  /** Yüksek, net tik — doğru cevap */
  function playCorrectSfx() {
    var ctx = ensureSfxCtx();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    function ping(freq, delay, gainPeak, dur) {
      var osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0 + delay);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + delay);
      g.gain.exponentialRampToValueAtTime(gainPeak, t0 + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + dur + 0.02);
    }
    ping(880, 0, 0.42, 0.14);
    ping(1320, 0.07, 0.32, 0.16);
    ping(1760, 0.13, 0.18, 0.12);
  }

  /** Net yanlış sesi */
  function playWrongSfx() {
    var ctx = ensureSfxCtx();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.18);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.24);

    var osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(180, t0);
    osc2.frequency.exponentialRampToValueAtTime(90, t0 + 0.16);
    var g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t0 + 0.2);
  }

  function stopNameTour() {
    nameTourToken += 1;
    if (nameTourAudio) {
      try {
        nameTourAudio.pause();
        nameTourAudio.src = "";
      } catch (_) {}
      nameTourAudio = null;
    }
    if (hostEl) {
      hostEl.querySelectorAll(".birles-kristal__name.is-speaking").forEach(function (el) {
        el.classList.remove("is-speaking");
      });
    }
  }

  function playNameAudioTour(data) {
    stopNameTour();
    var token = nameTourToken;
    var queue = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      var img = data.images[i] || {};
      if (!img.correct || !img.label) continue;
      var url = String(img.audioUrl || "").trim();
      if (!url) continue;
      queue.push({ index: i, url: url });
    }
    if (!queue.length || !hostEl) return;

    function clearSpeaking() {
      if (!hostEl) return;
      hostEl.querySelectorAll(".birles-kristal__name.is-speaking").forEach(function (el) {
        el.classList.remove("is-speaking");
      });
    }

    function playAt(qi) {
      if (token !== nameTourToken || !hostEl) return;
      clearSpeaking();
      if (qi >= queue.length) return;
      var item = queue[qi];
      var nameEl = hostEl.querySelector(".birles-kristal__name--" + item.index);
      if (nameEl) nameEl.classList.add("is-speaking");

      var audio = new Audio();
      nameTourAudio = audio;
      audio.preload = "auto";
      try {
        audio.setAttribute("playsinline", "");
        audio.playsInline = true;
      } catch (_) {}

      var settled = false;
      function next() {
        if (settled) return;
        settled = true;
        if (nameTourAudio === audio) nameTourAudio = null;
        clearSpeaking();
        setTimeout(function () {
          playAt(qi + 1);
        }, 180);
      }

      audio.addEventListener("ended", next);
      audio.addEventListener("error", next);
      audio.src = item.url;
      var p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(function () {
          next();
        });
      }
    }

    setTimeout(function () {
      if (token !== nameTourToken) return;
      playAt(0);
    }, 720);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function foldTr(s) {
    try {
      return String(s || "").toLocaleLowerCase("tr-TR");
    } catch (_) {
      return String(s || "").toLowerCase();
    }
  }

  function parseGlowList(glow) {
    return String(glow || "")
      .split(/[,;|/]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return b.length - a.length;
      });
  }

  /** Kelime içinde vurgulanan sesleri kristal span ile sar */
  function labelHtml(label, glow) {
    var text = String(label || "");
    if (!text) return "";
    var tokens = parseGlowList(glow);
    if (!tokens.length) return esc(text);

    var folded = foldTr(text);
    var marks = [];
    for (var m = 0; m < text.length; m++) marks[m] = false;

    tokens.forEach(function (tok) {
      var ft = foldTr(tok);
      if (!ft) return;
      var start = 0;
      while (start <= folded.length - ft.length) {
        var idx = folded.indexOf(ft, start);
        if (idx < 0) break;
        var overlap = false;
        for (var i = idx; i < idx + ft.length; i++) {
          if (marks[i]) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          for (var j = idx; j < idx + ft.length; j++) marks[j] = true;
        }
        start = idx + Math.max(1, ft.length);
      }
    });

    var html = "";
    var i = 0;
    while (i < text.length) {
      if (marks[i]) {
        var j = i;
        while (j < text.length && marks[j]) j++;
        html +=
          '<span class="birles-kristal__gem">' + esc(text.slice(i, j)) + "</span>";
        i = j;
      } else {
        var k = i;
        while (k < text.length && !marks[k]) k++;
        html += esc(text.slice(i, k));
        i = k;
      }
    }
    return html;
  }

  function normalizeActivity(raw, idx) {
    var row = raw && typeof raw === "object" ? raw : {};
    var images = Array.isArray(row.images) ? row.images : [];
    var out = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      var img = images[i] || {};
      out.push({
        imageUrl: String(img.imageUrl || img.url || "").trim(),
        correct: !!(img.correct === true || img.correct === 1 || img.correct === "1"),
        label: String(img.label || img.name || "").trim(),
        glow: String(img.glow || img.highlight || "").trim(),
        audioUrl: String(img.audioUrl || img.mp3 || img.soundUrl || "").trim()
      });
    }
    return {
      id: String(row.id || "k" + (idx + 1)).trim() || "k" + (idx + 1),
      title: String(row.title || "").trim(),
      question: String(row.question || "").trim(),
      images: out
    };
  }

  function listActivities(pack) {
    var k = pack && pack.kristal;
    if (!k || typeof k !== "object") return [];
    if (Array.isArray(k.activities) && k.activities.length) {
      return k.activities
        .map(function (a, i) {
          return normalizeActivity(a, i);
        })
        .filter(function (a) {
          return a.images.some(function (img) {
            return !!img.imageUrl;
          });
        });
    }
    var legacy = normalizeActivity(
      { id: "k1", title: "", question: k.question, images: k.images },
      0
    );
    if (
      legacy.images.some(function (img) {
        return !!img.imageUrl;
      })
    ) {
      return [legacy];
    }
    return [];
  }

  function normalizeKristal(pack) {
    var acts = listActivities(pack);
    if (!acts.length) return { question: "", images: [], activities: [] };
    var cur = acts[0];
    return {
      question: cur.question,
      images: cur.images,
      activities: acts
    };
  }

  function hasKristal(pack) {
    return listActivities(pack).length > 0;
  }

  function currentActivity() {
    if (!activitiesRef.length) return { question: "", images: [], title: "" };
    var i = Math.max(0, Math.min(activityIdx, activitiesRef.length - 1));
    return activitiesRef[i];
  }

  function defaultQuestion(sound) {
    var letter = (sound && (sound.displayUpper || sound.letter)) || "?";
    return "Hangilerinde “" + letter + "” sesi var?";
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      if (!url) {
        resolve();
        return;
      }
      var img = new Image();
      img.decoding = "async";
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      img.onload = function () {
        if (img.decode) {
          img.decode().then(finish).catch(finish);
        } else {
          finish();
        }
      };
      img.onerror = finish;
      img.src = url;
    });
  }

  function waitVideoReady(video, timeoutMs) {
    return new Promise(function (resolve) {
      if (!video) {
        resolve();
        return;
      }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        cleanup();
        resolve();
      }
      function cleanup() {
        video.removeEventListener("canplaythrough", onThrough);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("loadeddata", onLoaded);
        video.removeEventListener("error", finish);
      }
      function onThrough() {
        finish();
      }
      function onCanPlay() {
        if (video.readyState >= 3) finish();
      }
      function onLoaded() {
        if (video.readyState >= 4) finish();
      }
      if (video.readyState >= 4) {
        finish();
        return;
      }
      video.addEventListener("canplaythrough", onThrough);
      video.addEventListener("canplay", onCanPlay);
      video.addEventListener("loadeddata", onLoaded);
      video.addEventListener("error", finish);
      try {
        video.preload = "auto";
        if (video.readyState < 2) video.load();
      } catch (_) {}
      setTimeout(finish, timeoutMs || 25000);
    });
  }

/* Foto yüklemesi asla sonsuza kadar bekletmesin */
  function waitPhotosInDom(root) {
    var imgs = root ? root.querySelectorAll(".birles-kristal__photo") : [];
    var tasks = [];
    for (var i = 0; i < imgs.length; i++) {
      (function (el) {
        tasks.push(
          new Promise(function (resolve) {
            var done = false;
            function finish() {
              if (done) return;
              done = true;
              resolve();
            }
            if (el.complete && el.naturalWidth > 0) {
              if (el.decode) {
                el.decode().then(finish).catch(finish);
              } else {
                finish();
              }
              return;
            }
            el.addEventListener(
              "load",
              function () {
                if (el.decode) {
                  el.decode().then(finish).catch(finish);
                } else {
                  finish();
                }
              },
              { once: true }
            );
            el.addEventListener("error", finish, { once: true });
            setTimeout(finish, 8000);
          })
        );
      })(imgs[i]);
    }
    return Promise.all(tasks);
  }

  /** Ses hub’ında kart görünür görünmez video+foto önbelleğe alınır */
  function warm(pack) {
    var acts = listActivities(pack);
    var photoTasks = [];
    acts.forEach(function (act) {
      (act.images || []).forEach(function (img) {
        photoTasks.push(loadImage(img.imageUrl));
      });
    });

    if (!warmVideoEl) {
      warmVideoEl = document.createElement("video");
      warmVideoEl.muted = true;
      warmVideoEl.playsInline = true;
      warmVideoEl.setAttribute("playsinline", "");
      warmVideoEl.preload = "auto";
      warmVideoEl.src = VIDEO_SRC;
      try {
        warmVideoEl.load();
      } catch (_) {}
    }

    warmPromise = Promise.all([waitVideoReady(warmVideoEl, 30000)].concat(photoTasks));
    return warmPromise;
  }

  function viewportSize() {
    var w = Math.max(
      window.innerWidth || 0,
      (document.documentElement && document.documentElement.clientWidth) || 0,
      1
    );
    var h = Math.max(
      window.innerHeight || 0,
      (document.documentElement && document.documentElement.clientHeight) || 0,
      1
    );
    try {
      var vv = window.visualViewport;
      if (vv && vv.width > 0 && vv.height > 0) {
        w = Math.max(w, Math.ceil(vv.width), Math.ceil(vv.width + Math.abs(vv.offsetLeft || 0)));
        h = Math.max(h, Math.ceil(vv.height), Math.ceil(vv.height + Math.abs(vv.offsetTop || 0)));
      }
    } catch (_) {}
    if (hostEl) {
      try {
        var r = hostEl.getBoundingClientRect();
        if (r.width > 2) w = Math.max(w, Math.ceil(r.width));
        if (r.height > 2) h = Math.max(h, Math.ceil(r.height));
      } catch (_) {}
    }
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
  }

  /** 9:16 sahneyi ekranı kaplayacak şekilde (cover) piksel olarak boyutla */
  function layoutStage() {
    if (!hostEl) return;
    var stage = hostEl.querySelector(".birles-kristal__stage");
    if (!stage) return;
    var vp = viewportSize();
    hostEl.style.width = "100%";
    hostEl.style.height = "100%";
    hostEl.style.maxWidth = "none";
    hostEl.style.maxHeight = "none";
    var w = vp.w;
    var h = Math.round((vp.w * 16) / 9);
    if (h < vp.h) {
      h = vp.h;
      w = Math.round((vp.h * 9) / 16);
    }
    if (w < vp.w) w = vp.w;
    if (h < vp.h) h = vp.h;
    /* Kenar / alt piksel boşluklarını kapat */
    w += 6;
    h += 6;
    stage.style.position = "absolute";
    stage.style.left = "50%";
    stage.style.top = "50%";
    stage.style.width = w + "px";
    stage.style.height = h + "px";
    stage.style.maxWidth = "none";
    stage.style.maxHeight = "none";
    stage.style.minWidth = "0";
    stage.style.minHeight = "0";
    stage.style.pointerEvents = "none";
    var frame = stage.querySelector(".birles-kristal__frame");
    if (frame) frame.style.pointerEvents = "auto";
  }

  function bindLayout() {
    unbindLayout();
    layoutBound = function () {
      layoutStage();
    };
    window.addEventListener("resize", layoutBound);
    window.addEventListener("orientationchange", layoutBound);
    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", layoutBound);
        window.visualViewport.addEventListener("scroll", layoutBound);
      }
    } catch (_) {}
  }

  function unbindLayout() {
    if (!layoutBound) return;
    window.removeEventListener("resize", layoutBound);
    window.removeEventListener("orientationchange", layoutBound);
    try {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", layoutBound);
        window.visualViewport.removeEventListener("scroll", layoutBound);
      }
    } catch (_) {}
    layoutBound = null;
  }

  function forceHideBirlesMask() {
    try {
      var mask = document.getElementById("birles-zoom-mask");
      if (mask) mask.classList.remove("is-on");
      document.documentElement.classList.add("birles-kristal-open");
    } catch (_) {}
  }

  function clearKristalHtmlFlag() {
    try {
      document.documentElement.classList.remove("birles-kristal-open");
    } catch (_) {}
  }

  function close() {
    openToken += 1;
    finishing = false;
    stopNameTour();
    unbindLayout();
    clearKristalHtmlFlag();
    try {
      document.body.classList.remove("birles-kristal-fs");
      if (typeof window.novaSyncPerfRuntime === "function") {
        window.novaSyncPerfRuntime();
      }
    } catch (_) {}
    try {
      var birlesOv = document.getElementById("birlestirelim-overlay");
      if (birlesOv && birlesOv.getAttribute("data-kristal-under") === "1") {
        birlesOv.removeAttribute("data-kristal-under");
        if (birlesOv.classList.contains("open")) {
          birlesOv.style.removeProperty("visibility");
          birlesOv.style.removeProperty("pointer-events");
          birlesOv.style.removeProperty("opacity");
          birlesOv.style.removeProperty("z-index");
        }
        if (typeof window.__birlesScheduleHubCover === "function") {
          window.__birlesScheduleHubCover();
        }
      }
    } catch (_) {}
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    hostEl = null;
    soundRef = null;
    packRef = null;
    picked = {};
    onDoneCb = null;
    activitiesRef = [];
    activityIdx = 0;
  }

  function allCorrectFound(data) {
    var need = 0;
    var got = 0;
    data.images.forEach(function (img, i) {
      if (!img.imageUrl || !img.correct) return;
      need++;
      if (picked[i]) got++;
    });
    return need > 0 && got >= need;
  }

  function markSlot(btn, ok) {
    btn.classList.remove("is-right", "is-wrong");
    btn.classList.add(ok ? "is-right" : "is-wrong");
    var badge = btn.querySelector(".birles-kristal__badge");
    if (badge) badge.textContent = ok ? "✓" : "✕";
  }

  function revealNames(data) {
    if (finishing || !hostEl) return;
    finishing = true;
    hostEl.classList.add("is-names-on", "is-done");

    var ask = hostEl.querySelector(".birles-kristal__ask");
    if (ask) {
      var more = activityIdx < activitiesRef.length - 1;
      ask.textContent = more ? "Kristal kelimeler! · İleri’ye bas" : "Kristal kelimeler!";
    }

    var hint = hostEl.querySelector(".birles-kristal__hint");
    if (hint) hint.hidden = true;

    updateDoneButtons();

    hostEl.querySelectorAll("[data-kristal-slot]").forEach(function (btn) {
      btn.classList.add("is-locked");
    });

    try {
      playNameAudioTour(data);
    } catch (_) {}
  }

  function updateDoneButtons() {
    if (!hostEl) return;
    var hasNext = activityIdx < activitiesRef.length - 1;
    var nextBtn = hostEl.querySelector("[data-kristal-next]");
    var exitBtn = hostEl.querySelector("[data-kristal-done]");
    if (nextBtn) {
      nextBtn.hidden = !hasNext;
      nextBtn.setAttribute("aria-hidden", hasNext ? "false" : "true");
      if (hasNext) {
        nextBtn.textContent =
          "İleri · " + (activityIdx + 2) + "/" + activitiesRef.length;
      }
    }
    if (exitBtn) {
      exitBtn.hidden = hasNext;
      exitBtn.setAttribute("aria-hidden", hasNext ? "true" : "false");
      if (!hasNext) exitBtn.textContent = "✓";
    }
  }

  function goNextActivity() {
    if (!hostEl || activityIdx >= activitiesRef.length - 1) {
      finishSuccess();
      return;
    }
    stopNameTour();
    activityIdx += 1;
    picked = {};
    finishing = false;
    hostEl.classList.remove("is-names-on", "is-done");

    var data = currentActivity();
    var q = data.question || defaultQuestion(soundRef);

    var ask = hostEl.querySelector(".birles-kristal__ask");
    if (ask) ask.textContent = q;

    var hint = hostEl.querySelector(".birles-kristal__hint");
    if (hint) {
      hint.hidden = false;
      hint.textContent =
        activitiesRef.length > 1
          ? "Doğru olanların hepsine dokun · " +
            (activityIdx + 1) +
            "/" +
            activitiesRef.length
          : "Doğru olanların hepsine dokun";
    }

    var nextBtn = hostEl.querySelector("[data-kristal-next]");
    var exitBtn = hostEl.querySelector("[data-kristal-done]");
    if (nextBtn) {
      nextBtn.hidden = true;
      nextBtn.setAttribute("aria-hidden", "true");
    }
    if (exitBtn) {
      exitBtn.hidden = true;
      exitBtn.setAttribute("aria-hidden", "true");
    }

    var slots = hostEl.querySelector(".birles-kristal__slots");
    if (slots) {
      slots.innerHTML = slotsHtml(data);
      slots.querySelectorAll("[data-kristal-slot]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = Number(btn.getAttribute("data-kristal-slot"));
          onSlotClick(btn, idx, data);
        });
      });
    }
    layoutStage();
  }

  function finishSuccess() {
    var cb = onDoneCb;
    close();
    if (typeof cb === "function") cb({ success: true });
  }

  function onSlotClick(btn, idx, data) {
    if (finishing || btn.classList.contains("is-locked")) return;
    var img = data.images[idx];
    if (!img || !img.imageUrl) return;

    try {
      ensureSfxCtx();
    } catch (_) {}

    if (img.correct) {
      picked[idx] = true;
      playCorrectSfx();
      markSlot(btn, true);
      btn.classList.add("is-locked");
      if (allCorrectFound(data)) {
        setTimeout(function () {
          revealNames(data);
        }, 420);
      }
      return;
    }

    playWrongSfx();
    markSlot(btn, false);
    btn.classList.add("is-locked");
    setTimeout(function () {
      if (!btn || !btn.parentNode || finishing) return;
      btn.classList.remove("is-wrong", "is-locked");
      var badge = btn.querySelector(".birles-kristal__badge");
      if (badge) badge.textContent = "";
    }, 900);
  }

  function slotsHtml(data) {
    var html = "";
    for (var i = 0; i < SLOT_COUNT; i++) {
      var img = data.images[i] || {};
      var has = !!img.imageUrl;
      var label = img.label || "";
      html +=
        '<button type="button" class="birles-kristal__slot birles-kristal__slot--' +
        i +
        (has ? "" : " is-empty") +
        '" data-kristal-slot="' +
        i +
        '" aria-label="Çerçeve ' +
        (i + 1) +
        '"' +
        (has ? "" : " disabled") +
        ">" +
        (has
          ? '<img class="birles-kristal__photo" src="' +
            esc(img.imageUrl) +
            '" alt="" decoding="async" draggable="false"/>'
          : "") +
        '<span class="birles-kristal__badge" aria-hidden="true"></span>' +
        "</button>" +
        '<p class="birles-kristal__name birles-kristal__name--' +
        i +
        (label ? "" : " is-blank") +
        '" aria-hidden="true">' +
        (label
          ? '<span class="birles-kristal__name-peg" aria-hidden="true"></span>' +
            '<span class="birles-kristal__name-plate">' +
            labelHtml(label, img.glow) +
            "</span>"
          : "") +
        "</p>";
    }
    return html;
  }

  function revealReady(box, vid, token) {
    if (token !== openToken || !box || !box.parentNode) return;
    box.classList.add("is-ready");
    box.classList.remove("is-booting");
    layoutStage();
    var stage = box.querySelector(".birles-kristal__stage");
    if (stage) stage.removeAttribute("aria-hidden");
    var boot = box.querySelector(".birles-kristal__boot");
    if (boot) {
      boot.setAttribute("aria-hidden", "true");
      setTimeout(function () {
        if (boot && boot.parentNode && box.classList.contains("is-ready")) {
          boot.parentNode.removeChild(boot);
        }
      }, 520);
    }
    if (vid) {
      vid.muted = true;
      var p = vid.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    requestAnimationFrame(function () {
      layoutStage();
    });
  }

  function open(opts) {
    opts = opts || {};
    close();
    var token = openToken;
    soundRef = opts.sound || null;
    packRef = opts.letterPack || {};
    onDoneCb = typeof opts.onDone === "function" ? opts.onDone : null;
    picked = {};
    finishing = false;
    activitiesRef = listActivities(packRef);
    activityIdx = 0;

    var data = currentActivity();
    var q = data.question || defaultQuestion(soundRef);
    var totalActs = activitiesRef.length;

    try {
      warm(packRef);
    } catch (_) {}

    var box = document.createElement("div");
    box.id = "birles-kristal-overlay";
    box.className = "birles-kristal is-booting";
    box.innerHTML =
      '<div class="birles-kristal__backdrop"></div>' +
      '<div class="birles-kristal__boot" role="status" aria-live="polite">' +
      '  <div class="birles-kristal__boot-crystal" aria-hidden="true">' +
      '    <span class="birles-kristal__boot-facet"></span>' +
      '    <span class="birles-kristal__boot-facet birles-kristal__boot-facet--2"></span>' +
      '    <span class="birles-kristal__boot-glow"></span>' +
      "  </div>" +
      '  <p class="birles-kristal__boot-title">Kristal Mağarası</p>' +
      '  <p class="birles-kristal__boot-text">Mağara hazırlanıyor…</p>' +
      '  <div class="birles-kristal__boot-bar" aria-hidden="true"><i></i></div>' +
      '  <button type="button" class="birles-kristal__boot-close" data-kristal-close="1" aria-label="Kapat">✕</button>' +
      "</div>" +
      '<div class="birles-kristal__stage" role="dialog" aria-label="Kristal Mağarası" aria-hidden="true">' +
      '  <div class="birles-kristal__frame">' +
      '    <video class="birles-kristal__video" src="' +
      esc(VIDEO_SRC) +
      '" playsinline muted loop preload="auto"></video>' +
      '    <div class="birles-kristal__slots" aria-label="Çerçeveler">' +
      slotsHtml(data) +
      "    </div>" +
      "  </div>" +
      "</div>" +
      '<p class="birles-kristal__ask">' +
      esc(q) +
      "</p>" +
      '<button type="button" class="birles-kristal__close" data-kristal-close="1" aria-label="Kapat">✕</button>' +
      '<p class="birles-kristal__hint">' +
      (totalActs > 1
        ? "Doğru olanların hepsine dokun · 1/" + totalActs
        : "Doğru olanların hepsine dokun") +
      "</p>" +
      '<button type="button" class="birles-kristal__next" data-kristal-next="1" hidden aria-hidden="true">İleri ›</button>' +
      '<button type="button" class="birles-kristal__exit" data-kristal-done="1" hidden aria-hidden="true" aria-label="Bitir">✓</button>';

    /* Önce Kristal DOM’da olsun — yeşil maske/Ses Evreni’nden önce */
    var mount = document.documentElement || document.body;
    mount.appendChild(box);
    hostEl = box;

    forceHideBirlesMask();
    try {
      document.body.classList.add("birles-kristal-fs");
      if (typeof window.novaSyncPerfRuntime === "function") {
        window.novaSyncPerfRuntime();
      } else {
        document.body.style.zoom = "1";
        document.body.style.transform = "none";
        document.body.style.width = "100%";
      }
    } catch (_) {}

    try {
      if (typeof window.__birlesClearHubCover === "function") {
        window.__birlesClearHubCover();
      }
      var birlesOv = document.getElementById("birlestirelim-overlay");
      if (birlesOv) {
        birlesOv.setAttribute("data-kristal-under", "1");
        birlesOv.style.setProperty("visibility", "hidden", "important");
        birlesOv.style.setProperty("pointer-events", "none", "important");
        birlesOv.style.setProperty("z-index", "1", "important");
      }
    } catch (_) {}

    bindLayout();
    layoutStage();
    requestAnimationFrame(function () {
      layoutStage();
      requestAnimationFrame(layoutStage);
    });

    box.querySelectorAll("[data-kristal-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        /* Ortada çıkış: yıldız yok. Son etkinlik bitince X = tamam. */
        if (finishing && activityIdx >= activitiesRef.length - 1) {
          finishSuccess();
          return;
        }
        var cb = onDoneCb;
        close();
        if (typeof cb === "function") cb({ success: false, closed: true });
      });
    });

    box.querySelectorAll("[data-kristal-done]").forEach(function (el) {
      el.addEventListener("click", function () {
        finishSuccess();
      });
    });

    box.querySelectorAll("[data-kristal-next]").forEach(function (el) {
      el.addEventListener("click", function () {
        goNextActivity();
      });
    });

    box.querySelectorAll("[data-kristal-slot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-kristal-slot"));
        onSlotClick(btn, idx, data);
      });
    });

    var vid = box.querySelector(".birles-kristal__video");

    /* Hemen göster — video beklerken yeşil boş ekran olmasın */
    setTimeout(function () {
      if (token !== openToken || !box.parentNode) return;
      revealReady(box, vid, token);
    }, 280);

    var warmOk = Promise.resolve(warmPromise).catch(function () {
      return null;
    });
    Promise.all([
      waitVideoReady(vid, 8000),
      waitPhotosInDom(box),
      warmOk
    ])
      .then(function () {
        if (token !== openToken || !box.parentNode) return;
        revealReady(box, vid, token);
      })
      .catch(function () {
        if (token !== openToken || !box.parentNode) return;
        revealReady(box, vid, token);
      });
  }

  global.NovaBirlestirelimKristal = {
    open: open,
    close: close,
    warm: warm,
    hasKristal: hasKristal,
    normalize: normalizeKristal,
    listActivities: listActivities,
    SLOT_COUNT: SLOT_COUNT
  };
})(typeof window !== "undefined" ? window : this);
