/**
 * BİRLEŞTİRELİM — 1. sınıf Kaptan Kabuk özel birleştirme atölyesi
 */
(function () {
  "use strict";

  var D = null;
  var V = null;
  var overlay = null;
  var view = "groups";
  var activeSound = null;
  var activeFusion = null;
  var activeGroupId = "grup1";
  /** { key, title, allLabel, list, index } */
  var activeLane = null;
  var mediaMap = {};
  var letterMap = {};
  var animToken = 0;
  /** Lane İlerle kilidi — gösterim bitmeden false */
  var laneNextUnlocked = false;
  var reducedMotion = false;
  var mediaReady = null;
  /** Firebase: { sounds:{}, groups:{}, updatedAt } */
  var birlesProgress = null;
  var birlesProgressLoading = null;

  var LANE_DEFS = [
    {
      key: "hece",
      title: "Hece Avı",
      tag: "Hece",
      sub: "Küçük parçaları yakala",
      allLabel: "Tüm heceler",
      tone: "hece"
    },
    {
      key: "kelime",
      title: "Kelime Bahçesi",
      tag: "Kelime",
      sub: "Sözcükleri bir bir topla",
      allLabel: "Tüm kelimeler",
      tone: "kelime"
    },
    {
      key: "cumle",
      title: "Cümle Treni",
      tag: "Cümle",
      sub: "Vagon vagon oku",
      allLabel: "Tüm cümleler",
      tone: "cumle"
    },
    {
      key: "piramit",
      title: "Piramit Parkuru",
      tag: "Akıcı",
      sub: "Hızlı ve akıcı oku",
      allLabel: "Tüm piramitler",
      tone: "piramit"
    },
    {
      key: "metin",
      title: "Hikâye Yolu",
      tag: "Hikâye",
      sub: "Küçük hikâyeler",
      allLabel: "Tüm metinler",
      tone: "metin"
    }
  ];

  function classifyFusion(f) {
    var kind = String((f && (f.kind || f.type)) || "hece").toLowerCase();
    if (kind === "ses" || (f && f.type === "intro")) return "ses";
    if (kind === "metin" || (f && f.mode === "text")) return "metin";
    if (kind === "piramit" || (f && f.mode === "pyramid")) return "piramit";
    if (kind === "cumle" || (f && f.mode === "sentence")) return "cumle";
    if (kind === "kelime" || (f && f.mediaKey)) return "kelime";
    return "hece";
  }

  function collectSoundLanes(sound) {
    var bags = { hece: [], kelime: [], cumle: [], piramit: [], metin: [] };
    ((sound && sound.fusions) || []).forEach(function (f) {
      var k = classifyFusion(f);
      if (bags[k]) bags[k].push(f);
    });
    return bags;
  }

  function findLaneDef(key) {
    for (var i = 0; i < LANE_DEFS.length; i++) {
      if (LANE_DEFS[i].key === key) return LANE_DEFS[i];
    }
    return null;
  }

  function getStudent() {
    try {
      if (typeof selectedStudent !== "undefined" && selectedStudent && selectedStudent.studentId) {
        return selectedStudent;
      }
      return JSON.parse(localStorage.getItem("selectedStudent") || "null");
    } catch (_) {
      return null;
    }
  }

  function getDb() {
    try {
      if (window.database && typeof window.database.ref === "function") return window.database;
      if (typeof firebase !== "undefined" && firebase.database) return firebase.database();
    } catch (_) {}
    return null;
  }

  function studentRef() {
    var s = getStudent();
    var db = getDb();
    if (!s || !s.classId || !s.studentId || !db) return null;
    return db.ref("classes/" + s.classId + "/students/" + s.studentId);
  }

  function normalizeBirlesProgress(raw) {
    var p = raw && typeof raw === "object" ? raw : {};
    return {
      sounds: p.sounds && typeof p.sounds === "object" ? p.sounds : {},
      groups: p.groups && typeof p.groups === "object" ? p.groups : {},
      updatedAt: Number(p.updatedAt) || 0
    };
  }

  function syncBirlesProgressLocal(progress) {
    birlesProgress = normalizeBirlesProgress(progress);
    var s = getStudent();
    if (!s) return;
    s.birlestirelimProgress = birlesProgress;
    try {
      window.selectedStudent = s;
      localStorage.setItem("selectedStudent", JSON.stringify(s));
    } catch (_) {}
  }

  function ensureBirlesProgress() {
    if (birlesProgress) return Promise.resolve(birlesProgress);
    if (birlesProgressLoading) return birlesProgressLoading;
    birlesProgressLoading = (async function () {
      var local = getStudent();
      if (local && local.birlestirelimProgress) {
        birlesProgress = normalizeBirlesProgress(local.birlestirelimProgress);
      } else {
        birlesProgress = normalizeBirlesProgress(null);
      }
      var ref = studentRef();
      if (!ref) return birlesProgress;
      try {
        var snap = await ref.child("birlestirelimProgress").once("value");
        if (snap.exists()) {
          syncBirlesProgressLocal(snap.val());
        } else {
          syncBirlesProgressLocal(birlesProgress);
        }
      } catch (e) {
        console.warn("ensureBirlesProgress", e);
      }
      return birlesProgress;
    })().finally(function () {
      birlesProgressLoading = null;
    });
    return birlesProgressLoading;
  }

  function isLaneStarred(soundId, laneKey) {
    var p = birlesProgress || normalizeBirlesProgress(null);
    var lane =
      p.sounds &&
      p.sounds[soundId] &&
      p.sounds[soundId].lanes &&
      p.sounds[soundId].lanes[laneKey];
    return !!(lane && lane.starred);
  }

  function isGroupEggsClaimed(groupId) {
    var p = birlesProgress || normalizeBirlesProgress(null);
    var g = p.groups && p.groups[groupId];
    return !!(g && g.eggRewardClaimed);
  }

  function letterPackFor(sound) {
    if (!sound) return {};
    return (letterMap && letterMap[sound.id]) || letterMap[sound.letter] || {};
  }

  function hasKristalForSound(sound) {
    var K = window.NovaBirlestirelimKristal;
    if (!K || !K.hasKristal) return false;
    return K.hasKristal(letterPackFor(sound));
  }

  function laneKeysForSound(sound) {
    var bags = collectSoundLanes(sound);
    var keys = [];
    if (hasKristalForSound(sound)) keys.push("kristal");
    LANE_DEFS.forEach(function (d) {
      if ((bags[d.key] || []).length) keys.push(d.key);
    });
    return keys;
  }

  function countSoundLaneStars(sound) {
    var keys = laneKeysForSound(sound);
    var starred = 0;
    keys.forEach(function (k) {
      if (isLaneStarred(sound.id, k)) starred++;
    });
    return { starred: starred, total: keys.length };
  }

  function orbitStarsHtml(starred, total) {
    if (!total) return "";
    var parts = [];
    for (var i = 0; i < total; i++) {
      parts.push(
        '<span class="birles-orbit-star' +
          (i < starred ? " is-lit" : "") +
          '" style="--star-i:' +
          i +
          '" aria-hidden="true">' +
          '<svg class="birles-orbit-star__icon" viewBox="0 0 24 24" focusable="false">' +
          '<path d="M12 2.5l2.76 5.59 6.17.9-4.47 4.35 1.05 6.14L12 17.2l-5.51 2.28 1.05-6.14-4.47-4.35 6.17-.9z"/></svg>' +
          "</span>"
      );
    }
    return '<span class="birles-flower-petal__stars-row">' + parts.join("") + "</span>";
  }

  function isSoundComplete(sound) {
    var c = countSoundLaneStars(sound);
    /* Sadece intro olan seslerde starlanacak lane yok → tamam kabul */
    if (c.total === 0) return true;
    return c.starred >= c.total;
  }

  function countGroupSoundProgress(group) {
    var sounds = (group && group.sounds) || [];
    var done = 0;
    sounds.forEach(function (s) {
      if (isSoundComplete(s)) done++;
    });
    return { done: done, total: sounds.length };
  }

  function countGroupLaneStars(group) {
    var sounds = (group && group.sounds) || [];
    var starred = 0;
    var total = 0;
    sounds.forEach(function (s) {
      var c = countSoundLaneStars(s);
      starred += c.starred;
      total += c.total;
    });
    return { starred: starred, total: total };
  }

  function groupLetterRunesHtml(group) {
    var sounds = (group && group.sounds) || [];
    if (!sounds.length) return "";
    return (
      '<span class="birles-wcard__runes" aria-hidden="true">' +
      sounds
        .map(function (s, i) {
          var letter = s.displayUpper || s.letter || "?";
          return (
            '<span class="birles-wrune' +
            (isSoundComplete(s) ? " is-lit" : "") +
            '" style="--ri:' +
            i +
            '"><span class="birles-wrune__gem"><span class="birles-wrune__letter">' +
            esc(letter) +
            "</span></span></span>"
          );
        })
        .join("") +
      "</span>"
    );
  }

  function groupPortalStarsHtml(group) {
    return "";
  }

  function groupTreasureHtml(isComplete, eggsDone) {
    if (!isComplete && !eggsDone) return "";
    var cls = "birles-wcard__eggbadge";
    if (eggsDone) cls += " is-claimed";
    else cls += " is-ready";
    return (
      '<span class="' +
      cls +
      '" aria-label="' +
      (eggsDone ? "25 yumurta alındı" : "25 yumurta hazır") +
      '">' +
      '<span class="birles-wcard__eggbadge-shine" aria-hidden="true"></span>' +
      '<span class="birles-wcard__eggbadge-ring" aria-hidden="true">' +
      '<img class="birles-wcard__eggbadge-egg" src="egg_open/fire_dragon_egg.png" alt="" width="40" height="48" decoding="async"/>' +
      "</span>" +
      '<span class="birles-wcard__eggbadge-chip">' +
      '<span class="birles-wcard__eggbadge-plus">+25</span>' +
      (eggsDone ? '<span class="birles-wcard__eggbadge-check" aria-hidden="true">✓</span>' : "") +
      "</span></span>"
    );
  }

  function groupTrailHtml(gProg) {
    return (
      '<span class="birles-wcard__trail">' +
      '<span class="birles-wcard__tube" aria-hidden="true"><i></i><span class="birles-wcard__tube-shine"></span></span>' +
      '<span class="birles-wcard__trail-label">' +
      gProg.done +
      "/" +
      gProg.total +
      " ses</span></span>"
    );
  }

  function groupStatusLabel(done, total, isComplete) {
    if (!total) return "Başla";
    if (isComplete) return "Tamam!";
    if (done > 0) return "Devam";
    return "Başla!";
  }

  function isGroupFullyComplete(groupId) {
    var DD = data();
    var group = DD && DD.getGroup ? DD.getGroup(groupId) : null;
    if (!group) return false;
    var prog = countGroupSoundProgress(group);
    return prog.total > 0 && prog.done >= prog.total;
  }

  async function markLaneStarred(soundId, groupId, laneKey) {
    if (isLaneStarred(soundId, laneKey)) return false;
    var now = Date.now();
    var p = normalizeBirlesProgress(birlesProgress);
    if (!p.sounds[soundId]) p.sounds[soundId] = { lanes: {}, groupId: groupId || "" };
    if (!p.sounds[soundId].lanes) p.sounds[soundId].lanes = {};
    p.sounds[soundId].groupId = groupId || p.sounds[soundId].groupId || "";
    p.sounds[soundId].lanes[laneKey] = { starred: true, completedAt: now };
    p.updatedAt = now;
    syncBirlesProgressLocal(p);
    var ref = studentRef();
    if (ref) {
      try {
        var patch = {};
        patch["birlestirelimProgress/sounds/" + soundId + "/lanes/" + laneKey] = {
          starred: true,
          completedAt: now
        };
        patch["birlestirelimProgress/sounds/" + soundId + "/groupId"] = groupId || "";
        patch["birlestirelimProgress/updatedAt"] = now;
        await ref.update(patch);
      } catch (e) {
        console.warn("markLaneStarred", e);
      }
    }
    return true;
  }

  async function claimGroupEggs(groupId) {
    if (!groupId || isGroupEggsClaimed(groupId)) return false;
    var now = Date.now();
    var p = normalizeBirlesProgress(birlesProgress);
    if (!p.groups[groupId]) p.groups[groupId] = {};
    p.groups[groupId].eggRewardClaimed = true;
    p.groups[groupId].completedAt = now;
    p.updatedAt = now;
    syncBirlesProgressLocal(p);
    var ref = studentRef();
    if (ref) {
      try {
        var patch = {};
        patch["birlestirelimProgress/groups/" + groupId + "/eggRewardClaimed"] = true;
        patch["birlestirelimProgress/groups/" + groupId + "/completedAt"] = now;
        patch["birlestirelimProgress/updatedAt"] = now;
        await ref.update(patch);
      } catch (e) {
        console.warn("claimGroupEggs", e);
        return false;
      }
    }
    return true;
  }

  function playStarRewardOnce(laneTitle) {
    return new Promise(function (resolve) {
      ensureOverlay();
      var host = overlay || document.body;
      var old = host.querySelector(".birles-star-fx");
      if (old) old.remove();

      var fx = document.createElement("div");
      fx.className = "birles-star-fx";
      fx.setAttribute("role", "dialog");
      fx.setAttribute("aria-label", "Yıldız kazandın");
      fx.innerHTML =
        '<div class="birles-star-fx__panel">' +
        '<canvas class="birles-star-fx__canvas" width="720" height="405" aria-hidden="true"></canvas>' +
        '<video class="birles-star-fx__vid is-hidden" muted playsinline preload="auto"></video>' +
        '<p class="birles-star-fx__title">Yıldız kazandın!</p>' +
        (laneTitle
          ? '<p class="birles-star-fx__sub">' + esc(laneTitle) + " tamam</p>"
          : "") +
        "</div>";
      host.appendChild(fx);

      var vid = fx.querySelector(".birles-star-fx__vid");
      var canvas = fx.querySelector(".birles-star-fx__canvas");
      var ctx = canvas && canvas.getContext ? canvas.getContext("2d", { willReadFrequently: true }) : null;
      var raf = 0;
      var settled = false;
      var objectUrl = null;

      /* Chroma #1F73D4 — yalnızca mavi BG; şapka laciverti (B~126) korunur */
      var KEY_R = 31;
      var KEY_G = 115;
      var KEY_B = 212;
      var KEY_DIST2 = 82 * 82;

      function finish() {
        if (settled) return;
        settled = true;
        if (raf) window.cancelAnimationFrame(raf);
        try {
          if (vid) {
            vid.pause();
            vid.removeAttribute("src");
            vid.load();
          }
        } catch (_) {}
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch (_) {}
          objectUrl = null;
        }
        fx.classList.add("is-out");
        window.setTimeout(function () {
          if (fx.parentNode) fx.parentNode.removeChild(fx);
          resolve();
        }, 280);
      }

      function punchBlue() {
        if (!ctx || !vid || !vid.videoWidth) return;
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var d = img.data;
        for (var i = 0; i < d.length; i += 4) {
          var r = d[i];
          var g = d[i + 1];
          var b = d[i + 2];
          /* Parlak chroma mavi: yüksek B, düşük R, anahtara yakın */
          if (b < 145 || r > 120) continue;
          if (b - r < 40) continue;
          var dr = r - KEY_R;
          var dg = g - KEY_G;
          var db = b - KEY_B;
          if (dr * dr + dg * dg + db * db <= KEY_DIST2) {
            d[i + 3] = 0;
          }
        }
        ctx.putImageData(img, 0, 0);
      }

      function tick() {
        if (settled) return;
        if (vid && !vid.paused && !vid.ended) {
          try {
            punchBlue();
          } catch (e) {
            console.warn("birles star key", e);
          }
        }
        raf = window.requestAnimationFrame(tick);
      }

      if (!vid || !canvas || !ctx) {
        finish();
        return;
      }

      fetch("assets/birles/yldz_source.mp4")
        .then(function (res) {
          if (!res.ok) throw new Error("yldz missing");
          return res.blob();
        })
        .then(function (blob) {
          objectUrl = URL.createObjectURL(blob);
          vid.src = objectUrl;
          vid.muted = true;
          vid.playsInline = true;
          vid.addEventListener("ended", finish);
          vid.addEventListener("error", finish);
          return new Promise(function (res, rej) {
            vid.addEventListener(
              "loadeddata",
              function () {
                res();
              },
              { once: true }
            );
            vid.addEventListener(
              "error",
              function () {
                rej(new Error("vid"));
              },
              { once: true }
            );
            var p = vid.play();
            if (p && typeof p.catch === "function") p.catch(rej);
          });
        })
        .then(function () {
          var maxW = 720;
          var scale = Math.min(1, maxW / Math.max(1, vid.videoWidth));
          canvas.width = Math.round(vid.videoWidth * scale) || 720;
          canvas.height = Math.round(vid.videoHeight * scale) || 405;
          raf = window.requestAnimationFrame(tick);
        })
        .catch(function (err) {
          console.warn("playStarRewardOnce", err);
          /* Blob key başarısızsa şeffaf WebM dene */
          if (vid) {
            vid.classList.remove("is-hidden");
            canvas.classList.add("is-hidden");
            vid.src = "assets/birles/yldz_once.webm";
            vid.onended = finish;
            vid.onerror = finish;
            var p = vid.play();
            if (p && typeof p.catch === "function") p.catch(finish);
          } else {
            finish();
          }
        });

      window.setTimeout(finish, reducedMotion ? 900 : 7500);
      fx.addEventListener("click", finish);
    });
  }

  function eggAssetUrl(type) {
    var map = {
      fire: "egg_open/fire_dragon_egg.png",
      ice: "egg_open/ice_dragon_egg.png",
      night: "egg_open/night_dragon_egg.png"
    };
    return map[type] || map.fire;
  }

  function playGroupEggCelebrate(groupTitle, grantResult) {
    return new Promise(function (resolve) {
      ensureOverlay();
      var host = overlay || document.body;
      var old = host.querySelector(".birles-egg-reward");
      if (old) old.remove();

      var bag = (grantResult && grantResult.bag) || { fire: 0, ice: 0, night: 0 };
      var types = [
        { key: "fire", label: "Alev", n: Number(bag.fire) || 0 },
        { key: "ice", label: "Buz", n: Number(bag.ice) || 0 },
        { key: "night", label: "Gece", n: Number(bag.night) || 0 }
      ];

      var fx = document.createElement("div");
      fx.className = "birles-egg-reward";
      fx.setAttribute("role", "dialog");
      fx.setAttribute("aria-label", "Grup ödülü");

      var eggsHtml = types
        .map(function (t, i) {
          return (
            '<div class="birles-egg-reward__egg" style="--i:' +
            i +
            '">' +
            '<img src="' +
            esc(eggAssetUrl(t.key)) +
            '" alt="' +
            esc(t.label) +
            ' ejderha yumurtası" width="160" height="200" decoding="async"/>' +
            '<span class="birles-egg-reward__egg-label">' +
            esc(t.label) +
            (t.n ? " ×" + t.n : "") +
            "</span>" +
            "</div>"
          );
        })
        .join("");

      fx.innerHTML =
        '<div class="birles-egg-reward__panel">' +
        '<p class="birles-egg-reward__kicker">Büyük ödül</p>' +
        '<p class="birles-egg-reward__title">' +
        esc(groupTitle || "Grup") +
        " tamam!</p>" +
        '<p class="birles-egg-reward__plus" aria-label="25 yumurta">+25</p>' +
        '<p class="birles-egg-reward__sub">Karışık ejderha yumurtası</p>' +
        '<div class="birles-egg-reward__eggs">' +
        eggsHtml +
        "</div>" +
        '<p class="birles-egg-reward__hint">Ejderha bölümünden kırabilirsin · Dokun</p>' +
        "</div>";

      host.appendChild(fx);

      var colors = ["#fde047", "#34d399", "#60a5fa", "#f472b6", "#f97316", "#a78bfa", "#fff"];
      for (var i = 0; i < 42; i++) {
        var c = document.createElement("span");
        c.className = "birles-egg-reward__confetti";
        c.style.background = colors[i % colors.length];
        c.style.setProperty("--x", (Math.random() * 160 - 80).toFixed(1) + "vw");
        c.style.setProperty("--delay", (Math.random() * 0.55).toFixed(2) + "s");
        c.style.setProperty("--dur", (1.8 + Math.random() * 1.4).toFixed(2) + "s");
        c.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
        fx.appendChild(c);
      }

      var settled = false;
      var finish = function () {
        if (settled) return;
        settled = true;
        fx.classList.add("is-out");
        window.setTimeout(function () {
          if (fx.parentNode) fx.parentNode.removeChild(fx);
          resolve();
        }, 320);
      };

      fx.addEventListener("click", finish);
      window.setTimeout(finish, reducedMotion ? 2200 : 5600);
    });
  }

  async function maybeGrantGroupEggs(groupId) {
    if (!groupId) return false;
    await ensureBirlesProgress();
    if (isGroupEggsClaimed(groupId)) return false;
    if (!isGroupFullyComplete(groupId)) return false;
    var claimed = await claimGroupEggs(groupId);
    if (!claimed) return false;
    var DD = data();
    var group = DD && DD.getGroup ? DD.getGroup(groupId) : null;
    var title = (group && group.title) || groupId;
    var grant = null;
    try {
      if (typeof window.novaGrantMixedDragonEggs === "function") {
        grant = await window.novaGrantMixedDragonEggs(25, { suppressToast: true });
      }
    } catch (e) {
      console.warn("maybeGrantGroupEggs grant", e);
    }
    await playGroupEggCelebrate(title, grant);
    return true;
  }

  async function finishLaneSequence() {
    var sound = activeSound;
    var lane = activeLane;
    if (!sound || !lane) {
      if (sound) renderLaneGallery(sound);
      return;
    }
    await ensureBirlesProgress();
    var newly = false;
    if (!isLaneStarred(sound.id, lane.key)) {
      newly = await markLaneStarred(sound.id, sound.groupId || activeGroupId, lane.key);
      if (newly) {
        await playStarRewardOnce(lane.title || "");
        await maybeGrantGroupEggs(sound.groupId || activeGroupId);
      }
    }
    renderLaneGallery(sound);
  }

  function data() {
    return D || (D = window.NovaBirlestirelimData);
  }

  function voice() {
    return V || (V = window.NovaKidsVoice);
  }

  function ensureMedia() {
    if (mediaReady) return mediaReady;
    var vv = voice();
    if (!vv || !vv.loadMediaFromFirebase) {
      mediaReady = Promise.resolve();
      return mediaReady;
    }
    mediaReady = vv.loadMediaFromFirebase().then(function (pack) {
      mediaMap = (pack && pack.media) || {};
      letterMap = (pack && pack.letters) || {};
      return pack;
    });
    return mediaReady;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function isGrade1() {
    try {
      if (Number(window.NOVA_LOGIN_FIXED_GRADE || 0) === 1) return true;
      var st = window.selectedStudent || JSON.parse(localStorage.getItem("selectedStudent") || "null");
      var R = window.NovaRoboroxData;
      var label = String((st && (st.className || st.classId)) || "");
      var g = R && R.extractGrade ? R.extractGrade(label) : null;
      if (!g && typeof window.__novaExtractGradeNumber === "function") {
        g = window.__novaExtractGradeNumber(label);
      }
      if (!g) {
        var m = label.match(/\b([1-4])\b/) || String((st && st.classId) || "").match(/SINIF\s*1|sinif\s*1|class.*1/i);
        if (m) g = Number(m[1] || 1);
        if (/SINIF1|sinif1/i.test(String((st && st.classId) || ""))) g = 1;
      }
      return Number(g) === 1;
    } catch (_) {
      return Number(window.NOVA_LOGIN_FIXED_GRADE || 0) === 1;
    }
  }

  function preferReduced() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }

  function wait(ms) {
    return new Promise(function (r) {
      window.setTimeout(r, reducedMotion ? Math.min(ms, 120) : ms);
    });
  }

  function scrollWordIntoView(el) {
    if (!el || typeof el.getBoundingClientRect !== "function") return;
    try {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || 0;
      if (r.top >= 72 && r.bottom <= vh - 72) return;
      el.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest"
      });
    } catch (_) {}
  }

  /* Giriş kartlarıyla aynı sabit palet */
  var GROUP_THEMES = [
    { chip: "#e76f51", soft: "#fff4ef" },
    { chip: "#2a9d8f", soft: "#eaf8f5" },
    { chip: "#e9a825", soft: "#fff9e8" },
    { chip: "#7b2cbf", soft: "#f6efff" },
    { chip: "#3a86ff", soft: "#eef4ff" }
  ];

  function groupThemeById(groupId) {
    var DD = data();
    var groups = (DD && DD.GROUPS) || [];
    var idx = -1;
    for (var i = 0; i < groups.length; i++) {
      if (groups[i] && groups[i].id === groupId) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      var n = parseInt(String(groupId || "").replace(/\D/g, ""), 10);
      idx = n >= 1 ? n - 1 : 0;
    }
    return GROUP_THEMES[idx % GROUP_THEMES.length];
  }

  function setAccentTheme(theme) {
    ensureOverlay();
    if (!overlay) return;
    var t = theme || GROUP_THEMES[0];
    overlay.style.setProperty("--birles-accent", t.chip);
    overlay.style.setProperty("--birles-accent-soft", t.soft);
    overlay.style.setProperty("--chip", t.chip);
  }

  function ensureOverlay() {
    overlay = document.getElementById("birlestirelim-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "birlestirelim-overlay";
    overlay.className = "birles-overlay";
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="birles-shell" role="dialog" aria-modal="true" aria-labelledby="birles-title">' +
      '  <header class="birles-top">' +
      '    <button type="button" class="birles-icon-btn" id="birles-back" aria-label="Geri" hidden>←</button>' +
      '    <div class="birles-top-text">' +
      '      <p class="birles-eyebrow" id="birles-eyebrow">Maarif Modeli</p>' +
      '      <h2 id="birles-title">BİRLEŞTİRELİM</h2>' +
      '      <p class="birles-sub" id="birles-sub">Sesleri kartlarla birleştir</p>' +
      "    </div>" +
      '    <button type="button" class="birles-icon-btn birles-close" id="birles-close" aria-label="Kapat">✕</button>' +
      "  </header>" +
      '  <div class="birles-body" id="birles-body"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    overlay.querySelector("#birles-close").addEventListener("click", close);
    overlay.querySelector("#birles-back").addEventListener("click", goBack);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    return overlay;
  }

  function setBack(on) {
    var btn = document.getElementById("birles-back");
    if (!btn) return;
    btn.hidden = !on;
  }

  function clearHeaderMods() {
    var top = document.querySelector(".birles-top");
    var t = document.getElementById("birles-title");
    if (top) {
      top.classList.remove("birles-top--universe");
      top.classList.remove("birles-top--group");
    }
    if (t) {
      t.classList.remove("birles-title--universe");
      t.classList.remove("birles-title--group");
      t.removeAttribute("aria-label");
    }
  }

  function setHeader(title, sub, eye) {
    var t = document.getElementById("birles-title");
    var s = document.getElementById("birles-sub");
    var e = document.getElementById("birles-eyebrow");
    clearHeaderMods();
    if (t) t.textContent = title || "BİRLEŞTİRELİM";
    if (s) {
      s.textContent = sub || "";
      s.hidden = !sub;
    }
    if (e) {
      e.hidden = false;
      e.textContent = eye || "Maarif Modeli";
    }
  }

  function setGroupsHeader() {
    var top = document.querySelector(".birles-top");
    var t = document.getElementById("birles-title");
    var s = document.getElementById("birles-sub");
    var e = document.getElementById("birles-eyebrow");
    clearHeaderMods();
    if (top) top.classList.add("birles-top--universe");
    if (t) {
      t.classList.add("birles-title--universe");
      t.removeAttribute("aria-label");
      t.textContent = "SES EVRENİ";
    }
    if (s) {
      s.textContent = "";
      s.hidden = true;
    }
    if (e) e.hidden = true;
  }

  function formatGroupTitle(group) {
    var raw = String((group && group.title) || "").trim();
    if (raw) {
      var m = raw.match(/^(\d+)\s*\.?\s*grup$/i);
      if (m) return m[1] + ". GRUP";
      return raw.toLocaleUpperCase("tr-TR");
    }
    var order = (group && group.order) || 1;
    return String(order) + ". GRUP";
  }

  function setLettersHeader(group) {
    var top = document.querySelector(".birles-top");
    var t = document.getElementById("birles-title");
    var s = document.getElementById("birles-sub");
    var e = document.getElementById("birles-eyebrow");
    clearHeaderMods();
    if (top) top.classList.add("birles-top--group");
    if (t) {
      t.classList.add("birles-title--group");
      t.removeAttribute("aria-label");
      t.textContent = formatGroupTitle(group);
    }
    if (s) {
      s.textContent = "";
      s.hidden = true;
    }
    if (e) e.hidden = true;
  }

  function letterFor(key) {
    if (!key) return null;
    if (letterMap && letterMap[key]) return letterMap[key];
    return null;
  }

  function howToVideoUrl(sound) {
    if (!sound) return "";
    var row = letterFor(sound.id) || letterFor(sound.letter);
    return String((row && (row.videoUrl || row.howToVideoUrl)) || "").trim();
  }

  function buildBunnyEmbed(url) {
    url = String(url || "").trim();
    if (!url) return "";
    var m = url.match(/mediadelivery\.net\/(?:play|embed)\/(\d+)\/([0-9a-f-]{36})/i);
    if (m) {
      return (
        "https://iframe.mediadelivery.net/embed/" +
        m[1] +
        "/" +
        m[2] +
        "?autoplay=true&muted=false&preload=true&responsive=true&playsinline=true"
      );
    }
    return url;
  }

  function closeHowToVideo() {
    var box = document.getElementById("birles-howto-video");
    if (box) box.remove();
    if (window.NovaBirlestirelimKristal && window.NovaBirlestirelimKristal.close) {
      try {
        window.NovaBirlestirelimKristal.close();
      } catch (_) {}
    }
  }

  function warmKristalCave(sound) {
    var K = window.NovaBirlestirelimKristal;
    if (!K || !K.warm || !hasKristalForSound(sound)) return;
    try {
      K.warm(letterPackFor(sound));
    } catch (_) {}
  }

  function openKristalCave(sound) {
    var K = window.NovaBirlestirelimKristal;
    if (!K || !K.open) return;
    ensureMedia().then(function () {
      warmKristalCave(sound);
      K.open({
        sound: sound,
        letterPack: letterPackFor(sound),
        onDone: function (res) {
          if (!res || !res.success) return;
          Promise.resolve(
            markLaneStarred(sound.id, sound.groupId || activeGroupId, "kristal")
          )
            .then(function (newly) {
              if (newly) return playStarRewardOnce("Kristal Mağarası");
            })
            .then(function () {
              if (activeSound && activeSound.id === sound.id) openSound(sound.id);
            })
            .catch(function () {
              if (activeSound && activeSound.id === sound.id) openSound(sound.id);
            });
        }
      });
    });
  }

  function openHowToVideo(sound) {
    var url = howToVideoUrl(sound);
    if (!url) {
      try {
        if (typeof window.showAlert === "function") {
          window.showAlert("Bu ses için henüz “nasıl yapılır” videosu yok. Admin’den Bunny video URL ekle.");
        }
      } catch (_) {}
      return;
    }
    closeHowToVideo();
    var embed = buildBunnyEmbed(url);
    var isDirect =
      /\.(mp4|webm|mov)(\?|#|$)/i.test(embed) ||
      (/\.b-cdn\.net\//i.test(embed) && !/mediadelivery/i.test(embed));
    var box = document.createElement("div");
    box.id = "birles-howto-video";
    box.className = "birles-howto";
    box.innerHTML =
      '<div class="birles-howto__backdrop" data-howto-close="1"></div>' +
      '<div class="birles-howto__sheet" role="dialog" aria-label="Ses videosu">' +
      '  <button type="button" class="birles-howto__close" data-howto-close="1" aria-label="Kapat">✕</button>' +
      '  <p class="birles-howto__title">' +
      esc(sound.displayUpper || sound.letter) +
      " · nasıl yapılır</p>" +
      '  <div class="birles-howto__frame">' +
      (isDirect
        ? '<video class="birles-howto__media" src="' +
          esc(embed) +
          '" playsinline autoplay controls></video>'
        : '<iframe class="birles-howto__media" src="' +
          esc(embed) +
          '" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowfullscreen loading="eager"></iframe>') +
      "  </div>" +
      "</div>";
    document.body.appendChild(box);
    box.querySelectorAll("[data-howto-close]").forEach(function (el) {
      el.addEventListener("click", closeHowToVideo);
    });
  }

  function openGroups() {
    ensureOverlay();
    reducedMotion = preferReduced();
    view = "groups";
    activeSound = null;
    activeFusion = null;
    activeGroupId = "";
    closeHowToVideo();

    var alreadyOpen = overlay.classList.contains("open") && !overlay.hidden;
    if (alreadyOpen) {
      setBack(false);
      setAccentTheme(GROUP_THEMES[0]);
      setGroupsHeader();
      ensureBirlesProgress().then(function () {
        renderGroups();
      });
      return;
    }

    var loaderShown = false;
    try {
      if (typeof window.novaShowScreenLoader === "function") {
        window.novaShowScreenLoader("sounds");
        loaderShown = true;
      }
    } catch (_) {}

    /* Overlay hazırlanana kadar gizle */
    overlay.hidden = false;
    overlay.style.visibility = "hidden";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.add("birles-lock");
    setBack(false);
    setAccentTheme(GROUP_THEMES[0]);
    setGroupsHeader();
    ensureBirlesProgress().then(function () {
      renderGroups();
    });
    var vv = voice();
    if (vv) vv.unlock();
    mediaReady = ensureMedia();

    Promise.resolve(mediaReady)
      .catch(function () {})
      .then(function () {
        overlay.style.visibility = "";
        overlay.setAttribute("aria-hidden", "false");
        if (loaderShown && typeof window.novaHideScreenLoaderWhenReady === "function") {
          return window.novaHideScreenLoaderWhenReady(function () {
            var body = document.getElementById("birles-body");
            return !!(
              overlay.classList.contains("open") &&
              body &&
              body.querySelector(".birles-group-grid, .birles-wcard, .birles-group-card, [data-group]")
            );
          }, { maxMs: 8000, minVisibleMs: 280 });
        }
        if (loaderShown && typeof window.novaHideScreenLoader === "function") {
          window.novaHideScreenLoader();
        }
      })
      .catch(function () {
        overlay.style.visibility = "";
        overlay.setAttribute("aria-hidden", "false");
        if (loaderShown && typeof window.novaHideScreenLoader === "function") {
          window.novaHideScreenLoader();
        }
      });
  }

  function openLetters(groupId) {
    ensureOverlay();
    reducedMotion = preferReduced();
    view = "letters";
    activeSound = null;
    activeFusion = null;
    closeHowToVideo();
    activeGroupId = groupId || activeGroupId || "grup1";
    overlay.hidden = false;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("birles-lock");
    setBack(true);
    var DD = data();
    var group = DD && DD.getGroup ? DD.getGroup(activeGroupId) : null;
    setAccentTheme(groupThemeById(activeGroupId));
    setLettersHeader(group);
    ensureBirlesProgress().then(function () {
      renderLetters();
    });
    var vv = voice();
    if (vv) vv.unlock();
    if (!mediaReady) ensureMedia();
  }

  function close() {
    animToken += 1;
    var vv = voice();
    if (vv) vv.stop();
    closeHowToVideo();
    setPoolPlayMode(false);
    if (!overlay) return;
    if (typeof window.novaForceHideScreenLoader === "function") {
      try { window.novaForceHideScreenLoader(); } catch (_) {}
    }
    overlay.classList.remove("open");
    overlay.hidden = true;
    overlay.style.visibility = "";
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("birles-lock");
    view = "groups";
    activeSound = null;
    activeFusion = null;
  }

  function goBack() {
    var vv = voice();
    if (vv) vv.stop();
    animToken += 1;
    closeHowToVideo();
    if (view === "gallery") {
      activeLane = null;
      if (activeSound) openSound(activeSound.id);
      else openGroups();
      return;
    }
    if (view === "play") {
      setPoolPlayMode(false);
      if (activeLane && activeSound) {
        openSound(activeSound.id);
        return;
      }
      openSound(activeSound && activeSound.id);
      return;
    }
    if (view === "sound") {
      openLetters(activeGroupId || (activeSound && activeSound.groupId));
      return;
    }
    if (view === "letters") {
      openGroups();
      return;
    }
    close();
  }

  function mediaFor(key) {
    if (!key) return null;
    if (mediaMap && mediaMap[key]) return mediaMap[key];
    var vv = voice();
    return vv && vv.getMedia ? vv.getMedia(key) : null;
  }

  function countFusions(group) {
    var n = 0;
    ((group && group.sounds) || []).forEach(function (s) {
      n += (s.fusions || []).length;
    });
    return n;
  }

  function renderGroups() {
    var body = document.getElementById("birles-body");
    if (!body) return;
    var DD = data();
    var groups = (DD && DD.GROUPS) || [];
    var html =
      '<div class="birles-hub birles-hub--groups">' +
      '  <div class="birles-groups-scene" aria-hidden="true">' +
      '    <span class="birles-groups-scene__nebula birles-groups-scene__nebula--1"></span>' +
      '    <span class="birles-groups-scene__nebula birles-groups-scene__nebula--2"></span>' +
      '    <span class="birles-groups-scene__cloud birles-groups-scene__cloud--1"></span>' +
      '    <span class="birles-groups-scene__cloud birles-groups-scene__cloud--2"></span>' +
      '    <span class="birles-groups-scene__dust birles-groups-scene__dust--1"></span>' +
      '    <span class="birles-groups-scene__dust birles-groups-scene__dust--2"></span>' +
      '    <span class="birles-groups-scene__dust birles-groups-scene__dust--3"></span>' +
      "  </div>" +
      '  <div class="birles-group-grid" role="list">';

    groups.forEach(function (g, idx) {
      var theme = GROUP_THEMES[idx % GROUP_THEMES.length];
      var gProg = countGroupSoundProgress(g);
      var gPct = gProg.total ? Math.round((gProg.done / gProg.total) * 100) : 0;
      var isComplete = gProg.total > 0 && gProg.done >= gProg.total;
      var eggsDone = isGroupEggsClaimed(g.id);
      var status = groupStatusLabel(gProg.done, gProg.total, isComplete);
      var title = g.title || String(idx + 1) + ". Grup";
      html +=
        '<button type="button" class="birles-wcard birles-group-card' +
        (isComplete ? " is-complete" : gProg.done > 0 ? " is-started" : "") +
        (isComplete || eggsDone ? " has-egg" : "") +
        '" role="listitem" data-group="' +
        esc(g.id) +
        '" aria-label="' +
        esc(title + ", " + gProg.done + "/" + gProg.total + " ses, " + status) +
        '" style="--delay:' +
        idx * 0.08 +
        "s;--chip:" +
        esc(theme.chip) +
        ";--soft:" +
        esc(theme.soft) +
        ";--gpct:" +
        gPct +
        ';--wi:' +
        idx +
        '%">' +
        '<span class="birles-wcard__shadow" aria-hidden="true"></span>' +
        '<span class="birles-wcard__shell">' +
        '<span class="birles-wcard__aura" aria-hidden="true"></span>' +
        '<span class="birles-wcard__frame">' +
        '<span class="birles-wcard__ribbon"><span class="birles-wcard__ribbon-text">' +
        esc(title) +
        "</span></span>" +
        (isComplete ? '<span class="birles-wcard__crown" aria-hidden="true">👑</span>' : "") +
        groupTreasureHtml(isComplete, eggsDone) +
        '<span class="birles-wcard__layout">' +
        '<span class="birles-wcard__portal">' +
        '<span class="birles-wcard__pedestal" aria-hidden="true"><i></i><i></i></span>' +
        '<span class="birles-wcard__crystal">' +
        '<span class="birles-wcard__crystal-ring" aria-hidden="true"></span>' +
        '<span class="birles-wcard__crystal-core">' +
        esc(String(g.order || idx + 1)) +
        "</span></span>" +
        "</span>" +
        '<span class="birles-wcard__mid">' +
        groupLetterRunesHtml(g) +
        groupTrailHtml(gProg) +
        "</span>" +
        '<span class="birles-wcard__aside">' +
        '<span class="birles-wcard__flag">' +
        esc(status) +
        "</span>" +
        '<span class="birles-wcard__launch" aria-hidden="true">' +
        '<span class="birles-wcard__launch-pulse"></span>' +
        '<span class="birles-wcard__launch-btn"><span>▶</span></span>' +
        "</span></span></span>" +
        '<span class="birles-wcard__glint birles-wcard__glint--1" aria-hidden="true"></span>' +
        '<span class="birles-wcard__glint birles-wcard__glint--2" aria-hidden="true"></span>' +
        "</span></span></button>";
    });

    html += "</div></div>";
    body.innerHTML = html;
    body.querySelectorAll("[data-group]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLetters(btn.getAttribute("data-group"));
      });
    });
  }

  function renderLetters() {
    var body = document.getElementById("birles-body");
    if (!body) return;
    var DD = data();
    var group = DD && DD.getGroup ? DD.getGroup(activeGroupId) : null;
    if (!group) {
      openGroups();
      return;
    }
    var sounds = group.sounds || [];
    var theme = groupThemeById(group.id || activeGroupId);
    var n = sounds.length || 1;
    setAccentTheme(theme);
    setLettersHeader(group);

    var html =
      '<div class="birles-hub birles-hub--letters birles-hub--flower">' +
      '  <div class="birles-flower-stage" style="--chip:' +
      esc(theme.chip) +
      '">' +
      '    <div class="birles-flower-arena" aria-hidden="true">' +
      '      <span class="birles-flower-arena__glow"></span>' +
      '      <span class="birles-flower-arena__spark birles-flower-arena__spark--1"></span>' +
      '      <span class="birles-flower-arena__spark birles-flower-arena__spark--2"></span>' +
      '      <span class="birles-flower-arena__spark birles-flower-arena__spark--3"></span>' +
      "    </div>" +
      '    <div class="birles-flower birles-flower--orbs' +
      (n === 1 ? " birles-flower--solo" : "") +
      (n >= 7 ? " birles-flower--dense" : "") +
      '" style="--n:' +
      n +
      ";--chip:" +
      esc(theme.chip) +
      '" role="list" aria-label="Sesler">' +
      '      <div class="birles-flower__ring birles-flower__ring--outer" aria-hidden="true"></div>' +
      '      <div class="birles-flower__ring birles-flower__ring--inner" aria-hidden="true"></div>' +
      '      <div class="birles-flower__center" aria-hidden="true">' +
      '        <video class="birles-flower__mascot" src="assets/birles/gruporta_loop.webm" autoplay muted loop playsinline preload="auto"></video>' +
      "      </div>";

    sounds.forEach(function (s, idx) {
      var angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
      /* Çerçeveyi doldur: yarıçap n’e göre genişletildi */
      var radius = n <= 1 ? 0 : n <= 4 ? 38.5 : n <= 6 ? 40.5 : 42.5;
      var left = 50 + radius * Math.cos(angle);
      var top = 50 + radius * Math.sin(angle);
      var letter = s.displayUpper || s.letter || "?";
      var lower = s.displayLower || "";
      var sProg = countSoundLaneStars(s);
      var complete = sProg.total > 0 && sProg.starred >= sProg.total;
      html +=
        '<button type="button" class="birles-flower-petal' +
        (complete ? " is-complete" : "") +
        '" role="listitem" data-sound="' +
        esc(s.id) +
        '" aria-label="' +
        esc(letter + " sesi" + (sProg.total ? ", " + sProg.starred + "/" + sProg.total + " yıldız" : "")) +
        '" style="--chip:' +
        esc(s.color) +
        ";--glow:" +
        esc(s.glow || "rgba(6,214,160,0.22)") +
        ";--i:" +
        idx +
        ";left:" +
        left.toFixed(2) +
        "%;top:" +
        top.toFixed(2) +
        '%">' +
        '<span class="birles-flower-petal__cluster">' +
        '<span class="birles-flower-petal__orb">' +
        '<span class="birles-flower-petal__shine" aria-hidden="true"></span>' +
        '<span class="birles-flower-petal__letter">' +
        esc(letter) +
        "</span>" +
        (lower
          ? '<span class="birles-flower-petal__sub">' + esc(lower) + "</span>"
          : "") +
        "</span>" +
        orbitStarsHtml(sProg.starred, sProg.total) +
        "</span>" +
        "</button>";
    });

    html += "</div></div></div>";
    body.innerHTML = html;

    var mascot = body.querySelector(".birles-flower__mascot");
    if (mascot) {
      mascot.muted = true;
      var playM = mascot.play();
      if (playM && typeof playM.catch === "function") playM.catch(function () {});
    }

    body.querySelectorAll("[data-sound]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openSound(btn.getAttribute("data-sound"));
      });
    });
  }

  function openLetterWriting(sound) {
    if (!sound || !window.NovaBirlestirelimYazilis) return;
    if (!window.NovaBirlestirelimYazilis.hasWriting(sound.id)) return;
    var body = document.getElementById("birles-body");
    if (!body) return;
    view = "play";
    activeSound = sound;
    activeFusion = null;
    animToken += 1;
    window.NovaBirlestirelimYazilis.open({
      sound: sound,
      body: body,
      letterPack: letterMap && letterMap[sound.id] ? letterMap[sound.id] : {},
      setBack: setBack,
      setHeader: setHeader,
      onClose: function () {
        animToken += 1;
        openSound(sound.id);
      }
    });
  }

  function openSound(soundId) {
    var DD = data();
    var sound = DD && DD.getSound ? DD.getSound(soundId) : null;
    if (!sound) return;
    setPoolPlayMode(false);
    view = "sound";
    activeSound = sound;
    activeFusion = null;
    activeLane = null;
    if (sound.groupId) activeGroupId = sound.groupId;
    closeHowToVideo();
    setBack(true);
    var group = DD.getGroup ? DD.getGroup(sound.groupId || activeGroupId) : null;
    setAccentTheme(groupThemeById(sound.groupId || activeGroupId));
    setHeader(sound.title, "", (group && group.title) || "Ses grubu");
    Promise.all([ensureBirlesProgress(), ensureMedia()]).then(function () {
      renderSound(sound);
      var vv = voice();
      if (vv) {
        vv.unlock();
        vv.playToken(sound.letter);
      }
    });
  }

  function audioMissBadge(token) {
    var vv = voice();
    if (!vv || !vv.hasAudio || !vv.hasAudio(token)) {
      return '<span class="birles-miss" title="Admin’de ses URL’si yok">Ses yok</span>';
    }
    if (vv.describeUrlProblem) {
      var url = vv.resolveAudioUrl ? vv.resolveAudioUrl(token) : "";
      var problem = vv.describeUrlProblem(url);
      if (problem) {
        return '<span class="birles-miss" title="' + esc(problem) + '">Ses ayarı eksik</span>';
      }
    }
    return "";
  }

  function fusionCardHtml(f, extraAttrs) {
    var kind = String(f.kind || f.type || "hece").toLowerCase();
    var isCumle = kind === "cumle" || f.mode === "sentence";
    var isWord = !isCumle && (kind === "kelime" || !!f.mediaKey);
    var isSes = kind === "ses" || f.type === "intro";
    var med = isWord && f.mediaKey ? mediaFor(f.mediaKey) : null;
    var hasImg = !!(med && med.imageUrl);
    var badge = isSes ? "SES" : isCumle ? "CÜMLE" : isWord ? "KELİME" : "HECE";
    var cardClass = isCumle ? "cumle" : isWord ? "word" : isSes ? "ses" : "hece";
    var mediaInner;
    var attrs = extraAttrs ? " " + extraAttrs : "";

    if (isWord && hasImg) {
      mediaInner =
        '<img class="birles-fusion-card__img" src="' +
        esc(med.imageUrl) +
        '" alt="" loading="lazy" />';
    } else if (isWord) {
      /* Simetrik vitrin: foto yoksa baş harf değil — birleştirme illüstrasyonu */
      var gid = "bfa_" + String(f.id || f.result || "x").replace(/[^a-zA-Z0-9_-]/g, "_");
      mediaInner =
        '<span class="birles-fusion-card__placeholder" aria-hidden="true">' +
        '<svg class="birles-fusion-card__art" viewBox="0 0 160 160" focusable="false">' +
        "<defs>" +
        '<linearGradient id="' +
        gid +
        '_sky" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#FFF3D6"/>' +
        '<stop offset="55%" stop-color="#D7F6EE"/>' +
        '<stop offset="100%" stop-color="#DCEEFF"/>' +
        "</linearGradient>" +
        '<linearGradient id="' +
        gid +
        '_left" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#FF9B6A"/>' +
        '<stop offset="100%" stop-color="#FFD166"/>' +
        "</linearGradient>" +
        '<linearGradient id="' +
        gid +
        '_right" x1="0" y1="1" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#2EC4B6"/>' +
        '<stop offset="100%" stop-color="#7BDFF2"/>' +
        "</linearGradient>" +
        "</defs>" +
        '<rect width="160" height="160" rx="28" fill="url(#' +
        gid +
        '_sky)"/>' +
        '<circle cx="128" cy="34" r="16" fill="#FFE08A" opacity="0.95"/>' +
        '<path d="M18 118c18-22 38-22 56 0 18-26 40-26 58 0v28H18z" fill="#B8E0D2" opacity="0.55"/>' +
        '<rect x="28" y="52" width="42" height="54" rx="14" fill="url(#' +
        gid +
        '_left)"/>' +
        '<rect x="90" y="52" width="42" height="54" rx="14" fill="url(#' +
        gid +
        '_right)"/>' +
        '<path d="M70 72h20M70 88h20" stroke="#16324F" stroke-width="5" stroke-linecap="round" opacity="0.55"/>' +
        '<circle cx="80" cy="80" r="7" fill="#16324F" opacity="0.7"/>' +
        '<path d="M46 122h68" stroke="#16324F" stroke-width="4" stroke-linecap="round" opacity="0.18"/>' +
        '<circle cx="42" cy="38" r="4" fill="#FF8A5C" opacity="0.7"/>' +
        '<circle cx="58" cy="28" r="3" fill="#2EC4B6" opacity="0.65"/>' +
        '<circle cx="104" cy="124" r="3.5" fill="#FFD166" opacity="0.8"/>' +
        "</svg>" +
        "</span>";
    } else {
      mediaInner = "";
    }

    return (
      '<button type="button" class="birles-fusion-card birles-fusion-card--' +
      esc(cardClass) +
      (isWord ? " birles-fusion-card--showcase" : " birles-fusion-card--badge-only") +
      '" data-fusion="' +
      esc(f.id) +
      '"' +
      attrs +
      ">" +
      '<span class="birles-fusion-card__media">' +
      mediaInner +
      '<span class="birles-fusion-card__badge">' +
      badge +
      "</span>" +
      "</span>" +
      '<span class="birles-fusion-card__body">' +
      '<span class="birles-fusion-card__result">' +
      esc(f.result) +
      "</span>" +
      (isCumle || isWord
        ? ""
        : '<span class="birles-fusion-card__label">' + esc(f.label) + "</span>") +
      "</span>" +
      "</button>"
    );
  }

  function piramitTileHtml(f, extraAttrs) {
    var lines = f.lines || [];
    var mid = Math.floor(lines.length / 2);
    var maxW = 1;
    var attrs = extraAttrs ? " " + extraAttrs : "";
    lines.forEach(function (ln) {
      var n =
        (ln.words && ln.words.length) ||
        String(ln.text || "")
          .split(/\s+/)
          .filter(Boolean).length;
      if (n > maxW) maxW = n;
    });
    var bars = lines
      .map(function (ln, idx) {
        var n =
          (ln.words && ln.words.length) ||
          String(ln.text || "")
            .split(/\s+/)
            .filter(Boolean).length;
        var pct = Math.max(18, Math.round((n / maxW) * 100));
        var label =
          idx === 0 || idx === mid || idx === lines.length - 1
            ? '<span class="birles-piramit-tile__bar-txt">' + esc(ln.text) + "</span>"
            : "";
        return (
          '<span class="birles-piramit-tile__bar' +
          (idx === mid ? " is-peak" : "") +
          '" style="--w:' +
          pct +
          '%" data-bar="' +
          idx +
          '">' +
          label +
          "</span>"
        );
      })
      .join("");
    return (
      '<button type="button" class="birles-piramit-tile' +
     
      '" role="listitem" data-piramit="' +
      esc(f.id) +
      '"' +
      attrs +
      ">" +
      '<span class="birles-piramit-tile__top">' +
      '<span class="birles-piramit-tile__speed" aria-hidden="true">' +
      '<span class="birles-piramit-tile__dash"></span>' +
      '<span class="birles-piramit-tile__dash"></span>' +
      '<span class="birles-piramit-tile__dash"></span>' +
      "</span>" +
      '<span class="birles-piramit-tile__tag">Hızlı okuma</span>' +
      "</span>" +
      '<span class="birles-piramit-tile__title">' +
      esc(f.title || f.result) +
      "</span>" +
      '<span class="birles-piramit-tile__diamond" aria-hidden="true">' +
      bars +
      "</span>" +
      '<span class="birles-piramit-tile__foot">' +
      '<span class="birles-piramit-tile__meta">' +
      lines.length +
      " satır</span>" +
      '<span class="birles-piramit-tile__go">Oku</span>' +
      "</span>" +
      
      "</button>"
    );
  }

  function metinTileHtml(f, extraAttrs) {
    var med = f.mediaKey ? mediaFor(f.mediaKey) : null;
    var attrs = extraAttrs ? " " + extraAttrs : "";
    var cover =
      med && med.imageUrl
        ? '<img class="birles-metin-tile__img" src="' +
          esc(med.imageUrl) +
          '" alt="" loading="lazy" />'
        : '<span class="birles-metin-tile__ph" aria-hidden="true"></span>';
    return (
      '<button type="button" class="birles-metin-tile' +
     
      '" role="listitem" data-metin="' +
      esc(f.id) +
      '"' +
      attrs +
      ">" +
      '<span class="birles-metin-tile__poster">' +
      cover +
      '<span class="birles-metin-tile__shade"></span>' +
      '<span class="birles-metin-tile__title">' +
      esc(f.title || f.result) +
      "</span>" +
      "</span>" +
      '<span class="birles-metin-tile__meta">Hikâye</span>' +
      
      "</button>"
    );
  }

  function laneIconSvg(tone) {
    var t = String(tone || "metin");
    if (t === "hece") {
      return (
        '<svg class="birles-lane-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
        '<circle cx="24" cy="24" r="22" fill="#FFE566"/>' +
        '<circle cx="24" cy="24" r="16" fill="#FFF7D6"/>' +
        '<path d="M12 26c4-8 8-8 12 0 4-8 8-8 12 0" fill="none" stroke="#9A5B00" stroke-width="2.8" stroke-linecap="round"/>' +
        '<circle cx="17" cy="17" r="2.2" fill="#9A5B00"/>' +
        '<circle cx="31" cy="16" r="1.8" fill="#9A5B00"/>' +
        "</svg>"
      );
    }
    if (t === "kelime") {
      return (
        '<svg class="birles-lane-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
        '<rect x="4" y="4" width="40" height="40" rx="12" fill="#7BE495"/>' +
        '<rect x="12" y="14" width="10" height="20" rx="4" fill="#2A9D8F"/>' +
        '<rect x="26" y="14" width="10" height="20" rx="4" fill="#1B6B5A"/>' +
        '<path d="M22 20h4M22 28h4" stroke="#16324F" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>' +
        "</svg>"
      );
    }
    if (t === "cumle") {
      return (
        '<svg class="birles-lane-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
        '<rect x="4" y="4" width="40" height="40" rx="12" fill="#FFD166"/>' +
        '<rect x="8" y="20" width="12" height="10" rx="3" fill="#E76F51"/>' +
        '<rect x="18" y="20" width="12" height="10" rx="3" fill="#F4A261"/>' +
        '<rect x="28" y="20" width="12" height="10" rx="3" fill="#E9C46A"/>' +
        '<circle cx="11" cy="33" r="3" fill="#16324F"/>' +
        '<circle cx="37" cy="33" r="3" fill="#16324F"/>' +
        "</svg>"
      );
    }
    if (t === "piramit") {
      return (
        '<svg class="birles-lane-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
        '<rect x="4" y="4" width="40" height="40" rx="12" fill="#CDB4DB"/>' +
        '<path d="M24 12l14 24H10z" fill="#9B5DE5"/>' +
        '<path d="M24 18l9 16H15z" fill="#F15BB5" opacity="0.85"/>' +
        "</svg>"
      );
    }
    if (t === "kristal") {
      return (
        '<svg class="birles-lane-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
        '<rect x="4" y="4" width="40" height="40" rx="12" fill="#B8A4FF"/>' +
        '<path d="M24 10l8 12-8 16-8-16z" fill="#7B61FF"/>' +
        '<path d="M24 14l5 8-5 10-5-10z" fill="#E0D4FF" opacity="0.9"/>' +
        '<circle cx="18" cy="34" r="2" fill="#FFD166"/>' +
        '<circle cx="30" cy="32" r="1.6" fill="#9EFCFFaa"/>' +
        "</svg>"
      );
    }
    return (
      '<svg class="birles-lane-ico" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">' +
      '<rect x="4" y="4" width="40" height="40" rx="12" fill="#A2D2FF"/>' +
      '<rect x="12" y="14" width="24" height="6" rx="2" fill="#3A86FF"/>' +
      '<rect x="12" y="23" width="24" height="4" rx="2" fill="#fff" opacity="0.85"/>' +
      '<rect x="12" y="30" width="18" height="4" rx="2" fill="#fff" opacity="0.7"/>' +
      "</svg>"
    );
  }

  function renderSound(sound) {
    var body = document.getElementById("birles-body");
    if (!body || !sound) return;
    var bags = collectSoundLanes(sound);
    var letter = sound.displayUpper || sound.letter || "?";
    var lower = sound.displayLower || "";
    var hasVideo = !!howToVideoUrl(sound);
    var hasYaz =
      window.NovaBirlestirelimYazilis &&
      window.NovaBirlestirelimYazilis.hasWriting &&
      window.NovaBirlestirelimYazilis.hasWriting(sound.id);

    var DD = data();
    var group = DD && DD.getGroup ? DD.getGroup(sound.groupId || activeGroupId) : null;
    var laneStar = countSoundLaneStars(sound);
    var groupProg = group ? countGroupSoundProgress(group) : { done: 0, total: 0 };

    var html =
      '<div class="birles-sound-view birles-sound-view--story">' +
      '<div class="birles-sound-hero birles-sound-hero--story birles-sound-hero--evren">' +
      '<button type="button" class="birles-ses-evreni" data-listen-letter="' +
      esc(sound.letter) +
      '" style="--chip:' +
      esc(sound.color) +
      '" aria-label="' +
      esc(letter + " sesini dinle") +
      '">' +
      '<video class="birles-ses-evreni__vid" src="assets/birles/sesarka_loop.mp4" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>' +
      '<span class="birles-ses-evreni__letter-wrap" aria-hidden="true">' +
      '<span class="birles-ses-evreni__letter">' +
      esc(letter) +
      "</span>" +
      (lower
        ? '<span class="birles-ses-evreni__lower">' + esc(lower) + "</span>"
        : "") +
      "</span>" +
      '<span class="birles-ses-evreni__hint">Dokun · sesi dinle</span>' +
      "</button>" +
      '<div class="birles-sound-hero__actions">' +
      '<button type="button" class="birles-izle-btn birles-izle-btn--hero' +
      (hasVideo ? "" : " is-empty") +
      '" data-izle="1">' +
      '<span class="birles-izle-btn__ico" aria-hidden="true">▶</span>' +
      "İzle" +
      "<small>Nasıl?</small>" +
      "</button>" +
      (hasYaz
        ? '<button type="button" class="birles-yaz-btn birles-yaz-btn--hero" data-yazilis="' +
          esc(sound.id) +
          '">' +
          '<span class="birles-yaz-btn__ico" aria-hidden="true">✎</span>' +
          "Yazılış" +
          "<small>Maarif</small>" +
          "</button>"
        : "") +
      "</div>" +
      "</div>" +
      '<div class="birles-lanes-head">' +
      '<p class="birles-lanes-head__prog" aria-live="polite">' +
      '<span class="birles-lanes-head__prog-main">' +
      laneStar.starred +
      "/" +
      laneStar.total +
      " bölüm tamam</span>" +
      (group
        ? '<span class="birles-lanes-head__prog-group">Grup: ' +
          groupProg.done +
          "/" +
          groupProg.total +
          " ses</span>"
        : "") +
      "</p>" +
      "</div>" +
      '<div class="birles-lanes" role="list">';

    var hasKristal = hasKristalForSound(sound);
    if (hasKristal) {
      warmKristalCave(sound);
      var kristalStarred = isLaneStarred(sound.id, "kristal");
      html +=
        '<button type="button" class="birles-lane-card birles-lane-card--kristal' +
        (kristalStarred ? " is-starred" : "") +
        '" data-kristal="1" role="listitem">' +
        '<span class="birles-lane-card__ico" aria-hidden="true">' +
        laneIconSvg("kristal") +
        "</span>" +
        '<span class="birles-lane-card__body">' +
        '<span class="birles-lane-card__title">Kristal Mağarası' +
        (kristalStarred ? ' <span class="birles-lane-card__star" aria-hidden="true">★</span>' : "") +
        "</span>" +
        '<span class="birles-lane-card__sub">Doğru çerçeveleri bul</span>' +
        "</span>" +
        '<span class="birles-lane-card__count">6</span>' +
        '<span class="birles-lane-card__go">' +
        (kristalStarred ? "Tekrar" : "Başla") +
        "</span>" +
        "</button>";
    }

    LANE_DEFS.forEach(function (def) {
      var list = bags[def.key] || [];
      if (!list.length) return;
      var sub = def.sub || def.tag || "";
      var starred = isLaneStarred(sound.id, def.key);
      html +=
        '<button type="button" class="birles-lane-card birles-lane-card--' +
        esc(def.tone) +
        (starred ? " is-starred" : "") +
        '" data-lane="' +
        esc(def.key) +
        '" role="listitem">' +
        '<span class="birles-lane-card__ico" aria-hidden="true">' +
        laneIconSvg(def.tone) +
        "</span>" +
        '<span class="birles-lane-card__body">' +
        '<span class="birles-lane-card__title">' +
        esc(def.title) +
        (starred ? ' <span class="birles-lane-card__star" aria-hidden="true">★</span>' : "") +
        "</span>" +
        '<span class="birles-lane-card__sub">' +
        esc(sub) +
        "</span>" +
        "</span>" +
        '<span class="birles-lane-card__count">' +
        list.length +
        "</span>" +
        '<span class="birles-lane-card__go">' +
        (starred ? "Tekrar" : "Başla") +
        "</span>" +
        "</button>";
    });

    html += "</div></div>";
    body.innerHTML = html;

    var listenBtn = body.querySelector("[data-listen-letter]");
    if (listenBtn) {
      listenBtn.addEventListener("click", function () {
        var vv = voice();
        if (vv) vv.playToken(sound.letter);
        listenBtn.classList.remove("is-ping");
        void listenBtn.offsetWidth;
        listenBtn.classList.add("is-ping");
      });
      var vid = listenBtn.querySelector(".birles-ses-evreni__vid");
      if (vid) {
        vid.muted = true;
        var playP = vid.play();
        if (playP && typeof playP.catch === "function") playP.catch(function () {});
      }
    }
    var izle = body.querySelector("[data-izle]");
    if (izle) {
      izle.addEventListener("click", function (e) {
        e.preventDefault();
        ensureMedia().then(function () {
          openHowToVideo(sound);
        });
      });
    }
    var yazBtn = body.querySelector("[data-yazilis]");
    if (yazBtn) {
      yazBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openLetterWriting(sound);
      });
    }
    var kristalBtn = body.querySelector("[data-kristal]");
    if (kristalBtn) {
      kristalBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openKristalCave(sound);
      });
    }
    body.querySelectorAll("[data-lane]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLane(sound.id, btn.getAttribute("data-lane"));
      });
    });
  }

  function openLane(soundId, laneKey) {
    var DD = data();
    var sound = DD && DD.getSound ? DD.getSound(soundId) : null;
    if (!sound) return;
    var def = findLaneDef(laneKey);
    if (!def) return;
    var bags = collectSoundLanes(sound);
    var list = bags[laneKey] || [];
    if (!list.length) return;
    activeLane = {
      key: laneKey,
      title: def.title,
      allLabel: def.allLabel,
      list: list,
      index: 0
    };
    openLaneItem(sound, 0);
  }

  function openLaneItem(sound, index) {
    if (!activeLane || !sound) return;
    var list = activeLane.list || [];
    if (index < 0 || index >= list.length) return;
    activeLane.index = index;
    var f = list[index];
    if (!f) return;
    startFusion(sound.id, f.id, { fromLane: true });
  }

  function advanceLane() {
    if (!activeLane || !activeSound) {
      if (activeSound) openSound(activeSound.id);
      return;
    }
    if (!laneNextUnlocked) return;
    var next = (activeLane.index || 0) + 1;
    if (next >= (activeLane.list || []).length) {
      finishLaneSequence();
      return;
    }
    openLaneItem(activeSound, next);
  }

  function laneProgressLabel() {
    if (!activeLane) return "";
    var i = (activeLane.index || 0) + 1;
    var n = (activeLane.list || []).length;
    return i + " / " + n;
  }

  function setLaneNextEnabled(on) {
    laneNextUnlocked = !!on;
    var next = document.getElementById("birles-next");
    if (!next) return;
    if (!activeLane) {
      next.disabled = false;
      next.classList.remove("is-locked");
      next.removeAttribute("aria-disabled");
      return;
    }
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
      next.textContent = "Dinleniyor…";
      next.setAttribute("title", "Gösterim bitince açılır");
    }
  }

  function laneActionBarHtml(inLane) {
    if (inLane && activeLane) {
      var total = (activeLane.list || []).length || 1;
      var cur = (activeLane.index || 0) + 1;
      var pct = Math.max(6, Math.round((cur / total) * 100));
      return (
        '<div class="birles-play-actions birles-lane-bar">' +
        '<div class="birles-lane-bar__track" aria-hidden="true"><span style="width:' +
        pct +
        '%"></span></div>' +
        '<span class="birles-lane-bar__progress" aria-live="polite">' +
        esc(laneProgressLabel()) +
        "</span>" +
        '<button type="button" class="birles-btn birles-btn--soft" id="birles-replay">Tekrar</button>' +
        '<button type="button" class="birles-btn birles-btn--soft" id="birles-lane-all">' +
        esc(activeLane.allLabel || "Tümü") +
        "</button>" +
        '<button type="button" class="birles-btn birles-btn--go is-locked" id="birles-next" disabled aria-disabled="true" title="Gösterim bitince açılır">Dinleniyor…</button>' +
        "</div>"
      );
    }
    return (
      '<div class="birles-play-actions">' +
      '<button type="button" class="birles-btn birles-btn--ghost" id="birles-replay">Tekrar dinle</button>' +
      '<button type="button" class="birles-btn" id="birles-next">Başka birleştirme</button>' +
      "</div>"
    );
  }

  function wireLanePlayActions(sound, onReplay) {
    laneNextUnlocked = false;
    if (activeLane) setLaneNextEnabled(false);
    var replay = document.getElementById("birles-replay");
    var next = document.getElementById("birles-next");
    var allBtn = document.getElementById("birles-lane-all");
    if (replay) {
      replay.addEventListener("click", function () {
        if (activeLane) setLaneNextEnabled(false);
        if (typeof onReplay === "function") onReplay();
        else if (activeFusion) runFusionAnimation(sound, activeFusion);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        if (activeLane && !laneNextUnlocked) return;
        if (activeLane) advanceLane();
        else openSound(sound.id);
      });
    }
    if (allBtn) {
      allBtn.addEventListener("click", function () {
        animToken += 1;
        renderLaneGallery(sound);
      });
    }
  }

  function renderLaneGallery(sound) {
    if (!sound || !activeLane) return;
    setPoolPlayMode(false);
    var body = document.getElementById("birles-body");
    if (!body) return;
    var vv = voice();
    if (vv) vv.stop();
    animToken += 1;
    view = "gallery";
    activeSound = sound;
    activeFusion = null;
    setBack(true);
    setHeader(activeLane.title, sound.title, activeLane.allLabel || "Tümü");

    var list = activeLane.list || [];
    var key = activeLane.key;
    var sectionTitle =
      key === "hece"
        ? "Heceler"
        : key === "kelime"
          ? "Kelimeler"
          : key === "cumle"
            ? "Cümleler"
            : key === "piramit"
              ? "Piramit"
              : "Metinler";
    var gridClass =
      key === "hece"
        ? "birles-fusion-grid--hece"
        : key === "kelime"
          ? "birles-fusion-grid--word"
          : key === "cumle"
            ? "birles-fusion-grid--cumle"
            : "";

    var html =
      '<div class="birles-gallery birles-gallery--story birles-gallery--' +
      esc(key) +
      '">' +
      '  <div class="birles-gallery__toolbar">' +
      '    <button type="button" class="birles-btn birles-btn--soft" id="birles-gallery-back">Yollara dön</button>' +
      '    <button type="button" class="birles-btn birles-btn--go" id="birles-gallery-restart">Baştan oyna</button>' +
      "  </div>" +
      '  <section class="birles-fusion-section birles-fusion-section--gallery' +
      (key === "piramit" ? " birles-fusion-section--piramit" : "") +
      (key === "metin" ? " birles-fusion-section--metin" : "") +
      '">' +
      '    <header class="birles-fusion-section__head">' +
      '      <h3 class="birles-path-label">' +
      esc(sectionTitle) +
      "</h3>" +
      '      <span class="birles-fusion-section__count">' +
      list.length +
      "</span>" +
      "    </header>";

    if (key === "piramit") {
      html +=
        '<div class="birles-piramit-rail" role="list" style="--chip:' +
        esc(sound.color) +
        '">';
      list.forEach(function (f, i) {
        html += piramitTileHtml(f, 'data-lane-index="' + i + '"');
      });
      html += "</div>";
    } else if (key === "metin") {
      html += '<div class="birles-metin-rail" role="list">';
      list.forEach(function (f, i) {
        html += metinTileHtml(f, 'data-lane-index="' + i + '"');
      });
      html += "</div>";
    } else {
      html +=
        '<div class="birles-fusion-grid' +
        (gridClass ? " " + gridClass : "") +
        '" role="list">';
      list.forEach(function (f, i) {
        html += fusionCardHtml(
          f,
          'data-lane-index="' + i + '" role="listitem"'
        );
      });
      html += "</div>";
    }

    html += "</section></div>";
    body.innerHTML = html;

    var backBtn = document.getElementById("birles-gallery-back");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        activeLane = null;
        openSound(sound.id);
      });
    }
    var restart = document.getElementById("birles-gallery-restart");
    if (restart) {
      restart.addEventListener("click", function () {
        openLaneItem(sound, 0);
      });
    }
    body.querySelectorAll("[data-lane-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLaneItem(sound, Number(btn.getAttribute("data-lane-index")) || 0);
      });
    });
  }

  /**
   * Piramit okuyucu — satır satır uzayan akıcı okuma.
   * Öğretme: (1) satır vurgusu + kelime kelime (2) daha akıcı tekrar.
   * Hece balonu yok; amaç göz takibi ve akıcılık.
   */
  function openPyramidReader(soundId, fusionId, opts) {
    opts = opts || {};
    var D = data();
    if (!D) return;
    var sound = D.getSound(soundId);
    var fusion = D.getFusion(soundId, fusionId);
    if (!sound || !fusion || !fusion.lines || !fusion.lines.length) return;
    var body = document.getElementById("birles-body");
    if (!body) return;
    if (!opts.fromLane) activeLane = null;
    view = "play";
    activeSound = sound;
    activeFusion = fusion;
    setBack(true);
    setHeader(fusion.title || fusion.result, "Piramit · " + sound.title.toUpperCase(), "Akıcı");

    var flatWords = [];
    var pyramidHtml = '<div class="birles-piramit-stack" id="birles-piramit-stack" aria-label="Piramit metin">';
    fusion.lines.forEach(function (ln, li) {
      pyramidHtml +=
        '<p class="birles-piramit-line" data-pline="' +
        li +
        '" style="--pline:' +
        li +
        '">';
      (ln.words || []).forEach(function (w, wi) {
        var idx = flatWords.length;
        flatWords.push({ word: w, line: li });
        if (wi) pyramidHtml += " ";
        pyramidHtml +=
          '<span class="birles-piramit-word" data-pw="' +
          idx +
          '">' +
          esc(w.text) +
          "</span>";
      });
      pyramidHtml += "</p>";
    });
    pyramidHtml += "</div>";

    body.innerHTML =
      '<div class="birles-piramit-view" style="--chip:' +
      esc(sound.color) +
      '">' +
      '<div class="birles-piramit-hero">' +
      '<h2 class="birles-piramit-hero__title">' +
      esc(fusion.title || fusion.result) +
      "</h2>" +
      "</div>" +
      pyramidHtml +
      '<p class="birles-piramit-done" id="birles-piramit-done" hidden>Harika! Piramidi okudun!</p>' +
      (activeLane
        ? laneActionBarHtml(true)
        : '<div class="birles-piramit-actions">' +
          '<button type="button" class="birles-btn" id="birles-piramit-read">Piramidi oku</button>' +
          '<button type="button" class="birles-btn birles-btn--ghost" id="birles-piramit-back">Sese dön</button>' +
          "</div>") +
      "</div>";

    var stackEl = document.getElementById("birles-piramit-stack");
    var doneEl = document.getElementById("birles-piramit-done");

    /** Her satır tek satır: hedef punto büyük; yalnızca taşan en uzun satıra göre küçült */
    function fitPyramidLines() {
      if (!stackEl) return;
      var lines = Array.prototype.slice.call(stackEl.querySelectorAll(".birles-piramit-line"));
      if (!lines.length) return;
      var padL = parseFloat(getComputedStyle(stackEl).paddingLeft) || 14;
      var padR = parseFloat(getComputedStyle(stackEl).paddingRight) || 14;
      /* is-live scale ~1.06 payı */
      var avail = Math.max(64, stackEl.clientWidth - padL - padR - 4) / 1.07;
      lines.forEach(function (el) {
        el.style.fontSize = "";
        el.style.whiteSpace = "nowrap";
        el.style.width = "max-content";
      });
      var base = parseFloat(getComputedStyle(lines[0]).fontSize) || 28;
      lines.forEach(function (el) {
        el.style.fontSize = base + "px";
      });
      var maxW = 0;
      lines.forEach(function (el) {
        maxW = Math.max(maxW, el.scrollWidth || 0);
      });
      if (!maxW) return;
      var scale = maxW > avail ? avail / maxW : 1;
      var finalPx = Math.max(13, Math.floor(base * scale * 100) / 100);
      lines.forEach(function (el) {
        el.style.fontSize = finalPx + "px";
      });
    }

    var fitRaf = 0;
    function scheduleFitPyramid() {
      if (fitRaf) cancelAnimationFrame(fitRaf);
      fitRaf = requestAnimationFrame(function () {
        fitRaf = requestAnimationFrame(function () {
          fitPyramidLines();
        });
      });
    }

    scheduleFitPyramid();
    window.addEventListener("resize", scheduleFitPyramid);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleFitPyramid);
    }

    function wordNode(i) {
      return body.querySelector('.birles-piramit-word[data-pw="' + i + '"]');
    }

    function lineNode(i) {
      return body.querySelector('.birles-piramit-line[data-pline="' + i + '"]');
    }

    function resetMarks() {
      body.querySelectorAll(".birles-piramit-line").forEach(function (el) {
        el.classList.remove("is-live", "is-read", "is-done");
      });
      body.querySelectorAll(".birles-piramit-word").forEach(function (el) {
        el.classList.remove("is-live", "is-speak", "is-read");
      });
      if (stackEl) stackEl.classList.remove("is-finished", "is-fast");
      if (doneEl) doneEl.hidden = true;
    }

    function markLine(li, state) {
      body.querySelectorAll(".birles-piramit-line").forEach(function (el, idx) {
        el.classList.remove("is-live");
        if (state === "reset") {
          el.classList.remove("is-read", "is-done");
          return;
        }
        if (idx < li) {
          el.classList.add("is-read");
          el.classList.add("is-done");
        }
        if (idx === li && state === "focus") el.classList.add("is-live");
      });
    }

    async function playPyramidWord(entry, index, token, fast) {
      var el = wordNode(index);
      if (!el) return false;
      var vv = voice();
      var lineEl = lineNode(entry.line);
      if (lineEl) {
        scrollWordIntoView(lineEl);
        lineEl.classList.add("is-live");
      }
      el.classList.add("is-live", "is-speak");
      await pace(fast ? 60 : 110);
      if (token !== animToken) return false;
      if (vv) await vv.playToken(entry.word.say, { waitUntilEnd: true });
      await pace(fast ? 40 : 90);
      el.classList.remove("is-live", "is-speak");
      el.classList.add("is-read");
      return token === animToken;
    }

    async function runPyramidReading() {
      var token = ++animToken;
      if (activeLane) setLaneNextEnabled(false);
      resetMarks();
      await pace(380);
      if (token !== animToken) return;

      var lastLine = -1;
      /* 1) Satır satır, kelime kelime — yavaş, izlenebilir */
      for (var i = 0; i < flatWords.length; i++) {
        if (token !== animToken) return;
        var entry = flatWords[i];
        if (entry.line !== lastLine) {
          markLine(entry.line, "focus");
          lastLine = entry.line;
          await pace(160);
          if (token !== animToken) return;
        }
        if (!(await playPyramidWord(entry, i, token, false))) return;
      }

      if (token !== animToken) return;
      await pace(420);
      if (token !== animToken) return;

      /* 2) Akıcı tekrar — daha hızlı, göz takibi */
      if (stackEl) stackEl.classList.add("is-fast");
      body.querySelectorAll(".birles-piramit-word").forEach(function (el) {
        el.classList.remove("is-read", "is-live", "is-speak");
      });
      body.querySelectorAll(".birles-piramit-line").forEach(function (el) {
        el.classList.remove("is-read", "is-done", "is-live");
      });
      lastLine = -1;
      for (var j = 0; j < flatWords.length; j++) {
        if (token !== animToken) return;
        var e2 = flatWords[j];
        if (e2.line !== lastLine) {
          markLine(e2.line, "focus");
          lastLine = e2.line;
        }
        if (!(await playPyramidWord(e2, j, token, true))) return;
      }

      if (token !== animToken) return;
      markLine(fusion.lines.length, "focus");
      body.querySelectorAll(".birles-piramit-line").forEach(function (el) {
        el.classList.add("is-read", "is-done");
        el.classList.remove("is-live");
      });
      if (stackEl) {
        stackEl.classList.remove("is-fast");
        stackEl.classList.add("is-finished");
      }
      if (doneEl) {
        doneEl.hidden = true;
        doneEl.textContent = "";
      }
      if (activeLane) setLaneNextEnabled(true);
    }

    function cleanupPyramidFit() {
      window.removeEventListener("resize", scheduleFitPyramid);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", scheduleFitPyramid);
      }
    }

    if (activeLane) {
      wireLanePlayActions(sound, function () {
        scheduleFitPyramid();
        runPyramidReading();
      });
    } else {
      var pyrRead = document.getElementById("birles-piramit-read");
      if (pyrRead) {
        pyrRead.addEventListener("click", function () {
          scheduleFitPyramid();
          runPyramidReading();
        });
      }
      var pyrBack = document.getElementById("birles-piramit-back");
      if (pyrBack) {
        pyrBack.addEventListener("click", function () {
          animToken += 1;
          cleanupPyramidFit();
          openSound(sound.id);
        });
      }
    }

    runPyramidReading();
  }

  function openTextReader(soundId, fusionId, opts) {
    opts = opts || {};
    var D = data();
    if (!D) return;
    var sound = D.getSound(soundId);
    var fusion = D.getFusion(soundId, fusionId);
    if (!sound || !fusion) return;
    var body = document.getElementById("birles-body");
    if (!body) return;
    if (!opts.fromLane) activeLane = null;
    view = "play";
    activeSound = sound;
    activeFusion = fusion;
    setBack(true);
    setHeader(fusion.title || fusion.result, "Hikâye · " + sound.title.toUpperCase(), "Metin");
    var med = fusion.mediaKey ? mediaFor(fusion.mediaKey) : null;
    var coverHtml =
      med && med.imageUrl
        ? '<img class="birles-metin-hero__img" src="' +
          esc(med.imageUrl) +
          '" alt="' +
          esc(fusion.title || "") +
          '" />'
        : '<div class="birles-metin-hero__ph" aria-hidden="true"></div>';

    /* Sürekli paragraf: cümleler yan yana */
    var storyWords = [];
    var storyHtml = '<p class="birles-metin-story__flow">';
    (fusion.sentences || []).forEach(function (sf, si) {
      if (si) storyHtml += " ";
      (sf.words || []).forEach(function (w, wi) {
        var idx = storyWords.length;
        storyWords.push(w);
        if (wi) storyHtml += " ";
        storyHtml +=
          '<span class="birles-metin-word" data-sw="' +
          idx +
          '">' +
          '<span class="birles-metin-word__txt">' +
          esc(w.text) +
          "</span>" +
          "</span>";
      });
      storyHtml += '<span class="birles-metin-dot">.</span>';
    });
    storyHtml += "</p>";

    body.innerHTML =
      '<div class="birles-metin-view" style="--chip:' +
      esc(sound.color) +
      '">' +
      '<div class="birles-metin-hero">' +
      coverHtml +
      '<div class="birles-metin-hero__veil"></div>' +
      '<div class="birles-metin-hero__copy">' +
      '<p class="birles-metin-hero__kicker">Hikâye</p>' +
      '<h2 class="birles-metin-hero__title">' +
      esc(fusion.title || fusion.result) +
      "</h2>" +
      "</div></div>" +
      '<div class="birles-metin-story" id="birles-metin-story" aria-label="Hikâye metni">' +
      storyHtml +
      "</div>" +
      '<p class="birles-metin-done" id="birles-metin-done" hidden>Harika! Hikâyeyi okudun!</p>' +
      (activeLane
        ? laneActionBarHtml(true)
        : '<div class="birles-metin-actions">' +
          '<button type="button" class="birles-btn" id="birles-metin-readall">Metni oku</button>' +
          '<button type="button" class="birles-btn birles-btn--ghost" id="birles-metin-back">Sese dön</button>' +
          "</div>") +
      "</div>";

    var storyEl = document.getElementById("birles-metin-story");
    var doneEl = document.getElementById("birles-metin-done");

    function wordNode(i) {
      return body.querySelector('.birles-metin-word[data-sw="' + i + '"]');
    }

    function clearFloats() {
      body.querySelectorAll(".birles-metin-word").forEach(function (el) {
        el.classList.remove("is-live", "is-split", "is-merge", "is-speak");
        var f = el.querySelector(".birles-metin-float");
        if (f) f.remove();
        var txt = el.querySelector(".birles-metin-word__txt");
        if (txt) txt.classList.remove("is-ghost");
      });
    }

    function setWordState(i, state) {
      body.querySelectorAll(".birles-metin-word").forEach(function (el, idx) {
        el.classList.remove("is-live", "is-speak");
        if (state === "reset") {
          el.classList.remove("is-read");
          return;
        }
        if (idx < i) el.classList.add("is-read");
        if (idx === i && state === "focus") el.classList.add("is-live");
      });
    }

    async function playSylChip(chip, tokenStr, token) {
      if (!chip || token !== animToken) return;
      chip.classList.add("is-on");
      var vv = voice();
      if (vv) await vv.playToken(tokenStr, { waitUntilEnd: true });
      chip.classList.remove("is-on");
      await pace(90);
    }

    /** Hikâye heceleme: kelimenin üstünde balon (eski düzen) */
    async function playStoryWord(word, index, token) {
      var el = wordNode(index);
      if (!el) return false;
      var displaySyls = resolveDisplaySyllables(word);
      var audioSyls =
        word.syllables && word.syllables.length && typeof word.syllables[0] === "string"
          ? word.syllables.slice()
          : word.syllables && word.syllables.length
            ? word.syllables.map(function (s) {
                return Array.isArray(s) ? s.join("") : String(s || "");
              })
            : [word.say || word.text];
      audioSyls = audioSyls.map(function (s) {
        return String(s || "").toLocaleLowerCase("tr-TR");
      });
      var vv = voice();
      var txt = el.querySelector(".birles-metin-word__txt");

      el.classList.add("is-live");
      scrollWordIntoView(el);
      await pace(220);
      if (token !== animToken) return false;

      if (displaySyls.length > 1) {
        el.classList.add("is-split");
        if (txt) txt.classList.add("is-ghost");
        var float = document.createElement("span");
        float.className = "birles-metin-float";
        float.setAttribute("aria-hidden", "true");
        float.innerHTML = displaySyls
          .map(function (sy, si) {
            return (
              (si ? '<span class="birles-metin-float__plus">+</span>' : "") +
              '<span class="birles-metin-float__syl" data-syl="' +
              si +
              '">' +
              esc(sy) +
              "</span>"
            );
          })
          .join("");
        el.appendChild(float);
        await pace(280);
        if (token !== animToken) return false;

        for (var si = 0; si < displaySyls.length; si++) {
          if (token !== animToken) return false;
          var chip = float.querySelector('.birles-metin-float__syl[data-syl="' + si + '"]');
          await playSylChip(chip, audioSyls[si] || displaySyls[si].toLocaleLowerCase("tr-TR"), token);
        }

        el.classList.add("is-merge");
        float.classList.add("is-merging");
        await pace(520);
        if (token !== animToken) return false;

        float.innerHTML = '<span class="birles-metin-float__word">' + esc(word.text) + "</span>";
        float.classList.remove("is-merging");
        float.classList.add("is-word");
        el.classList.remove("is-split");
        el.classList.add("is-speak");
        await pace(160);
        if (vv) await vv.playToken(word.say, { waitUntilEnd: true });
        await pace(200);
        if (token !== animToken) return false;

        float.classList.add("is-out");
        await pace(280);
        if (float.parentNode) float.remove();
        if (txt) txt.classList.remove("is-ghost");
        el.classList.remove("is-merge", "is-speak", "is-split");
      } else {
        el.classList.add("is-speak");
        await pace(120);
        if (vv) await vv.playToken(word.say, { waitUntilEnd: true });
        await pace(160);
        el.classList.remove("is-speak");
      }

      el.classList.remove("is-live");
      el.classList.add("is-read");
      return token === animToken;
    }

    /** 2. tur: hece yok — yalnızca kelime kelime okuma */
    async function playStoryWordOnly(word, index, token) {
      var el = wordNode(index);
      if (!el) return false;
      var vv = voice();
      clearFloats();
      el.classList.add("is-live", "is-speak");
      scrollWordIntoView(el);
      await pace(100);
      if (token !== animToken) return false;
      if (vv) await vv.playToken(word.say, { waitUntilEnd: true });
      await pace(80);
      el.classList.remove("is-live", "is-speak");
      el.classList.add("is-read");
      return token === animToken;
    }

    async function runStoryReading() {
      var token = ++animToken;
      if (activeLane) setLaneNextEnabled(false);
      clearFloats();
      setWordState(0, "reset");
      if (doneEl) doneEl.hidden = true;
      if (storyEl) storyEl.classList.remove("is-finished", "is-wordpass");
      await pace(420);
      if (token !== animToken) return;

      /* 1) Hece hece + kelime */
      for (var i = 0; i < storyWords.length; i++) {
        if (token !== animToken) return;
        setWordState(i, "focus");
        if (!(await playStoryWord(storyWords[i], i, token))) return;
        await pace(100);
      }

      if (token !== animToken) return;
      await pace(360);
      if (token !== animToken) return;

      /* 2) Metnin tamamı — sadece kelimeler */
      if (storyEl) storyEl.classList.add("is-wordpass");
      body.querySelectorAll(".birles-metin-word").forEach(function (el) {
        el.classList.remove("is-read", "is-live", "is-speak");
      });
      for (var j = 0; j < storyWords.length; j++) {
        if (token !== animToken) return;
        setWordState(j, "focus");
        if (!(await playStoryWordOnly(storyWords[j], j, token))) return;
        await pace(70);
      }

      if (token !== animToken) return;
      if (storyEl) {
        storyEl.classList.remove("is-wordpass");
        storyEl.classList.add("is-finished");
      }
      if (doneEl) {
        doneEl.hidden = true;
        doneEl.textContent = "";
      }
      if (activeLane) setLaneNextEnabled(true);
    }

    if (activeLane) {
      wireLanePlayActions(sound, function () {
        ensureMedia().then(function () {
          runStoryReading();
        });
      });
    } else {
      var metinRead = document.getElementById("birles-metin-readall");
      if (metinRead) {
        metinRead.addEventListener("click", function () {
          ensureMedia().then(function () {
            runStoryReading();
          });
        });
      }
      var metinBack = document.getElementById("birles-metin-back");
      if (metinBack) {
        metinBack.addEventListener("click", function () {
          animToken += 1;
          openSound(sound.id);
        });
      }
    }

    ensureMedia().then(function () {
      runStoryReading();
    });
  }

  function startFusion(soundId, fusionId, opts) {
    opts = opts || {};
    var DD = data();
    var sound = DD.getSound(soundId);
    var fusion = DD.getFusion(soundId, fusionId);
    if (!sound || !fusion) return;
    if (!opts.fromLane) activeLane = null;
    if (fusion.kind === "piramit" || fusion.mode === "pyramid") {
      openPyramidReader(soundId, fusionId, opts);
      return;
    }
    if (fusion.kind === "metin" || fusion.mode === "text") {
      openTextReader(soundId, fusionId, opts);
      return;
    }
    view = "play";
    activeSound = sound;
    activeFusion = fusion;
    setBack(true);
    setHeader(fusion.result, fusion.label, sound.title.toUpperCase());
    renderPlayStage(sound, fusion);
    ensureMedia()
      .then(function () {
        if (document.getElementById("birles-pool")) return preparePoolReady();
      })
      .then(function () {
        runFusionAnimation(sound, fusion);
      });
  }

  var POOL_MERGE_SRC = "assets/birles/ses_birlestirme.mp4?v=opt1";
  var POOL_BOOM_SRC = "assets/birles/ses_patlama.mp4?v=opt1";
  var poolLayoutBound = null;
  var poolMediaCache = { merge: "", boom: "", ready: null };

  function setPoolPlayMode(on) {
    var ov = document.getElementById("birlestirelim-overlay");
    if (!ov) return;
    ov.classList.toggle("is-pool-play", !!on);
    try {
      document.body.classList.toggle("birles-pool-fs", !!on);
    } catch (_) {}
    if (!on) {
      unbindPoolLayout();
      try {
        softPauseVideo(document.getElementById("birles-pool-merge"));
        softPauseVideo(document.getElementById("birles-pool-boom"));
      } catch (_) {}
    } else {
      requestAnimationFrame(function () {
        layoutPoolStage();
        requestAnimationFrame(layoutPoolStage);
      });
    }
  }

  /** Telefon layout + visualViewport — en büyük kutu (letterbox yok) */
  function fullBleedViewport() {
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
    var ov = document.getElementById("birlestirelim-overlay");
    if (ov) {
      try {
        var r = ov.getBoundingClientRect();
        if (r.width > 2) w = Math.max(w, Math.ceil(r.width));
        if (r.height > 2) h = Math.max(h, Math.ceil(r.height));
      } catch (_) {}
    }
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
  }

  function layoutPoolStage() {
    var pool = document.getElementById("birles-pool");
    var box = document.getElementById("birles-pool-stagebox");
    if (!box) return;
    var vp = fullBleedViewport();
    if (pool) {
      try {
        var pr = pool.getBoundingClientRect();
        if (pr.width > 2) vp.w = Math.max(vp.w, Math.ceil(pr.width));
        if (pr.height > 2) vp.h = Math.max(vp.h, Math.ceil(pr.height));
      } catch (_) {}
    }
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
    box.style.maxWidth = "none";
    box.style.maxHeight = "none";
    box.style.minWidth = "0";
    box.style.minHeight = "0";
    box.style.transform = "translate(-50%, -50%)";
    box.style.zIndex = "0";
    box.style.pointerEvents = "none";
  }

  function bindPoolLayout() {
    unbindPoolLayout();
    poolLayoutBound = function () {
      layoutPoolStage();
    };
    window.addEventListener("resize", poolLayoutBound);
    window.addEventListener("orientationchange", poolLayoutBound);
    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", poolLayoutBound);
        window.visualViewport.addEventListener("scroll", poolLayoutBound);
      }
    } catch (_) {}
  }

  function unbindPoolLayout() {
    if (!poolLayoutBound) return;
    window.removeEventListener("resize", poolLayoutBound);
    window.removeEventListener("orientationchange", poolLayoutBound);
    try {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", poolLayoutBound);
        window.visualViewport.removeEventListener("scroll", poolLayoutBound);
      }
    } catch (_) {}
    poolLayoutBound = null;
  }

  function fetchPoolBlobUrl(src) {
    return fetch(src, { cache: "force-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("pool-fetch");
        return res.blob();
      })
      .then(function (blob) {
        return URL.createObjectURL(blob);
      });
  }

  /** Videoları bir kez indirip blob URL olarak sakla — tekrar indirmez */
  function ensurePoolBlobUrls() {
    if (poolMediaCache.merge && poolMediaCache.boom) {
      return Promise.resolve(poolMediaCache);
    }
    if (poolMediaCache.ready) return poolMediaCache.ready;
    poolMediaCache.ready = Promise.all([
      fetchPoolBlobUrl(POOL_MERGE_SRC),
      fetchPoolBlobUrl(POOL_BOOM_SRC)
    ])
      .then(function (urls) {
        poolMediaCache.merge = urls[0];
        poolMediaCache.boom = urls[1];
        return poolMediaCache;
      })
      .catch(function () {
        poolMediaCache.merge = POOL_MERGE_SRC;
        poolMediaCache.boom = POOL_BOOM_SRC;
        poolMediaCache.ready = null;
        return poolMediaCache;
      });
    return poolMediaCache.ready;
  }

  function waitVideoCanPlay(video, timeoutMs) {
    return new Promise(function (resolve) {
      if (!video) {
        resolve();
        return;
      }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        video.removeEventListener("canplay", finish);
        video.removeEventListener("loadeddata", finish);
        video.removeEventListener("error", finish);
        resolve();
      }
      if (video.readyState >= 3) {
        finish();
        return;
      }
      video.addEventListener("canplay", finish);
      video.addEventListener("loadeddata", finish);
      video.addEventListener("error", finish);
      try {
        video.preload = "auto";
        if (video.readyState < 2) video.load();
      } catch (_) {}
      setTimeout(finish, timeoutMs || 18000);
    });
  }

  function softPauseVideo(video) {
    if (!video) return;
    try {
      video.pause();
    } catch (_) {}
  }

  function poolLayer(which) {
    return document.getElementById(
      which === "boom" ? "birles-pool-layer-boom" : "birles-pool-layer-merge"
    );
  }

  function poolVeil() {
    return document.getElementById("birles-pool-veil");
  }

  function readPoolOpacity(el) {
    if (!el) return 0;
    var inline = el.style.opacity;
    if (inline !== "" && inline != null) {
      var n = parseFloat(inline);
      if (!isNaN(n)) return n;
    }
    if (el.classList.contains("is-on")) return 1;
    try {
      var c = parseFloat(window.getComputedStyle(el).opacity);
      if (!isNaN(c)) return c;
    } catch (_) {}
    return 0;
  }

  /** Telefonda güvenilir dissolve — CSS transition yerine rAF */
  function animatePoolOpacity(el, target, durationMs) {
    return new Promise(function (resolve) {
      if (!el) {
        resolve();
        return;
      }
      var from = readPoolOpacity(el);
      var dur = Math.max(0, durationMs || 0);
      el.style.transition = "none";
      if (dur < 16 || Math.abs(from - target) < 0.02) {
        el.style.opacity = String(target);
        el.classList.toggle("is-on", target >= 0.95);
        resolve();
        return;
      }
      var t0 = performance.now();
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        var s = p * p * (3 - 2 * p);
        el.style.opacity = String(from + (target - from) * s);
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          el.style.opacity = String(target);
          el.classList.toggle("is-on", target >= 0.95);
          resolve();
        }
      }
      requestAnimationFrame(tick);
    });
  }

  function setPoolLayerVisible(layer, on) {
    if (!layer) return;
    layer.style.transition = "none";
    layer.style.opacity = on ? "1" : "0";
    layer.classList.toggle("is-on", !!on);
  }

  /** İlk kare decode olana kadar bekle (siyah flaş önlemi) */
  function waitVideoPaint(video, timeoutMs) {
    return new Promise(function (resolve) {
      if (!video) {
        resolve();
        return;
      }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      try {
        if (typeof video.requestVideoFrameCallback === "function") {
          video.requestVideoFrameCallback(function () {
            finish();
          });
          setTimeout(finish, timeoutMs || 400);
          return;
        }
      } catch (_) {}
      if (video.readyState >= 2 && video.currentTime > 0.01) {
        requestAnimationFrame(function () {
          requestAnimationFrame(finish);
        });
        return;
      }
      var onMeta = function () {
        cleanup();
        requestAnimationFrame(function () {
          requestAnimationFrame(finish);
        });
      };
      function cleanup() {
        video.removeEventListener("loadeddata", onMeta);
        video.removeEventListener("playing", onMeta);
        video.removeEventListener("seeked", onMeta);
      }
      video.addEventListener("loadeddata", onMeta);
      video.addEventListener("playing", onMeta);
      video.addEventListener("seeked", onMeta);
      setTimeout(function () {
        cleanup();
        finish();
      }, timeoutMs || 400);
    });
  }

  function setPoolBoot(on, text) {
    var boot = document.getElementById("birles-pool-boot");
    var play = document.querySelector(".birles-play--pool");
    if (play) play.classList.toggle("is-booting", !!on);
    if (!boot) return;
    boot.hidden = !on;
    boot.setAttribute("aria-hidden", on ? "false" : "true");
    var t = boot.querySelector(".birles-pool__boot-text");
    if (t && text) t.textContent = text;
  }

  function applyPoolVideoSources(cache) {
    var merge = document.getElementById("birles-pool-merge");
    var boom = document.getElementById("birles-pool-boom");
    if (merge && cache.merge) {
      if (merge.getAttribute("data-pool-src") !== cache.merge) {
        merge.src = cache.merge;
        merge.setAttribute("data-pool-src", cache.merge);
      }
    }
    if (boom && cache.boom) {
      if (boom.getAttribute("data-pool-src") !== cache.boom) {
        boom.src = cache.boom;
        boom.setAttribute("data-pool-src", cache.boom);
      }
    }
  }

  function startPoolMergeLoop() {
    var merge = document.getElementById("birles-pool-merge");
    var boom = document.getElementById("birles-pool-boom");
    var layerMerge = poolLayer("merge");
    var layerBoom = poolLayer("boom");
    var veil = poolVeil();
    var burst = document.getElementById("birles-pool-burst");
    if (burst) {
      burst.hidden = true;
      burst.classList.remove("is-rise", "is-boom-in");
      burst.textContent = "";
    }
    var flash = document.getElementById("birles-pool-flash");
    if (flash) {
      flash.hidden = true;
      flash.classList.remove("is-on");
    }
    if (veil) setPoolLayerVisible(veil, false);
    if (boom) {
      softPauseVideo(boom);
      boom.removeAttribute("hidden");
    }
    setPoolLayerVisible(layerBoom, false);
    if (merge) {
      merge.removeAttribute("hidden");
      merge.muted = true;
      merge.loop = true;
      try {
        merge.currentTime = 0;
      } catch (_) {}
      var p = merge.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    setPoolLayerVisible(layerMerge, true);
    layoutPoolStage();
  }

  function preparePoolReady() {
    if (!document.getElementById("birles-pool")) {
      return Promise.resolve();
    }
    setPoolBoot(true, "Sihirli Havuz hazırlanıyor…");
    layoutPoolStage();
    return ensurePoolBlobUrls()
      .then(function (cache) {
        applyPoolVideoSources(cache);
        var merge = document.getElementById("birles-pool-merge");
        var boom = document.getElementById("birles-pool-boom");
        return Promise.all([
          waitVideoCanPlay(merge, 18000),
          waitVideoCanPlay(boom, 18000)
        ]);
      })
      .then(function () {
        startPoolMergeLoop();
        setPoolBoot(false);
      })
      .catch(function () {
        startPoolMergeLoop();
        setPoolBoot(false);
      });
  }

  /** Katmanları anında değiştir — geçiş efekti yok */
  function hardCutPoolLayers(showBoom) {
    var layerMerge = poolLayer("merge");
    var layerBoom = poolLayer("boom");
    var veil = poolVeil();
    if (veil) setPoolLayerVisible(veil, false);
    setPoolLayerVisible(layerMerge, !showBoom);
    setPoolLayerVisible(layerBoom, !!showBoom);
  }

  function waitBoomEnded(boom, token) {
    return new Promise(function (resolve) {
      var finished = false;
      function done() {
        if (finished) return;
        finished = true;
        resolve();
      }
      function cleanup() {
        if (!boom) return;
        boom.removeEventListener("ended", onEnded);
        boom.removeEventListener("timeupdate", onTime);
      }
      function onEnded() {
        cleanup();
        done();
      }
      function onTime() {
        if (token !== animToken) {
          cleanup();
          done();
          return;
        }
        var d = boom && boom.duration;
        if (d && isFinite(d) && d > 0 && boom.currentTime >= d - 0.05) {
          cleanup();
          done();
        }
      }
      if (!boom) {
        done();
        return;
      }
      if (boom.ended) {
        done();
        return;
      }
      boom.addEventListener("ended", onEnded);
      boom.addEventListener("timeupdate", onTime);
      setTimeout(function () {
        if (finished) return;
        cleanup();
        done();
      }, 12000);
    });
  }

  /** Patlama: ilk hece yumuşak kaybolur → parlama + video → yeni hece aşağıdan yükselir */
  async function playPoolFinale(finalWord, soundKey, vv, token) {
    var merge = document.getElementById("birles-pool-merge");
    var boom = document.getElementById("birles-pool-boom");
    var burst = document.getElementById("birles-pool-burst");
    var flash = document.getElementById("birles-pool-flash");
    var stage = document.getElementById("birles-stage");
    var tray = document.getElementById("birles-tray");
    if (!boom) return;

    var reduceMotion = false;
    try {
      reduceMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {}

    /* 1) İlk hece (birleşmiş kart) yumuşak kaybolsun */
    if (stage) {
      stage.classList.remove("is-finale");
      stage.classList.add("is-finale-fade");
    }
    if (tray) {
      tray.classList.remove("is-finale");
      tray.classList.add("is-finale-fade");
    }
    await pace(reduceMotion ? 120 : 480);
    if (token !== animToken) return;
    if (stage) stage.classList.add("is-finale");
    if (tray) tray.classList.add("is-finale");

    softPauseVideo(merge);

    boom.removeAttribute("hidden");
    boom.muted = false;
    boom.defaultMuted = false;
    boom.loop = false;
    try {
      boom.volume = 1;
    } catch (_) {}
    try {
      boom.currentTime = 0;
    } catch (_) {}

    hardCutPoolLayers(true);

    /* 2) Parlama + patlama videosu */
    if (flash) {
      flash.hidden = false;
      flash.classList.remove("is-on");
      void flash.offsetWidth;
      flash.classList.add("is-on");
    }

    var playP = boom.play();
    if (playP && typeof playP.catch === "function") {
      try {
        await playP;
      } catch (_) {
        try {
          boom.muted = true;
          await boom.play();
          boom.muted = false;
        } catch (_) {}
      }
    }
    if (token !== animToken) return;

    /* 3) Yeni hece aşağıdan patlamaya uygun yükseliş */
    await pace(reduceMotion ? 40 : 160);
    if (token !== animToken) return;
    if (burst) {
      burst.textContent = String(finalWord || "");
      burst.hidden = false;
      burst.classList.remove("is-rise", "is-boom-in");
      void burst.offsetWidth;
      burst.classList.add("is-boom-in");
    }

    var audioP = Promise.resolve();
    if (vv && soundKey) {
      audioP = Promise.resolve(vv.playToken(soundKey, { waitUntilEnd: true })).catch(
        function () {}
      );
    }

    await waitBoomEnded(boom, token);
    if (token !== animToken) return;

    softPauseVideo(boom);
    try {
      boom.muted = true;
    } catch (_) {}
    if (flash) {
      flash.classList.remove("is-on");
      flash.hidden = true;
    }

    if (merge) {
      merge.removeAttribute("hidden");
      merge.muted = true;
      merge.loop = true;
      var mp = merge.play();
      if (mp && typeof mp.catch === "function") mp.catch(function () {});
    }
    hardCutPoolLayers(false);

    await audioP;
  }

  function renderPlayStage(sound, fusion) {
    var body = document.getElementById("birles-body");
    if (!body) return;
    var isCumle = fusion.kind === "cumle" || fusion.mode === "sentence";
    var isKelime =
      !isCumle &&
      (fusion.kind === "kelime" || fusion.type === "kelime" || !!fusion.mediaKey);
    var usePool = !isCumle;
    var med = fusion.mediaKey ? mediaFor(fusion.mediaKey) : null;
    var hasImg = !!(med && med.imageUrl);
    var sentenceBar = "";
    var wordBoard = "";
    if (isCumle && fusion.words && fusion.words.length) {
      sentenceBar =
        '<div class="birles-sentence-board" id="birles-sentence-bar" aria-label="Cümle">' +
        '<div class="birles-sentence-board__top">' +
        '<span class="birles-sentence-board__kicker">Cümle</span>' +
        '<span class="birles-sentence-board__step" id="birles-sentence-step">1 / ' +
        fusion.words.length +
        "</span>" +
        "</div>" +
        '<div class="birles-sentence-bar">' +
        fusion.words
          .map(function (w, i) {
            return (
              '<span class="birles-sentence-word" data-word-i="' +
              i +
              '">' +
              '<span class="birles-sentence-word__mark" aria-hidden="true"></span>' +
              '<span class="birles-sentence-word__text">' +
              esc(w.text) +
              "</span>" +
              "</span>"
            );
          })
          .join("") +
        '<span class="birles-sentence-dot" aria-hidden="true">.</span>' +
        "</div></div>";
    }
    if (isKelime) {
      var kelimeSyls = resolveDisplaySyllables(fusion);
      wordBoard = heceBoardHtml(fusion.result, kelimeSyls, {
        id: "birles-hece-board",
        kicker: "Kelime heceleme",
        spotlight: true
      });
    }

    setPoolPlayMode(usePool);

    var core =
      '  <p class="birles-play__narration" id="birles-narration"' +
      (isKelime ? " hidden" : "") +
      ">" +
      esc(isKelime ? "" : fusion.narration || "") +
      "</p>" +
      wordBoard +
      sentenceBar +
      '  <div class="birles-stage" id="birles-stage" aria-live="polite"></div>' +
      '  <div class="birles-tray" id="birles-tray" aria-label="Birleşen heceler"></div>' +
      '  <p class="birles-audio-hint" id="birles-audio-hint" hidden></p>' +
      '  <div class="birles-reveal' +
      (hasImg ? "" : " birles-reveal--textonly") +
      '" id="birles-reveal" hidden>' +
      (hasImg
        ? '<img id="birles-reveal-img" class="birles-reveal__img" src="' +
          esc(med.imageUrl) +
          '" alt="' +
          esc(fusion.result) +
          '" />'
        : "") +
      '    <strong id="birles-reveal-word" class="birles-reveal__word" hidden></strong>' +
      '    <span id="birles-reveal-msg" class="birles-reveal__msg"></span>' +
      "  </div>";

    if (usePool) {
      body.innerHTML =
        '<div class="birles-play birles-play--pool' +
        (isKelime ? " birles-play--kelime" : "") +
        '" style="--chip:' +
        esc(sound.color) +
        ";--glow:" +
        esc(sound.glow) +
        '">' +
        '  <div class="birles-pool" id="birles-pool">' +
        '    <div class="birles-pool__stagebox" id="birles-pool-stagebox">' +
        '      <div class="birles-pool__layer birles-pool__layer--merge is-on" id="birles-pool-layer-merge" style="opacity:1">' +
        '        <video class="birles-pool__vid birles-pool__vid--merge" id="birles-pool-merge" playsinline webkit-playsinline muted loop preload="auto"></video>' +
        "      </div>" +
        '      <div class="birles-pool__layer birles-pool__layer--boom" id="birles-pool-layer-boom" style="opacity:0">' +
        '        <video class="birles-pool__vid birles-pool__vid--boom" id="birles-pool-boom" playsinline webkit-playsinline preload="auto"></video>' +
        "      </div>" +
        '      <div class="birles-pool__veil" id="birles-pool-veil" style="opacity:0" aria-hidden="true"></div>' +
        '      <div class="birles-pool__flash" id="birles-pool-flash" hidden aria-hidden="true"></div>' +
        '      <div class="birles-pool__ui">' +
        core +
        '        <p class="birles-pool__burst" id="birles-pool-burst" hidden aria-live="polite"></p>' +
        "      </div>" +
        "    </div>" +
        '    <div class="birles-pool__boot" id="birles-pool-boot" role="status" aria-live="polite">' +
        '      <div class="birles-pool__boot-orb" aria-hidden="true"></div>' +
        '      <p class="birles-pool__boot-title">Sihirli Havuz</p>' +
        '      <p class="birles-pool__boot-text">Sihirli Havuz hazırlanıyor…</p>' +
        '      <div class="birles-pool__boot-bar" aria-hidden="true"><i></i></div>' +
        "    </div>" +
        "  </div>" +
        laneActionBarHtml(!!activeLane) +
        "</div>";
      bindPoolLayout();
      layoutPoolStage();
      /* preparePoolReady startFusion / Tekrar içinde çağrılır */
    } else {
      body.innerHTML =
        '<div class="birles-play birles-play--cumle" style="--chip:' +
        esc(sound.color) +
        ";--glow:" +
        esc(sound.glow) +
        '">' +
        core +
        laneActionBarHtml(!!activeLane) +
        "</div>";
    }

    wireLanePlayActions(sound, function () {
      var go = function () {
        runFusionAnimation(sound, fusion);
      };
      if (document.getElementById("birles-pool")) {
        preparePoolReady().then(go);
      } else {
        go();
      }
    });
  }

  function cardHtml(text, tone) {
    return (
      '<button type="button" class="birles-card birles-card--' +
      esc(tone || "letter") +
      '" data-card="' +
      esc(text) +
      '"><span class="birles-card__face"><span class="birles-card__txt">' +
      esc(text) +
      '</span></span><span class="birles-card__pulse" aria-hidden="true"></span></button>'
    );
  }

  /** Cümle sonucu: kelime kelime — bitenler ince, okunan kalın (üst heceleme fontu) */
  function sentenceResultCardHtml(words) {
    var parts = (words || [])
      .map(function (w, i) {
        return (
          '<span class="birles-cumle-result-word" data-rw="' +
          i +
          '">' +
          esc(w.text) +
          "</span>"
        );
      })
      .join(" ");
    return (
      '<button type="button" class="birles-card birles-card--result birles-card--cumle-result" data-card="' +
      esc(
        (words || [])
          .map(function (w) {
            return w.text;
          })
          .join(" ") + "."
      ) +
      '"><span class="birles-card__face"><span class="birles-card__txt birles-card__txt--cumle">' +
      parts +
      '<span class="birles-cumle-result-dot">.</span></span></span>' +
      '<span class="birles-card__pulse" aria-hidden="true"></span></button>'
    );
  }

  function clearCardStates(root) {
    if (!root) return;
    root.querySelectorAll(".birles-card").forEach(function (c) {
      c.classList.remove("is-speaking", "is-dim", "is-merged", "is-waiting", "is-joining", "is-fly-down");
    });
  }

  function setSpeaking(card, on) {
    if (!card) return;
    card.classList.toggle("is-speaking", !!on);
  }

  function setHint(msg) {
    var el = document.getElementById("birles-audio-hint");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function setNarr(text) {
    if (quietProcessNarr) return;
    var narr = document.getElementById("birles-narration");
    if (narr && text) narr.textContent = text;
  }

  function setNarrForce(text) {
    var narr = document.getElementById("birles-narration");
    if (!narr) return;
    if (text) {
      narr.hidden = false;
      narr.textContent = text;
    } else {
      narr.textContent = "";
      narr.hidden = true;
    }
  }

  var quietProcessNarr = false;

  function pace(ms) {
    return wait(reducedMotion ? Math.min(ms, 160) : ms);
  }

  /** Görünen hece listesi (büyük harf hizalı) */
  function resolveDisplaySyllables(wordOrFusion) {
    var w = wordOrFusion || {};
    if (w.displaySyllables && w.displaySyllables.length) return w.displaySyllables.slice();
    if (w.syllables && w.syllables.length) {
      if (typeof w.syllables[0] === "string") return w.syllables.slice();
      return w.syllables.map(function (s) {
        return Array.isArray(s) ? s.join("") : String(s || "");
      });
    }
    var t = w.text || w.result || w.say || "";
    return t ? [String(t)] : [];
  }

  function heceBoardHtml(fullWord, displaySyls, opts) {
    opts = opts || {};
    var syls = displaySyls && displaySyls.length ? displaySyls : [fullWord];
    var full =
      '<div class="birles-hece-board__full" aria-label="Kelime">' +
      syls
        .map(function (sy, si) {
          return (
            '<span class="birles-hece-seg" data-syl="' +
            si +
            '">' +
            esc(sy) +
            "</span>"
          );
        })
        .join("") +
      "</div>";
    return (
      '<div class="birles-hece-board' +
      (opts.compact ? " birles-hece-board--compact" : "") +
      (opts.spotlight ? " birles-hece-board--spotlight" : "") +
      '" id="' +
      esc(opts.id || "birles-hece-board") +
      '">' +
      (opts.kicker
        ? '<p class="birles-hece-board__kicker">' + esc(opts.kicker) + "</p>"
        : "") +
      full +
      "</div>"
    );
  }

  function heceBoardRoot(id) {
    return document.getElementById(id || "birles-hece-board");
  }

  function setHeceActive(sylIndex, boardId) {
    var root = heceBoardRoot(boardId);
    if (!root) return;
    root.querySelectorAll(".birles-hece-seg").forEach(function (el) {
      var on = String(el.getAttribute("data-syl")) === String(sylIndex);
      el.classList.toggle("is-on", on);
      el.classList.toggle("is-done", Number(el.getAttribute("data-syl")) < Number(sylIndex));
    });
    root.classList.toggle("is-active", sylIndex != null && sylIndex >= 0);
  }

  function clearHeceActive(boardId) {
    var root = heceBoardRoot(boardId);
    if (!root) return;
    root.querySelectorAll(".is-on, .is-done").forEach(function (el) {
      el.classList.remove("is-on", "is-done");
    });
    root.classList.remove("is-active", "is-complete");
  }

  function markHeceComplete(boardId) {
    var root = heceBoardRoot(boardId);
    if (!root) return;
    root.querySelectorAll(".birles-hece-seg").forEach(function (el) {
      el.classList.remove("is-on");
      el.classList.add("is-done");
    });
    root.classList.add("is-complete");
    root.classList.remove("is-active");
  }

  async function playHeceSequence(displaySyls, audioSyls, token, boardId) {
    audioSyls = audioSyls || displaySyls;
    var vv = voice();
    for (var si = 0; si < displaySyls.length; si++) {
      if (token !== animToken) return false;
      setHeceActive(si, boardId);
      var tok = audioSyls[si] || displaySyls[si].toLocaleLowerCase("tr-TR");
      if (vv) await vv.playToken(tok, { waitUntilEnd: true });
      else await pace(700);
      await pace(160);
    }
    if (token !== animToken) return false;
    markHeceComplete(boardId);
    return true;
  }

  async function playWithHighlight(card, token) {
    var vv = voice();
    var root = card && (card.closest(".birles-cards") || card.closest(".birles-tray__row") || card.parentElement);
    clearCardStates(root);
    if (root) {
      root.querySelectorAll(".birles-card, .birles-tray-chip").forEach(function (c) {
        if (c !== card) c.classList.add("is-dim");
        else c.classList.add("is-waiting");
      });
    }
    setSpeaking(card, true);
    var ok = false;
    if (vv) ok = await vv.playToken(token, { waitUntilEnd: true });
    if (!ok) {
      setHint('"' + token + '" sesi için Admin → Birleştirelim’den Bunny URL ekle.');
      await pace(900);
    } else {
      setHint("");
      /* Ses bitti — kısa nefes; sabit kısa süre sesi kesmez */
      await pace(220);
    }
    setSpeaking(card, false);
    if (card) card.classList.remove("is-waiting");
    if (root) {
      root.querySelectorAll(".is-dim").forEach(function (c) {
        c.classList.remove("is-dim");
      });
    }
    return ok;
  }

  function bindTokenClicks(root) {
    var vv = voice();
    if (!root) return;
    root.querySelectorAll("[data-card], [data-tray]").forEach(function (c) {
      c.addEventListener("click", function () {
        if (vv) vv.playToken(c.getAttribute("data-card") || c.getAttribute("data-tray"));
      });
    });
  }

  function renderTray(tray, opts) {
    opts = opts || {};
    var trayEl = document.getElementById("birles-tray");
    if (!trayEl) return null;
    trayEl.classList.remove("is-lift", "is-merging", "is-final");
    if (!tray || !tray.length) {
      if (!opts.keepVisible) {
        trayEl.innerHTML = "";
        trayEl.classList.remove("is-visible");
      }
      return trayEl;
    }
    trayEl.classList.add("is-visible");
    var html =
      '<div class="birles-tray__label">' +
      (opts.label || "Heceler burada birleşecek") +
      '</div><div class="birles-tray__row">';
    tray.forEach(function (item, i) {
      if (i) html += '<span class="birles-tray__plus" aria-hidden="true">+</span>';
      html +=
        '<button type="button" class="birles-tray-chip' +
        (opts.flashIndex === i ? " is-arrive" : "") +
        (opts.speakIndex === i ? " is-speaking" : "") +
        '" data-tray="' +
        esc(item) +
        '"><span class="birles-tray-chip__txt">' +
        esc(item) +
        "</span></button>";
    });
    html += "</div>";
    trayEl.innerHTML = html;
    bindTokenClicks(trayEl);
    return trayEl;
  }

  /** Üst sahnede iki parçayı birleştir (sonuç sahnede kalır) */
  async function stageMerge(left, right, token) {
    var stage = document.getElementById("birles-stage");
    var vv = voice();
    if (!stage) return null;
    var hasRight = right != null && right !== "";

    /* Tek harfli hece (örn. eti → e): birleştirme animasyonu yok */
    if (!hasRight) {
      stage.classList.remove("is-merging", "is-quiet");
      stage.innerHTML =
        '<div class="birles-cards birles-cards--ready">' +
        cardHtml(left, String(left).length > 1 ? "chunk" : "letter") +
        "</div>";
      bindTokenClicks(stage);
      await pace(320);
      if (token !== animToken) return null;
      var solo = stage.querySelector(".birles-card");
      await playWithHighlight(solo, left);
      if (token !== animToken) return null;
      await pace(180);
      return String(left);
    }

    stage.classList.remove("is-merging", "is-quiet");
    stage.innerHTML =
      '<div class="birles-cards birles-cards--ready">' +
      cardHtml(left, String(left).length > 1 ? "chunk" : "letter") +
      '<span class="birles-plus" aria-hidden="true">+</span>' +
      cardHtml(right, String(right).length > 1 ? "chunk" : "letter") +
      "</div>";
    bindTokenClicks(stage);
    await pace(420);
    if (token !== animToken) return null;

    var cards = stage.querySelectorAll(".birles-card");
    await playWithHighlight(cards[0], left);
    if (token !== animToken) return null;
    await pace(260);
    if (cards[1]) {
      await playWithHighlight(cards[1], right);
      if (token !== animToken) return null;
      await pace(260);
    }

    clearCardStates(stage);
    stage.classList.add("is-merging");
    var wrap = stage.querySelector(".birles-cards");
    if (wrap) wrap.classList.add("is-merge");
    cards = stage.querySelectorAll(".birles-card");
    if (cards[0]) cards[0].classList.add("is-joining");
    if (cards[1]) cards[1].classList.add("is-joining");
    await pace(980);
    if (token !== animToken) return null;

    var merged = String(left) + String(right);
    stage.classList.remove("is-merging");
    stage.innerHTML =
      '<div class="birles-cards birles-cards--result">' + cardHtml(merged, "result") + "</div>";
    bindTokenClicks(stage);
    var resultCard = stage.querySelector(".birles-card");
    if (resultCard) resultCard.classList.add("is-merged", "is-speaking");
    await pace(160);
    if (vv) await vv.playToken(merged, { waitUntilEnd: true });
    await pace(280);
    if (resultCard) resultCard.classList.remove("is-speaking");
    await pace(200);
    return merged;
  }

  /** Sahnedeki sonucu aşağı rafa indir — yukarıya geri dönmez */
  async function dropToTray(tray, piece, token) {
    var stage = document.getElementById("birles-stage");
    if (!stage) return;
    var resultCard = stage.querySelector(".birles-card");
    if (resultCard) {
      resultCard.classList.add("is-fly-down");
      await pace(780);
    }
    if (token !== animToken) return;
    stage.innerHTML = "";
    stage.classList.add("is-quiet");
    tray.push(piece);
    renderTray(tray, { flashIndex: tray.length - 1 });
    await pace(480);
  }

  /** Sahnede tek harf/parça gösterip aşağı rafa bırak */
  async function sendPieceDown(tray, piece, token) {
    var stage = document.getElementById("birles-stage");
    var vv = voice();
    if (!stage) return;
    stage.classList.remove("is-quiet");
    stage.innerHTML =
      '<div class="birles-cards birles-cards--ready">' +
      cardHtml(piece, String(piece).length > 1 ? "chunk" : "letter") +
      "</div>";
    bindTokenClicks(stage);
    await pace(360);
    if (token !== animToken) return;
    var card = stage.querySelector(".birles-card");
    await playWithHighlight(card, piece);
    if (token !== animToken) return;
    await pace(220);
    if (card) card.classList.add("is-fly-down");
    await pace(780);
    if (token !== animToken) return;
    stage.innerHTML = "";
    stage.classList.add("is-quiet");
    tray.push(piece);
    renderTray(tray, { flashIndex: tray.length - 1 });
    await pace(420);
  }

  /** Rafta (altta) birleştir — asla yukarı çıkma */
  async function trayMerge(tray, token) {
    var vv = voice();
    var trayEl = document.getElementById("birles-tray");
    var stage = document.getElementById("birles-stage");
    if (!tray || !tray.length) return null;
    if (stage) {
      stage.innerHTML = "";
      stage.classList.add("is-quiet");
    }

    if (tray.length === 1) {
      renderTray(tray, { label: quietProcessNarr ? "Kelime" : "Sonuç" });
      var only = trayEl && trayEl.querySelector(".birles-tray-chip");
      if (only) only.classList.add("is-speaking", "is-final");
      if (vv) await vv.playToken(tray[0], { waitUntilEnd: true });
      await pace(280);
      return tray[0];
    }

    if (!quietProcessNarr) setNarr(tray.join(" + ") + " → birleşiyor!");
    renderTray(tray, { label: quietProcessNarr ? "Heceler" : "Şimdi altta birleştiriyoruz" });
    await pace(520);
    if (token !== animToken) return null;

    /* Sırayla raf parçalarını dinlet */
    var chips = trayEl ? trayEl.querySelectorAll(".birles-tray-chip") : [];
    for (var i = 0; i < chips.length; i++) {
      if (token !== animToken) return null;
      if (quietProcessNarr) setHeceActive(i, "birles-hece-board");
      await playWithHighlight(chips[i], tray[i]);
      await pace(240);
    }
    if (quietProcessNarr) markHeceComplete("birles-hece-board");

    if (trayEl) trayEl.classList.add("is-merging");
    renderTray(tray, { label: quietProcessNarr ? "Heceler" : "Birleşiyor…", merging: true });
    /* merging re-render wiped speaking — add join class via class on tray */
    trayEl = document.getElementById("birles-tray");
    if (trayEl) {
      trayEl.classList.add("is-merging");
      trayEl.querySelectorAll(".birles-tray-chip").forEach(function (c) {
        c.classList.add("is-join");
      });
      trayEl.querySelectorAll(".birles-tray__plus").forEach(function (p) {
        p.classList.add("is-fade");
      });
    }
    await pace(1100);
    if (token !== animToken) return null;

    var merged = tray.join("");
    if (trayEl) {
      trayEl.classList.remove("is-merging");
      trayEl.classList.add("is-final");
      trayEl.innerHTML =
        '<div class="birles-tray__label">Kelime hazır</div>' +
        '<div class="birles-tray__row birles-tray__row--final">' +
        '<button type="button" class="birles-tray-chip birles-tray-chip--word is-arrive is-speaking" data-tray="' +
        esc(merged) +
        '"><span class="birles-tray-chip__txt">' +
        esc(merged) +
        "</span></button></div>";
      bindTokenClicks(trayEl);
    }
    await pace(200);
    if (vv) await vv.playToken(merged, { waitUntilEnd: true });
    await pace(280);
    var wordChip = trayEl && trayEl.querySelector(".birles-tray-chip");
    if (wordChip) wordChip.classList.remove("is-speaking");
    await pace(220);
    return merged;
  }

  async function runSentenceAnimation(sound, fusion, token) {
    var vv = voice();
    var stage = document.getElementById("birles-stage");
    var bar = document.getElementById("birles-sentence-bar");
    var words = fusion.words || [];
    if (!stage || !words.length) return;

    function wordEl(i) {
      return bar && bar.querySelector('.birles-sentence-word[data-word-i="' + i + '"]');
    }

    function setStep(i) {
      var stepEl = document.getElementById("birles-sentence-step");
      if (stepEl) {
        stepEl.textContent = i < words.length ? i + 1 + " / " + words.length : "Tamam";
      }
    }

    /** Üst cümle hep okunur; yalnızca odak / okundu işaretleri */
    function setFocus(i) {
      if (!bar) return;
      setStep(i);
      bar.querySelectorAll(".birles-sentence-word").forEach(function (el, idx) {
        el.classList.remove("is-focus");
        if (idx === i) el.classList.add("is-focus");
      });
    }

    function clearFocus() {
      if (!bar) return;
      bar.querySelectorAll(".birles-sentence-word").forEach(function (el) {
        el.classList.remove("is-focus");
      });
    }

    function resetSentenceWords() {
      if (!bar) return;
      bar.classList.remove("is-reading-pass", "is-intro");
      bar.querySelectorAll(".birles-sentence-word").forEach(function (el) {
        el.classList.remove("is-focus", "is-read", "is-pop", "is-speaking-now");
      });
      setStep(0);
    }

    function markRead(i) {
      var el = wordEl(i);
      if (!el) return;
      el.classList.remove("is-focus");
      el.classList.add("is-read");
      el.classList.add("is-pop");
      window.setTimeout(function () {
        el.classList.remove("is-pop");
      }, 420);
    }

    function stagePanel(cap, cardsHtml, extraCardsClass) {
      return (
        '<div class="birles-drop-zone birles-drop-zone--cumle">' +
        '<p class="birles-drop-zone__cap">' +
        esc(cap) +
        "</p>" +
        '<div class="birles-cards birles-cards--ready' +
        (extraCardsClass ? " " + extraCardsClass : "") +
        '">' +
        cardsHtml +
        "</div></div>"
      );
    }

    /** Kelime sahnede düşer — üstteki yazı yerinde kalır */
    async function dropWordFromSentence(i, word) {
      setFocus(i);
      setNarr(word.text);
      stage.classList.remove("is-quiet");
      stage.innerHTML = stagePanel(
        "Aşağı iniyor",
        cardHtml(word.text, "result"),
        "birles-cards--drop-in birles-cards--cumle-hero"
      );
      bindTokenClicks(stage);
      await pace(620);
      return token === animToken;
    }

    /** Hemen hecelere ayır ve oku — üst kelime ile eşzamanlı vurgu */
    async function splitAndReadSyllables(word, displaySyls, audioSyls) {
      audioSyls = audioSyls || displaySyls;
      setNarr(displaySyls.join("  ·  "));
      stage.innerHTML =
        heceBoardHtml(word.text, displaySyls, {
          id: "birles-hece-board-cumle",
          kicker: "Kelime heceleme",
          spotlight: true
        });
      await pace(360);
      if (token !== animToken) return false;

      if (!(await playHeceSequence(displaySyls, audioSyls, token, "birles-hece-board-cumle"))) {
        return false;
      }
      return token === animToken;
    }

    /** Heceleri birleştir */
    async function mergeSyllablesToWord(word, displaySyls) {
      setNarr(displaySyls.join(" + ") + " → " + word.text);
      var wrap = stage.querySelector(".birles-cards");
      if (wrap) wrap.classList.add("is-merge");
      stage.classList.add("is-merging");
      await pace(760);
      if (token !== animToken) return false;

      stage.classList.remove("is-merging");
      stage.innerHTML = stagePanel(
        "Birleşti",
        cardHtml(word.text, "result"),
        "birles-cards--result birles-cards--cumle-hero"
      );
      bindTokenClicks(stage);
      var resultCard = stage.querySelector(".birles-card");
      if (resultCard) resultCard.classList.add("is-merged", "is-speaking");
      await pace(140);
      if (vv) await vv.playToken(word.say, { waitUntilEnd: true });
      await pace(220);
      if (resultCard) resultCard.classList.remove("is-speaking");
      return token === animToken;
    }

    /** Birleşen kelime yukarı, cümledeki yerine döner */
    async function returnWordToSentence(i, word) {
      setNarr(word.text + " yerine dönüyor");
      var wrap = stage.querySelector(".birles-cards");
      if (wrap) {
        wrap.classList.remove("birles-cards--drop-in", "birles-cards--split", "is-merge");
        wrap.classList.add("birles-cards--return-up");
      }
      await pace(560);
      if (token !== animToken) return false;
      markRead(i);
      stage.innerHTML = "";
      stage.classList.add("is-quiet");
      renderTray([]);
      await pace(200);
      return token === animToken;
    }

    /* 1) Cümlenin tamamı üstte — tekrar dinle’de tikler sıfırlanır */
    resetSentenceWords();
    renderTray([]);
    stage.classList.add("is-quiet");
    stage.innerHTML = "";
    setNarr(fusion.result);
    if (bar) bar.classList.add("is-intro");
    await pace(820);
    if (bar) bar.classList.remove("is-intro");
    if (token !== animToken) return;

    for (var wi = 0; wi < words.length; wi++) {
      if (token !== animToken) return;
      var word = words[wi];
      var syls =
        word.displaySyllables && word.displaySyllables.length
          ? word.displaySyllables.slice()
          : word.syllables && word.syllables.length
            ? word.syllables.slice()
            : [word.text || word.say];
      var audioSyls = word.syllables && word.syllables.length ? word.syllables.slice() : [word.say];

      if (!(await dropWordFromSentence(wi, word))) return;

      if (syls.length === 1) {
        setNarr(word.text);
        var solo = stage.querySelector(".birles-card");
        /* Tek hece: diğer kelimeler gibi yeşil vurgu (turuncu is-speaking değil) */
        if (solo) solo.classList.add("is-merged", "birles-card--cumle-solo");
        await playWithHighlight(solo, word.say);
        if (token !== animToken) return;
      } else {
        if (!(await splitAndReadSyllables(word, syls, audioSyls))) return;
        if (!(await mergeSyllablesToWord(word, syls))) return;
      }

      if (!(await returnWordToSentence(wi, word))) return;
    }

    if (token !== animToken) return;
    clearFocus();
    setStep(words.length);
    setNarr(fusion.result);
    stage.classList.remove("is-quiet");
    stage.innerHTML = stagePanel(
      "Cümleyi okuyalım",
      sentenceResultCardHtml(words),
      "birles-cards--result birles-cards--cumle-hero birles-cards--drop-in"
    );
    var finalCard = stage.querySelector(".birles-card");
    if (finalCard) finalCard.classList.add("is-merged", "is-speaking");
    if (bar) bar.classList.add("is-reading-pass");

    for (var rj = 0; rj < words.length; rj++) {
      if (token !== animToken) return;
      if (bar) {
        bar.querySelectorAll(".birles-sentence-word").forEach(function (el, idx) {
          el.classList.toggle("is-speaking-now", idx === rj);
          el.classList.remove("is-focus");
        });
      }
      if (finalCard) {
        finalCard.querySelectorAll(".birles-cumle-result-word").forEach(function (el, idx) {
          el.classList.toggle("is-on", idx === rj);
          el.classList.toggle("is-done", idx < rj);
        });
      }
      setStep(rj);
      setNarr(words[rj].text);
      if (vv) await vv.playToken(words[rj].say, { waitUntilEnd: true });
      await pace(140);
      var spoken = wordEl(rj);
      if (spoken) spoken.classList.remove("is-speaking-now");
      markRead(rj);
      if (finalCard) {
        var rw = finalCard.querySelector('.birles-cumle-result-word[data-rw="' + rj + '"]');
        if (rw) {
          rw.classList.remove("is-on");
          rw.classList.add("is-done");
        }
      }
    }
    if (bar) bar.classList.remove("is-reading-pass");
    clearFocus();
    if (finalCard) {
      finalCard.classList.remove("is-speaking");
      finalCard.querySelectorAll(".birles-cumle-result-word").forEach(function (el) {
        el.classList.remove("is-on");
        el.classList.add("is-done");
      });
    }
  }

  async function runFusionAnimation(sound, fusion) {
    var token = ++animToken;
    if (activeLane) setLaneNextEnabled(false);
    var vv = voice();
    var stage = document.getElementById("birles-stage");
    var reveal = document.getElementById("birles-reveal");
    if (!stage) return;
    if (reveal) reveal.hidden = true;
    var isKelime =
      fusion.kind === "kelime" ||
      fusion.type === "kelime" ||
      (!!fusion.mediaKey && fusion.kind !== "cumle" && fusion.mode !== "sentence");
    quietProcessNarr = !!isKelime;
    if (!isKelime) setNarr(fusion.narration || "");
    setHint("");
    renderTray([]);
    stage.classList.remove("is-quiet", "is-finale", "is-finale-fade");
    var trayEl0 = document.getElementById("birles-tray");
    if (trayEl0) trayEl0.classList.remove("is-finale", "is-finale-fade");
    if (vv) vv.stop();

    if (fusion.mode === "sentence" || fusion.kind === "cumle") {
      quietProcessNarr = false;
      await runSentenceAnimation(sound, fusion, token);
      if (token !== animToken) return;
      /* Dönüt metni yok — sadece ses */
      if (reveal) reveal.hidden = true;
      setNarrForce("");
      await pace(320);
      if (token === animToken && activeLane) setLaneNextEnabled(true);
      return;
    }

    var tray = [];
    var mode = fusion.mode || (fusion.syllables && fusion.syllables.length > 1 ? "syllables" : "simple");
    var finalWord = fusion.result;

    if (mode === "syllables" && fusion.syllables && fusion.syllables.length) {
      for (var i = 0; i < fusion.syllables.length; i++) {
        if (token !== animToken) return;
        setHeceActive(i, "birles-hece-board");
        var syl = fusion.syllables[i] || [];
        var left = syl[0];
        var right = syl.length > 1 ? syl[1] : null;
        if (!isKelime) {
          if (right != null && right !== "") setNarr(left + " + " + right + " → …");
          else setNarr(left + " geliyor…");
        }
        var mergedSyl = await stageMerge(left, right, token);
        if (token !== animToken || mergedSyl == null) return;
        if (!isKelime) setNarr(mergedSyl + " hecesi aşağı iniyor");
        await dropToTray(tray, mergedSyl, token);
        if (token !== animToken) return;
      }
      if (isKelime) markHeceComplete("birles-hece-board");
      finalWord = await trayMerge(tray, token);
      if (token !== animToken || finalWord == null) return;
    } else if (mode === "chain" && fusion.steps && fusion.steps.length > 1) {
      var first = fusion.steps[0];
      if (!isKelime) setNarr(first[0] + " + " + first[1] + " → …");
      var firstMerged = await stageMerge(first[0], first[1], token);
      if (token !== animToken || firstMerged == null) return;
      if (!isKelime) setNarr(firstMerged + " aşağı iniyor");
      await dropToTray(tray, firstMerged, token);
      if (token !== animToken) return;

      for (var si = 1; si < fusion.steps.length; si++) {
        if (token !== animToken) return;
        var step = fusion.steps[si];
        var nextPiece = step[1] != null ? step[1] : step[0];
        if (!isKelime) setNarr("Şimdi " + nextPiece + " geliyor");
        await sendPieceDown(tray, nextPiece, token);
        if (token !== animToken) return;
      }
      finalWord = await trayMerge(tray, token);
      if (token !== animToken || finalWord == null) return;
    } else {
      var steps = fusion.steps && fusion.steps.length ? fusion.steps : [fusion.parts.slice()];
      var pair = steps[0] || fusion.parts || [fusion.result];
      finalWord = await stageMerge(pair[0], pair[1], token);
      if (token !== animToken || finalWord == null) return;
      if (stage.querySelector(".birles-card")) {
        stage.querySelector(".birles-card").classList.add("birles-card--final", "is-merged");
      }
    }

    if (token !== animToken) return;

    var poolEl = document.getElementById("birles-pool");
    if (poolEl) {
      var soundKey = fusion.mediaKey || fusion.say || fusion.result;
      await playPoolFinale(finalWord || fusion.result, soundKey, vv, token);
      if (token !== animToken) return;
    } else {
      quietProcessNarr = false;
      setNarrForce("");
      await pace(120);
      if (vv) await vv.playToken(fusion.mediaKey || fusion.say || fusion.result, { waitUntilEnd: true });
    }

    /* Dönüt metni yok; görsel varsa yalnız görseli göster */
    if (reveal) {
      var revealImg = document.getElementById("birles-reveal-img");
      var hasRevealImg = !!(revealImg && revealImg.getAttribute("src"));
      if (hasRevealImg) {
        reveal.hidden = false;
        reveal.classList.remove("birles-reveal--msgonly");
        reveal.classList.remove("is-pop");
        void reveal.offsetWidth;
        reveal.classList.add("is-pop");
        var wordReveal = document.getElementById("birles-reveal-word");
        if (wordReveal) {
          wordReveal.textContent = "";
          wordReveal.hidden = true;
        }
        var msg = document.getElementById("birles-reveal-msg");
        if (msg) msg.textContent = "";
      } else {
        reveal.hidden = true;
      }
    }
    quietProcessNarr = false;
    setNarrForce("");
    await pace(160);
    if (token === animToken && activeLane) setLaneNextEnabled(true);
  }

  /** Eski Kaptan listesi SESLER satırı — kalıntı temizliği */
  function purgeLegacyEntryButtons(root) {
    var scope = root || document;
    try {
      scope.querySelectorAll("[data-birlestirelim-entry]").forEach(function (el) {
        el.remove();
      });
    } catch (_) {}
  }

  document.addEventListener("keydown", function (e) {
    if (!overlay || !overlay.classList.contains("open")) return;
    if (e.key === "Escape") {
      if (view === "groups") close();
      else goBack();
    }
  });

  purgeLegacyEntryButtons(document);

  window.novaOpenBirlestirelim = openGroups;
  window.novaCloseBirlestirelim = close;
  window.novaBirlestirelimInjectEntry = purgeLegacyEntryButtons;
  window.novaBirlestirelimRefreshEntry = function () {
    purgeLegacyEntryButtons(document.getElementById("roborox-topics-list") || document);
  };
  window.novaIsBirlestirelimGrade1 = isGrade1;
})();
