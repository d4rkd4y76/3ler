/**
 * Harf yazılışı — izle + pratik.
 * Mobil: CSS transition yerine rAF (dashoffset telefonlarda anında atlamasın).
 * Hamle süresi: varsa admin MP3 süresi, yoksa yavaş varsayılan.
 */
(function () {
  "use strict";

  function data() {
    return window.NovaBirlestirelimYazilisData || null;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pace(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function pathLen(pathEl) {
    try {
      return pathEl.getTotalLength();
    } catch (e) {
      return 0;
    }
  }

  function samplePath(pathEl, n) {
    var len = pathLen(pathEl);
    var pts = [];
    if (!len) return pts;
    /* Uzun yollarda daha sık örnek — ilerleme hassas olsun */
    n = Math.max(16, n || Math.round(Math.max(48, len / 3.2)));
    for (var i = 0; i <= n; i++) {
      var p = pathEl.getPointAtLength((i / n) * len);
      var pt = { x: p.x, y: p.y, t: i / n };
      if (i > 0) {
        pt.dx = pt.x - pts[i - 1].x;
        pt.dy = pt.y - pts[i - 1].y;
      } else {
        pt.dx = 0;
        pt.dy = 0;
      }
      pts.push(pt);
    }
    return pts;
  }

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function openYazilis(opts) {
    opts = opts || {};
    var D = data();
    var sound = opts.sound;
    var body = opts.body;
    if (!D || !sound || !body || !D.hasWriting(sound.id)) return;

    var letters = D.lettersForSound(sound.id);
    var activeKey = letters[0] ? letters[0].id : "a";
    var mode = "demo";
    var strokeIndex = 0;
    var animToken = 0;
    var practiceDone = {};
    var strokeAudio = null;
    var letterPack = opts.letterPack || {};

    if (opts.setBack) opts.setBack(true);
    if (opts.setHeader) {
      opts.setHeader(
        "Yazılış · " + String(sound.displayUpper || "A"),
        "Dik temel · hamleleri izle, sonra yaz",
        "Maarif"
      );
    }

    function letter() {
      return D.getLetter(activeKey);
    }

    function stopStrokeAudio() {
      if (!strokeAudio) return;
      try {
        strokeAudio.pause();
        strokeAudio.currentTime = 0;
      } catch (e) {}
      strokeAudio = null;
    }

    /* Pratik SFX · Web Audio (mp3 yok) */
    var sfxCtx = null;
    var lastFailSfxAt = 0;
    function ensureSfxCtx() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!sfxCtx) sfxCtx = new AC();
      if (sfxCtx.state === "suspended") {
        try {
          sfxCtx.resume();
        } catch (e) {}
      }
      return sfxCtx;
    }
    function playBuzzSfx() {
      var nowMs = Date.now();
      if (nowMs - lastFailSfxAt < 280) return;
      lastFailSfxAt = nowMs;
      var ctx = ensureSfxCtx();
      if (!ctx) return;
      var t0 = ctx.currentTime;
      var dur = 0.22;
      /* Belirgin dijital cızzz: gürültü + çift testere */
      var bufLen = Math.floor(ctx.sampleRate * dur);
      var noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = noiseBuf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        var env = 1 - i / bufLen;
        data[i] = (Math.random() * 2 - 1) * env * env;
      }
      var noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      var nFilter = ctx.createBiquadFilter();
      nFilter.type = "bandpass";
      nFilter.frequency.setValueAtTime(1800, t0);
      nFilter.frequency.exponentialRampToValueAtTime(320, t0 + 0.2);
      nFilter.Q.value = 2.2;
      var nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, t0);
      nGain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.01);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(t0);
      noise.stop(t0 + dur);

      var osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(520, t0);
      osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.18);
      var oFilter = ctx.createBiquadFilter();
      oFilter.type = "lowpass";
      oFilter.frequency.setValueAtTime(2400, t0);
      oFilter.frequency.exponentialRampToValueAtTime(500, t0 + 0.18);
      var oGain = ctx.createGain();
      oGain.gain.setValueAtTime(0.0001, t0);
      oGain.gain.exponentialRampToValueAtTime(0.38, t0 + 0.012);
      oGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      osc.connect(oFilter);
      oFilter.connect(oGain);
      oGain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);

      var osc2 = ctx.createOscillator();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(260, t0);
      osc2.frequency.exponentialRampToValueAtTime(70, t0 + 0.16);
      var o2Gain = ctx.createGain();
      o2Gain.gain.setValueAtTime(0.0001, t0);
      o2Gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.015);
      o2Gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.17);
      osc2.connect(o2Gain);
      o2Gain.connect(ctx.destination);
      osc2.start(t0);
      osc2.stop(t0 + 0.18);
    }
    function playTickSfx(strong) {
      var ctx = ensureSfxCtx();
      if (!ctx) return;
      var t0 = ctx.currentTime;
      /* Net “tik”: kısa tık + parlak zil */
      var click = ctx.createOscillator();
      click.type = "square";
      click.frequency.setValueAtTime(strong ? 2100 : 1800, t0);
      var cGain = ctx.createGain();
      cGain.gain.setValueAtTime(0.0001, t0);
      cGain.gain.exponentialRampToValueAtTime(strong ? 0.28 : 0.2, t0 + 0.003);
      cGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      click.connect(cGain);
      cGain.connect(ctx.destination);
      click.start(t0);
      click.stop(t0 + 0.055);

      var bell = ctx.createOscillator();
      bell.type = "sine";
      bell.frequency.setValueAtTime(strong ? 1040 : 920, t0);
      bell.frequency.exponentialRampToValueAtTime(strong ? 1560 : 1380, t0 + 0.05);
      var bGain = ctx.createGain();
      bGain.gain.setValueAtTime(0.0001, t0);
      bGain.gain.exponentialRampToValueAtTime(strong ? 0.42 : 0.3, t0 + 0.01);
      bGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (strong ? 0.28 : 0.16));
      bell.connect(bGain);
      bGain.connect(ctx.destination);
      bell.start(t0);
      bell.stop(t0 + 0.3);

      var harm = ctx.createOscillator();
      harm.type = "triangle";
      harm.frequency.setValueAtTime(strong ? 1560 : 1380, t0 + 0.01);
      var hGain = ctx.createGain();
      hGain.gain.setValueAtTime(0.0001, t0 + 0.01);
      hGain.gain.exponentialRampToValueAtTime(strong ? 0.18 : 0.12, t0 + 0.025);
      hGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (strong ? 0.22 : 0.12));
      harm.connect(hGain);
      hGain.connect(ctx.destination);
      harm.start(t0 + 0.01);
      harm.stop(t0 + 0.25);

      if (strong) {
        var sparkle = ctx.createOscillator();
        sparkle.type = "sine";
        sparkle.frequency.setValueAtTime(2200, t0 + 0.06);
        var sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.0001, t0 + 0.06);
        sGain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.08);
        sGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
        sparkle.connect(sGain);
        sGain.connect(ctx.destination);
        sparkle.start(t0 + 0.06);
        sparkle.stop(t0 + 0.34);
      }
    }

    function strokeAudioUrl(strokeIdx) {
      var L = letter();
      if (!L) return "";
      var y = letterPack.yazilis;
      if (y && typeof y === "object") {
        var arr = y[activeKey] || y[L.id];
        if (Array.isArray(arr) && arr[strokeIdx]) {
          return String(arr[strokeIdx] || "").trim();
        }
      }
      var s = L.strokes[strokeIdx];
      return s && s.audioUrl ? String(s.audioUrl).trim() : "";
    }

    /** Hamle süresi (ms): MP3 varsa onun uzunluğu, yoksa yavaş varsayılan. */
    function resolveDurationMs(pathEl, strokeIdx) {
      var url = strokeAudioUrl(strokeIdx);
      var len = pathLen(pathEl);
      var fallback = Math.min(7000, Math.max(2800, len * 14));
      if (!url) return Promise.resolve(fallback);

      return new Promise(function (resolve) {
        var a = new Audio();
        var done = false;
        function finish(ms) {
          if (done) return;
          done = true;
          resolve(Math.max(1800, ms || fallback));
        }
        a.preload = "metadata";
        a.addEventListener("loadedmetadata", function () {
          var d = a.duration;
          finish(d && isFinite(d) && d > 0.2 ? d * 1000 : fallback);
        });
        a.addEventListener("error", function () {
          finish(fallback);
        });
        setTimeout(function () {
          finish(fallback);
        }, 3500);
        a.src = url;
      });
    }

    function playStrokeNarration(url, token) {
      stopStrokeAudio();
      if (!url) return Promise.resolve();
      return new Promise(function (resolve) {
        if (token !== animToken) {
          resolve();
          return;
        }
        var a = new Audio(url);
        strokeAudio = a;
        var settled = false;
        function end() {
          if (settled) return;
          settled = true;
          if (strokeAudio === a) strokeAudio = null;
          resolve();
        }
        a.addEventListener("ended", end);
        a.addEventListener("error", end);
        a.play().catch(function () {
          end();
        });
      });
    }

    /**
     * Telefon uyumlu çizim: CSS transition kullanma → rAF ile dashoffset.
     */
    function animateStrokeDraw(pathEl, durationMs, token) {
      return new Promise(function (resolve) {
        if (!pathEl || token !== animToken) {
          resolve();
          return;
        }
        pathEl.removeAttribute("pathLength");
        var len = pathLen(pathEl);
        if (!len) {
          resolve();
          return;
        }
        /* Subpixel titremeyi azalt: uzunluğu sabitle */
        len = Math.round(len * 100) / 100;
        pathEl.style.transition = "none";
        pathEl.style.webkitTransition = "none";
        pathEl.style.strokeDasharray = len + " " + len;
        pathEl.style.strokeDashoffset = String(len);
        void pathEl.getBoundingClientRect();

        var t0 = null;
        function frame(now) {
          if (token !== animToken) {
            resolve();
            return;
          }
          if (t0 == null) t0 = now;
          var t = Math.min(1, (now - t0) / Math.max(16, durationMs));
          /* Lineer: MP3 süresiyle birebir uyum */
          var off = Math.round(len * (1 - t) * 100) / 100;
          pathEl.style.strokeDashoffset = String(off);
          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            pathEl.style.strokeDashoffset = "0";
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    function hideAllDots() {
      body.querySelectorAll(".birles-yaz__dot").forEach(function (g) {
        g.setAttribute("hidden", "hidden");
        g.setAttribute("aria-hidden", "true");
        g.classList.remove("is-on");
      });
    }

    /* Yalnız aktif hamle numarası · merkez = path başlangıcı */
    function placeDot(i) {
      var L = letter();
      var path = body.querySelector('.birles-yaz__stroke[data-stroke="' + i + '"]');
      var g = body.querySelector('.birles-yaz__dot[data-dot="' + i + '"]');
      if (!path || !g || !L || !L.strokes[i]) return;
      hideAllDots();
      var stroke = L.strokes[i];
      var pt = path.getPointAtLength(0);
      g.removeAttribute("hidden");
      g.setAttribute("aria-hidden", "false");
      g.setAttribute(
        "transform",
        "translate(" + Math.round(pt.x * 10) / 10 + " " + Math.round(pt.y * 10) / 10 + ")"
      );
      g.classList.add("is-on");
      /* sameHamle: metin hep 1 (veya label) kalır */
      var num = g.querySelector(".birles-yaz__dot-num");
      if (num) num.textContent = stroke.label || "1";
    }

    function renderShell() {
      stopStrokeAudio();
      animToken += 1;
      var L = letter();
      body.innerHTML =
        '<div class="birles-yaz" style="--chip:' +
        esc(sound.color || "#e4572e") +
        '">' +
        '<div class="birles-yaz__top">' +
        '<div class="birles-yaz__cases" role="tablist">' +
        letters
          .map(function (x) {
            return (
              '<button type="button" class="birles-yaz__case' +
              (x.id === activeKey ? " is-on" : "") +
              '" data-case="' +
              esc(x.id) +
              '" role="tab" aria-selected="' +
              (x.id === activeKey ? "true" : "false") +
              '">' +
              esc(x.label) +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<p class="birles-yaz__meta" id="birles-yaz-meta">' +
        esc(L ? L.hint : "") +
        "</p>" +
        "</div>" +
        '<div class="birles-yaz__stage" id="birles-yaz-stage">' +
        boardHtml(L) +
        "</div>" +
        '<p class="birles-yaz__tip" id="birles-yaz-tip"></p>' +
        '<div class="birles-yaz__actions">' +
        '<button type="button" class="birles-yaz-act birles-yaz-act--demo" id="birles-yaz-demo">' +
        '<span class="birles-yaz-act__ico" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M8 5.5v13l11-6.5L8 5.5z"/></svg>' +
        "</span>" +
        '<span class="birles-yaz-act__txt"><strong>İzle</strong><small>nasıl yazılır</small></span>' +
        "</button>" +
        '<button type="button" class="birles-yaz-act birles-yaz-act--write" id="birles-yaz-practice">' +
        '<span class="birles-yaz-act__ico" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M4 19h16v2H4v-2zm2.3-3.4l8.1-8.1 2.1 2.1-8.1 8.1H6.3v-2.1zm10.4-8.3 1.5-1.5a1.2 1.2 0 0 1 1.7 0l1.4 1.4a1.2 1.2 0 0 1 0 1.7l-1.5 1.5-3.1-3.1z"/></svg>' +
        "</span>" +
        '<span class="birles-yaz-act__txt"><strong>Sen yaz</strong><small>şimdi dene</small></span>' +
        "</button>" +
        '<button type="button" class="birles-yaz-act birles-yaz-act--back" id="birles-yaz-back">' +
        '<span class="birles-yaz-act__ico" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M11 7l-5 5 5 5V7zm2 0v10l5-5-5-5z"/></svg>' +
        "</span>" +
        '<span class="birles-yaz-act__txt"><strong>Sese dön</strong><small>geri git</small></span>' +
        "</button>" +
        "</div>" +
        '<p class="birles-yaz__status" id="birles-yaz-status" hidden></p>' +
        "</div>";

      wire();
      setTip(L && L.strokes[0] ? L.strokes[0].tip : "");
      /* Hamle 1 numarası path başlangıcında — sonra demo */
      placeDot(0);
      runDemo();
    }

    function boardHtml(L) {
      if (!L) return "";
      var guides =
        '<line class="birles-yaz__guide" x1="16" y1="40" x2="184" y2="40" />' +
        '<line class="birles-yaz__guide birles-yaz__guide--mid" x1="16" y1="120" x2="184" y2="120" />' +
        '<line class="birles-yaz__guide" x1="16" y1="200" x2="184" y2="200" />';

      var ghosts = L.strokes
        .map(function (s, i) {
          return (
            '<path class="birles-yaz__ghost" data-ghost="' +
            i +
            '" d="' +
            esc(s.d) +
            '" fill="none" />'
          );
        })
        .join("");

      /* pathLength kullanma — mobilde dash animasyonu bozuluyor */
      var strokes = L.strokes
        .map(function (s, i) {
          return (
            '<path class="birles-yaz__stroke" data-stroke="' +
            i +
            '" d="' +
            esc(s.d) +
            '" fill="none" />'
          );
        })
        .join("");

      var dots = L.strokes
        .map(function (s, i) {
          return (
            '<g class="birles-yaz__dot" data-dot="' +
            i +
            '" hidden>' +
            '<circle r="8" class="birles-yaz__dot-ring" />' +
            '<text class="birles-yaz__dot-num">' +
            esc(s.label || "1") +
            "</text>" +
            "</g>"
          );
        })
        .join("");

      return (
        '<svg class="birles-yaz__svg" viewBox="0 0 200 286" shape-rendering="geometricPrecision" aria-label="' +
        esc(L.title) +
        ' yazılışı">' +
        '<rect class="birles-yaz__paper" x="8" y="6" width="184" height="274" rx="20" />' +
        guides +
        '<g class="birles-yaz__ghosts">' +
        ghosts +
        "</g>" +
        '<g class="birles-yaz__inks">' +
        strokes +
        "</g>" +
        '<g class="birles-yaz__dots">' +
        dots +
        "</g>" +
        '<path class="birles-yaz__user" id="birles-yaz-user" d="" fill="none" />' +
        '<circle class="birles-yaz__pen" id="birles-yaz-pen" r="5" hidden />' +
        "</svg>" +
        '<div class="birles-yaz__hit" id="birles-yaz-hit" aria-hidden="true"></div>'
      );
    }

    function setTip(t) {
      var el = document.getElementById("birles-yaz-tip");
      if (el) {
        el.textContent = "";
        el.hidden = true;
      }
    }

    function setStatus(msg, ok) {
      var el = document.getElementById("birles-yaz-status");
      if (!el) return;
      el.hidden = true;
      el.textContent = "";
      el.classList.remove("is-ok", "is-bad");
    }

    function strokeEls() {
      return Array.prototype.slice.call(body.querySelectorAll(".birles-yaz__stroke"));
    }

    function resetStrokesVisual() {
      strokeEls().forEach(function (p) {
        p.style.transition = "none";
        p.style.webkitTransition = "none";
        p.removeAttribute("pathLength");
        var len = pathLen(p) || 1;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.classList.remove("is-done", "is-live", "is-fail");
      });
      hideAllDots();
      var user = document.getElementById("birles-yaz-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yaz-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
    }

    function markAct(which) {
      var demo = document.getElementById("birles-yaz-demo");
      var prac = document.getElementById("birles-yaz-practice");
      if (demo) demo.classList.toggle("is-on", which === "demo");
      if (prac) prac.classList.toggle("is-on", which === "practice");
    }

    async function runDemo() {
      stopStrokeAudio();
      unbindPractice();
      var token = ++animToken;
      mode = "demo";
      strokeIndex = 0;
      practiceDone = {};
      markAct("demo");
      setStatus("");
      resetStrokesVisual();
      var L = letter();
      if (!L) return;
      var paths = strokeEls();
      /* layout hazır olsun (özellikle mobil) */
      await pace(120);
      void (body.querySelector(".birles-yaz__svg") && body.querySelector(".birles-yaz__svg").getBoundingClientRect());
      await pace(280);
      if (token !== animToken) return;

      for (var i = 0; i < paths.length; i++) {
        if (token !== animToken) return;
        strokeIndex = i;
        setTip(L.strokes[i].tip);
        placeDot(i);
        var p = paths[i];
        p.classList.add("is-live");
        p.classList.remove("is-done", "is-fail");

        var url = strokeAudioUrl(i);
        var dur = await resolveDurationMs(p, i);
        if (token !== animToken) return;

        /* Ses + çizim birlikte */
        var narr = playStrokeNarration(url, token);
        await animateStrokeDraw(p, dur, token);
        if (token !== animToken) return;

        p.classList.remove("is-live");
        p.classList.add("is-done");
        hideAllDots();

        /* Ses hâlâ sürüyorsa kısa bekle (animasyon = ses süresi ise genelde bitmiştir) */
        var waitMore = 0;
        if (strokeAudio && strokeAudio.duration && isFinite(strokeAudio.duration)) {
          try {
            waitMore = Math.max(0, (strokeAudio.duration - strokeAudio.currentTime) * 1000);
          } catch (e) {}
        }
        if (waitMore > 80) await pace(Math.min(waitMore, 8000));
        await narr;
        if (token !== animToken) return;
        /* sameHamle devamı kısa ara (el kaldırmadan) */
        var next = L.strokes[i + 1];
        await pace(next && next.sameHamle ? 140 : 320);
      }
      if (token !== animToken) return;
      stopStrokeAudio();
      setTip("Harika! Şimdi “Sen yaz”a dokun ve sen çiz.");
      setStatus("İzleme bitti · sıra sende!", true);
      markAct("practice");
    }

    function svgPoint(clientX, clientY) {
      var svg = body.querySelector(".birles-yaz__svg");
      if (!svg) return null;
      var pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    }

    function startPractice() {
      stopStrokeAudio();
      animToken += 1;
      mode = "practice";
      strokeIndex = 0;
      practiceDone = {};
      markAct("practice");
      resetStrokesVisual();
      setStatus("Sarı noktadan başla · parmağınla çiz", true);
      var L = letter();
      if (L && L.strokes[0]) setTip(L.strokes[0].tip);
      placeDot(0);
      bindPractice();
    }

    var practiceBound = false;
    var drawing = false;
    var samples = [];
    var progress = 0;
    var userPts = [];
    var missStreak = 0;
    var lastPointerId = null;
    var seamlessHold = false;

    function unbindPractice() {
      var hit = document.getElementById("birles-yaz-hit");
      if (!hit || !practiceBound) return;
      hit.onpointerdown = null;
      hit.onpointermove = null;
      hit.onpointerup = null;
      hit.onpointercancel = null;
      practiceBound = false;
    }

    function sampleBudget(pathEl) {
      var len = pathLen(pathEl) || 80;
      return Math.round(Math.max(40, Math.min(120, len / 2.8)));
    }

    function paintProgressInk() {
      var ink = body.querySelector('.birles-yaz__stroke[data-stroke="' + strokeIndex + '"]');
      if (!ink || !samples.length) return;
      var len = pathLen(ink) || 1;
      ink.style.transition = "none";
      ink.style.strokeDasharray = String(len);
      ink.style.strokeDashoffset = String(len * (1 - progress / Math.max(1, samples.length - 1)));
      ink.classList.add("is-live");
    }

    /** Yol boyunca ileri doğru eşle; geriye/çakışan parçaya zıplama. */
    function advanceAlongPath(pt, prevPt) {
      if (!samples.length) return { ok: false, far: true };
      var windowN = 18;
      var tol = 26;
      var best = -1;
      var bestScore = 1e9;
      var moveDx = prevPt ? pt.x - prevPt.x : 0;
      var moveDy = prevPt ? pt.y - prevPt.y : 0;
      var moveLen = Math.sqrt(moveDx * moveDx + moveDy * moveDy) || 0;

      for (var i = progress; i < samples.length && i <= progress + windowN; i++) {
        var d = dist(pt, samples[i]);
        if (d > tol + 8) continue;
        var score = d;
        /* İlerleme tercihi: path yönüyle aynı hareket biraz avantajlı */
        if (moveLen > 1.2 && samples[i].dx !== undefined) {
          var pLen = Math.sqrt(samples[i].dx * samples[i].dx + samples[i].dy * samples[i].dy) || 1;
          var align = (moveDx * samples[i].dx + moveDy * samples[i].dy) / (moveLen * pLen);
          score -= Math.max(0, align) * 6;
        }
        /* Çok uzağa sıçramayı cezalandır */
        score += (i - progress) * 0.15;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }

      if (best < 0) {
        var nearest = dist(pt, samples[Math.min(progress, samples.length - 1)]);
        return { ok: false, far: nearest > tol };
      }
      if (best >= progress) progress = best;
      return { ok: true, far: false };
    }

    function beginStrokeAt(pt) {
      drawing = true;
      missStreak = 0;
      progress = 0;
      userPts = [pt];
      var pen = document.getElementById("birles-yaz-pen");
      if (pen) {
        pen.removeAttribute("hidden");
        pen.setAttribute("cx", pt.x);
        pen.setAttribute("cy", pt.y);
      }
      paintUser();
      paintProgressInk();
    }

    function bindPractice(opts) {
      opts = opts || {};
      unbindPractice();
      var hit = document.getElementById("birles-yaz-hit");
      var path = body.querySelector('.birles-yaz__stroke[data-stroke="' + strokeIndex + '"]');
      if (!hit || !path) return;
      samples = samplePath(path, sampleBudget(path));
      progress = 0;
      userPts = [];
      missStreak = 0;
      drawing = false;
      practiceBound = true;
      hit.style.pointerEvents = "auto";
      hit.style.touchAction = "none";

      /* Aynı hamle devamı: parmak hâlâ basılıysa kaldırılmadan sürdür */
      if (opts.seamless && opts.pt && samples.length && dist(opts.pt, samples[0]) <= 30) {
        seamlessHold = true;
        beginStrokeAt(opts.pt);
        advanceAlongPath(opts.pt, null);
        paintProgressInk();
      } else {
        seamlessHold = false;
      }

      hit.onpointerdown = function (e) {
        if (mode !== "practice") return;
        e.preventDefault();
        lastPointerId = e.pointerId;
        try {
          hit.setPointerCapture(e.pointerId);
        } catch (err) {}
        var pt = svgPoint(e.clientX, e.clientY);
        if (!pt || !samples.length) return;
        if (dist(pt, samples[0]) > 28) {
          failStroke("Sarı noktadan başla");
          return;
        }
        beginStrokeAt(pt);
      };

      hit.onpointermove = function (e) {
        if (!drawing || mode !== "practice") return;
        e.preventDefault();
        var pt = svgPoint(e.clientX, e.clientY);
        if (!pt) return;
        var prev = userPts.length ? userPts[userPts.length - 1] : null;
        userPts.push(pt);
        var pen = document.getElementById("birles-yaz-pen");
        if (pen) {
          pen.setAttribute("cx", pt.x);
          pen.setAttribute("cy", pt.y);
        }
        paintUser();

        var adv = advanceAlongPath(pt, prev);
        if (adv.far) {
          missStreak += 1;
          if (missStreak >= 4) {
            failStroke("Yönü kaçırdın · tekrar dene");
            return;
          }
        } else {
          missStreak = 0;
          paintProgressInk();
        }

        if (progress >= samples.length - 2) {
          completeStroke({ keepPointer: true, pt: pt, pointerId: e.pointerId });
        }
      };

      hit.onpointerup = function (e) {
        if (!drawing) {
          var penIdle = document.getElementById("birles-yaz-pen");
          if (penIdle) penIdle.setAttribute("hidden", "hidden");
          return;
        }
        drawing = false;
        seamlessHold = false;
        try {
          hit.releasePointerCapture(e.pointerId);
        } catch (err) {}
        var pen = document.getElementById("birles-yaz-pen");
        if (pen) pen.setAttribute("hidden", "hidden");
        /* Neredeyse bitmişse başarılı say */
        if (progress >= Math.floor(samples.length * 0.82)) {
          completeStroke({});
          return;
        }
        if (progress < samples.length - 4) {
          failStroke("Hamleyi tamamla");
        }
      };
      hit.onpointercancel = hit.onpointerup;
    }

    function paintUser() {
      var user = document.getElementById("birles-yaz-user");
      if (!user || userPts.length < 1) return;
      var d = "M " + userPts[0].x.toFixed(1) + " " + userPts[0].y.toFixed(1);
      for (var i = 1; i < userPts.length; i++) {
        d += " L " + userPts[i].x.toFixed(1) + " " + userPts[i].y.toFixed(1);
      }
      user.setAttribute("d", d);
    }

    function failStroke(msg) {
      drawing = false;
      playBuzzSfx();
      var ink = body.querySelector('.birles-yaz__stroke[data-stroke="' + strokeIndex + '"]');
      if (ink) {
        ink.classList.add("is-fail");
        var len = pathLen(ink) || 1;
        ink.style.strokeDasharray = String(len);
        ink.style.strokeDashoffset = String(len);
      }
      setStatus(msg || "Tekrar dene", false);
      var stage = document.getElementById("birles-yaz-stage");
      if (stage) {
        stage.classList.remove("is-shake");
        void stage.offsetWidth;
        stage.classList.add("is-shake");
      }
      setTimeout(function () {
        if (mode !== "practice") return;
        if (ink) ink.classList.remove("is-fail", "is-live");
        resetCurrentStrokePractice();
      }, 650);
    }

    function resetCurrentStrokePractice() {
      var user = document.getElementById("birles-yaz-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yaz-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      userPts = [];
      progress = 0;
      var ink = body.querySelector('.birles-yaz__stroke[data-stroke="' + strokeIndex + '"]');
      if (ink && !practiceDone[strokeIndex]) {
        var len = pathLen(ink) || 1;
        ink.style.strokeDasharray = String(len);
        ink.style.strokeDashoffset = String(len);
        ink.classList.remove("is-live", "is-done");
      }
      placeDot(strokeIndex);
      var L = letter();
      if (L && L.strokes[strokeIndex]) setTip(L.strokes[strokeIndex].tip);
      setStatus("Sarı noktadan tekrar başla", true);
      bindPractice();
    }

    function completeStroke(opts) {
      opts = opts || {};
      if (practiceDone[strokeIndex]) return;
      practiceDone[strokeIndex] = true;
      var keepPointer = !!opts.keepPointer;
      var lastPt = opts.pt || (userPts.length ? userPts[userPts.length - 1] : null);

      drawing = false;
      var ink = body.querySelector('.birles-yaz__stroke[data-stroke="' + strokeIndex + '"]');
      if (ink) {
        ink.style.strokeDashoffset = "0";
        ink.classList.remove("is-live", "is-fail");
        ink.classList.add("is-done");
      }
      hideAllDots();
      var user = document.getElementById("birles-yaz-user");
      if (user) user.setAttribute("d", "");

      var L = letter();
      strokeIndex += 1;
      if (!L || strokeIndex >= L.strokes.length) {
        playTickSfx(true);
        setTip("Süper! Harfi doğru yazdın.");
        setStatus("Aferin · doğru yazdın!", true);
        var penDone = document.getElementById("birles-yaz-pen");
        if (penDone) penDone.setAttribute("hidden", "hidden");
        unbindPractice();
        var hitDone = document.getElementById("birles-yaz-hit");
        if (hitDone) hitDone.style.pointerEvents = "none";
        return;
      }

      playTickSfx(false);
      setTip(L.strokes[strokeIndex].tip);
      var next = L.strokes[strokeIndex];
      if (next.sameHamle) {
        setStatus("1. hamle devam · el kaldırmadan sürdür", true);
      } else {
        var hamleNo = 1;
        for (var hi = 0; hi <= strokeIndex; hi++) {
          if (!L.strokes[hi].sameHamle) hamleNo = Number(L.strokes[hi].label) || hamleNo;
        }
        setStatus(hamleNo + ". hamle · sarı noktadan başla", true);
      }

      /* sameHamle + parmak basılı: sarı noktaya dokunmadan devam */
      if (keepPointer && next.sameHamle && lastPt) {
        placeDot(strokeIndex);
        bindPractice({ seamless: true, pt: lastPt });
        return;
      }

      var pen = document.getElementById("birles-yaz-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      placeDot(strokeIndex);
      bindPractice();
    }

    function wire() {
      body.querySelectorAll("[data-case]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          activeKey = btn.getAttribute("data-case");
          stopStrokeAudio();
          animToken += 1;
          unbindPractice();
          renderShell();
        });
      });
      var demo = document.getElementById("birles-yaz-demo");
      if (demo) {
        demo.addEventListener("click", function () {
          /* Tam sıfırdan: sil baştan */
          stopStrokeAudio();
          unbindPractice();
          practiceDone = {};
          strokeIndex = 0;
          resetStrokesVisual();
          setTip(letter() && letter().strokes[0] ? letter().strokes[0].tip : "");
          setStatus("");
          runDemo();
        });
      }
      var prac = document.getElementById("birles-yaz-practice");
      if (prac) {
        prac.addEventListener("click", function () {
          startPractice();
        });
      }
      var back = document.getElementById("birles-yaz-back");
      if (back) {
        back.addEventListener("click", function () {
          stopStrokeAudio();
          animToken += 1;
          unbindPractice();
          if (opts.onClose) opts.onClose();
        });
      }
    }

    renderShell();
  }

  window.NovaBirlestirelimYazilis = {
    open: openYazilis,
    hasWriting: function (id) {
      var D = data();
      return !!(D && D.hasWriting(id));
    }
  };
})();
