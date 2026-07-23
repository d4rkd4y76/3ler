/**
 * Yazı Ustası — kelime yazılışı (kılavuz çizgili).
 * İlk sürüm: yalnızca O sesi · ot, no
 * Harf stroke’ları NovaBirlestirelimYazilisData’dan alınır.
 */
(function (global) {
  "use strict";

  var CELL_W = 156;
  var PAD_X = 18;
  var VIEW_H = 286;
  var GUIDE_YS = [40, 120, 200];
  var TOL = 34;

  /** Ses → kelime listesi (şimdilik yalnız o) */
  var WORDS_BY_SOUND = {
    o: [
      {
        id: "ot",
        label: "ot",
        say: "ot",
        letters: ["o", "t"],
        hint: "o · t — iki harfi sırayla yaz"
      },
      {
        id: "no",
        label: "no",
        say: "no",
        letters: ["n", "o"],
        hint: "n · o — iki harfi sırayla yaz"
      }
    ]
  };

  function yazData() {
    return global.NovaBirlestirelimYazilisData || null;
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

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function hasYaziUstasi(soundId) {
    var sid = String(soundId || "").toLowerCase();
    return !!(WORDS_BY_SOUND[sid] && WORDS_BY_SOUND[sid].length);
  }

  function wordsForSound(soundId) {
    var sid = String(soundId || "").toLowerCase();
    return (WORDS_BY_SOUND[sid] || []).slice();
  }

  function composeWord(word) {
    var D = yazData();
    if (!D || !word) return null;
    var strokes = [];
    var letters = word.letters || [];
    for (var i = 0; i < letters.length; i++) {
      var L = D.getLetter(letters[i]);
      if (!L || !L.strokes) continue;
      var dx = PAD_X + i * CELL_W;
      for (var j = 0; j < L.strokes.length; j++) {
        var s = L.strokes[j];
        strokes.push({
          id: word.id + "_" + L.id + "_" + (s.id || j),
          label: String(strokes.length + 1),
          d: s.d,
          tip: (L.label || "") + " · " + (s.tip || "Çiz"),
          letterId: L.id,
          letterLabel: L.label,
          letterIndex: i,
          dx: dx,
          sameHamle: !!s.sameHamle
        });
      }
    }
    if (!strokes.length) return null;
    var vbW = PAD_X + letters.length * CELL_W + PAD_X;
    return {
      id: word.id,
      label: word.label,
      say: word.say || word.label,
      hint: word.hint || "",
      letterCount: letters.length,
      viewW: vbW,
      strokes: strokes
    };
  }

  function openYaziUstasi(opts) {
    opts = opts || {};
    var sound = opts.sound;
    var body = opts.body;
    if (!sound || !body || !hasYaziUstasi(sound.id)) return;

    var words = wordsForSound(sound.id)
      .map(composeWord)
      .filter(Boolean);
    if (!words.length) return;

    var activeIdx = 0;
    var mode = "demo";
    var strokeIndex = 0;
    var animToken = 0;
    var completedWords = {};
    var practiceBound = false;

    if (opts.setBack) opts.setBack(true);
    if (opts.setHeader) {
      opts.setHeader(
        "Yazı Ustası · " + String(sound.displayUpper || sound.letter || "O"),
        "Kelimeyi kılavuz çizgide yaz",
        "Yazı"
      );
    }

    function activeWord() {
      return words[activeIdx] || null;
    }

    function allWordsDone() {
      return words.every(function (w) {
        return !!completedWords[w.id];
      });
    }

    /* SFX */
    var sfxCtx = null;
    var lastFailSfxAt = 0;
    function ensureSfxCtx() {
      var AC = global.AudioContext || global.webkitAudioContext;
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
      var osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.14);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    }
    function playTickSfx(strong) {
      var ctx = ensureSfxCtx();
      if (!ctx) return;
      var t0 = ctx.currentTime;
      var bell = ctx.createOscillator();
      bell.type = "sine";
      bell.frequency.setValueAtTime(strong ? 880 : 720, t0);
      var bGain = ctx.createGain();
      bGain.gain.setValueAtTime(0.0001, t0);
      bGain.gain.exponentialRampToValueAtTime(strong ? 0.38 : 0.26, t0 + 0.01);
      bGain.gain.exponentialRampToValueAtTime(0.0001, t0 + (strong ? 0.28 : 0.14));
      bell.connect(bGain);
      bGain.connect(ctx.destination);
      bell.start(t0);
      bell.stop(t0 + 0.3);
    }

    function playWordAudio(token) {
      var W = activeWord();
      var vv = global.NovaKidsVoice;
      if (!W || !vv || !vv.playToken) return Promise.resolve();
      return Promise.resolve(vv.playToken(W.say || W.label, { waitUntilEnd: true })).catch(
        function () {}
      );
    }

    function animateStrokeDraw(pathEl, durationMs, token) {
      return new Promise(function (resolve) {
        if (!pathEl || token !== animToken) {
          resolve();
          return;
        }
        var len = pathLen(pathEl);
        if (!len) {
          resolve();
          return;
        }
        len = Math.round(len * 100) / 100;
        pathEl.style.transition = "none";
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
          pathEl.style.strokeDashoffset = String(Math.round(len * (1 - t) * 100) / 100);
          if (t < 1) requestAnimationFrame(frame);
          else {
            pathEl.style.strokeDashoffset = "0";
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    function hideAllDots() {
      body.querySelectorAll(".birles-yazu__dot").forEach(function (g) {
        g.setAttribute("hidden", "hidden");
        g.classList.remove("is-on");
      });
    }

    function placeDot(i) {
      var W = activeWord();
      var path = body.querySelector('.birles-yazu__stroke[data-stroke="' + i + '"]');
      var g = body.querySelector('.birles-yazu__dot[data-dot="' + i + '"]');
      if (!path || !g || !W || !W.strokes[i]) return;
      hideAllDots();
      var pt = path.getPointAtLength(0);
      var dx = W.strokes[i].dx || 0;
      g.removeAttribute("hidden");
      g.classList.add("is-on");
      g.setAttribute(
        "transform",
        "translate(" +
          Math.round((pt.x + dx) * 10) / 10 +
          " " +
          Math.round(pt.y * 10) / 10 +
          ")"
      );
      var num = g.querySelector(".birles-yazu__dot-num");
      if (num) num.textContent = W.strokes[i].label || "1";
    }

    function boardHtml(W) {
      if (!W) return "";
      var vbW = W.viewW;
      var guides = GUIDE_YS.map(function (y, gi) {
        return (
          '<line class="birles-yazu__guide' +
          (gi === 1 ? " birles-yazu__guide--mid" : "") +
          '" x1="' +
          (PAD_X - 6) +
          '" y1="' +
          y +
          '" x2="' +
          (vbW - PAD_X + 6) +
          '" y2="' +
          y +
          '" />'
        );
      }).join("");

      var ghosts = W.strokes
        .map(function (s, i) {
          return (
            '<g transform="translate(' +
            s.dx +
            ',0)">' +
            '<path class="birles-yazu__ghost" data-ghost="' +
            i +
            '" d="' +
            esc(s.d) +
            '" fill="none" />' +
            "</g>"
          );
        })
        .join("");

      var strokes = W.strokes
        .map(function (s, i) {
          return (
            '<g transform="translate(' +
            s.dx +
            ',0)">' +
            '<path class="birles-yazu__stroke" data-stroke="' +
            i +
            '" d="' +
            esc(s.d) +
            '" fill="none" />' +
            "</g>"
          );
        })
        .join("");

      var dots = W.strokes
        .map(function (s, i) {
          return (
            '<g class="birles-yazu__dot" data-dot="' +
            i +
            '" hidden>' +
            '<circle r="10" class="birles-yazu__dot-ring" />' +
            '<text class="birles-yazu__dot-num">' +
            esc(s.label || "1") +
            "</text>" +
            "</g>"
          );
        })
        .join("");

      var letterTags = "";
      for (var li = 0; li < W.letterCount; li++) {
        letterTags +=
          '<text class="birles-yazu__cell-label" x="' +
          (PAD_X + li * CELL_W + CELL_W * 0.5) +
          '" y="268" text-anchor="middle">' +
          esc((W.strokes.find(function (s) {
            return s.letterIndex === li;
          }) || {}).letterLabel || "") +
          "</text>";
      }

      return (
        '<svg class="birles-yazu__svg" viewBox="0 0 ' +
        vbW +
        " " +
        VIEW_H +
        '" shape-rendering="geometricPrecision" aria-label="' +
        esc(W.label) +
        ' yazılışı">' +
        '<rect class="birles-yazu__paper" x="6" y="6" width="' +
        (vbW - 12) +
        '" height="274" rx="22" />' +
        guides +
        '<g class="birles-yazu__ghosts">' +
        ghosts +
        "</g>" +
        '<g class="birles-yazu__inks">' +
        strokes +
        "</g>" +
        '<g class="birles-yazu__dots">' +
        dots +
        "</g>" +
        letterTags +
        '<path class="birles-yazu__user" id="birles-yazu-user" d="" fill="none" />' +
        '<circle class="birles-yazu__pen" id="birles-yazu-pen" r="6" hidden />' +
        "</svg>" +
        '<div class="birles-yazu__hit" id="birles-yazu-hit" aria-hidden="true"></div>'
      );
    }

    function setTip(t) {
      var el = document.getElementById("birles-yazu-tip");
      if (!el) return;
      el.textContent = t || "";
      el.hidden = !t;
    }

    function setStatus(msg, ok) {
      var el = document.getElementById("birles-yazu-status");
      if (!el) return;
      if (!msg) {
        el.hidden = true;
        el.textContent = "";
        el.classList.remove("is-ok", "is-bad");
        return;
      }
      el.hidden = false;
      el.textContent = msg;
      el.classList.toggle("is-ok", !!ok);
      el.classList.toggle("is-bad", ok === false);
    }

    function strokeEls() {
      return Array.prototype.slice.call(body.querySelectorAll(".birles-yazu__stroke"));
    }

    function resetStrokesVisual() {
      strokeEls().forEach(function (p) {
        p.style.transition = "none";
        var len = pathLen(p) || 1;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.classList.remove("is-done", "is-live", "is-fail");
      });
      hideAllDots();
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
    }

    function markAct(which) {
      var demo = document.getElementById("birles-yazu-demo");
      var prac = document.getElementById("birles-yazu-practice");
      if (demo) demo.classList.toggle("is-on", which === "demo");
      if (prac) prac.classList.toggle("is-on", which === "practice");
    }

    function renderShell() {
      animToken += 1;
      unbindPractice();
      var W = activeWord();
      var doneCount = words.filter(function (w) {
        return completedWords[w.id];
      }).length;

      body.innerHTML =
        '<div class="birles-yazu" style="--chip:' +
        esc(sound.color || "#0d9488") +
        '">' +
        '<div class="birles-yazu__hero">' +
        '<p class="birles-yazu__kicker">Yazı Ustası</p>' +
        '<p class="birles-yazu__headline">Kelimeyi yaz</p>' +
        '<p class="birles-yazu__progress">' +
        doneCount +
        " / " +
        words.length +
        " kelime</p>" +
        "</div>" +
        '<div class="birles-yazu__words" role="tablist">' +
        words
          .map(function (w, i) {
            return (
              '<button type="button" class="birles-yazu__word' +
              (i === activeIdx ? " is-on" : "") +
              (completedWords[w.id] ? " is-done" : "") +
              '" data-word="' +
              i +
              '" role="tab">' +
              esc(w.label) +
              (completedWords[w.id] ? " ✓" : "") +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<p class="birles-yazu__meta">' +
        esc(W ? W.hint : "") +
        "</p>" +
        '<div class="birles-yazu__stage" id="birles-yazu-stage">' +
        boardHtml(W) +
        "</div>" +
        '<p class="birles-yazu__tip" id="birles-yazu-tip"></p>' +
        '<div class="birles-yazu__actions">' +
        '<button type="button" class="birles-yazu-act birles-yazu-act--demo" id="birles-yazu-demo">' +
        "<strong>İzle</strong><small>nasıl yazılır</small></button>" +
        '<button type="button" class="birles-yazu-act birles-yazu-act--write" id="birles-yazu-practice">' +
        "<strong>Sen yaz</strong><small>parmakla çiz</small></button>" +
        '<button type="button" class="birles-yazu-act birles-yazu-act--back" id="birles-yazu-back">' +
        "<strong>Sese dön</strong><small>geri</small></button>" +
        "</div>" +
        '<p class="birles-yazu__status" id="birles-yazu-status" hidden></p>' +
        "</div>";

      wire();
      if (W && W.strokes[0]) setTip(W.strokes[0].tip);
      placeDot(0);
      runDemo();
    }

    async function runDemo() {
      unbindPractice();
      var token = ++animToken;
      mode = "demo";
      strokeIndex = 0;
      markAct("demo");
      setStatus("");
      resetStrokesVisual();
      var W = activeWord();
      if (!W) return;
      var paths = strokeEls();
      await pace(100);
      playWordAudio(token);
      await pace(320);
      if (token !== animToken) return;

      for (var i = 0; i < paths.length; i++) {
        if (token !== animToken) return;
        strokeIndex = i;
        setTip(W.strokes[i].tip);
        placeDot(i);
        var p = paths[i];
        p.classList.add("is-live");
        var len = pathLen(p) || 80;
        var dur = Math.min(5200, Math.max(2200, len * 12));
        await animateStrokeDraw(p, dur, token);
        if (token !== animToken) return;
        p.classList.remove("is-live");
        p.classList.add("is-done");
        hideAllDots();
        await pace(180);
      }
      setTip("Şimdi sen yaz · sarı noktadan başla");
      setStatus("İzledin · Sen yaz’a bas", true);
    }

    function clientToSvg(clientX, clientY) {
      var svg = body.querySelector(".birles-yazu__svg");
      if (!svg) return null;
      var pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    }

    function unbindPractice() {
      var hit = document.getElementById("birles-yazu-hit");
      if (!hit || !practiceBound) return;
      hit.onpointerdown = null;
      hit.onpointermove = null;
      hit.onpointerup = null;
      hit.onpointercancel = null;
      practiceBound = false;
    }

    var drawing = false;
    var samples = [];
    var progress = 0;
    var userPts = [];
    var missStreak = 0;
    var lastPointerId = null;
    var lastPt = null;
    var strokeLock = false;

    function samplePathLocal(pathEl) {
      var len = pathLen(pathEl);
      var pts = [];
      if (!len) return pts;
      var n = Math.max(20, Math.round(Math.max(48, len / 3)));
      var W = activeWord();
      var dx = W && W.strokes[strokeIndex] ? W.strokes[strokeIndex].dx : 0;
      for (var i = 0; i <= n; i++) {
        var p = pathEl.getPointAtLength((i / n) * len);
        var pt = { x: p.x + dx, y: p.y, t: i / n };
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

    function advanceAlongPath(pt, prevPt) {
      if (!samples.length) return { ok: false, far: true };
      var windowN = 20;
      var best = -1;
      var bestScore = 1e9;
      var moveDx = prevPt ? pt.x - prevPt.x : 0;
      var moveDy = prevPt ? pt.y - prevPt.y : 0;
      var moveLen = Math.sqrt(moveDx * moveDx + moveDy * moveDy) || 0;
      for (var i = progress; i < samples.length && i <= progress + windowN; i++) {
        var d = dist(pt, samples[i]);
        if (d > TOL + 10) continue;
        var score = d;
        if (moveLen > 1.2 && samples[i].dx !== undefined) {
          var pLen =
            Math.sqrt(samples[i].dx * samples[i].dx + samples[i].dy * samples[i].dy) || 1;
          var align = (moveDx * samples[i].dx + moveDy * samples[i].dy) / (moveLen * pLen);
          score -= Math.max(0, align) * 6;
        }
        score += (i - progress) * 0.12;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      if (best < 0) {
        var nearest = dist(pt, samples[Math.min(progress, samples.length - 1)]);
        return { ok: false, far: nearest > TOL };
      }
      if (best >= progress) progress = best;
      return { ok: true, far: false };
    }

    function paintProgressInk() {
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!ink || !samples.length) return;
      var len = pathLen(ink) || 1;
      ink.style.strokeDasharray = String(len);
      ink.style.strokeDashoffset = String(len * (1 - progress / Math.max(1, samples.length - 1)));
      ink.classList.add("is-live");
    }

    function paintUserTrail() {
      var user = document.getElementById("birles-yazu-user");
      if (!user || userPts.length < 2) return;
      var d = "M " + userPts[0].x + " " + userPts[0].y;
      for (var i = 1; i < userPts.length; i++) {
        d += " L " + userPts[i].x + " " + userPts[i].y;
      }
      user.setAttribute("d", d);
    }

    function failStroke() {
      playBuzzSfx();
      drawing = false;
      missStreak = 0;
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (ink) {
        ink.classList.add("is-fail");
        setTimeout(function () {
          if (ink) ink.classList.remove("is-fail");
        }, 420);
      }
      setStatus("Tekrar dene · sarı noktadan başla", false);
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      resetStrokeForRetry();
      placeDot(strokeIndex);
    }

    function resetStrokeForRetry() {
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!ink) return;
      var len = pathLen(ink) || 1;
      ink.style.strokeDasharray = String(len);
      ink.style.strokeDashoffset = String(len);
      ink.classList.remove("is-live", "is-done");
    }

    function completeStroke() {
      if (strokeLock) return;
      strokeLock = true;
      var W = activeWord();
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (ink) {
        ink.style.strokeDashoffset = "0";
        ink.classList.remove("is-live");
        ink.classList.add("is-done");
      }
      hideAllDots();
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      drawing = false;
      strokeIndex += 1;

      if (!W || strokeIndex >= W.strokes.length) {
        playTickSfx(true);
        completedWords[W.id] = true;
        setTip("Harika! “" + W.label + "” kelimesini yazdın.");
        setStatus("Aferin · kelime tamam!", true);
        var penDone = document.getElementById("birles-yazu-pen");
        if (penDone) penDone.setAttribute("hidden", "hidden");
        unbindPractice();
        var hitDone = document.getElementById("birles-yazu-hit");
        if (hitDone) hitDone.style.pointerEvents = "none";

        body.querySelectorAll(".birles-yazu__word").forEach(function (btn, i) {
          if (words[i] && completedWords[words[i].id]) btn.classList.add("is-done");
        });
        var prog = body.querySelector(".birles-yazu__progress");
        if (prog) {
          var n = words.filter(function (w) {
            return completedWords[w.id];
          }).length;
          prog.textContent = n + " / " + words.length + " kelime";
        }

        if (allWordsDone()) {
          setStatus("Süper! Yazı Ustası tamam · yıldız kazandın", true);
          if (typeof opts.onComplete === "function") {
            try {
              opts.onComplete({ success: true });
            } catch (e) {}
          }
        } else {
          setTimeout(function () {
            var next = words.findIndex(function (w, i) {
              return i > activeIdx && !completedWords[w.id];
            });
            if (next < 0) {
              next = words.findIndex(function (w) {
                return !completedWords[w.id];
              });
            }
            if (next >= 0) {
              activeIdx = next;
              renderShell();
            }
          }, 900);
        }
        return;
      }

      playTickSfx(false);
      setTip(W.strokes[strokeIndex].tip);
      setStatus(W.strokes[strokeIndex].label + ". hamle · sarı noktadan başla", true);
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      placeDot(strokeIndex);
      strokeLock = false;
      bindPractice();
    }

    function bindPractice() {
      unbindPractice();
      var hit = document.getElementById("birles-yazu-hit");
      var path = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!hit || !path) return;
      hit.style.pointerEvents = "auto";
      samples = samplePathLocal(path);
      progress = 0;
      userPts = [];
      drawing = false;
      practiceBound = true;

      hit.onpointerdown = function (e) {
        e.preventDefault();
        try {
          hit.setPointerCapture(e.pointerId);
        } catch (err) {}
        lastPointerId = e.pointerId;
        var pt = clientToSvg(e.clientX, e.clientY);
        if (!pt || !samples.length) return;
        var start = samples[0];
        if (dist(pt, start) > TOL + 14) {
          playBuzzSfx();
          setStatus("Sarı noktaya dokunarak başla", false);
          return;
        }
        drawing = true;
        missStreak = 0;
        progress = 0;
        userPts = [pt];
        lastPt = pt;
        var pen = document.getElementById("birles-yazu-pen");
        if (pen) {
          pen.removeAttribute("hidden");
          pen.setAttribute("cx", pt.x);
          pen.setAttribute("cy", pt.y);
        }
        hideAllDots();
        paintProgressInk();
      };

      hit.onpointermove = function (e) {
        if (!drawing || e.pointerId !== lastPointerId) return;
        e.preventDefault();
        var pt = clientToSvg(e.clientX, e.clientY);
        if (!pt) return;
        var res = advanceAlongPath(pt, lastPt);
        lastPt = pt;
        if (!res.ok) {
          if (res.far) {
            missStreak += 1;
            if (missStreak > 10) failStroke();
          }
          return;
        }
        missStreak = 0;
        userPts.push(pt);
        if (userPts.length > 180) userPts = userPts.slice(-120);
        paintUserTrail();
        paintProgressInk();
        var pen = document.getElementById("birles-yazu-pen");
        if (pen) {
          pen.setAttribute("cx", pt.x);
          pen.setAttribute("cy", pt.y);
        }
        if (progress >= samples.length - 2) {
          completeStroke();
        }
      };

      hit.onpointerup = function (e) {
        if (e.pointerId !== lastPointerId) return;
        if (drawing) {
          if (progress < samples.length * 0.72) failStroke();
          else completeStroke();
        }
        drawing = false;
      };
      hit.onpointercancel = hit.onpointerup;
    }

    function startPractice() {
      animToken += 1;
      mode = "practice";
      strokeIndex = 0;
      markAct("practice");
      resetStrokesVisual();
      setStatus("Sarı noktadan başla · parmağınla çiz", true);
      var W = activeWord();
      if (W && W.strokes[0]) setTip(W.strokes[0].tip);
      placeDot(0);
      playWordAudio(animToken);
      bindPractice();
    }

    function wire() {
      body.querySelectorAll("[data-word]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = Number(btn.getAttribute("data-word"));
          if (!isFinite(i) || i === activeIdx) return;
          activeIdx = i;
          renderShell();
        });
      });
      var demo = document.getElementById("birles-yazu-demo");
      if (demo) {
        demo.addEventListener("click", function () {
          unbindPractice();
          strokeIndex = 0;
          resetStrokesVisual();
          runDemo();
        });
      }
      var prac = document.getElementById("birles-yazu-practice");
      if (prac) {
        prac.addEventListener("click", function () {
          startPractice();
        });
      }
      var back = document.getElementById("birles-yazu-back");
      if (back) {
        back.addEventListener("click", function () {
          animToken += 1;
          unbindPractice();
          if (opts.onClose) opts.onClose();
        });
      }
    }

    renderShell();
  }

  global.NovaBirlestirelimYaziUstasi = {
    open: openYaziUstasi,
    hasYaziUstasi: hasYaziUstasi,
    wordsForSound: wordsForSound
  };
})(typeof window !== "undefined" ? window : this);
