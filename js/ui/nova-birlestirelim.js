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
  var mediaMap = {};
  var letterMap = {};
  var animToken = 0;
  var reducedMotion = false;
  var mediaReady = null;

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
      return false;
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

  function setHeader(title, sub, eye) {
    var t = document.getElementById("birles-title");
    var s = document.getElementById("birles-sub");
    var e = document.getElementById("birles-eyebrow");
    if (t) t.textContent = title || "BİRLEŞTİRELİM";
    if (s) s.textContent = sub || "";
    if (e) e.textContent = eye || "Maarif Modeli";
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

  function openHub(groupId) {
    /* Geriye uyumluluk: groupId varsa harf listesi, yoksa grup seçim ekranı */
    if (groupId) {
      openLetters(groupId);
      return;
    }
    openGroups();
  }

  function openGroups() {
    ensureOverlay();
    reducedMotion = preferReduced();
    view = "groups";
    activeSound = null;
    activeFusion = null;
    activeGroupId = "";
    closeHowToVideo();
    overlay.hidden = false;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("birles-lock");
    setBack(false);
    setHeader("BİRLEŞTİRELİM", "Önce bir ses grubu seç", "Maarif Modeli");
    renderGroups();
    var vv = voice();
    if (vv) vv.unlock();
    mediaReady = null;
    ensureMedia();
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
    setHeader(
      (group && group.title) || "Ses grubu",
      (group && group.subtitle) || "Bir harf seç",
      "Harfleri seç · dinle · birleştir"
    );
    renderLetters();
    var vv = voice();
    if (vv) vv.unlock();
    if (!mediaReady) ensureMedia();
  }

  function close() {
    animToken += 1;
    var vv = voice();
    if (vv) vv.stop();
    closeHowToVideo();
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.hidden = true;
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
    if (view === "play") {
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
      '  <div class="birles-confetti" aria-hidden="true"></div>' +
      '  <div class="birles-hero-card">' +
      '    <div class="birles-hero-mark" aria-hidden="true">' +
      '      <svg viewBox="0 0 64 64" width="58" height="58">' +
      '        <defs><linearGradient id="birlesGrad" x1="0" y1="0" x2="1" y2="1">' +
      '          <stop offset="0%" stop-color="#ff7a59"/><stop offset="50%" stop-color="#ffd166"/><stop offset="100%" stop-color="#06d6a0"/>' +
      "        </linearGradient></defs>" +
      '        <rect x="4" y="8" width="24" height="30" rx="8" fill="url(#birlesGrad)"/>' +
      '        <rect x="36" y="20" width="24" height="30" rx="8" fill="#4cc9f0"/>' +
      '        <path d="M28 22h8M28 40h8" stroke="#1d3557" stroke-width="3.5" stroke-linecap="round"/>' +
      '        <circle cx="32" cy="31" r="6" fill="#1d3557"/>' +
      '        <circle cx="32" cy="31" r="2.5" fill="#ffd166"/>' +
      "      </svg>" +
      "    </div>" +
      '    <div class="birles-hero-copy">' +
      "      <strong>Ses gruplarına hoş geldin!</strong>" +
      "      <span>Maarif Modeli’ne göre sırayla ilerle. Önce grubunu seç, sonra harfini seç.</span>" +
      "    </div>" +
      "  </div>" +
      '  <p class="birles-path-label">5 ses grubu · dokun ve başla</p>' +
      '  <div class="birles-group-grid" role="list">';

    groups.forEach(function (g, idx) {
      var letters = ((g.sounds || []).map(function (s) {
        return s.displayUpper || s.letter;
      }).join(" · "));
      var fusionN = countFusions(g);
      html +=
        '<button type="button" class="birles-group-card" role="listitem" data-group="' +
        esc(g.id) +
        '" style="--delay:' +
        idx * 0.06 +
        "s;--chip:" +
        esc((g.sounds && g.sounds[0] && g.sounds[0].color) || "#06d6a0") +
        '">' +
        '<span class="birles-group-card__badge">' +
        esc(String(g.order || idx + 1)) +
        ". grup</span>" +
        '<span class="birles-group-card__title">' +
        esc(g.title) +
        "</span>" +
        '<span class="birles-group-card__letters">' +
        esc(letters) +
        "</span>" +
        '<span class="birles-group-card__meta">' +
        ((g.sounds && g.sounds.length) || 0) +
        " harf · " +
        fusionN +
        " çalışma" +
        "</span>" +
        '<span class="birles-group-card__go">Başla →</span>' +
        "</button>";
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

    var html =
      '<div class="birles-hub birles-hub--letters">' +
      '  <div class="birles-confetti" aria-hidden="true"></div>' +
      '  <div class="birles-group-banner" style="--chip:' +
      esc((sounds[0] && sounds[0].color) || "#06d6a0") +
      '">' +
      '    <div class="birles-group-banner__text">' +
      "      <strong>" +
      esc(group.title) +
      "</strong>" +
      "      <span>" +
      esc(group.subtitle || "") +
      "</span>" +
      "    </div>" +
      '    <button type="button" class="birles-izle-btn birles-izle-btn--tiny" data-back-groups="1">Gruplar</button>' +
      "  </div>" +
      '  <p class="birles-path-label">Harfi seç · İzle · birleştir</p>' +
      '  <div class="birles-sound-rail" role="list">';

    sounds.forEach(function (s, idx) {
      var hasVideo = !!howToVideoUrl(s);
      var workN = (s.fusions || []).length;
      html +=
        '<div class="birles-sound-chip-wrap" role="listitem" style="--chip:' +
        esc(s.color) +
        ";--glow:" +
        esc(s.glow) +
        ";--delay:" +
        idx * 0.05 +
        's">' +
        '<button type="button" class="birles-sound-chip" data-sound="' +
        esc(s.id) +
        '">' +
        '<span class="birles-sound-chip__ord">' +
        (idx + 1) +
        "</span>" +
        '<span class="birles-sound-chip__letter">' +
        esc(s.displayUpper) +
        "<small>" +
        esc(s.displayLower) +
        "</small></span>" +
        '<span class="birles-sound-chip__title">' +
        esc(s.title) +
        "</span>" +
        '<span class="birles-sound-chip__hint">' +
        esc(s.hint || "") +
        " · " +
        workN +
        " çalışma</span>" +
        "</button>" +
        '<button type="button" class="birles-izle-btn' +
        (hasVideo ? "" : " is-empty") +
        '" data-izle="' +
        esc(s.id) +
        '" title="Nasıl yapılır videosu">' +
        '<span class="birles-izle-btn__ico" aria-hidden="true">▶</span>' +
        "<span>İzle</span>" +
        "</button>" +
        "</div>";
    });

    html += "</div></div>";
    body.innerHTML = html;

    var backG = body.querySelector("[data-back-groups]");
    if (backG) {
      backG.addEventListener("click", function () {
        openGroups();
      });
    }
    body.querySelectorAll("[data-sound]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openSound(btn.getAttribute("data-sound"));
      });
    });
    body.querySelectorAll("[data-izle]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var sid = btn.getAttribute("data-izle");
        var snd = DD && DD.getSound ? DD.getSound(sid) : null;
        ensureMedia().then(function () {
          openHowToVideo(snd);
        });
      });
    });
  }

  /* Eski ad */
  function renderHub() {
    if (view === "groups") renderGroups();
    else renderLetters();
  }

  function openSound(soundId) {
    var DD = data();
    var sound = DD && DD.getSound ? DD.getSound(soundId) : null;
    if (!sound) return;
    view = "sound";
    activeSound = sound;
    activeFusion = null;
    if (sound.groupId) activeGroupId = sound.groupId;
    closeHowToVideo();
    setBack(true);
    var group = DD.getGroup ? DD.getGroup(sound.groupId || activeGroupId) : null;
    setHeader(sound.title, "Küçük kutulardan birleştir!", (group && group.title) || "Ses grubu");
    ensureMedia().then(function () {
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

  function fusionCardHtml(f) {
    var kind = String(f.kind || f.type || "hece").toLowerCase();
    var isWord = kind === "kelime" || !!f.mediaKey;
    var isSes = kind === "ses" || f.type === "intro";
    var med = f.mediaKey ? mediaFor(f.mediaKey) : null;
    var thumb;
    if (med && med.imageUrl) {
      thumb =
        '<img class="birles-fusion-card__img" src="' +
        esc(med.imageUrl) +
        '" alt="" loading="lazy" />';
    } else if (isSes) {
      thumb = '<span class="birles-fusion-card__badge">SES</span>';
    } else if (isWord) {
      thumb = '<span class="birles-fusion-card__badge">KELİME</span>';
    } else {
      thumb = '<span class="birles-fusion-card__badge">HECE</span>';
    }
    return (
      '<button type="button" class="birles-fusion-card birles-fusion-card--' +
      esc(isWord ? "word" : isSes ? "ses" : "hece") +
      '" data-fusion="' +
      esc(f.id) +
      '">' +
      '<span class="birles-fusion-card__media">' +
      thumb +
      "</span>" +
      '<span class="birles-fusion-card__result">' +
      esc(f.result) +
      audioMissBadge(f.result) +
      "</span>" +
      '<span class="birles-fusion-card__label">' +
      esc(f.label) +
      "</span>" +
      "</button>"
    );
  }

  function renderSound(sound) {
    var body = document.getElementById("birles-body");
    if (!body) return;
    var hasVideo = !!howToVideoUrl(sound);
    var ses = [];
    var hece = [];
    var kelime = [];
    (sound.fusions || []).forEach(function (f) {
      var kind = String(f.kind || f.type || "hece").toLowerCase();
      if (kind === "ses" || f.type === "intro") ses.push(f);
      else if (kind === "kelime" || f.mediaKey) kelime.push(f);
      else hece.push(f);
    });

    var html =
      '<div class="birles-sound-view">' +
      '  <div class="birles-sound-hero">' +
      '    <button type="button" class="birles-listen-main" data-listen-letter="' +
      esc(sound.letter) +
      '" style="--chip:' +
      esc(sound.color) +
      '">' +
      '      <span class="birles-listen-main__ring" aria-hidden="true"></span>' +
      '      <span class="birles-listen-main__letter">' +
      esc(sound.displayUpper) +
      "</span>" +
      '      <span class="birles-listen-main__cap">Dokun · sesi dinle</span>' +
      "    </button>" +
      '    <button type="button" class="birles-izle-btn birles-izle-btn--hero' +
      (hasVideo ? "" : " is-empty") +
      '" data-izle="' +
      esc(sound.id) +
      '">' +
      '      <span class="birles-izle-btn__ico" aria-hidden="true">▶</span>' +
      "      <span>İzle</span>" +
      "      <small>nasıl yapılır</small>" +
      "    </button>" +
      "  </div>";

    function section(title, list, extraClass) {
      if (!list.length) return;
      html +=
        '<p class="birles-path-label">' +
        esc(title) +
        " · " +
        list.length +
        "</p>" +
        '<div class="birles-fusion-grid' +
        (extraClass ? " " + extraClass : "") +
        '">';
      list.forEach(function (f) {
        html += fusionCardHtml(f);
      });
      html += "</div>";
    }

    section("Ses tanıma", ses, "birles-fusion-grid--ses");
    section("Heceler", hece, "birles-fusion-grid--hece");
    section("Kelimeler", kelime, "birles-fusion-grid--word");

    html += "</div>";
    body.innerHTML = html;
    body.querySelector("[data-listen-letter]").addEventListener("click", function () {
      var vv = voice();
      if (vv) vv.playToken(sound.letter);
    });
    var izle = body.querySelector("[data-izle]");
    if (izle) {
      izle.addEventListener("click", function (e) {
        e.preventDefault();
        ensureMedia().then(function () {
          openHowToVideo(sound);
        });
      });
    }
    body.querySelectorAll("[data-fusion]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startFusion(sound.id, btn.getAttribute("data-fusion"));
      });
    });
  }

  function startFusion(soundId, fusionId) {
    var DD = data();
    var sound = DD.getSound(soundId);
    var fusion = DD.getFusion(soundId, fusionId);
    if (!sound || !fusion) return;
    view = "play";
    activeSound = sound;
    activeFusion = fusion;
    setBack(true);
    setHeader(fusion.result, fusion.label, sound.title.toUpperCase());
    renderPlayStage(sound, fusion);
    ensureMedia().then(function () {
      runFusionAnimation(sound, fusion);
    });
  }

  function renderPlayStage(sound, fusion) {
    var body = document.getElementById("birles-body");
    if (!body) return;
    var med = fusion.mediaKey ? mediaFor(fusion.mediaKey) : null;
    var hasImg = !!(med && med.imageUrl);
    body.innerHTML =
      '<div class="birles-play" style="--chip:' +
      esc(sound.color) +
      ";--glow:" +
      esc(sound.glow) +
      '">' +
      '  <p class="birles-play__narration" id="birles-narration">' +
      esc(fusion.narration || "") +
      "</p>" +
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
      '    <strong id="birles-reveal-word">' +
      esc(fusion.result) +
      "</strong>" +
      '    <span id="birles-reveal-msg"></span>' +
      "  </div>" +
      '  <div class="birles-play-actions">' +
      '    <button type="button" class="birles-btn birles-btn--ghost" id="birles-replay">Tekrar dinle</button>' +
      '    <button type="button" class="birles-btn" id="birles-next">Başka birleştirme</button>' +
      "  </div>" +
      "</div>";

    document.getElementById("birles-replay").addEventListener("click", function () {
      runFusionAnimation(sound, fusion);
    });
    document.getElementById("birles-next").addEventListener("click", function () {
      openSound(sound.id);
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
    var narr = document.getElementById("birles-narration");
    if (narr && text) narr.textContent = text;
  }

  function pace(ms) {
    return wait(reducedMotion ? Math.min(ms, 160) : ms);
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
        '"><span>' +
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
    stage.classList.remove("is-merging", "is-quiet");
    stage.innerHTML =
      '<div class="birles-cards birles-cards--ready">' +
      cardHtml(left, String(left).length > 1 ? "chunk" : "letter") +
      (right != null && right !== ""
        ? '<span class="birles-plus" aria-hidden="true">+</span>' +
          cardHtml(right, String(right).length > 1 ? "chunk" : "letter")
        : "") +
      "</div>";
    bindTokenClicks(stage);
    await pace(420);
    if (token !== animToken) return null;

    var cards = stage.querySelectorAll(".birles-card");
    await playWithHighlight(cards[0], left);
    if (token !== animToken) return null;
    await pace(260);
    if (right != null && right !== "" && cards[1]) {
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
    if (right != null && right !== "" && cards[1]) cards[1].classList.add("is-joining");
    await pace(980);
    if (token !== animToken) return null;

    var merged = right != null && right !== "" ? String(left) + String(right) : String(left);
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
      renderTray(tray, { label: "Sonuç" });
      var only = trayEl && trayEl.querySelector(".birles-tray-chip");
      if (only) only.classList.add("is-speaking", "is-final");
      if (vv) await vv.playToken(tray[0], { waitUntilEnd: true });
      await pace(280);
      return tray[0];
    }

    setNarr(tray.join(" + ") + " → birleşiyor!");
    renderTray(tray, { label: "Şimdi altta birleştiriyoruz" });
    await pace(520);
    if (token !== animToken) return null;

    /* Sırayla raf parçalarını dinlet */
    var chips = trayEl ? trayEl.querySelectorAll(".birles-tray-chip") : [];
    for (var i = 0; i < chips.length; i++) {
      if (token !== animToken) return null;
      await playWithHighlight(chips[i], tray[i]);
      await pace(240);
    }

    if (trayEl) trayEl.classList.add("is-merging");
    renderTray(tray, { label: "Birleşiyor…", merging: true });
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
        '"><span>' +
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

  async function runFusionAnimation(sound, fusion) {
    var token = ++animToken;
    var vv = voice();
    var stage = document.getElementById("birles-stage");
    var reveal = document.getElementById("birles-reveal");
    if (!stage) return;
    if (reveal) reveal.hidden = true;
    setNarr(fusion.narration || "");
    setHint("");
    renderTray([]);
    stage.classList.remove("is-quiet");
    if (vv) vv.stop();

    var tray = [];
    var mode = fusion.mode || (fusion.syllables && fusion.syllables.length > 1 ? "syllables" : "simple");
    var finalWord = fusion.result;

    if (mode === "syllables" && fusion.syllables && fusion.syllables.length) {
      for (var i = 0; i < fusion.syllables.length; i++) {
        if (token !== animToken) return;
        var syl = fusion.syllables[i];
        setNarr(syl[0] + " + " + syl[1] + " → …");
        var mergedSyl = await stageMerge(syl[0], syl[1], token);
        if (token !== animToken || mergedSyl == null) return;
        setNarr(mergedSyl + " hecesi aşağı iniyor");
        await dropToTray(tray, mergedSyl, token);
        if (token !== animToken) return;
      }
      finalWord = await trayMerge(tray, token);
      if (token !== animToken || finalWord == null) return;
    } else if (mode === "chain" && fusion.steps && fusion.steps.length > 1) {
      /* Örn ala: a+l → al (aşağı) ; a aşağı ; altta al+a → ala */
      var first = fusion.steps[0];
      setNarr(first[0] + " + " + first[1] + " → …");
      var firstMerged = await stageMerge(first[0], first[1], token);
      if (token !== animToken || firstMerged == null) return;
      setNarr(firstMerged + " aşağı iniyor");
      await dropToTray(tray, firstMerged, token);
      if (token !== animToken) return;

      for (var si = 1; si < fusion.steps.length; si++) {
        if (token !== animToken) return;
        var step = fusion.steps[si];
        var nextPiece = step[1] != null ? step[1] : step[0];
        /* Zincir: soldaki tepside, sağdaki yeni parça yukarıda okunup alta iner */
        setNarr("Şimdi " + nextPiece + " geliyor");
        await sendPieceDown(tray, nextPiece, token);
        if (token !== animToken) return;
      }
      finalWord = await trayMerge(tray, token);
      if (token !== animToken || finalWord == null) return;
    } else {
      /* Tek adım: yalnızca sahnede */
      var steps = fusion.steps && fusion.steps.length ? fusion.steps : [fusion.parts.slice()];
      var pair = steps[0] || fusion.parts || [fusion.result];
      finalWord = await stageMerge(pair[0], pair[1], token);
      if (token !== animToken || finalWord == null) return;
      if (stage.querySelector(".birles-card")) {
        stage.querySelector(".birles-card").classList.add("birles-card--final", "is-merged");
      }
    }

    if (token !== animToken) return;

    if (reveal) {
      reveal.hidden = false;
      reveal.classList.remove("is-pop");
      void reveal.offsetWidth;
      reveal.classList.add("is-pop");
      var msg = document.getElementById("birles-reveal-msg");
      if (msg) msg.textContent = fusion.celebrate || "Harika!";
    }
    setNarr(fusion.celebrate || finalWord);
    await pace(220);
    if (vv) await vv.playToken(fusion.mediaKey || fusion.result, { waitUntilEnd: true });
    await pace(320);
  }

  /** Kaptan Kabuk listesine özel giriş kartı */
  function injectEntryButton(listEl) {
    if (!listEl || !isGrade1()) return null;
    if (listEl.querySelector("[data-birlestirelim-entry]")) return listEl.querySelector("[data-birlestirelim-entry]");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "roborox-topic-item birles-entry";
    btn.setAttribute("data-birlestirelim-entry", "1");
    btn.innerHTML =
      '<span class="birles-entry__ico" aria-hidden="true">' +
      '<svg viewBox="0 0 64 64" width="36" height="36">' +
      '<defs><linearGradient id="beG" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#ff8a5c"/><stop offset="100%" stop-color="#2ec4b6"/>' +
      "</linearGradient></defs>" +
      '<rect x="6" y="12" width="20" height="26" rx="6" fill="url(#beG)"/>' +
      '<rect x="38" y="22" width="20" height="26" rx="6" fill="#ffd166"/>' +
      '<path d="M26 25h12M26 39h12" stroke="#16324f" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="32" cy="32" r="4.5" fill="#16324f"/>' +
      "</svg></span>" +
      '<span class="roborox-topic-item__body">' +
      '<span class="roborox-topic-item__title">BİRLEŞTİRELİM</span>' +
      '<span class="roborox-topic-item__meta">5 ses grubu · hece &amp; kelime</span>' +
      "</span>" +
      '<span class="birles-entry__go" aria-hidden="true">✦</span>';
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openHub();
    });
    listEl.insertBefore(btn, listEl.firstChild);
    return btn;
  }

  function refreshEntryInOpenModal() {
    var list = document.getElementById("roborox-topics-list");
    if (!list) return;
    var modal = document.getElementById("roborox-topics-modal");
    if (!modal || !modal.classList.contains("open")) return;
    if (!isGrade1()) {
      var old = list.querySelector("[data-birlestirelim-entry]");
      if (old) old.remove();
      return;
    }
    injectEntryButton(list);
  }

  document.addEventListener("keydown", function (e) {
    if (!overlay || !overlay.classList.contains("open")) return;
    if (e.key === "Escape") {
      if (view === "groups") close();
      else goBack();
    }
  });

  window.novaOpenBirlestirelim = openGroups;
  window.novaCloseBirlestirelim = close;
  window.novaBirlestirelimInjectEntry = injectEntryButton;
  window.novaBirlestirelimRefreshEntry = refreshEntryInOpenModal;
  window.novaIsBirlestirelimGrade1 = isGrade1;
})();
