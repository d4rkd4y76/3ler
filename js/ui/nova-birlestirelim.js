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
    var isCumle = kind === "cumle" || f.mode === "sentence";
    var isWord = !isCumle && (kind === "kelime" || !!f.mediaKey);
    var isSes = kind === "ses" || f.type === "intro";
    var med = isWord && f.mediaKey ? mediaFor(f.mediaKey) : null;
    var hasImg = !!(med && med.imageUrl);
    var badge = isSes ? "SES" : isCumle ? "CÜMLE" : isWord ? "KELİME" : "HECE";
    var cardClass = isCumle ? "cumle" : isWord ? "word" : isSes ? "ses" : "hece";
    var mediaInner;

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
      '">' +
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
      '<span class="birles-fusion-card__label">' +
      esc(f.label) +
      "</span>" +
      "</span>" +
      "</button>"
    );
  }

  function renderSound(sound) {
    var body = document.getElementById("birles-body");
    if (!body) return;
    var hasVideo = !!howToVideoUrl(sound);
    var hece = [];
    var kelime = [];
    var cumle = [];
    var metin = [];
    (sound.fusions || []).forEach(function (f) {
      var kind = String(f.kind || f.type || "hece").toLowerCase();
      if (kind === "ses" || f.type === "intro") return;
      if (kind === "metin" || f.mode === "text") {
        metin.push(f);
        return;
      }
      if (kind === "cumle" || f.mode === "sentence") {
        cumle.push(f);
        return;
      }
      if (kind === "kelime" || f.mediaKey) kelime.push(f);
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
        '<section class="birles-fusion-section">' +
        '<header class="birles-fusion-section__head">' +
        '<h3 class="birles-path-label">' +
        esc(title) +
        "</h3>" +
        '<span class="birles-fusion-section__count">' +
        list.length +
        "</span>" +
        "</header>" +
        '<div class="birles-fusion-grid' +
        (extraClass ? " " + extraClass : "") +
        '">';
      list.forEach(function (f) {
        html += fusionCardHtml(f);
      });
      html += "</div></section>";
    }

    section("Heceler", hece, "birles-fusion-grid--hece");
    section("Kelimeler", kelime, "birles-fusion-grid--word");
    section("Cümleler", cumle, "birles-fusion-grid--cumle");

    if (metin.length) {
      html +=
        '<section class="birles-fusion-section birles-fusion-section--metin">' +
        '<header class="birles-fusion-section__head">' +
        '<h3 class="birles-path-label">Metinler</h3>' +
        '<span class="birles-fusion-section__count">' +
        metin.length +
        "</span>" +
        "</header>" +
        '<div class="birles-metin-rail" role="list">' +
        metin
          .map(function (f) {
            var med = f.mediaKey ? mediaFor(f.mediaKey) : null;
            var cover = med && med.imageUrl
              ? '<img class="birles-metin-tile__img" src="' +
                esc(med.imageUrl) +
                '" alt="" loading="lazy" />'
              : '<span class="birles-metin-tile__ph" aria-hidden="true"></span>';
            return (
              '<button type="button" class="birles-metin-tile" role="listitem" data-metin="' +
              esc(f.id) +
              '">' +
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
          })
          .join("") +
        "</div></section>";
    }

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
    body.querySelectorAll("[data-metin]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        ensureMedia().then(function () {
          openTextReader(sound.id, btn.getAttribute("data-metin"));
        });
      });
    });
  }

  function openTextReader(soundId, fusionId) {
    var D = data();
    if (!D) return;
    var sound = D.getSound(soundId);
    var fusion = D.getFusion(soundId, fusionId);
    if (!sound || !fusion) return;
    var body = document.getElementById("birles-body");
    if (!body) return;
    setBack(true, function () {
      animToken += 1;
      openSound(sound.id);
    });
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
      '<div class="birles-metin-actions">' +
      '<button type="button" class="birles-btn" id="birles-metin-readall">Metni oku</button>' +
      '<button type="button" class="birles-btn birles-btn--ghost" id="birles-metin-back">Sese dön</button>' +
      "</div></div>";

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

    /** Heceleme kelimenin üzerinde (metine özel yöntem) */
    async function playStoryWord(word, index, token) {
      var el = wordNode(index);
      if (!el) return false;
      var displaySyls =
        word.displaySyllables && word.displaySyllables.length
          ? word.displaySyllables.slice()
          : word.syllables && word.syllables.length
            ? word.syllables.slice()
            : [word.text || word.say];
      var audioSyls =
        word.syllables && word.syllables.length ? word.syllables.slice() : [word.say];
      var vv = voice();
      var txt = el.querySelector(".birles-metin-word__txt");

      el.classList.add("is-live");
      if (el.scrollIntoView) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        } catch (e2) {}
      }
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
          await playSylChip(
            chip,
            audioSyls[si] || displaySyls[si].toLocaleLowerCase("tr-TR"),
            token
          );
        }

        el.classList.add("is-merge");
        float.classList.add("is-merging");
        await pace(520);
        if (token !== animToken) return false;

        float.innerHTML =
          '<span class="birles-metin-float__word">' + esc(word.text) + "</span>";
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
      if (el.scrollIntoView) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        } catch (e3) {}
      }
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
        doneEl.hidden = false;
        doneEl.textContent = fusion.celebrate || "Harika! Hikâyeyi okudun!";
      }
    }

    document.getElementById("birles-metin-readall").addEventListener("click", function () {
      ensureMedia().then(function () {
        runStoryReading();
      });
    });
    document.getElementById("birles-metin-back").addEventListener("click", function () {
      animToken += 1;
      openSound(sound.id);
    });

    ensureMedia().then(function () {
      runStoryReading();
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
    var isCumle = fusion.kind === "cumle" || fusion.mode === "sentence";
    var med = fusion.mediaKey ? mediaFor(fusion.mediaKey) : null;
    var hasImg = !!(med && med.imageUrl);
    var sentenceBar = "";
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
    body.innerHTML =
      '<div class="birles-play' +
      (isCumle ? " birles-play--cumle" : "") +
      '" style="--chip:' +
      esc(sound.color) +
      ";--glow:" +
      esc(sound.glow) +
      '">' +
      '  <p class="birles-play__narration" id="birles-narration">' +
      esc(fusion.narration || "") +
      "</p>" +
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

    /** Hemen hecelere ayır ve oku */
    async function splitAndReadSyllables(word, displaySyls, audioSyls) {
      audioSyls = audioSyls || displaySyls;
      setNarr(displaySyls.join("  ·  "));
      stage.innerHTML = stagePanel(
        "Hecelere ayır",
        displaySyls
          .map(function (sy, si) {
            return (
              (si ? '<span class="birles-plus" aria-hidden="true">+</span>' : "") +
              cardHtml(sy, String(sy).length > 1 ? "chunk" : "letter")
            );
          })
          .join(""),
        "birles-cards--split"
      );
      bindTokenClicks(stage);
      await pace(360);
      if (token !== animToken) return false;

      var cards = stage.querySelectorAll(".birles-card");
      for (var si = 0; si < displaySyls.length; si++) {
        if (token !== animToken) return false;
        setNarr(displaySyls[si]);
        await playWithHighlight(cards[si], audioSyls[si] || displaySyls[si].toLocaleLowerCase("tr-TR"));
        await pace(180);
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
      cardHtml(fusion.result, "result"),
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
      setStep(rj);
      setNarr(words[rj].text);
      if (vv) await vv.playToken(words[rj].say, { waitUntilEnd: true });
      await pace(140);
      var spoken = wordEl(rj);
      if (spoken) spoken.classList.remove("is-speaking-now");
      markRead(rj);
    }
    if (bar) bar.classList.remove("is-reading-pass");
    clearFocus();
    if (finalCard) finalCard.classList.remove("is-speaking");
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

    if (fusion.mode === "sentence" || fusion.kind === "cumle") {
      await runSentenceAnimation(sound, fusion, token);
      if (token !== animToken) return;
      if (reveal) {
        reveal.hidden = false;
        reveal.classList.add("birles-reveal--msgonly");
        reveal.classList.remove("is-pop");
        void reveal.offsetWidth;
        reveal.classList.add("is-pop");
        var wordElReveal = document.getElementById("birles-reveal-word");
        if (wordElReveal) {
          wordElReveal.textContent = "";
          wordElReveal.hidden = true;
        }
        var msgC = document.getElementById("birles-reveal-msg");
        if (msgC) msgC.textContent = fusion.celebrate || "Harika! Cümleyi okudun!";
      }
      setNarr(fusion.celebrate || "Harika! Cümleyi okudun!");
      await pace(320);
      return;
    }

    var tray = [];
    var mode = fusion.mode || (fusion.syllables && fusion.syllables.length > 1 ? "syllables" : "simple");
    var finalWord = fusion.result;

    if (mode === "syllables" && fusion.syllables && fusion.syllables.length) {
      for (var i = 0; i < fusion.syllables.length; i++) {
        if (token !== animToken) return;
        var syl = fusion.syllables[i] || [];
        var left = syl[0];
        var right = syl.length > 1 ? syl[1] : null;
        if (right != null && right !== "") {
          setNarr(left + " + " + right + " → …");
        } else {
          setNarr(left + " geliyor…");
        }
        var mergedSyl = await stageMerge(left, right, token);
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
      reveal.classList.add("birles-reveal--msgonly");
      reveal.classList.remove("is-pop");
      void reveal.offsetWidth;
      reveal.classList.add("is-pop");
      var wordReveal = document.getElementById("birles-reveal-word");
      if (wordReveal) {
        wordReveal.textContent = "";
        wordReveal.hidden = true;
      }
      var msg = document.getElementById("birles-reveal-msg");
      if (msg) msg.textContent = fusion.celebrate || "Harika!";
    }
    setNarr(fusion.celebrate || "Harika!");
    await pace(220);
    if (vv) await vv.playToken(fusion.mediaKey || fusion.say || fusion.result, { waitUntilEnd: true });
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
