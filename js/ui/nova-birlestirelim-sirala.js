/**
 * Ses Yuvası — duyulan sesleri doğru sırayla yuvalara sürükle
 * Admin: birlestirelim/letters/{soundId}/sirala =
 *   { activities:[{ id, title, result, instructionAudioUrl,
 *                   sounds:[{label,audioUrl}] }] }  // en fazla 5
 */
(function (global) {
  "use strict";

  var SLOT_MAX = 5;
  var POOL_MERGE_SRC = "assets/birles/ses_birlestirme.mp4?v=opt1";
  var POOL_BOOM_SRC = "assets/birles/ses_patlama.mp4?v=opt1";

  var hostEl = null;
  var onDoneCb = null;
  var soundRef = null;
  var packRef = null;
  var openToken = 0;
  var activitiesRef = [];
  var activityIdx = 0;
  var finishing = false;
  var placements = [];
  var dragState = null;
  var layoutBound = null;
  var instructAudio = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeSound(row) {
    var r = row && typeof row === "object" ? row : {};
    return {
      label: String(r.label || r.text || r.token || "").trim(),
      audioUrl: String(r.audioUrl || r.mp3 || r.url || "").trim()
    };
  }

  function normalizeActivity(raw, idx) {
    var row = raw && typeof raw === "object" ? raw : {};
    var soundsIn = Array.isArray(row.sounds) ? row.sounds : Array.isArray(row.slots) ? row.slots : [];
    var sounds = [];
    for (var i = 0; i < SLOT_MAX; i++) {
      var s = normalizeSound(soundsIn[i]);
      if (s.label || s.audioUrl) sounds.push(s);
    }
    return {
      id: String(row.id || "s" + (idx + 1)).trim() || "s" + (idx + 1),
      title: String(row.title || "").trim(),
      result: String(row.result || row.title || "").trim(),
      instructionAudioUrl: String(
        row.instructionAudioUrl || row.instructionUrl || row.promptAudioUrl || ""
      ).trim(),
      sounds: sounds
    };
  }

  function listActivities(pack) {
    var k = pack && pack.sirala;
    if (!k || typeof k !== "object") return [];
    var list = Array.isArray(k.activities) ? k.activities : k.images ? [] : [];
    if (!list.length && Array.isArray(k.sounds)) {
      list = [k];
    }
    return list
      .map(function (a, i) {
        return normalizeActivity(a, i);
      })
      .filter(function (a) {
        return a.sounds.length >= 2;
      });
  }

  function hasSirala(pack) {
    return listActivities(pack).length > 0;
  }

  function currentActivity() {
    if (!activitiesRef.length) return null;
    var i = Math.max(0, Math.min(activityIdx, activitiesRef.length - 1));
    return activitiesRef[i];
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
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", layoutBound);
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
      }
    } catch (_) {}
    layoutBound = null;
  }

  function setPoolFs(on) {
    try {
      document.body.classList.toggle("birles-pool-fs", !!on);
      document.body.classList.toggle("birles-sirala-fs", !!on);
      if (typeof window.novaSyncPerfRuntime === "function") {
        window.novaSyncPerfRuntime();
      } else if (on) {
        document.body.style.zoom = "1";
      }
    } catch (_) {}
  }

  function close() {
    openToken += 1;
    finishing = false;
    stopInstruct();
    unbindLayout();
    endDrag(true);
    setPoolFs(false);
    if (hostEl && hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
    hostEl = null;
    soundRef = null;
    packRef = null;
    onDoneCb = null;
    activitiesRef = [];
    activityIdx = 0;
    placements = [];
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

  async function playFinale(act) {
    if (!hostEl || finishing) return;
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

    var word = act.result || act.title || "";
    if (burst) {
      burst.textContent = word;
      burst.hidden = false;
      burst.classList.add("is-boom-in");
    }

    /* Sonuç sesi: son parçanın / birleşimin URL’si yoksa parçaları sırayla çalma */
    var resultAudio = "";
    /* result audio ayrı yok — parçaları bir kez daha çalmak yerine sessiz bırak */

    await waitBoomEnded(boom);
    if (!hostEl) return;

    softPause(boom);
    if (flash) {
      flash.classList.remove("is-on");
      flash.hidden = true;
    }
    if (merge) {
      merge.muted = true;
      merge.loop = true;
      var mp = merge.play();
      if (mp && typeof mp.catch === "function") mp.catch(function () {});
    }
    hardCutBoom(false);

    updateDoneButtons();
  }

  function updateDoneButtons() {
    if (!hostEl) return;
    var hasNext = activityIdx < activitiesRef.length - 1;
    var nextBtn = hostEl.querySelector("[data-sirala-next]");
    var exitBtn = hostEl.querySelector("[data-sirala-done]");
    if (nextBtn) {
      nextBtn.hidden = !hasNext;
      if (hasNext) {
        nextBtn.textContent = "İleri · " + (activityIdx + 2) + "/" + activitiesRef.length;
      }
    }
    if (exitBtn) {
      exitBtn.hidden = hasNext;
      if (!hasNext) exitBtn.textContent = "✓";
    }
  }

  function finishSuccess() {
    var cb = onDoneCb;
    close();
    if (typeof cb === "function") cb({ success: true });
  }

  function goNextActivity() {
    if (activityIdx >= activitiesRef.length - 1) {
      finishSuccess();
      return;
    }
    stopInstruct();
    activityIdx += 1;
    finishing = false;
    mountActivity();
  }

  function nestHtml(n) {
    var html = "";
    for (var i = 0; i < n; i++) {
      html +=
        '<div class="birles-sirala__nest" data-nest="' +
        i +
        '" aria-label="Yuva ' +
        (i + 1) +
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
      var act = currentActivity();
      var s = act.sounds[origIdx];
      html +=
        '<button type="button" class="birles-sirala__chip" data-sound-i="' +
        origIdx +
        '" draggable="false">' +
        '<span class="birles-sirala__chip-label">' +
        esc(s.label || "?") +
        "</span>" +
        "</button>";
    });
    return html;
  }

  function filledCount() {
    var n = 0;
    for (var i = 0; i < placements.length; i++) {
      if (placements[i] != null) n++;
    }
    return n;
  }

  function checkComplete() {
    var act = currentActivity();
    if (!act || finishing) return;
    if (filledCount() < act.sounds.length) return;
    var ok = true;
    for (var i = 0; i < act.sounds.length; i++) {
      if (placements[i] !== i) {
        ok = false;
        break;
      }
    }
    if (ok) {
      playFinale(act);
      return;
    }
    /* yanlış sıra — salla ve geri al */
    if (hostEl) {
      var nests = hostEl.querySelector(".birles-sirala__nests");
      if (nests) {
        nests.classList.remove("is-shake");
        void nests.offsetWidth;
        nests.classList.add("is-shake");
      }
    }
    setTimeout(function () {
      if (!hostEl || finishing) return;
      resetPlacementsKeepOrder();
    }, 650);
  }

  function resetPlacementsKeepOrder() {
    var act = currentActivity();
    if (!act || !hostEl) return;
    placements = act.sounds.map(function () {
      return null;
    });
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (nest) {
      nest.classList.remove("is-filled", "is-correct");
      var slot = nest.querySelector(".birles-sirala__nest-slot");
      if (slot) slot.innerHTML = "";
    });
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (rack) {
      var order = shuffle(
        act.sounds.map(function (_, i) {
          return i;
        })
      );
      rack.innerHTML = rackHtml(order);
      bindChips();
    }
  }

  function placeChipInNest(soundI, nestI) {
    var act = currentActivity();
    if (!act || finishing || !hostEl) return;
    if (nestI < 0 || nestI >= act.sounds.length) return;
    if (placements[nestI] != null) return;

    /* chip zaten bir yuvadaysa çıkar */
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
    var chip = hostEl.querySelector('.birles-sirala__chip[data-sound-i="' + soundI + '"]');
    if (nest && chip) {
      nest.classList.add("is-filled");
      var slot = nest.querySelector(".birles-sirala__nest-slot");
      if (slot) {
        chip.classList.add("is-placed");
        slot.appendChild(chip);
      }
    }
    try {
      var s = act.sounds[soundI];
      if (s && s.audioUrl) playUrl(s.audioUrl);
    } catch (_) {}
    checkComplete();
  }

  function endDrag(cancel) {
    if (!dragState) return;
    var ghost = dragState.ghost;
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    if (dragState.chip) dragState.chip.classList.remove("is-dragging");
    hostEl &&
      hostEl.querySelectorAll(".birles-sirala__nest.is-target").forEach(function (n) {
        n.classList.remove("is-target");
      });
    if (!cancel && dragState.nestI != null && dragState.soundI != null) {
      placeChipInNest(dragState.soundI, dragState.nestI);
    }
    dragState = null;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);
  }

  function nestAtPoint(x, y) {
    if (!hostEl) return null;
    var nests = hostEl.querySelectorAll(".birles-sirala__nest");
    for (var i = 0; i < nests.length; i++) {
      var r = nests[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return Number(nests[i].getAttribute("data-nest"));
      }
    }
    return null;
  }

  function onPointerMove(e) {
    if (!dragState || !dragState.ghost) return;
    dragState.ghost.style.left = e.clientX - dragState.ox + "px";
    dragState.ghost.style.top = e.clientY - dragState.oy + "px";
    var nestI = nestAtPoint(e.clientX, e.clientY);
    dragState.nestI = nestI;
    if (hostEl) {
      hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (n) {
        var i = Number(n.getAttribute("data-nest"));
        n.classList.toggle("is-target", nestI === i && placements[i] == null);
      });
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;
    if (e && e.clientX != null) {
      dragState.nestI = nestAtPoint(e.clientX, e.clientY);
    }
    endDrag(false);
  }

  function startDrag(chip, e) {
    if (finishing || !chip || dragState) return;
    var soundI = Number(chip.getAttribute("data-sound-i"));
    if (isNaN(soundI)) return;
    e.preventDefault();
    var rect = chip.getBoundingClientRect();
    var ghost = chip.cloneNode(true);
    ghost.classList.add("birles-sirala__ghost");
    ghost.style.width = rect.width + "px";
    ghost.style.height = rect.height + "px";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    document.body.appendChild(ghost);
    chip.classList.add("is-dragging");
    dragState = {
      chip: chip,
      ghost: ghost,
      soundI: soundI,
      nestI: null,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }

  function bindChips() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__chip").forEach(function (chip) {
      chip.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        startDrag(chip, e);
      });
      chip.addEventListener("click", function () {
        if (finishing || dragState) return;
        var soundI = Number(chip.getAttribute("data-sound-i"));
        var act = currentActivity();
        if (!act || isNaN(soundI)) return;
        var s = act.sounds[soundI];
        if (s && s.audioUrl) playUrl(s.audioUrl);
      });
    });
  }

  function bindNests() {
    if (!hostEl) return;
    hostEl.querySelectorAll(".birles-sirala__nest").forEach(function (nest) {
      nest.addEventListener("click", function () {
        if (finishing) return;
        var nestI = Number(nest.getAttribute("data-nest"));
        if (placements[nestI] == null) return;
        /* yuvadan geri rafta */
        var soundI = placements[nestI];
        placements[nestI] = null;
        nest.classList.remove("is-filled");
        var slot = nest.querySelector(".birles-sirala__nest-slot");
        var chip = slot && slot.querySelector(".birles-sirala__chip");
        var rack = hostEl.querySelector(".birles-sirala__rack");
        if (chip && rack) {
          chip.classList.remove("is-placed");
          rack.appendChild(chip);
        }
        if (slot) slot.innerHTML = "";
      });
    });
  }

  function mountActivity() {
    var act = currentActivity();
    if (!act || !hostEl) return;
    placements = act.sounds.map(function () {
      return null;
    });
    hostEl.classList.remove("is-done");

    var title = hostEl.querySelector(".birles-sirala__ask");
    if (title) {
      title.textContent =
        (act.title ? act.title + " · " : "") + "Sesleri sırayla yuvaya sürükle";
    }
    var hint = hostEl.querySelector(".birles-sirala__hint");
    if (hint) {
      hint.hidden = false;
      hint.textContent =
        activitiesRef.length > 1
          ? "Doğru sırayı bul · " + (activityIdx + 1) + "/" + activitiesRef.length
          : "Doğru sırayı bul";
    }

    var nests = hostEl.querySelector(".birles-sirala__nests");
    if (nests) {
      nests.classList.remove("is-shake");
      nests.innerHTML = nestHtml(act.sounds.length);
    }
    var rack = hostEl.querySelector(".birles-sirala__rack");
    if (rack) {
      var order = shuffle(
        act.sounds.map(function (_, i) {
          return i;
        })
      );
      rack.innerHTML = rackHtml(order);
    }
    var burst = hostEl.querySelector(".birles-sirala__burst");
    if (burst) {
      burst.hidden = true;
      burst.classList.remove("is-boom-in");
      burst.textContent = "";
    }
    var board = hostEl.querySelector(".birles-sirala__board");
    if (board) board.classList.remove("is-finale");

    var nextBtn = hostEl.querySelector("[data-sirala-next]");
    var exitBtn = hostEl.querySelector("[data-sirala-done]");
    if (nextBtn) nextBtn.hidden = true;
    if (exitBtn) exitBtn.hidden = true;

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

    if (act.instructionAudioUrl) {
      setTimeout(function () {
        playUrl(act.instructionAudioUrl);
      }, 400);
    }
  }

  function open(opts) {
    opts = opts || {};
    close();
    var token = ++openToken;
    soundRef = opts.sound || null;
    packRef = opts.letterPack || {};
    onDoneCb = typeof opts.onDone === "function" ? opts.onDone : null;
    activitiesRef = listActivities(packRef);
    activityIdx = 0;
    finishing = false;

    if (!activitiesRef.length) {
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
      '    <div class="birles-sirala__flash" hidden aria-hidden="true"></div>' +
      '    <div class="birles-sirala__board">' +
      '      <p class="birles-sirala__ask"></p>' +
      '      <div class="birles-sirala__nests" aria-label="Yuvalar"></div>' +
      '      <div class="birles-sirala__rack" aria-label="Sesler"></div>' +
      '      <p class="birles-sirala__hint"></p>' +
      '      <button type="button" class="birles-sirala__replay" data-sirala-instruct="1" aria-label="Yönergeyi dinle">🔊</button>' +
      "    </div>" +
      '    <p class="birles-sirala__burst" hidden aria-live="polite"></p>' +
      "  </div>" +
      "</div>" +
      '<button type="button" class="birles-sirala__close" data-sirala-close="1" aria-label="Kapat">✕</button>' +
      '<button type="button" class="birles-sirala__next" data-sirala-next="1" hidden>İleri ›</button>' +
      '<button type="button" class="birles-sirala__exit" data-sirala-done="1" hidden aria-label="Bitir">✓</button>';

    (document.documentElement || document.body).appendChild(box);
    hostEl = box;
    setPoolFs(true);
    bindLayout();
    layoutStage();

    box.querySelectorAll("[data-sirala-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (finishing && activityIdx >= activitiesRef.length - 1) {
          finishSuccess();
          return;
        }
        var cb = onDoneCb;
        close();
        if (typeof cb === "function") cb({ success: false, closed: true });
      });
    });
    box.querySelectorAll("[data-sirala-done]").forEach(function (el) {
      el.addEventListener("click", function () {
        finishSuccess();
      });
    });
    box.querySelectorAll("[data-sirala-next]").forEach(function (el) {
      el.addEventListener("click", function () {
        goNextActivity();
      });
    });
    box.querySelectorAll("[data-sirala-instruct]").forEach(function (el) {
      el.addEventListener("click", function () {
        var act = currentActivity();
        if (act && act.instructionAudioUrl) playUrl(act.instructionAudioUrl);
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
