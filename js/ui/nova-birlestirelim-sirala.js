/**
 * Ses Yuvası — Hece Avı içinde “sıra sende”
 * Yuva = correctOrder (ör. e,r). Rafta en fazla 5 ses.
 * Alt dock = havuz ile aynı (ilerleme · 🔁 · Tümü · Bekle/İlerle).
 */
(function (global) {
  "use strict";

  var SLOT_MAX = 5;
  var POOL_MERGE_SRC = "assets/birles/ses_birlestirme.mp4?v=opt1";
  var POOL_BOOM_SRC = "assets/birles/ses_patlama.mp4?v=opt1";

  var hostEl = null;
  var onDoneCb = null;
  var soundRef = null;
  var openToken = 0;
  var activityRef = null;
  var finishing = false;
  var placements = [];
  var dragState = null;
  var layoutBound = null;
  var instructAudio = null;
  var laneMode = false;
  var laneProgressText = "";
  var nextUnlocked = false;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normLabel(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("tr-TR");
  }

  function normalizeSound(row) {
    var r = row && typeof row === "object" ? row : {};
    return {
      label: String(r.label || r.text || r.token || "").trim(),
      audioUrl: String(r.audioUrl || r.mp3 || r.url || "").trim()
    };
  }

  function parseCorrectOrder(raw, sounds) {
    var out = [];
    if (Array.isArray(raw)) {
      raw.forEach(function (x) {
        var t = String(x || "").trim();
        if (t) out.push(t);
      });
    } else if (raw != null && String(raw).trim()) {
      String(raw)
        .split(/[,;]+/)
        .forEach(function (p) {
          var t = p.trim();
          if (t) out.push(t);
        });
    }
    if (out.length) return out;
    return (sounds || [])
      .map(function (s) {
        return s.label;
      })
      .filter(Boolean);
  }

  function normalizeActivity(raw, idx) {
    var row = raw && typeof raw === "object" ? raw : {};
    var soundsIn = Array.isArray(row.sounds) ? row.sounds : Array.isArray(row.slots) ? row.slots : [];
    var sounds = [];
    for (var i = 0; i < SLOT_MAX; i++) {
      var s = normalizeSound(soundsIn[i]);
      if (s.label || s.audioUrl) sounds.push(s);
    }
    var correctOrder = parseCorrectOrder(row.correctOrder || row.order || row.nests, sounds);
    var heceStep = parseInt(row.heceStep, 10);
    if (!isFinite(heceStep) || heceStep < 1) heceStep = 0;
    return {
      id: String(row.id || "s" + (idx + 1)).trim() || "s" + (idx + 1),
      title: String(row.title || "").trim(),
      result: String(row.result || row.title || "").trim(),
      resultAudioUrl: String(
        row.resultAudioUrl || row.resultUrl || row.heceAudioUrl || ""
      ).trim(),
      heceStep: heceStep,
      correctOrder: correctOrder,
      instructionAudioUrl: String(
        row.instructionAudioUrl || row.instructionUrl || row.promptAudioUrl || ""
      ).trim(),
      sounds: sounds
    };
  }

  function listActivities(pack) {
    var k = pack && pack.sirala;
    if (!k || typeof k !== "object") return [];
    var list = Array.isArray(k.activities) ? k.activities : [];
    if (!list.length && Array.isArray(k.sounds)) list = [k];
    return list
      .map(function (a, i) {
        return normalizeActivity(a, i);
      })
      .filter(function (a) {
        return a.sounds.length >= 2 && a.correctOrder.length >= 2;
      });
  }

  function hasSirala(pack) {
    return listActivities(pack).length > 0;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function stopInstruct() {
    if (instructAudio) {
      try {
        instructAudio.pause();
        instructAudio.removeAttribute("src");
        instructAudio.load();
      } catch (_) {}
      instructAudio = null;
    }
  }

  function playUrl(url) {
    stopInstruct();
    if (!url) return Promise.resolve();
    return new Promise(function (resolve) {
      var a = new Audio();
      instructAudio = a;
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      a.addEventListener("ended", finish, { once: true });
      a.addEventListener("error", finish, { once: true });
      a.src = url;
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(finish);
      setTimeout(finish, 30000);
    });
  }

  function softPause(v) {
    if (!v) return;
    try {
      v.pause();
    } catch (_) {}
  }

  function viewportSize() {
    var w = Math.max(window.innerWidth || 0, 1);
    var h = Math.max(window.innerHeight || 0, 1);
    try {
      var vv = window.visualViewport;
      if (vv && vv.width > 0 && vv.height > 0) {
        w = Math.max(w, Math.ceil(vv.width));
        h = Math.max(h, Math.ceil(vv.height));
      }
    } catch (_) {}
    return { w: w, h: h };
  }

  function layoutStage() {
    if (!hostEl) return;
    var box = hostEl.querySelector(".birles-sirala__stagebox");
    if (!box) return;
    var vp = viewportSize();
    var w = vp.w;
    var h = Math.round((vp.w * 16) / 9);
    if (h < vp.h) {
      h = vp.h;
      w = Math.round((vp.h * 9) / 16);
    }
    if (w < vp.w) w = vp.w;
    if (h < vp.h) h = vp.h;
    w += 6;
    h += 6;
    box.style.position = "absolute";
    box.style.left = "50%";
    box.style.top = "50%";
    box.style.width = w + "px";
    box.style.height = h + "px";
    box.style.transform = "translate(-50%, -50%)";
  }

  function bindLayout() {
    unbindLayout();
    layoutBound = function () {
      layoutStage();
    };
    window.addEventListener("resize", layoutBound);
    window.addEventListener("orientationchange", layoutBound);
    try {
      if (window.visualViewport) window.visualViewport.addEventListener("resize", layoutBound);
    } catch (_) {}
  }

  function unbindLayout() {
    if (!layoutBound) return;
    window.removeEventListener("resize", layoutBound);
    window.removeEventListener("orientationchange", layoutBound);
    try {
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", layoutBound);
    } catch (_) {}
    layoutBound = null;
  }

  function setPoolFs(on) {
    try {
      document.body.classList.toggle("birles-sirala-fs", !!on);
      if (typeof window.novaSyncPerfRuntime === "function") {
        window.novaSyncPerfRuntime();
      } else if (on) {
        document.body.style.zoom = "1";
      }
    } catch (_) {}
  }

  function nestCount() {
    return (activityRef && activityRef.correctOrder && activityRef.correctOrder.length) || 0;
  }

  function filledCount() {
    var n = 0;
    for (var i = 0; i < placements.length; i++) {
      if (placements[i] != null) n++;
    }
    return n;
  }

  function setNextEnabled(on) {
    nextUnlocked = !!on;
    if (!hostEl) return;
    var next = hostEl.querySelector("#birles-sirala-next");
    if (!next) return;
    if (on) {
      next.disabled = false;
      next.classList.remove("is-locked");
      next.setAttribute("aria-disabled", "false");
      next.textContent = "İlerle";
      next.removeAttribute("title");
    } else {
      next.disabled = true;
      next.classList.add("is-locked");
      next.setAttribute("aria-disabled", "true");
      next.textContent = "Bekle";
      next.setAttribute("title", "Gösterim bitince açılır");
    }
  }

  function dockHtml() {
    var prog = laneProgressText || "·";
    return (
      '<div class="birles-fs-dock" id="birles-sirala-dock" role="toolbar" aria-label="Oyun kontrolleri">' +
      '  <div class="birles-fs-dock__bar">' +
      '    <span class="birles-fs-dock__prog" aria-live="polite">' +
      esc(prog) +
      "</span>" +
      '    <div class="birles-fs-dock__actions">' +
      '      <button type="button" class="birles-fs-dock__btn birles-fs-dock__btn--replay" id="birles-sirala-replay" aria-label="Tekrar" title="Tekrar">🔁</button>' +
      '      <button type="button" class="birles-fs-dock__btn birles-fs-dock__btn--soft" id="birles-sirala-all">Tümü</button>' +
      '      <button type="button" class="birles-fs-dock__btn birles-fs-dock__btn--go is-locked" id="birles-sirala-next" disabled aria-disabled="true" title="Gösterim bitince açılır">Bekle</button>' +
      "    </div>" +
      "  </div>" +
      "</div>"
    );
  }

  function bindDock() {
    if (!hostEl) return;
    var replay = hostEl.querySelector("#birles-sirala-replay");
    var allBtn = hostEl.querySelector("#birles-sirala-all");
    var next = hostEl.querySelector("#birles-sirala-next");
    if (replay) {
      replay.addEventListener("click", function () {
        if (finishing && !nextUnlocked) return;
        mountActivity();
      });
    }
    if (allBtn) {
      allBtn.addEventListener("click", function () {
        var cb = onDoneCb;
        close();
        if (typeof cb === "function") cb({ success: false, goGallery: true });
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        if (!nextUnlocked) return;
        finishSuccess();
      });
    }
  }

  function restoreChipToRack(chip, beforeEl) {
    if (!chip || !hostEl) return;
    chip.classList.remove("is-dragging", "is-lifted", "is-placed");
    chip.style.cssText = "";
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (!rack) return;
    if (beforeEl && beforeEl.parentNode === rack) {
      rack.insertBefore(chip, beforeEl);
    } else {
      rack.appendChild(chip);
    }
  }

  function endDrag(cancel) {
    if (!dragState) return;
    try {
      if (dragState.capEl && dragState.pointerId != null) {
        dragState.capEl.releasePointerCapture(dragState.pointerId);
      }
    } catch (_) {}

    var chip = dragState.chip;
    var ph = dragState.placeholder;
    var nestI = dragState.nestI;
    var soundI = dragState.soundI;

    dragState = null;
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerUp, true);

    if (hostEl) {
      hostEl.querySelectorAll(".birles-sirala__nest.is-target").forEach(function (n) {
        n.classList.remove("is-target");
      });
    }

    if (chip) {
      chip.classList.remove("is-dragging", "is-lifted");
      chip.style.cssText = "";
    }

    if (!cancel && nestI != null && soundI != null && chip) {
      if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
      placeChipInNest(soundI, nestI, chip);
    } else if (chip) {
      if (ph && ph.parentNode) {
        restoreChipToRack(chip, ph);
        ph.parentNode.removeChild(ph);
      } else {
        restoreChipToRack(chip);
      }
    } else if (ph && ph.parentNode) {
      ph.parentNode.removeChild(ph);
    }
  }

  function close() {
    openToken += 1;
    finishing = false;
    nextUnlocked = false;
    stopInstruct();
    unbindLayout();
    endDrag(true);
    setPoolFs(false);
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    hostEl = null;
    soundRef = null;
    onDoneCb = null;
    activityRef = null;
    placements = [];
    laneMode = false;
    laneProgressText = "";
  }

  function hardCutBoom(on) {
    if (!hostEl) return;
    var mergeL = hostEl.querySelector(".birles-sirala__layer--merge");
    var boomL = hostEl.querySelector(".birles-sirala__layer--boom");
    if (mergeL) mergeL.style.opacity = on ? "0" : "1";
    if (boomL) boomL.style.opacity = on ? "1" : "0";
  }

  function waitBoomEnded(boom) {
    return new Promise(function (resolve) {
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        resolve();
      }
      if (!boom) {
        done();
        return;
      }
      function onEnded() {
        boom.removeEventListener("ended", onEnded);
        done();
      }
      boom.addEventListener("ended", onEnded);
      setTimeout(done, 12000);
    });
  }

  async function playFinale() {
    if (!hostEl || finishing || !activityRef) return;
    finishing = true;
    hostEl.classList.add("is-done");

    var merge = hostEl.querySelector(".birles-sirala__vid--merge");
    var boom = hostEl.querySelector(".birles-sirala__vid--boom");
    var burst = hostEl.querySelector(".birles-sirala__burst");
    var flash = hostEl.querySelector(".birles-sirala__flash");
    var board = hostEl.querySelector(".birles-sirala__board");

    if (board) board.classList.add("is-finale");
    softPause(merge);

    if (boom) {
      boom.removeAttribute("hidden");
      boom.muted = false;
      boom.loop = false;
      try {
        boom.volume = 1;
      } catch (_) {}
      try {
        boom.currentTime = 0;
      } catch (_) {}
    }
    hardCutBoom(true);

    if (flash) {
      flash.hidden = false;
      flash.classList.remove("is-on");
      void flash.offsetWidth;
      flash.classList.add("is-on");
    }

    if (boom) {
      try {
        await boom.play();
      } catch (_) {
        try {
          boom.muted = true;
          await boom.play();
          boom.muted = false;
        } catch (_) {}
      }
    }

    await new Promise(function (r) {
      setTimeout(r, 620);
    });
    if (!hostEl) return;

    var word = activityRef.result || activityRef.title || activityRef.correctOrder.join("") || "";
    if (burst) {
      burst.innerHTML =
        '<span class="birles-sirala__burst-chip">' + esc(word) + "</span>";
      burst.hidden = false;
      burst.classList.add("is-boom-in");
    }

    var resultAudio = String(activityRef.resultAudioUrl || "").trim();
    if (resultAudio) {
      try {
        playUrl(resultAudio);
      } catch (_) {}
    }

    await waitBoomEnded(boom);
    if (!hostEl) return;

    softPause(boom);
    if (flash) {
      flash.classList.remove("is-on");
      flash.hidden = true;
    }

    setNextEnabled(true);
  }

  function finishSuccess() {
    var cb = onDoneCb;
    close();
    if (typeof cb === "function") cb({ success: true });
  }

  function checkComplete() {
    if (!activityRef || finishing) return;
    var order = activityRef.correctOrder;
    if (filledCount() < order.length) return;

    var ok = true;
    for (var i = 0; i < order.length; i++) {
      var soundI = placements[i];
      if (soundI == null) {
        ok = false;
        break;
      }
      var lab = activityRef.sounds[soundI] && activityRef.sounds[soundI].label;
      if (normLabel(lab) !== normLabel(order[i])) {
        ok = false;
        break;
      }
    }

    if (ok) {
      playFinale();
      return;
    }

    var nests = hostEl && hostEl.querySelector(".birles-sirala__nests");
    if (nests) {
      nests.classList.remove("is-shake");
      void nests.offsetWidth;
      nests.classList.add("is-shake");
    }
    setTimeout(function () {
      if (!hostEl || finishing) return;
      resetPlacements();
    }, 650);
  }

  function resetPlacements() {
    if (!activityRef || !hostEl) return;
    var n = nestCount();
    placements = [];
    for (var i = 0; i < n; i++) placements.push(null);
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (nest) {
      nest.classList.remove("is-filled");
      var slot = nest.querySelector(".birles-sirala__nest-slot");
      if (slot) slot.innerHTML = "";
    });
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (rack) {
      var order = shuffle(
        activityRef.sounds.map(function (_, i) {
          return i;
        })
      );
      rack.innerHTML = rackHtml(order);
      bindChips();
    }
  }

  function placeChipInNest(soundI, nestI, chipEl) {
    if (!activityRef || finishing || !hostEl) return;
    var n = nestCount();
    if (nestI < 0 || nestI >= n) return;
    if (placements[nestI] != null) return;

    for (var i = 0; i < placements.length; i++) {
      if (placements[i] === soundI) {
        placements[i] = null;
        var oldNest = hostEl.querySelector('.birles-sirala__nest[data-nest="' + i + '"]');
        if (oldNest) {
          oldNest.classList.remove("is-filled");
          var os = oldNest.querySelector(".birles-sirala__nest-slot");
          if (os) os.innerHTML = "";
        }
      }
    }

    placements[nestI] = soundI;
    var nest = hostEl.querySelector('.birles-sirala__nest[data-nest="' + nestI + '"]');
    var chip =
      chipEl ||
      (hostEl &&
        hostEl.querySelector('.birles-sirala__chip[data-sound-i="' + soundI + '"]')) ||
      document.querySelector(
        '#birles-sirala-overlay .birles-sirala__chip.is-lifted[data-sound-i="' + soundI + '"]'
      );
    if (nest && chip) {
      nest.classList.add("is-filled");
      var slot = nest.querySelector(".birles-sirala__nest-slot");
      if (slot) {
        chip.classList.add("is-placed");
        chip.classList.remove("is-dragging", "is-lifted");
        chip.style.cssText = "";
        slot.appendChild(chip);
      }
    }
    try {
      var s = activityRef.sounds[soundI];
      if (s && s.audioUrl) playUrl(s.audioUrl);
    } catch (_) {}
    checkComplete();
  }

  function nestAtPoint(x, y) {
    if (!hostEl) return null;
    var nests = hostEl.querySelectorAll(".birles-sirala__nest:not(.is-filled)");
    for (var i = 0; i < nests.length; i++) {
      var r = nests[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return Number(nests[i].getAttribute("data-nest"));
      }
    }
    return null;
  }

  function moveLifted(x, y) {
    if (!dragState || !dragState.chip) return;
    dragState.chip.style.left = x - dragState.ox + "px";
    dragState.chip.style.top = y - dragState.oy + "px";
  }

  function onPointerMove(e) {
    if (!dragState) return;
    if (dragState.pointerId != null && e.pointerId !== dragState.pointerId) return;
    e.preventDefault();
    moveLifted(e.clientX, e.clientY);
    var nestI = nestAtPoint(e.clientX, e.clientY);
    dragState.nestI = nestI;
    if (hostEl) {
      hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (el) {
        var i = Number(el.getAttribute("data-nest"));
        el.classList.toggle("is-target", nestI === i);
      });
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;
    if (dragState.pointerId != null && e.pointerId !== dragState.pointerId) return;
    if (e && e.clientX != null) {
      dragState.nestI = nestAtPoint(e.clientX, e.clientY);
    }
    endDrag(false);
  }

  /** Gerçek kutuyu kaldır — yerinde sabit boşluk, diğerleri kaymaz */
  function startDrag(chip, e) {
    if (finishing || !chip || dragState) return;
    if (chip.classList.contains("is-placed")) return;
    var soundI = Number(chip.getAttribute("data-sound-i"));
    if (isNaN(soundI)) return;

    e.preventDefault();
    e.stopPropagation();

    var rect = chip.getBoundingClientRect();
    var parent = chip.parentNode;
    if (!parent) return;

    var ph = document.createElement("div");
    ph.className = "birles-sirala__chip-ph";
    ph.style.width = Math.round(rect.width) + "px";
    ph.style.height = Math.round(rect.height) + "px";
    ph.style.flex = "0 0 " + Math.round(rect.width) + "px";
    parent.insertBefore(ph, chip);

    /* Asıl kutuyu overlay içinde taşı — body’ye alınca z-index altında kayboluyordu */
    hostEl.appendChild(chip);
    chip.classList.add("is-lifted", "is-dragging");
    chip.style.position = "fixed";
    chip.style.left = rect.left + "px";
    chip.style.top = rect.top + "px";
    chip.style.width = rect.width + "px";
    chip.style.height = rect.height + "px";
    chip.style.margin = "0";
    chip.style.zIndex = "15000";
    chip.style.transform = "scale(1.08)";
    chip.style.boxShadow = "0 14px 32px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,236,170,0.95)";
    chip.style.pointerEvents = "none";
    chip.style.touchAction = "none";
    chip.style.visibility = "visible";
    chip.style.opacity = "1";
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.justifyContent = "center";

    dragState = {
      chip: chip,
      placeholder: ph,
      soundI: soundI,
      nestI: null,
      ox: Math.max(8, Math.min(rect.width - 8, e.clientX - rect.left)),
      oy: Math.max(8, Math.min(rect.height - 8, e.clientY - rect.top)),
      pointerId: e.pointerId,
      capEl: hostEl || document.body
    };

    moveLifted(e.clientX, e.clientY);

    try {
      dragState.capEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
  }

  function nestHtml(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
      html +=
        '<div class="birles-sirala__nest" data-nest="' +
        i +
        '">' +
        '<span class="birles-sirala__nest-num">' +
        (i + 1) +
        "</span>" +
        '<span class="birles-sirala__nest-slot"></span>' +
        "</div>";
    }
    return html;
  }

  function rackHtml(order) {
    var html = "";
    order.forEach(function (origIdx) {
      var s = activityRef.sounds[origIdx];
      html +=
        '<button type="button" class="birles-sirala__chip" data-sound-i="' +
        origIdx +
        '">' +
        '<span class="birles-sirala__chip-label">' +
        esc(s.label || "?") +
        "</span>" +
        "</button>";
    });
    return html;
  }

  function bindChips() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__chip").forEach(function (chip) {
      chip.addEventListener(
        "pointerdown",
        function (e) {
          if (e.button != null && e.button !== 0) return;
          startDrag(chip, e);
        },
        { passive: false }
      );
    });
  }

  function bindNests() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (nest) {
      nest.addEventListener("click", function () {
        if (finishing) return;
        var nestI = Number(nest.getAttribute("data-nest"));
        if (placements[nestI] == null) return;
        var soundI = placements[nestI];
        placements[nestI] = null;
        nest.classList.remove("is-filled");
        var slot = nest.querySelector(".birles-sirala__nest-slot");
        var chip = slot && slot.querySelector(".birles-sirala__chip");
        if (chip) restoreChipToRack(chip);
        if (slot) slot.innerHTML = "";
      });
    });
  }

  function mountActivity() {
    if (!activityRef || !hostEl) return;
    endDrag(true);
    var n = nestCount();
    placements = [];
    for (var i = 0; i < n; i++) placements.push(null);
    finishing = false;
    nextUnlocked = false;
    hostEl.classList.remove("is-done");
    setNextEnabled(false);

    var title = hostEl.querySelector(".birles-sirala__ask");
    if (title) {
      var head = activityRef.result || activityRef.title || "";
      title.textContent = (head ? head + " · " : "") + "Sesleri sırayla yuvaya sürükle";
    }
    var hint = hostEl.querySelector(".birles-sirala__hint");
    if (hint) {
      hint.hidden = false;
      hint.textContent = "Kutuyu tutup yuvaya sürükle";
    }

    var nests = hostEl.querySelector(".birles-sirala__nests");
    if (nests) {
      nests.classList.remove("is-shake");
      nests.innerHTML = nestHtml(n);
    }
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (rack) {
      var order = shuffle(
        activityRef.sounds.map(function (_, i) {
          return i;
        })
      );
      rack.innerHTML = rackHtml(order);
    }
    var burst = hostEl.querySelector(".birles-sirala__burst");
    if (burst) {
      burst.hidden = true;
      burst.classList.remove("is-boom-in");
      burst.innerHTML = "";
    }
    var board = hostEl.querySelector(".birles-sirala__board");
    if (board) board.classList.remove("is-finale");

    bindChips();
    bindNests();
    hardCutBoom(false);

    var merge = hostEl.querySelector(".birles-sirala__vid--merge");
    if (merge) {
      merge.muted = true;
      merge.loop = true;
      if (!merge.getAttribute("src")) merge.src = POOL_MERGE_SRC;
      var p = merge.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    var boom = hostEl.querySelector(".birles-sirala__vid--boom");
    if (boom && !boom.getAttribute("src")) boom.src = POOL_BOOM_SRC;

    if (activityRef.instructionAudioUrl) {
      setTimeout(function () {
        playUrl(activityRef.instructionAudioUrl);
      }, 350);
    }
  }

  function open(opts) {
    opts = opts || {};
    close();
    var token = ++openToken;
    soundRef = opts.sound || null;
    onDoneCb = typeof opts.onDone === "function" ? opts.onDone : null;
    laneMode = !!opts.laneMode;
    laneProgressText = String(opts.laneProgress || "").trim();
    finishing = false;
    nextUnlocked = false;

    if (opts.activity) {
      activityRef = normalizeActivity(opts.activity, 0);
    } else {
      var acts = listActivities(opts.letterPack || {});
      activityRef = acts[0] || null;
    }

    if (!activityRef || activityRef.sounds.length < 2 || activityRef.correctOrder.length < 2) {
      if (typeof onDoneCb === "function") onDoneCb({ success: false, empty: true });
      return;
    }

    var box = document.createElement("div");
    box.id = "birles-sirala-overlay";
    box.className = "birles-sirala";
    box.innerHTML =
      '<div class="birles-sirala__backdrop"></div>' +
      '<div class="birles-sirala__stage">' +
      '  <div class="birles-sirala__stagebox">' +
      '    <div class="birles-sirala__layer birles-sirala__layer--merge" style="opacity:1">' +
      '      <video class="birles-sirala__vid birles-sirala__vid--merge" playsinline muted loop preload="auto"></video>' +
      "    </div>" +
      '    <div class="birles-sirala__layer birles-sirala__layer--boom" style="opacity:0">' +
      '      <video class="birles-sirala__vid birles-sirala__vid--boom" playsinline preload="auto"></video>' +
      "    </div>" +
      '    <div class="birles-sirala__flash" hidden></div>' +
      '    <div class="birles-sirala__board">' +
      '      <p class="birles-sirala__ask"></p>' +
      '      <div class="birles-sirala__nests"></div>' +
      '      <div class="birles-sirala__rack"></div>' +
      '      <p class="birles-sirala__hint"></p>' +
      '      <button type="button" class="birles-sirala__replay" data-sirala-instruct="1" aria-label="Yönerge">🔊</button>' +
      "    </div>" +
      '    <p class="birles-sirala__burst" hidden aria-live="polite"></p>' +
      "  </div>" +
      "</div>" +
      '<button type="button" class="birles-sirala__close" data-sirala-close="1" aria-label="Kapat">✕</button>' +
      dockHtml();

    (document.documentElement || document.body).appendChild(box);
    hostEl = box;
    setPoolFs(true);
    bindLayout();
    layoutStage();
    bindDock();

    box.querySelectorAll("[data-sirala-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (finishing && nextUnlocked) {
          finishSuccess();
          return;
        }
        var cb = onDoneCb;
        close();
        if (typeof cb === "function") cb({ success: false, closed: true });
      });
    });
    box.querySelectorAll("[data-sirala-instruct]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (activityRef && activityRef.instructionAudioUrl) {
          playUrl(activityRef.instructionAudioUrl);
        }
      });
    });

    mountActivity();
    requestAnimationFrame(function () {
      if (token !== openToken) return;
      layoutStage();
    });
  }

  global.NovaBirlestirelimSirala = {
    open: open,
    close: close,
    hasSirala: hasSirala,
    listActivities: listActivities,
    normalize: normalizeActivity,
    SLOT_MAX: SLOT_MAX
  };
})(typeof window !== "undefined" ? window : this);
