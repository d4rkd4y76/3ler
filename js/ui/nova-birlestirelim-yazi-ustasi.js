/**
 * Yazı Ustası — kelime yazılışı (kılavuz çizgili).
 * O sesi: nota, olan, alto
 * Geniş yaz: yalnızca telefon/tablet · tam ekran yan panel.
 */
(function (global) {
  "use strict";

  /*
   * Harf yolları yazılışta 0 0 200 286 + kılavuz 40/120/200.
   * Ölçekleme YAPMA — yalnız yatayda kaydır.
   */
  var CELL_W = 102;
  var CELL_W_WIDE = 124;
  var PAD_X = 14;
  var VIEW_H = 286;
  var GUIDE_YS = [40, 120, 200];

  var TOL = 34;
  var TOL_START = 42;
  var TOL_WIDE = 52;
  var TOL_START_WIDE = 62;
  var MISS_LIMIT = 22;
  var WINDOW_N = 24;
  var COMPLETE_RATIO = 0.75;

  /** Geniş yaz: yalnızca telefon / tablet */
  function isPhoneOrTablet() {
    try {
      if (!global.matchMedia) return true;
      return global.matchMedia(
        "(max-width: 1024px), (hover: none) and (pointer: coarse)"
      ).matches;
    } catch (e) {
      return true;
    }
  }

  var WORDS_BY_SOUND = {
    o: [
      {
        id: "nota",
        label: "nota",
        say: "nota",
        letters: ["n", "o", "t", "a"],
        hint: "Silik harflerin üstünden sırayla yaz"
      },
      {
        id: "olan",
        label: "olan",
        say: "olan",
        letters: ["o", "l", "a", "n"],
        hint: "Silik harflerin üstünden sırayla yaz"
      },
      {
        id: "alto",
        label: "alto",
        say: "alto",
        letters: ["a", "l", "t", "o"],
        hint: "Silik harflerin üstünden sırayla yaz"
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

  function letterCenterX(letterIndex, cellW) {
    var cw = cellW || CELL_W;
    return PAD_X + letterIndex * cw + cw * 0.5;
  }

  function mapLocalToView(localX, localY, letterIndex, cellW) {
    var cx = letterCenterX(letterIndex, cellW);
    return {
      x: localX + (cx - 100),
      y: localY
    };
  }

  function letterGroupTransform(letterIndex, cellW) {
    var cx = letterCenterX(letterIndex, cellW);
    return "translate(" + (cx - 100) + " 0)";
  }

  function hasYaziUstasi(soundId) {
    var sid = String(soundId || "").toLowerCase();
    return !!(WORDS_BY_SOUND[sid] && WORDS_BY_SOUND[sid].length);
  }

  function wordsForSound(soundId) {
    var sid = String(soundId || "").toLowerCase();
    return (WORDS_BY_SOUND[sid] || []).slice();
  }

  function composeWord(word, cellW) {
    var D = yazData();
    if (!D || !word) return null;
    var cw = cellW || CELL_W;
    var strokes = [];
    var letters = word.letters || [];
    for (var i = 0; i < letters.length; i++) {
      var L = D.getLetter(letters[i]);
      if (!L || !L.strokes) continue;
      for (var j = 0; j < L.strokes.length; j++) {
        var s = L.strokes[j];
        strokes.push({
          id: word.id + "_" + L.id + "_" + (s.id || j),
          d: s.d,
          letterId: L.id,
          letterLabel: L.label,
          letterIndex: i,
          sameHamle: !!s.sameHamle
        });
      }
    }
    if (!strokes.length) return null;
    return {
      id: word.id,
      label: word.label,
      say: word.say || word.label,
      hint: word.hint || "",
      letterCount: letters.length,
      cellW: cw,
      viewW: PAD_X + letters.length * cw + PAD_X,
      strokes: strokes
    };
  }

  function openYaziUstasi(opts) {
    opts = opts || {};
    var sound = opts.sound;
    var body = opts.body;
    if (!sound || !body || !hasYaziUstasi(sound.id)) return;

    var wideOpen = false;
    var layoutCellW = CELL_W;

    function buildWords() {
      layoutCellW = wideOpen ? CELL_W_WIDE : CELL_W;
      return wordsForSound(sound.id)
        .map(function (w) {
          return composeWord(w, layoutCellW);
        })
        .filter(Boolean);
    }

    var words = buildWords();
    if (!words.length) return;

    var activeIdx = 0;
    var strokeIndex = 0;
    var animToken = 0;
    var completedWords = {};
    var practiceBound = false;
    var drawing = false;
    var samples = [];
    var doneJunctionSamples = [];
    var progress = 0;
    var userPts = [];
    var missStreak = 0;
    var lastPointerId = null;
    var lastPt = null;
    var strokeLock = false;
    var svgCtmInv = null;
    var cachedInk = null;
    var cachedInkLen = 1;
    var cachedUser = null;
    var cachedPen = null;
    var paintRaf = 0;
    var pendingPaint = false;

    if (opts.setBack) opts.setBack(true);
    if (opts.setHeader) {
      opts.setHeader(
        "Yazı Ustası · " + String(sound.displayUpper || sound.letter || "O"),
        "Kelimeyi kılavuz çizgide yaz",
        "Yazı"
      );
    }

    function setLandscapeForWide(on) {
      if (global.NovaPortraitLock && global.NovaPortraitLock.allowLandscape) {
        global.NovaPortraitLock.allowLandscape(!!on);
      }
    }

    function releaseLandscape() {
      setLandscapeForWide(false);
    }

    function activeWord() {
      return words[activeIdx] || null;
    }

    function allWordsDone() {
      return words.every(function (w) {
        return !!completedWords[w.id];
      });
    }

    function tolNow() {
      return wideOpen ? TOL_WIDE : TOL;
    }

    function tolStartNow() {
      return wideOpen ? TOL_START_WIDE : TOL_START;
    }

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

    function playWordAudio() {
      var W = activeWord();
      var vv = global.NovaKidsVoice;
      if (!W || !vv || !vv.playToken) return Promise.resolve();
      return Promise.resolve(vv.playToken(W.say || W.label, { waitUntilEnd: true })).catch(
        function () {}
      );
    }

    function boardHtml(W) {
      if (!W) return "";
      var vbW = W.viewW;
      var cw = W.cellW || layoutCellW;
      var guides = GUIDE_YS.map(function (y, gi) {
        return (
          '<line class="birles-yazu__guide' +
          (gi === 1 ? " birles-yazu__guide--mid" : "") +
          '" x1="' +
          (PAD_X - 4) +
          '" y1="' +
          y +
          '" x2="' +
          (vbW - PAD_X + 4) +
          '" y2="' +
          y +
          '" />'
        );
      }).join("");

      var letterGroups = "";
      for (var li = 0; li < W.letterCount; li++) {
        var ghostPaths = "";
        var inkPaths = "";
        for (var si = 0; si < W.strokes.length; si++) {
          var st = W.strokes[si];
          if (st.letterIndex !== li) continue;
          ghostPaths +=
            '<path class="birles-yazu__ghost" data-ghost="' +
            si +
            '" d="' +
            esc(st.d) +
            '" fill="none" />';
          inkPaths +=
            '<path class="birles-yazu__stroke" data-stroke="' +
            si +
            '" d="' +
            esc(st.d) +
            '" fill="none" />';
        }
        letterGroups +=
          '<g class="birles-yazu__letter" transform="' +
          letterGroupTransform(li, cw) +
          '">' +
          ghostPaths +
          inkPaths +
          "</g>";
      }

      return (
        '<svg class="birles-yazu__svg" viewBox="0 0 ' +
        vbW +
        " " +
        VIEW_H +
        '" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" aria-label="' +
        esc(W.label) +
        '">' +
        '<rect class="birles-yazu__paper" x="2" y="6" width="' +
        (vbW - 4) +
        '" height="254" rx="22" />' +
        '<rect class="birles-yazu__paper-edge" x="2" y="6" width="10" height="254" rx="4" />' +
        guides +
        letterGroups +
        '<path class="birles-yazu__user" id="birles-yazu-user" d="" fill="none" />' +
        '<circle class="birles-yazu__pen" id="birles-yazu-pen" r="7" hidden />' +
        "</svg>" +
        '<div class="birles-yazu__hit" id="birles-yazu-hit" aria-hidden="true"></div>'
      );
    }

    function setTip(t) {
      var els = body.querySelectorAll(".birles-yazu__tip");
      for (var i = 0; i < els.length; i++) {
        els[i].textContent = t || "";
        els[i].hidden = !t;
      }
    }

    function setStatus(msg, ok) {
      var els = body.querySelectorAll(".birles-yazu__status");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!msg) {
          el.hidden = true;
          el.textContent = "";
          el.classList.remove("is-ok", "is-bad");
          continue;
        }
        el.hidden = false;
        el.textContent = msg;
        el.classList.toggle("is-ok", !!ok);
        el.classList.toggle("is-bad", ok === false);
      }
    }

    function strokeEls() {
      return Array.prototype.slice.call(body.querySelectorAll(".birles-yazu__stroke"));
    }

    function ghostEls() {
      return Array.prototype.slice.call(body.querySelectorAll(".birles-yazu__ghost"));
    }

    /** Görsel sıra yok — tüm silik harfler eşit; yalnız biten mürekkep yeşil */
    function updateStrokeFocus() {
      ghostEls().forEach(function (g) {
        g.classList.remove("is-active", "is-dim");
      });
      strokeEls().forEach(function (p) {
        var i = Number(p.getAttribute("data-stroke"));
        p.classList.remove("is-focus", "is-wait", "is-ahead");
        if (i < strokeIndex) {
          p.classList.add("is-done");
          p.classList.remove("is-live", "is-fail");
        } else {
          p.classList.remove("is-done");
        }
      });
    }

    function resetStrokesVisual() {
      strokeEls().forEach(function (p) {
        p.style.transition = "none";
        var len = pathLen(p) || 1;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.classList.remove("is-done", "is-live", "is-fail", "is-focus", "is-ahead");
      });
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      updateStrokeFocus();
    }

    function restoreStrokeProgress(si) {
      strokeIndex = Math.max(0, si || 0);
      strokeEls().forEach(function (p) {
        var i = Number(p.getAttribute("data-stroke"));
        var len = pathLen(p) || 1;
        p.style.transition = "none";
        p.style.strokeDasharray = String(len);
        if (i < strokeIndex) {
          p.style.strokeDashoffset = "0";
          p.classList.add("is-done");
          p.classList.remove("is-live", "is-fail");
        } else {
          p.style.strokeDashoffset = String(len);
          p.classList.remove("is-done", "is-live", "is-fail");
        }
      });
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      updateStrokeFocus();
    }

    function doneCount() {
      return words.filter(function (w) {
        return completedWords[w.id];
      }).length;
    }

    function renderShell(shellOpts) {
      shellOpts = shellOpts || {};
      var keepProgress = !!shellOpts.keepProgress;
      var savedStroke = strokeIndex;
      animToken += 1;
      unbindPractice();
      var W = activeWord();
      var nDone = doneCount();
      var chip = esc(sound.color || "#0d9488");
      var showWideBtn = isPhoneOrTablet();

      body.innerHTML =
        '<div class="birles-yazu' +
        (wideOpen ? " is-wide-open" : "") +
        '" style="--chip:' +
        chip +
        '">' +
        '<div class="birles-yazu__ambient" aria-hidden="true"></div>' +
        '<header class="birles-yazu__hero">' +
        '<div class="birles-yazu__badge">Yazı Ustası</div>' +
        '<p class="birles-yazu__word-big" id="birles-yazu-word-big">' +
        esc(W ? W.label : "") +
        "</p>" +
        '<div class="birles-yazu__progress-row">' +
        '<span class="birles-yazu__progress">' +
        nDone +
        " / " +
        words.length +
        " kelime</span>" +
        '<span class="birles-yazu__dots" aria-hidden="true">' +
        words
          .map(function (w) {
            return (
              '<i class="birles-yazu__dot-pip' +
              (completedWords[w.id] ? " is-done" : "") +
              (words[activeIdx] && w.id === words[activeIdx].id ? " is-on" : "") +
              '"></i>'
            );
          })
          .join("") +
        "</span>" +
        "</div>" +
        "</header>" +
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
              '<span class="birles-yazu__word-label">' +
              esc(w.label) +
              "</span>" +
              (completedWords[w.id]
                ? '<span class="birles-yazu__word-check" aria-hidden="true">✓</span>'
                : "") +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<p class="birles-yazu__meta">' +
        esc(W ? W.hint : "") +
        "</p>" +
        (wideOpen
          ? ""
          : '<div class="birles-yazu__stage-wrap">' +
            '<div class="birles-yazu__stage" id="birles-yazu-stage">' +
            boardHtml(W) +
            "</div>" +
            "</div>") +
        '<p class="birles-yazu__tip" id="birles-yazu-tip"></p>' +
        '<div class="birles-yazu__actions">' +
        '<button type="button" class="birles-yazu-act birles-yazu-act--write is-on" id="birles-yazu-practice">' +
        '<span class="birles-yazu-act__ico" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M4 19h16v2H4v-2zm2.3-3.4l8.1-8.1 2.1 2.1-8.1 8.1H6.3v-2.1zm10.4-8.3 1.5-1.5a1.2 1.2 0 0 1 1.7 0l1.4 1.4a1.2 1.2 0 0 1 0 1.7l-1.5 1.5-3.1-3.1z"/></svg>' +
        "</span>" +
        '<span class="birles-yazu-act__txt"><strong>Yeniden yaz</strong><small>parmakla çiz</small></span></button>' +
        '<button type="button" class="birles-yazu-act birles-yazu-act--listen" id="birles-yazu-listen">' +
        '<span class="birles-yazu-act__ico" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 3a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4zm-7 8a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.9V21h4a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h4v-3.1A7 7 0 0 1 5 11z"/></svg>' +
        "</span>" +
        '<span class="birles-yazu-act__txt"><strong>Dinle</strong><small>kelimeyi duy</small></span></button>' +
        '<button type="button" class="birles-yazu-act birles-yazu-act--back" id="birles-yazu-back">' +
        '<span class="birles-yazu-act__ico" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M10.8 5.2a1 1 0 0 1 0 1.4L6.4 11H20a1 1 0 1 1 0 2H6.4l4.4 4.4a1 1 0 1 1-1.4 1.4l-6.1-6.1a1 1 0 0 1 0-1.4l6.1-6.1a1 1 0 0 1 1.4 0z"/></svg>' +
        "</span>" +
        '<span class="birles-yazu-act__txt"><strong>Sese dön</strong><small>geri</small></span></button>' +
        "</div>" +
        (showWideBtn
          ? '<button type="button" class="birles-yazu__wide-btn" id="birles-yazu-wide-open">' +
            '<span class="birles-yazu__wide-btn-ico" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"/></svg>' +
            "</span>" +
            "<strong>Geniş yaz</strong>" +
            "<small>Yatay · tam ekran tahta</small>" +
            "</button>"
          : "") +
        '<p class="birles-yazu__status" id="birles-yazu-status" hidden></p>' +
        '<div class="birles-yazu__sheet' +
        (wideOpen ? " is-open" : "") +
        '" id="birles-yazu-sheet" ' +
        (wideOpen ? "" : "hidden") +
        ">" +
        '<div class="birles-yazu__sheet-panel" role="dialog" aria-modal="true" aria-label="Geniş yazma tahtası">' +
        '<button type="button" class="birles-yazu__sheet-close" id="birles-yazu-wide-close" aria-label="Kapat">×</button>' +
        (wideOpen
          ? '<div class="birles-yazu__stage birles-yazu__stage--wide" id="birles-yazu-stage">' +
            boardHtml(W) +
            "</div>" +
            '<p class="birles-yazu__wide-hint" id="birles-yazu-wide-hint" hidden>Yataya çevir · daha rahat yaz</p>'
          : "") +
        "</div>" +
        "</div>" +
        "</div>";

      wire();
      if (keepProgress) {
        restoreStrokeProgress(savedStroke);
        setTip("");
        setStatus("", true);
        bindPractice();
      } else {
        startPractice(true);
      }
      refreshSvgCtm();
      syncWideHint();
    }

    function refreshSvgCtm() {
      var svg = body.querySelector(".birles-yazu__svg");
      if (!svg) {
        svgCtmInv = null;
        return;
      }
      try {
        var ctm = svg.getScreenCTM();
        svgCtmInv = ctm ? ctm.inverse() : null;
      } catch (e) {
        svgCtmInv = null;
      }
    }

    function clientToSvg(clientX, clientY) {
      var svg = body.querySelector(".birles-yazu__svg");
      if (!svg) return null;
      if (!svgCtmInv) refreshSvgCtm();
      if (!svgCtmInv) return null;
      var pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      try {
        return pt.matrixTransform(svgCtmInv);
      } catch (e) {
        refreshSvgCtm();
        if (!svgCtmInv) return null;
        try {
          return pt.matrixTransform(svgCtmInv);
        } catch (e2) {
          return null;
        }
      }
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

    function samplePathView(pathEl, letterIndex) {
      var len = pathLen(pathEl);
      var pts = [];
      if (!len) return pts;
      var cw = (activeWord() && activeWord().cellW) || layoutCellW;
      var n = Math.max(28, Math.round(Math.max(56, len / 2.4)));
      for (var i = 0; i <= n; i++) {
        var p = pathEl.getPointAtLength((i / n) * len);
        var mapped = mapLocalToView(p.x, p.y, letterIndex, cw);
        var pt = { x: mapped.x, y: mapped.y, t: i / n };
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

    /** Bitmiş hamle örnekleri — kesişimde “yanlış” dememek için (ceza değil, yumuşak bölge) */
    function buildDoneJunctionSamples(W, currentIdx) {
      doneJunctionSamples = [];
      if (!W || currentIdx <= 0) return;
      var curLetter = W.strokes[currentIdx].letterIndex;
      for (var i = 0; i < currentIdx; i++) {
        if (W.strokes[i].letterIndex !== curLetter) continue;
        var path = body.querySelector('.birles-yazu__stroke[data-stroke="' + i + '"]');
        if (!path) continue;
        doneJunctionSamples.push(samplePathView(path, W.strokes[i].letterIndex));
      }
    }

    function distToDoneJunction(pt) {
      var best = 1e9;
      for (var s = 0; s < doneJunctionSamples.length; s++) {
        var pts = doneJunctionSamples[s];
        for (var i = 0; i < pts.length; i += 2) {
          var d = dist(pt, pts[i]);
          if (d < best) best = d;
        }
      }
      return best;
    }

    function nearestOnActivePath(pt, fromIdx, toIdx) {
      var best = -1;
      var bestD = 1e9;
      var a = Math.max(0, fromIdx);
      var b = Math.min(samples.length - 1, toIdx);
      for (var i = a; i <= b; i++) {
        var d = dist(pt, samples[i]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return { i: best, d: bestD };
    }

    function advanceAlongPath(pt, prevPt) {
      if (!samples.length) return { ok: false, far: true };
      var tol = tolNow();
      /*
       * t çubuğu × dik gövde, n kemer × dik, a dik × kâse:
       * parmak bitmiş çizgiye değince aktif yoldan biraz sapar.
       * Bitmiş yola YAKINLIK ceza değil — toleransı büyüt, yön cezasını kaldır.
       */
      var nearJunction = distToDoneJunction(pt) <= tol * 1.05;
      var useTol = nearJunction ? tol * 2.1 : tol;
      var win = nearJunction ? WINDOW_N * 2 : WINDOW_N;

      var best = -1;
      var bestScore = 1e9;
      var moveDx = prevPt ? pt.x - prevPt.x : 0;
      var moveDy = prevPt ? pt.y - prevPt.y : 0;
      var moveLen = Math.sqrt(moveDx * moveDx + moveDy * moveDy) || 0;

      for (var i = progress; i < samples.length && i <= progress + win; i++) {
        var d = dist(pt, samples[i]);
        if (d > useTol) continue;
        var score = d;
        if (!nearJunction && moveLen > 1.2 && samples[i].dx !== undefined) {
          var pLen =
            Math.sqrt(samples[i].dx * samples[i].dx + samples[i].dy * samples[i].dy) || 1;
          var align = (moveDx * samples[i].dx + moveDy * samples[i].dy) / (moveLen * pLen);
          if (align < -0.35) score += 4;
          else if (align > 0.2) score -= align * 2.5;
        }
        score += (i - progress) * 0.18;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }

      if (best < 0) {
        /* Aktif yolun ilerisindeki en yakın nokta — kesişimde kaybolmayı affet */
        var near = nearestOnActivePath(pt, progress, progress + win + 8);
        if (near.i >= progress && near.d <= useTol) {
          progress = near.i;
          return { ok: true, far: false };
        }
        if (nearJunction && near.d <= useTol * 1.25) {
          /* Bitmiş dikeye değdi: yanlış sayma, ilerlemeyi zorlama */
          return { ok: false, far: false };
        }
        return { ok: false, far: near.d > useTol * 1.35 };
      }
      if (best < progress) {
        return { ok: false, far: false };
      }
      if (best > progress + (nearJunction ? 16 : 14)) {
        if (dist(pt, samples[best]) <= useTol) {
          progress = best;
          return { ok: true, far: false };
        }
        return { ok: false, far: !nearJunction };
      }
      progress = best;
      return { ok: true, far: false };
    }

    function paintProgressInk() {
      if (!cachedInk || !samples.length) return;
      cachedInk.style.strokeDashoffset = String(
        cachedInkLen * (1 - progress / Math.max(1, samples.length - 1))
      );
      if (!cachedInk.classList.contains("is-live")) cachedInk.classList.add("is-live");
    }

    function paintUserTrail() {
      if (!cachedUser || userPts.length < 2) return;
      var d = "M " + userPts[0].x + " " + userPts[0].y;
      for (var i = 1; i < userPts.length; i++) {
        d += " L " + userPts[i].x + " " + userPts[i].y;
      }
      cachedUser.setAttribute("d", d);
    }

    function schedulePaint() {
      if (paintRaf) {
        pendingPaint = true;
        return;
      }
      paintRaf = global.requestAnimationFrame
        ? global.requestAnimationFrame(function () {
            paintRaf = 0;
            paintUserTrail();
            paintProgressInk();
            if (pendingPaint) {
              pendingPaint = false;
              schedulePaint();
            }
          })
        : 0;
      if (!paintRaf) {
        paintUserTrail();
        paintProgressInk();
      }
    }

    function resetStrokeForRetry() {
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!ink) return;
      var len = pathLen(ink) || 1;
      ink.style.strokeDasharray = String(len);
      ink.style.strokeDashoffset = String(len);
      ink.classList.remove("is-live", "is-done");
      updateStrokeFocus();
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
      setStatus("Çizgiye biraz daha yakın yaz", false);
      setTip("Silik harfin üstünden yaz");
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      resetStrokeForRetry();
      progress = 0;
      userPts = [];
      var W = activeWord();
      samples = samplePathView(
        body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]'),
        W && W.strokes[strokeIndex] ? W.strokes[strokeIndex].letterIndex : 0
      );
    }

    function completeStroke() {
      if (strokeLock) return;
      strokeLock = true;
      var W = activeWord();
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (ink) {
        ink.style.strokeDashoffset = "0";
        ink.classList.remove("is-live", "is-focus");
        ink.classList.add("is-done");
      }
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      drawing = false;
      strokeIndex += 1;

      if (!W || strokeIndex >= W.strokes.length) {
        playTickSfx(true);
        completedWords[W.id] = true;
        setTip("Harika! “" + W.label + "” tamam");
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
          prog.textContent = doneCount() + " / " + words.length + " kelime";
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
          }, 850);
        }
        return;
      }

      playTickSfx(false);
      setTip("Devam · silik çizgiyi takip et");
      setStatus("Güzel · devam et", true);
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      strokeLock = false;
      updateStrokeFocus();
      bindPractice();
    }

    function bindPractice() {
      unbindPractice();
      if (paintRaf && global.cancelAnimationFrame) {
        global.cancelAnimationFrame(paintRaf);
        paintRaf = 0;
      }
      pendingPaint = false;
      var hit = document.getElementById("birles-yazu-hit");
      var W = activeWord();
      var path = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!hit || !path || !W) return;
      hit.style.pointerEvents = "auto";
      var letterIndex = W.strokes[strokeIndex].letterIndex;
      samples = samplePathView(path, letterIndex);
      buildDoneJunctionSamples(W, strokeIndex);
      progress = 0;
      userPts = [];
      drawing = false;
      strokeLock = false;
      practiceBound = true;
      updateStrokeFocus();

      cachedInk = path;
      cachedInkLen = pathLen(path) || 1;
      cachedInk.style.strokeDasharray = String(cachedInkLen);
      cachedInk.style.strokeDashoffset = String(cachedInkLen);
      cachedUser = document.getElementById("birles-yazu-user");
      cachedPen = document.getElementById("birles-yazu-pen");
      refreshSvgCtm();

      hit.onpointerdown = function (e) {
        e.preventDefault();
        try {
          hit.setPointerCapture(e.pointerId);
        } catch (err) {}
        lastPointerId = e.pointerId;
        refreshSvgCtm();
        var pt = clientToSvg(e.clientX, e.clientY);
        if (!pt || !samples.length) return;
        var start = samples[0];
        if (dist(pt, start) > tolStartNow()) {
          playBuzzSfx();
          setStatus("Harfin başlangıcına biraz daha yakın başla", false);
          return;
        }
        drawing = true;
        missStreak = 0;
        progress = 0;
        userPts = [pt];
        lastPt = pt;
        if (cachedPen) {
          cachedPen.removeAttribute("hidden");
          cachedPen.setAttribute("cx", pt.x);
          cachedPen.setAttribute("cy", pt.y);
        }
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
            if (missStreak > MISS_LIMIT) failStroke();
          }
          return;
        }
        missStreak = 0;
        userPts.push(pt);
        if (userPts.length > 90) userPts = userPts.slice(-64);
        if (cachedPen) {
          cachedPen.setAttribute("cx", pt.x);
          cachedPen.setAttribute("cy", pt.y);
        }
        schedulePaint();
        if (progress >= samples.length - 2) {
          completeStroke();
        }
      };

      hit.onpointerup = function (e) {
        if (e.pointerId !== lastPointerId) return;
        if (drawing) {
          if (progress < samples.length * COMPLETE_RATIO) failStroke();
          else completeStroke();
        }
        drawing = false;
      };
      hit.onpointercancel = hit.onpointerup;
    }

    function syncWideHint() {
      var hint = document.getElementById("birles-yazu-wide-hint");
      if (!hint) return;
      var needRotate =
        wideOpen &&
        global.NovaPortraitLock &&
        global.NovaPortraitLock.isLandscape &&
        !global.NovaPortraitLock.isLandscape();
      hint.hidden = !needRotate;
    }

    function startPractice(playAudio) {
      animToken += 1;
      strokeIndex = 0;
      resetStrokesVisual();
      setTip(wideOpen ? "Tam ekranda silik harflerin üstünden yaz" : "Silik harflerin üstünden sırayla yaz");
      setStatus("Parmağınla çizgiyi takip et", true);
      if (playAudio) playWordAudio();
      bindPractice();
      syncWideHint();
    }

    function openWide() {
      if (!isPhoneOrTablet()) return;
      if (wideOpen) return;
      wideOpen = true;
      setLandscapeForWide(true);
      words = buildWords();
      renderShell({ keepProgress: true });
      syncWideHint();
      /* Dönüş sonrası CTM yenile */
      setTimeout(function () {
        refreshSvgCtm();
        syncWideHint();
        if (global.NovaPortraitLock && global.NovaPortraitLock.sync) {
          global.NovaPortraitLock.sync();
        }
      }, 320);
    }

    function closeWide() {
      if (!wideOpen) return;
      wideOpen = false;
      setLandscapeForWide(false);
      words = buildWords();
      renderShell({ keepProgress: true });
      setTimeout(refreshSvgCtm, 320);
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

      var prac = document.getElementById("birles-yazu-practice");
      if (prac) {
        prac.addEventListener("click", function () {
          startPractice(false);
        });
      }
      var listen = document.getElementById("birles-yazu-listen");
      if (listen) {
        listen.addEventListener("click", function () {
          playWordAudio();
        });
      }

      var back = document.getElementById("birles-yazu-back");
      if (back) {
        back.addEventListener("click", function () {
          animToken += 1;
          unbindPractice();
          releaseLandscape();
          if (opts.onClose) opts.onClose();
        });
      }

      var wideOpenBtn = document.getElementById("birles-yazu-wide-open");
      if (wideOpenBtn) {
        wideOpenBtn.addEventListener("click", openWide);
      }
      var wideCloseBtn = document.getElementById("birles-yazu-wide-close");
      if (wideCloseBtn) {
        wideCloseBtn.addEventListener("click", closeWide);
      }
    }

    renderShell();
  }

  global.NovaBirlestirelimYaziUstasi = {
    open: openYaziUstasi,
    hasYaziUstasi: hasYaziUstasi,
    wordsForSound: wordsForSound,
    isPhoneOrTablet: isPhoneOrTablet
  };
})(typeof window !== "undefined" ? window : this);
