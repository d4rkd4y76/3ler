/**
 * Yazı Ustası — kelime yazılışı (kılavuz çizgili).
 * O sesi: 4–6 sesli kelimeler · nota, olan, alto
 * Üstte kelime metni; altta silik harfler; hamle numarası yok.
 * Doğru sıra zorunlu; yoldan uzak çizim kabul edilmez.
 */
(function (global) {
  "use strict";

  /*
   * Harf yolları yazılışta 0 0 200 286 + kılavuz 40/120/200.
   * Ölçekleme YAPMA — yükseklik bozulmasın; yalnız yatayda kaydır.
   * Glif ~x 55–145 → hücre ~100 yeterli.
   */
  var CELL_W = 102;
  var PAD_X = 12;
  var VIEW_H = 286;
  var GUIDE_YS = [40, 120, 200];
  /* Hassas takip — uzağı kabul etme */
  var TOL = 16;
  var TOL_START = 20;
  var MISS_LIMIT = 5;
  var WINDOW_N = 12;

  var WORDS_BY_SOUND = {
    o: [
      {
        id: "nota",
        label: "nota",
        say: "nota",
        letters: ["n", "o", "t", "a"],
        hint: "Kelimeyi silik çizginin üstünden yaz"
      },
      {
        id: "olan",
        label: "olan",
        say: "olan",
        letters: ["o", "l", "a", "n"],
        hint: "Kelimeyi silik çizginin üstünden yaz"
      },
      {
        id: "alto",
        label: "alto",
        say: "alto",
        letters: ["a", "l", "t", "o"],
        hint: "Kelimeyi silik çizginin üstünden yaz"
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

  function letterCenterX(letterIndex) {
    return PAD_X + letterIndex * CELL_W + CELL_W * 0.5;
  }

  /** Yerel harf noktası → viewBox (yalnız yatay kaydırma; y aynı = kılavuz doğru) */
  function mapLocalToView(localX, localY, letterIndex) {
    var cx = letterCenterX(letterIndex);
    return {
      x: localX + (cx - 100),
      y: localY
    };
  }

  function letterGroupTransform(letterIndex) {
    var cx = letterCenterX(letterIndex);
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

  function composeWord(word) {
    var D = yazData();
    if (!D || !word) return null;
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
      viewW: PAD_X + letters.length * CELL_W + PAD_X,
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
    var strokeIndex = 0;
    var animToken = 0;
    var completedWords = {};
    var practiceBound = false;
    var drawing = false;
    var samples = [];
    var progress = 0;
    var userPts = [];
    var missStreak = 0;
    var lastPointerId = null;
    var lastPt = null;
    var strokeLock = false;

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

      /* Her harfin stroke’ları aynı grupta — silik gövde + mürekkep */
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
          letterGroupTransform(li) +
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
        '" shape-rendering="geometricPrecision" aria-label="' +
        esc(W.label) +
        '">' +
        '<rect class="birles-yazu__paper" x="4" y="8" width="' +
        (vbW - 8) +
        '" height="250" rx="18" />' +
        guides +
        letterGroups +
        '<path class="birles-yazu__user" id="birles-yazu-user" d="" fill="none" />' +
        '<circle class="birles-yazu__pen" id="birles-yazu-pen" r="5" hidden />' +
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
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
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
        '<p class="birles-yazu__word-big" id="birles-yazu-word-big">' +
        esc(W ? W.label : "") +
        "</p>" +
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
        '<button type="button" class="birles-yazu-act birles-yazu-act--write is-on" id="birles-yazu-practice">' +
        "<strong>Yeniden yaz</strong><small>parmakla çiz</small></button>" +
        '<button type="button" class="birles-yazu-act birles-yazu-act--listen" id="birles-yazu-listen">' +
        "<strong>Dinle</strong><small>kelimeyi duy</small></button>" +
        '<button type="button" class="birles-yazu-act birles-yazu-act--back" id="birles-yazu-back">' +
        "<strong>Sese dön</strong><small>geri</small></button>" +
        "</div>" +
        '<p class="birles-yazu__status" id="birles-yazu-status" hidden></p>' +
        "</div>";

      wire();
      startPractice(true);
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

    function samplePathView(pathEl, letterIndex) {
      var len = pathLen(pathEl);
      var pts = [];
      if (!len) return pts;
      var n = Math.max(28, Math.round(Math.max(56, len / 2.4)));
      for (var i = 0; i <= n; i++) {
        var p = pathEl.getPointAtLength((i / n) * len);
        var mapped = mapLocalToView(p.x, p.y, letterIndex);
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

    function advanceAlongPath(pt, prevPt) {
      if (!samples.length) return { ok: false, far: true };
      var best = -1;
      var bestScore = 1e9;
      var moveDx = prevPt ? pt.x - prevPt.x : 0;
      var moveDy = prevPt ? pt.y - prevPt.y : 0;
      var moveLen = Math.sqrt(moveDx * moveDx + moveDy * moveDy) || 0;

      for (var i = progress; i < samples.length && i <= progress + WINDOW_N; i++) {
        var d = dist(pt, samples[i]);
        if (d > TOL) continue;
        var score = d * 1.35;
        if (moveLen > 1 && samples[i].dx !== undefined) {
          var pLen =
            Math.sqrt(samples[i].dx * samples[i].dx + samples[i].dy * samples[i].dy) || 1;
          var align = (moveDx * samples[i].dx + moveDy * samples[i].dy) / (moveLen * pLen);
          /* Ters yöne gitmeyi cezalandır */
          if (align < 0.15) score += 8;
          else score -= align * 3;
        }
        score += (i - progress) * 0.35;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }

      if (best < 0) {
        var nearest = dist(pt, samples[Math.min(progress, samples.length - 1)]);
        return { ok: false, far: nearest > TOL };
      }
      /* Çok ileri zıplamayı engelle */
      if (best > progress + 8) {
        return { ok: false, far: true };
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

    function resetStrokeForRetry() {
      var ink = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!ink) return;
      var len = pathLen(ink) || 1;
      ink.style.strokeDasharray = String(len);
      ink.style.strokeDashoffset = String(len);
      ink.classList.remove("is-live", "is-done");
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
      setStatus("Çizgiye daha yakın yaz · sırayı bozma", false);
      setTip("Silik harfin tam üstünden, sırayla çiz");
      var user = document.getElementById("birles-yazu-user");
      if (user) user.setAttribute("d", "");
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      resetStrokeForRetry();
      progress = 0;
      userPts = [];
      samples = samplePathView(
        body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]'),
        (activeWord() && activeWord().strokes[strokeIndex]
          ? activeWord().strokes[strokeIndex].letterIndex
          : 0)
      );
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
          }, 850);
        }
        return;
      }

      playTickSfx(false);
      setTip("Devam · sıradaki harfi yaz");
      setStatus("Devam et · silik çizgiyi takip et", true);
      var pen = document.getElementById("birles-yazu-pen");
      if (pen) pen.setAttribute("hidden", "hidden");
      strokeLock = false;
      bindPractice();
    }

    function bindPractice() {
      unbindPractice();
      var hit = document.getElementById("birles-yazu-hit");
      var W = activeWord();
      var path = body.querySelector('.birles-yazu__stroke[data-stroke="' + strokeIndex + '"]');
      if (!hit || !path || !W) return;
      hit.style.pointerEvents = "auto";
      var letterIndex = W.strokes[strokeIndex].letterIndex;
      samples = samplePathView(path, letterIndex);
      progress = 0;
      userPts = [];
      drawing = false;
      strokeLock = false;
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
        if (dist(pt, start) > TOL_START) {
          playBuzzSfx();
          setStatus("Harfin başlangıcına daha yakın başla", false);
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
        if (userPts.length > 160) userPts = userPts.slice(-110);
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
          /* En az %88’i çizilmiş olmalı */
          if (progress < samples.length * 0.88) failStroke();
          else completeStroke();
        }
        drawing = false;
      };
      hit.onpointercancel = hit.onpointerup;
    }

    function startPractice(playAudio) {
      animToken += 1;
      strokeIndex = 0;
      resetStrokesVisual();
      setTip("Silik harflerin üstünden sırayla yaz");
      setStatus("Parmağınla çizgiye yapışık yaz", true);
      if (playAudio) playWordAudio();
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
