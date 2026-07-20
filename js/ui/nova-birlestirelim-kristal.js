/**
 * Kristal Mağarası — 9:16 video + 6 çerçeveli çoklu seçim
 * Admin: birlestirelim/letters/{soundId}/kristal =
 *   { question?, images:[{imageUrl,correct,label,glow}] }
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

  function normalizeKristal(pack) {
    var k = pack && pack.kristal;
    if (!k || typeof k !== "object") return { question: "", images: [] };
    var images = Array.isArray(k.images) ? k.images : [];
    var out = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      var row = images[i] || {};
      out.push({
        imageUrl: String(row.imageUrl || row.url || "").trim(),
        correct: !!(row.correct === true || row.correct === 1 || row.correct === "1"),
        label: String(row.label || row.name || "").trim(),
        glow: String(row.glow || row.highlight || "").trim()
      });
    }
    return {
      question: String(k.question || "").trim(),
      images: out
    };
  }

  function hasKristal(pack) {
    var data = normalizeKristal(pack);
    return data.images.some(function (img) {
      return !!img.imageUrl;
    });
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

  function waitPhotosInDom(root) {
    var imgs = root ? root.querySelectorAll(".birles-kristal__photo") : [];
    var tasks = [];
    for (var i = 0; i < imgs.length; i++) {
      (function (el) {
        tasks.push(
          new Promise(function (resolve) {
            function finish() {
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
          })
        );
      })(imgs[i]);
    }
    return Promise.all(tasks);
  }

  /** Ses hub’ında kart görünür görünmez video+foto önbelleğe alınır */
  function warm(pack) {
    var data = normalizeKristal(pack);
    var photoTasks = data.images.map(function (img) {
      return loadImage(img.imageUrl);
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

  function close() {
    openToken += 1;
    finishing = false;
    unbindLayout();
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    hostEl = null;
    soundRef = null;
    packRef = null;
    picked = {};
    onDoneCb = null;
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
    if (ask) ask.textContent = "Kristal kelimeler!";

    var hint = hostEl.querySelector(".birles-kristal__hint");
    if (hint) hint.hidden = true;

    var exitBtn = hostEl.querySelector(".birles-kristal__exit");
    if (exitBtn) {
      exitBtn.hidden = false;
      exitBtn.setAttribute("aria-hidden", "false");
    }

    hostEl.querySelectorAll("[data-kristal-slot]").forEach(function (btn) {
      btn.classList.add("is-locked");
    });
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

    if (img.correct) {
      picked[idx] = true;
      markSlot(btn, true);
      btn.classList.add("is-locked");
      if (allCorrectFound(data)) {
        setTimeout(function () {
          revealNames(data);
        }, 420);
      }
      return;
    }

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

    var data = normalizeKristal(packRef);
    var q = data.question || defaultQuestion(soundRef);

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
      '  <p class="birles-kristal__ask">' +
      esc(q) +
      "</p>" +
      '  <button type="button" class="birles-kristal__close" data-kristal-close="1" aria-label="Kapat">✕</button>' +
      '  <p class="birles-kristal__hint">Doğru olanların hepsine dokun</p>' +
      '  <button type="button" class="birles-kristal__exit" data-kristal-done="1" hidden aria-hidden="true" aria-label="Kapat">✕</button>' +
      "</div>";

    document.body.appendChild(box);
    hostEl = box;
    bindLayout();
    layoutStage();

    box.querySelectorAll("[data-kristal-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (finishing) {
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

    box.querySelectorAll("[data-kristal-slot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-kristal-slot"));
        onSlotClick(btn, idx, data);
      });
    });

    var vid = box.querySelector(".birles-kristal__video");
    var minShow = new Promise(function (r) {
      setTimeout(r, 480);
    });

    Promise.all([
      waitVideoReady(vid, 25000),
      waitPhotosInDom(box),
      warmPromise || Promise.resolve(),
      minShow
    ]).then(function () {
      revealReady(box, vid, token);
    });
  }

  global.NovaBirlestirelimKristal = {
    open: open,
    close: close,
    warm: warm,
    hasKristal: hasKristal,
    normalize: normalizeKristal,
    SLOT_COUNT: SLOT_COUNT
  };
})(typeof window !== "undefined" ? window : this);
