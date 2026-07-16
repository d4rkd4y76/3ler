/**
 * Kaptan Kabuk Anlatıyor — ders listesi → konu listesi → Bunny dikey tam ekran video
 */
(function () {
  "use strict";

  var R = window.NovaRoboroxData;
  var BRAND_NAME = "Kaptan Kabuk Anlatıyor";
  var BRAND_EMOJI = "🐢";

  function videoCountLabel(n) {
    n = Math.max(0, Number(n) || 0);
    return n + (n === 1 ? " Video" : " Video");
  }

  function topicContentCount(topic) {
    if (R && R.topicContentCount) return R.topicContentCount(topic);
    if (!topic) return 0;
    if (topic.sections && topic.sections.length) return topic.sections.length;
    if (topic.videos && topic.videos.length) return topic.videos.length;
    return topic.images ? topic.images.length : 0;
  }

  function topicContentLabel(topic) {
    if (R && R.topicContentLabel) return R.topicContentLabel(topic);
    return videoCountLabel(topicContentCount(topic));
  }

  function topicUsesSections(topic) {
    return R && R.topicUsesSections ? R.topicUsesSections(topic) : !!(topic && topic.sections && topic.sections.length);
  }

  function topicItemHtml(title, meta, icon) {
    return (
      '<span class="roborox-topic-item__ico" aria-hidden="true">' +
      esc(icon || BRAND_EMOJI) +
      "</span>" +
      '<span class="roborox-topic-item__body">' +
      '<span class="roborox-topic-item__title">' +
      esc(title) +
      "</span>" +
      '<span class="roborox-topic-item__meta">' +
      esc(meta) +
      "</span></span>"
    );
  }

  function roboroxLearnPath() {
    return R && R.roboroxLearnPath ? R.roboroxLearnPath() : "roboroxLearn";
  }

  function db() {
    try {
      return window.database || (window.firebase && firebase.database && firebase.database());
    } catch (_) {
      return null;
    }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function pickPlayback(cfg) {
    if (window.novaBuildHikayePlayback) {
      return window.novaBuildHikayePlayback(cfg);
    }
    if (!cfg) return null;
    var videoId = String(cfg.videoId || "").trim();
    if (!videoId) return null;
    var libraryId = String(cfg.libraryId || "").trim();
    if (libraryId) {
      return {
        mode: "iframe",
        src:
          "https://iframe.mediadelivery.net/embed/" +
          libraryId +
          "/" +
          videoId +
          "?autoplay=true&loop=false&muted=false&preload=true&responsive=true&rememberPosition=false",
      };
    }
    var host = String(cfg.libraryName || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\.b-cdn\.net.*$/i, "");
    if (host && host.length >= 8) {
      return {
        mode: "video",
        src: "https://" + host + ".b-cdn.net/" + videoId + "/play_720p.mp4",
      };
    }
    return null;
  }

  function buildMp4Candidates(host, videoId) {
    var base = "https://" + host + ".b-cdn.net/" + videoId + "/";
    return [base + "play_1080p.mp4", base + "play_720p.mp4", base + "play_480p.mp4", base + "play_360p.mp4"];
  }

  const topicsModal = document.getElementById("roborox-topics-modal");
  const topicsList = document.getElementById("roborox-topics-list");
  const topicsClose = document.getElementById("roborox-topics-close");
  const topicsBack = document.getElementById("roborox-topics-back");
  const topicsSubtitle = document.getElementById("roborox-topics-subtitle");

  const learnHubModal = document.getElementById("learn-hub-modal");
  const learnOpenBtn = document.getElementById("nova_kaptan_kabuk_btn");
  const learnHubClose = document.getElementById("learn-hub-close");
  const learnHubRoborox = document.getElementById("learn-hub-roborox");
  const learnHubTools = document.getElementById("learn-hub-tools");

  const reader = document.getElementById("roborox-reader-overlay");
  const readerExit = document.getElementById("roborox-reader-exit");
  const readerVideo = document.getElementById("roborox-reader-video");
  const readerIframeWrap = document.getElementById("roborox-reader-iframe-wrap");
  const readerIframe = document.getElementById("roborox-reader-iframe");
  const readerLoading = document.getElementById("roborox-reader-loading");
  const topicIntro = document.getElementById("roborox-topic-intro");
  const topicIntroTitle = document.getElementById("roborox-topic-intro-title");
  const topicIntroHint = document.getElementById("roborox-topic-intro-hint");
  const topicIntroCards = document.getElementById("roborox-topic-intro-cards");
  const readerNav = document.getElementById("roborox-reader-nav");
  const readerNavLabel = document.getElementById("roborox-reader-nav-label");
  const readerNavPrev = document.getElementById("roborox-reader-nav-prev");
  const readerNavNext = document.getElementById("roborox-reader-nav-next");

  const INTRO_MIN_MS = 1100;
  const INTRO_MIN_PERF_MS = 580;
  const INTRO_MAX_MS = 2600;
  const INTRO_EXIT_MS = 380;

  let viewMode = "lessons";
  let lessonsCache = [];
  let topicsCache = [];
  let sectionsCache = [];
  let selectedLesson = null;
  let selectedTopic = null;
  let studentGrade = null;
  let videos = [];
  let videoIndex = 0;
  let introActive = false;
  let readerReady = false;
  let loadToken = 0;
  let directOpenMode = null;

  function lockScroll(on) {
    document.body.style.overflow = on ? "hidden" : "";
  }

  function notifyMainScreenReturn() {
    if (typeof window.novaReturnToMainScreen === "function") {
      window.novaReturnToMainScreen();
    }
  }

  function currentStudent() {
    try {
      return window.selectedStudent || JSON.parse(localStorage.getItem("selectedStudent") || "null");
    } catch (_) {
      return null;
    }
  }

  function syncGradeSubtitle() {
    if (!topicsSubtitle) return;
    var student = currentStudent();
    var className = String((student && student.className) || "").trim();
    studentGrade = R && R.extractGrade ? R.extractGrade(className || (student && student.classId)) : null;
    var gradeText = R && R.gradeLabel ? R.gradeLabel(studentGrade) : "";
    if (viewMode === "sections" && selectedTopic) {
      topicsSubtitle.textContent =
        (gradeText ? gradeText + " · " : "") +
        (selectedLesson ? selectedLesson.name + " · " : "") +
        selectedTopic.title;
    } else if (viewMode === "topics" && selectedLesson) {
      topicsSubtitle.textContent = (gradeText ? gradeText + " · " : "") + selectedLesson.name;
    } else if (gradeText) {
      topicsSubtitle.textContent = gradeText + " derslerin";
    } else {
      topicsSubtitle.textContent = "Videolarla konuları adım adım keşfet.";
    }
  }

  function setBackVisible(on) {
    if (!topicsBack) return;
    topicsBack.hidden = !on;
    topicsBack.style.display = on ? "" : "none";
  }

  function ensureReaderPortal() {
    if (reader && reader.parentElement !== document.body) {
      document.body.appendChild(reader);
    }
  }

  function ensureIntroPortal() {
    if (topicIntro && topicIntro.parentElement !== document.body) {
      document.body.appendChild(topicIntro);
    }
  }

  function isLowPerfMode() {
    return (
      document.body.classList.contains("nova-perf-ultra") ||
      document.body.classList.contains("nova-perf-performance")
    );
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }

  function collectPlaybackVideos(topic, section) {
    if (R && R.collectTopicPlaylist) {
      return R.collectTopicPlaylist(topic, section);
    }
    if (section && section.videos && section.videos.length) {
      return section.videos.slice();
    }
    var out = [];
    if (topic && topic.sections && topic.sections.length) {
      (topic.sections || []).forEach(function (s) {
        if (s.active !== false && s.videos && s.videos.length) {
          out = out.concat(s.videos);
        }
      });
    }
    if (out.length) return out;
    if (topic && topic.videos && topic.videos.length) return topic.videos.slice();
    return [];
  }

  function normalizePlaylist(list) {
    var out = [];
    var seen = {};
    (list || []).forEach(function (v) {
      if (!v) return;
      var videoId = String(v.videoId || v.id || "").trim();
      if (!videoId) return;
      var key = videoId + "|" + String(v.libraryId || v.libraryName || "");
      if (seen[key]) return;
      seen[key] = true;
      out.push(v);
    });
    return out;
  }

  function updateReaderNav() {
    if (!readerNav) return;
    var total = videos.length;
    var solo = total <= 1;
    readerNav.classList.toggle("is-solo", solo);
    if (solo) {
      readerNav.hidden = true;
      readerNav.setAttribute("hidden", "");
      return;
    }
    readerNav.hidden = false;
    readerNav.removeAttribute("hidden");
    if (readerNavLabel) {
      readerNavLabel.textContent = "Video " + (videoIndex + 1) + " / " + total;
    }
    if (readerNavPrev) {
      readerNavPrev.disabled = videoIndex <= 0;
      readerNavPrev.classList.toggle("is-passive", videoIndex <= 0);
    }
    if (readerNavNext) {
      var noNext = videoIndex >= total - 1;
      readerNavNext.disabled = noNext;
      readerNavNext.classList.toggle("is-passive", noNext);
      readerNavNext.textContent = "Sonraki Video →";
      readerNavNext.setAttribute("aria-disabled", noNext ? "true" : "false");
    }
  }

  function dismissAllKaptanKabukUi() {
    introActive = false;
    directOpenMode = null;
    hideTopicIntro();
    hideTopicsModal();
    try {
      if (typeof window.novaCloseBirlestirelim === "function") window.novaCloseBirlestirelim();
    } catch (_) {}
    loadToken += 1;
    if (reader) {
      reader.classList.remove("open", "is-ready", "is-opening", "is-open-ready");
      reader.setAttribute("aria-hidden", "true");
      reader.hidden = true;
    }
    hideAllPlayers();
    setReaderLoading(false);
    setExitVisible(false);
    if (readerNav) {
      readerNav.hidden = true;
      readerNav.setAttribute("hidden", "");
    }
    videos = [];
    videoIndex = 0;
    setReaderBodyLock(false);
    lockScroll(false);
    viewMode = "lessons";
    selectedLesson = null;
    selectedTopic = null;
    sectionsCache = [];
    setBackVisible(false);
  }

  function hideTopicIntro() {
    if (!topicIntro) return;
    topicIntro.classList.remove("open", "is-enter", "is-exit");
    topicIntro.hidden = true;
    topicIntro.setAttribute("aria-hidden", "true");
  }

  function preloadFirstVideo(topic, section, cb) {
    var list = collectPlaybackVideos(topic, section);
    if (!list.length) {
      cb(false);
      return;
    }
    var play = pickPlayback(list[0]);
    if (!play) {
      cb(false);
      return;
    }
    if (play.mode === "iframe") {
      cb(true);
      return;
    }
    var done = false;
    function finish(ok) {
      if (done) return;
      done = true;
      cb(!!ok);
    }
    window.setTimeout(function () {
      finish(true);
    }, 1200);
    var v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.onloadeddata = function () {
      finish(true);
    };
    v.onerror = function () {
      finish(false);
    };
    v.src = play.src;
  }

  function playTopicIntro(topic, section) {
    var playVideos = collectPlaybackVideos(topic, section);
    var playCount = playVideos ? playVideos.length : 0;
    if (!topic || !playCount) {
      if (typeof window.showAlert === "function") {
        window.showAlert("Bu konuda henüz video eklenmemiş.");
      }
      return;
    }
    if (introActive) return;

    if (!topicIntro || !topicIntroTitle || prefersReducedMotion()) {
      hideTopicsModal();
      openReader(topic, section, false);
      return;
    }

    introActive = true;
    hideTopicsModal();
    ensureIntroPortal();

    const lowPerf = isLowPerfMode();
    const minMs = lowPerf ? INTRO_MIN_PERF_MS : INTRO_MIN_MS;
    const exitMs = lowPerf ? 260 : INTRO_EXIT_MS;
    let minTimeDone = false;
    let mediaReady = false;
    let introFinished = false;

    topicIntroTitle.textContent = section ? section.title : topic.title;
    if (topicIntroCards) {
      topicIntroCards.textContent = videoCountLabel(playCount);
    }
    if (topicIntroHint) topicIntroHint.textContent = "Ders videosu hazırlanıyor…";
    topicIntro.hidden = false;
    topicIntro.setAttribute("aria-hidden", "false");
    topicIntro.classList.add("open");
    topicIntro.classList.remove("is-exit");
    void topicIntro.offsetWidth;
    topicIntro.classList.add("is-enter");
    lockScroll(true);

    function finishIntro() {
      if (introFinished) return;
      introFinished = true;
      topicIntro.classList.remove("is-enter");
      topicIntro.classList.add("is-exit");
      window.setTimeout(function () {
        hideTopicIntro();
        lockScroll(false);
        openReader(topic, section, true);
        introActive = false;
      }, exitMs);
    }

    function tryFinishIntro() {
      if (!minTimeDone || !mediaReady || introFinished) return;
      finishIntro();
    }

    window.setTimeout(function () {
      minTimeDone = true;
      tryFinishIntro();
    }, minMs);

    window.setTimeout(function () {
      mediaReady = true;
      tryFinishIntro();
    }, INTRO_MAX_MS);

    preloadFirstVideo(topic, section, function () {
      mediaReady = true;
      tryFinishIntro();
    });
  }

  function setReaderBodyLock(on) {
    document.body.classList.toggle("roborox-reader-open", !!on);
    document.documentElement.classList.toggle("roborox-reader-open", !!on);
    document.body.style.overflow = on ? "hidden" : "";
    if (on) {
      try {
        document.body.style.zoom = "1";
        document.body.style.transform = "none";
        document.body.style.width = "100%";
      } catch (_) {}
    } else if (typeof window.novaSyncPerfRuntime === "function") {
      window.novaSyncPerfRuntime();
    }
  }

  function setReaderLoading(on) {
    if (!readerLoading) return;
    readerLoading.hidden = !on;
    if (on) readerLoading.removeAttribute("hidden");
    else readerLoading.setAttribute("hidden", "");
  }

  function setExitVisible(on) {
    if (!readerExit) return;
    if (on) {
      readerExit.hidden = false;
      readerExit.removeAttribute("hidden");
    } else {
      readerExit.hidden = true;
      readerExit.setAttribute("hidden", "");
    }
  }

  function hideAllPlayers() {
    if (readerVideo) {
      readerVideo.hidden = true;
      readerVideo.setAttribute("hidden", "");
      try {
        readerVideo.pause();
        readerVideo.onended = null;
        readerVideo.removeAttribute("src");
        readerVideo.load();
      } catch (_) {}
    }
    if (readerIframeWrap) {
      readerIframeWrap.hidden = true;
      readerIframeWrap.setAttribute("hidden", "");
    }
    if (readerIframe) {
      try {
        readerIframe.removeAttribute("src");
      } catch (_) {}
    }
  }

  function setReaderReady(on) {
    readerReady = !!on;
    if (reader) {
      reader.classList.toggle("is-ready", readerReady);
    }
    setExitVisible(readerReady);
  }

  function loadVideoSource(video, srcOrList) {
    var list = Array.isArray(srcOrList) ? srcOrList.slice() : [srcOrList];
    return new Promise(function (resolve, reject) {
      if (!video || !list.length) {
        reject(new Error("no-video"));
        return;
      }
      var idx = 0;
      function tryNext() {
        if (idx >= list.length) {
          reject(new Error("video-error"));
          return;
        }
        var src = list[idx];
        idx += 1;
        function cleanup() {
          video.removeEventListener("canplay", onOk);
          video.removeEventListener("loadeddata", onOk);
          video.removeEventListener("error", onErr);
        }
        function onOk() {
          if (video.readyState < 2) return;
          cleanup();
          resolve(src);
        }
        function onErr() {
          cleanup();
          tryNext();
        }
        video.addEventListener("canplay", onOk, { once: true });
        video.addEventListener("loadeddata", onOk, { once: true });
        video.addEventListener("error", onErr, { once: true });
        video.src = src;
        try {
          video.load();
        } catch (e) {
          onErr();
        }
      }
      tryNext();
    });
  }

  function tryPlayVideo(video) {
    try {
      video.controls = false;
      video.muted = false;
      video.volume = 1;
      video.playsInline = true;
    } catch (_) {}
    var p;
    try {
      p = video.play();
    } catch (_) {
      p = null;
    }
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        try {
          video.controls = true;
          if (typeof window.showAlert === "function") {
            window.showAlert("Ders videosu için ekrana dokunup oynatın.");
          }
        } catch (_) {}
      });
    }
  }

  function revealReaderUi() {
    setReaderLoading(false);
    setReaderReady(true);
    updateReaderNav();
  }

  function playVideoAt(index) {
    if (!reader || index < 0 || index >= videos.length) return;
    var token = ++loadToken;
    videoIndex = index;
    setReaderReady(false);
    setReaderLoading(true);
    hideAllPlayers();
    updateReaderNav();

    var cfg = videos[index];
    var play = pickPlayback(cfg);
    if (!play) {
      setReaderLoading(false);
      return;
    }

    function abort() {
      return token !== loadToken;
    }

    if (play.mode === "iframe") {
      if (readerIframeWrap) {
        readerIframeWrap.hidden = false;
        readerIframeWrap.removeAttribute("hidden");
      }
      if (readerIframe) {
        readerIframe.setAttribute(
          "allow",
          "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        );
        readerIframe.onload = function () {
          if (!abort()) revealReaderUi();
        };
        readerIframe.src = play.src;
      }
      window.setTimeout(function () {
        if (!abort()) revealReaderUi();
      }, 3500);
      return;
    }

    if (readerVideo) {
      readerVideo.hidden = false;
      readerVideo.removeAttribute("hidden");
    }

    var host = String(cfg.libraryName || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\.b-cdn\.net.*$/i, "");
    var mp4List = host.length >= 8 ? buildMp4Candidates(host, cfg.videoId) : [play.src];

    loadVideoSource(readerVideo, mp4List)
      .then(function () {
        if (abort()) return;
        revealReaderUi();
        readerVideo.onended = null;
        tryPlayVideo(readerVideo);
      })
      .catch(function () {
        if (abort()) return;
        var fallback = pickPlayback({
          videoId: cfg.videoId,
          libraryId: cfg.libraryId,
          libraryName: "",
        });
        if (fallback && fallback.mode === "iframe" && readerIframe) {
          hideAllPlayers();
          if (readerIframeWrap) {
            readerIframeWrap.hidden = false;
            readerIframeWrap.removeAttribute("hidden");
          }
          readerIframe.src = fallback.src;
          revealReaderUi();
          return;
        }
        setReaderLoading(false);
      });
  }

  function openLearnHub() {
    if (!learnHubModal) return;
    learnHubModal.hidden = false;
    learnHubModal.classList.add("open");
    learnHubModal.setAttribute("aria-hidden", "false");
    lockScroll(true);
  }

  function closeLearnHub() {
    if (!learnHubModal) return;
    learnHubModal.classList.remove("open");
    learnHubModal.setAttribute("aria-hidden", "true");
    learnHubModal.hidden = true;
    lockScroll(false);
    notifyMainScreenReturn();
  }

  function hideTopicsModal() {
    if (!topicsModal) return;
    topicsModal.classList.remove("open");
    topicsModal.setAttribute("aria-hidden", "true");
    topicsModal.hidden = true;
  }

  function restoreTopicsModal() {
    if (!topicsModal) return;
    if (viewMode === "sections" && selectedTopic) {
      renderSections();
      setBackVisible(true);
    } else if (viewMode === "topics" && selectedLesson) {
      renderTopics();
      setBackVisible(true);
    } else if (viewMode === "flat") {
      renderTopics();
      setBackVisible(false);
    } else {
      renderLessons();
      setBackVisible(false);
    }
    syncGradeSubtitle();
    topicsModal.hidden = false;
    topicsModal.classList.add("open");
    topicsModal.setAttribute("aria-hidden", "false");
    lockScroll(true);
  }

  function closeTopicsModal() {
    if (directOpenMode && directOpenMode.kind === "sections") {
      var cb = directOpenMode.onClose;
      directOpenMode = null;
      hideTopicsModal();
      viewMode = "lessons";
      selectedLesson = null;
      selectedTopic = null;
      sectionsCache = [];
      setBackVisible(false);
      lockScroll(false);
      if (typeof cb === "function") cb();
      return;
    }
    hideTopicsModal();
    viewMode = "lessons";
    selectedLesson = null;
    selectedTopic = null;
    sectionsCache = [];
    setBackVisible(false);
    lockScroll(false);
    notifyMainScreenReturn();
  }

  function openTopicsModal() {
    if (!topicsModal) return;
    topicsModal.hidden = false;
    topicsModal.classList.add("open");
    topicsModal.setAttribute("aria-hidden", "false");
    lockScroll(true);
    loadRoboroxContent();
  }

  function renderLessons() {
    if (!topicsList) return;
    topicsList.innerHTML = "";
    if (typeof window.novaBirlestirelimInjectEntry === "function") {
      window.novaBirlestirelimInjectEntry(topicsList);
    }
    lessonsCache.forEach(function (lesson) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "roborox-topic-item roborox-lesson-item";
      btn.dataset.lessonId = lesson.id;
      btn.innerHTML = topicItemHtml(lesson.name, lesson.topics.length + " konu", lesson.icon || "📚");
      topicsList.appendChild(btn);
    });
    syncGradeSubtitle();
    setBackVisible(false);
  }

  function sectionItemHtml(section, index) {
    var num = String(index + 1).padStart(2, "0");
    var videoN = section.videos ? section.videos.length : 0;
    return (
      '<span class="roborox-section-item__num" aria-hidden="true">' +
      esc(num) +
      "</span>" +
      '<span class="roborox-topic-item__body">' +
      '<span class="roborox-topic-item__title">' +
      esc(section.title) +
      "</span>" +
      '<span class="roborox-topic-item__meta">' +
      esc(videoCountLabel(videoN)) +
      "</span></span>" +
      '<span class="roborox-section-item__play" aria-hidden="true">▶</span>'
    );
  }

  function renderSections() {
    if (!topicsList) return;
    topicsList.innerHTML = "";
    if (selectedTopic) {
      var header = document.createElement("div");
      header.className = "roborox-sections-header";
      header.innerHTML =
        '<span class="roborox-sections-header__badge">Konu</span>' +
        '<h4 class="roborox-sections-header__title">' +
        esc(selectedTopic.title) +
        "</h4>" +
        '<p class="roborox-sections-header__hint">Alt başlığı seçerek videoyu izle</p>';
      topicsList.appendChild(header);
    }
    sectionsCache.forEach(function (s, i) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "roborox-topic-item roborox-section-item";
      btn.dataset.sectionId = s.id;
      btn.innerHTML = sectionItemHtml(s, i);
      topicsList.appendChild(btn);
    });
    syncGradeSubtitle();
    setBackVisible(true);
  }

  function renderTopics() {
    if (!topicsList) return;
    topicsList.innerHTML = "";
    topicsCache.forEach(function (t) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "roborox-topic-item";
      btn.dataset.topicId = t.id;
      btn.innerHTML = topicItemHtml(t.title, topicContentLabel(t), BRAND_EMOJI);
      topicsList.appendChild(btn);
    });
    syncGradeSubtitle();
    setBackVisible(true);
  }

  function showTopicSections(topic) {
    if (!topic) return;
    selectedTopic = topic;
    viewMode = "sections";
    sectionsCache = topic.sections.slice();
    renderSections();
  }

  function showLessonTopics(lesson) {
    if (!lesson) return;
    selectedLesson = lesson;
    selectedTopic = null;
    sectionsCache = [];
    viewMode = "topics";
    topicsCache = lesson.topics.slice();
    renderTopics();
  }

  function goBackFromSections() {
    if (viewMode !== "sections" || !selectedLesson) return;
    selectedTopic = null;
    sectionsCache = [];
    viewMode = "topics";
    topicsCache = selectedLesson.topics.slice();
    renderTopics();
  }

  function goBackToLessons() {
    if (viewMode === "sections") {
      goBackFromSections();
      return;
    }
    if (viewMode !== "topics" || !lessonsCache.length) return;
    viewMode = "lessons";
    selectedLesson = null;
    selectedTopic = null;
    topicsCache = [];
    sectionsCache = [];
    renderLessons();
  }

  async function fetchRoboroxRawAtPath(path) {
    const database = db();
    if (!database) return {};
    var raw = null;
    if (typeof window.novaCdnFetchByPath === "function") {
      const fromCdn = await window.novaCdnFetchByPath(path, 15 * 60 * 1000);
      if (fromCdn !== undefined) raw = fromCdn;
    }
    if (raw === null) {
      const snap = await database.ref(path).get();
      raw = snap.exists() ? snap.val() || {} : {};
    }
    return raw;
  }

  function roboroxPathForHeading(headingId) {
    if (!R || !headingId) return null;
    return R.roboroxLearnPath({ classId: String(headingId), className: String(headingId) });
  }

  function resolveRoboroxTopicFromRaw(raw, lessonId, topicId) {
    if (!R || !R.parseSnapshot) return null;
    const parsed = R.parseSnapshot(raw);
    if (parsed.mode === "lessons") {
      if (lessonId) {
        const lesson = parsed.lessons.find(function (l) {
          return l.id === lessonId;
        });
        if (!lesson) return null;
        const topic = lesson.topics.find(function (t) {
          return t.id === topicId;
        });
        if (!topic) return null;
        return { lesson: lesson, topic: topic };
      }
      for (var li = 0; li < parsed.lessons.length; li++) {
        var les = parsed.lessons[li];
        var top = les.topics.find(function (t) {
          return t.id === topicId;
        });
        if (top) return { lesson: les, topic: top };
      }
      return null;
    }
    const topic = parsed.flatTopics.find(function (t) {
      return t.id === topicId;
    });
    return topic ? { lesson: null, topic: topic } : null;
  }

  async function resolveRoboroxTopic(lessonId, topicId, customPath) {
    if (!topicId) return null;
    var paths = [];
    if (customPath) paths.push(customPath);
    try {
      var studentPath = roboroxLearnPath();
      if (studentPath && paths.indexOf(studentPath) < 0) paths.push(studentPath);
    } catch (_) {}
    if (paths.indexOf("roboroxLearn") < 0) paths.push("roboroxLearn");
    for (var pi = 0; pi < paths.length; pi++) {
      try {
        var raw = await fetchRoboroxRawAtPath(paths[pi]);
        var found = resolveRoboroxTopicFromRaw(raw, lessonId, topicId);
        if (found) return found;
      } catch (_) {}
    }
    return null;
  }

  async function novaFetchKaptanKabukLink(headingId, championLessonId, championTopicId) {
    const database = db();
    if (!database || !headingId || !championLessonId || !championTopicId) return null;
    try {
      const snap = await database
        .ref(
          "championData/headings/" +
            headingId +
            "/lessons/" +
            championLessonId +
            "/topics/" +
            championTopicId +
            "/kaptanKabuk"
        )
        .get();
      if (!snap.exists()) return null;
      const v = snap.val() || {};
      const lessonId = String(v.lessonId || v.roboroxLessonId || "").trim();
      const topicId = String(v.topicId || v.roboroxTopicId || "").trim();
      if (!topicId) return null;
      return { lessonId: lessonId, topicId: topicId };
    } catch (_) {
      return null;
    }
  }

  function openDirectSectionsModal(topic, lesson, onClose) {
    directOpenMode = { onClose: onClose, kind: "sections" };
    selectedTopic = topic;
    selectedLesson = lesson;
    viewMode = "sections";
    sectionsCache = topic.sections.slice();
    if (topicsSubtitle) topicsSubtitle.textContent = topic.title;
    topicsModal.hidden = false;
    topicsModal.classList.add("open");
    topicsModal.setAttribute("aria-hidden", "false");
    renderSections();
    setBackVisible(false);
    lockScroll(true);
  }

  async function novaOpenKaptanKabukTopic(options) {
    options = options || {};
    const lessonId = String(options.lessonId || "").trim();
    const topicId = String(options.topicId || "").trim();
    const onClose = typeof options.onClose === "function" ? options.onClose : null;
    if (!topicId) {
      if (typeof window.showAlert === "function") {
        window.showAlert("Kaptan Kabuk bağlantısı eksik.");
      }
      return false;
    }
    const found = await resolveRoboroxTopic(lessonId, topicId, options.roboroxPath || null);
    if (!found || !found.topic) {
      if (typeof window.showAlert === "function") {
        window.showAlert("Kaptan Kabuk anlatımı bulunamadı. Admin panelinden kontrol edin.");
      }
      return false;
    }
    const topic = found.topic;
    directOpenMode = { onClose: onClose, kind: "reader", flattenSections: true };
    if (options.sectionId && topicUsesSections(topic)) {
      const section = topic.sections.find(function (s) {
        return s.id === options.sectionId;
      });
      if (section) {
        directOpenMode.flattenSections = false;
        playTopicIntro(topic, section);
        return true;
      }
    }
    var playlist = collectPlaybackVideos(topic, null);
    if (!playlist.length) {
      if (typeof window.showAlert === "function") {
        window.showAlert("Bu konuda henüz video eklenmemiş.");
      }
      directOpenMode = null;
      return false;
    }
    playTopicIntro(topic, null);
    return true;
  }

  async function novaOpenKaptanKabukForChampionTopic(options) {
    options = options || {};
    const link = await novaFetchKaptanKabukLink(options.headingId, options.lessonId, options.topicId);
    if (!link || !link.topicId) return false;
    var roboroxPath = options.roboroxPath || null;
    if (!roboroxPath && options.headingId) {
      roboroxPath = roboroxPathForHeading(options.headingId);
    }
    return novaOpenKaptanKabukTopic({
      lessonId: link.lessonId,
      topicId: link.topicId,
      onClose: options.onClose,
      sectionId: options.sectionId,
      roboroxPath: roboroxPath,
    });
  }

  async function loadRoboroxContent() {
    if (!topicsList) return;
    topicsList.innerHTML = '<p class="roborox-topics-empty">Yükleniyor…</p>';
    setBackVisible(false);
    const database = db();
    if (!database) {
      topicsList.innerHTML = '<p class="roborox-topics-empty">Bağlantı kurulamadı.</p>';
      return;
    }
    if (!R || !R.parseSnapshot) {
      topicsList.innerHTML = '<p class="roborox-topics-empty">Modül yüklenemedi.</p>';
      return;
    }
    try {
      const path = roboroxLearnPath();
      const raw = await fetchRoboroxRawAtPath(path);
      const parsed = R.parseSnapshot(raw);

      if (parsed.mode === "lessons" && parsed.lessons.length) {
        viewMode = "lessons";
        lessonsCache = parsed.lessons;
        selectedLesson = null;
        renderLessons();
        return;
      }

      if (parsed.flatTopics.length) {
        viewMode = "flat";
        lessonsCache = [];
        topicsCache = parsed.flatTopics;
        selectedLesson = null;
        renderTopics();
        setBackVisible(false);
        if (typeof window.novaBirlestirelimInjectEntry === "function") {
          window.novaBirlestirelimInjectEntry(topicsList);
        }
        return;
      }

      var student = currentStudent();
      var grade = R.extractGrade(String((student && student.className) || (student && student.classId) || ""));
      var gradeText = R.gradeLabel(grade);
      topicsList.innerHTML =
        '<p class="roborox-topics-empty">Henüz ' +
        (gradeText ? "<strong>" + esc(gradeText) + "</strong> için " : "") +
        "ders videosu eklenmemiş.<br>Öğretmeniniz admin panelinden ders ve konu ekleyebilir.</p>";
      if (typeof window.novaBirlestirelimInjectEntry === "function") {
        window.novaBirlestirelimInjectEntry(topicsList);
      }
      syncGradeSubtitle();
    } catch (e) {
      topicsList.innerHTML =
        '<p class="roborox-topics-empty">Yükleme hatası: ' + esc(e && e.message ? e.message : e) + "</p>";
    }
  }

  function openReader(topic, section, withIntroHandoff) {
    if (!reader || !topic) return;
    var playVideos = collectPlaybackVideos(topic, section);
    if (!playVideos || !playVideos.length) return;

    ensureReaderPortal();
    videos = normalizePlaylist(playVideos);
    videoIndex = 0;
    updateReaderNav();
    loadToken += 1;
    reader.dataset.title = section ? section.title : topic.title;
    hideTopicsModal();
    reader.hidden = false;
    reader.classList.remove("is-open-ready", "is-ready");
    if (withIntroHandoff) reader.classList.add("is-opening");
    else reader.classList.remove("is-opening");
    reader.classList.add("open");
    reader.setAttribute("aria-hidden", "false");
    setReaderBodyLock(true);
    setExitVisible(false);
    setReaderLoading(true);
    hideAllPlayers();
    playVideoAt(0);

    if (withIntroHandoff) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          reader.classList.add("is-open-ready");
          window.setTimeout(function () {
            reader.classList.remove("is-opening", "is-open-ready");
          }, 400);
        });
      });
    }
  }

  function closeReader() {
    if (!reader) return;
    loadToken += 1;
    reader.classList.remove("open", "is-ready", "is-opening", "is-open-ready");
    reader.setAttribute("aria-hidden", "true");
    reader.hidden = true;
    hideAllPlayers();
    setReaderLoading(false);
    setExitVisible(false);
    videos = [];
    videoIndex = 0;
    setReaderBodyLock(false);
    if (directOpenMode) {
      var cb = directOpenMode.onClose;
      directOpenMode = null;
      hideTopicsModal();
      viewMode = "lessons";
      selectedLesson = null;
      selectedTopic = null;
      sectionsCache = [];
      setBackVisible(false);
      lockScroll(false);
      if (typeof cb === "function") cb();
      return;
    }
    restoreTopicsModal();
  }

  if (learnOpenBtn) {
    learnOpenBtn.addEventListener("click", function () {
      openLearnHub();
    });
  }

  if (learnHubClose) {
    learnHubClose.addEventListener("click", closeLearnHub);
  }

  if (learnHubModal) {
    learnHubModal.addEventListener("click", function (e) {
      if (e.target === learnHubModal) closeLearnHub();
    });
  }

  if (learnHubRoborox) {
    learnHubRoborox.addEventListener("click", function () {
      closeLearnHub();
      openTopicsModal();
    });
  }

  if (learnHubTools) {
    learnHubTools.addEventListener("click", function () {
      closeLearnHub();
      if (typeof window.novaOpenSpecialToolsModal === "function") {
        window.novaOpenSpecialToolsModal();
      }
    });
  }

  if (topicsClose) {
    topicsClose.addEventListener("click", closeTopicsModal);
  }

  if (topicsBack) {
    topicsBack.addEventListener("click", goBackToLessons);
  }

  if (topicsModal) {
    topicsModal.addEventListener("click", function (e) {
      if (e.target === topicsModal) closeTopicsModal();
    });
  }

  if (topicsList) {
    topicsList.addEventListener("click", function (e) {
      const lessonBtn = e.target.closest("[data-lesson-id]");
      if (lessonBtn) {
        const id = lessonBtn.getAttribute("data-lesson-id");
        const lesson = lessonsCache.find(function (l) {
          return l.id === id;
        });
        if (lesson) showLessonTopics(lesson);
        return;
      }
      const sectionBtn = e.target.closest("[data-section-id]");
      if (sectionBtn) {
        const sid = sectionBtn.getAttribute("data-section-id");
        const section = sectionsCache.find(function (s) {
          return s.id === sid;
        });
        if (section && selectedTopic) {
          if (directOpenMode) directOpenMode.kind = "reader";
          playTopicIntro(selectedTopic, section);
        }
        return;
      }
      const btn = e.target.closest("[data-topic-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-topic-id");
      const topic = topicsCache.find(function (t) {
        return t.id === id;
      });
      if (!topic) return;
      playTopicIntro(topic, null);
    });
  }

  if (readerExit) {
    readerExit.addEventListener("click", closeReader);
  }

  if (readerNavNext) {
    readerNavNext.addEventListener("click", function () {
      if (videoIndex < videos.length - 1) playVideoAt(videoIndex + 1);
    });
  }
  if (readerNavPrev) {
    readerNavPrev.addEventListener("click", function () {
      if (videoIndex > 0) playVideoAt(videoIndex - 1);
    });
  }

  if (reader) {
    reader.addEventListener("click", function (e) {
      if (e.target === reader && readerReady) closeReader();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (learnHubModal && learnHubModal.classList.contains("open") && e.key === "Escape") {
      closeLearnHub();
      return;
    }
    if (topicsModal && topicsModal.classList.contains("open") && e.key === "Escape") {
      if (viewMode === "sections" && selectedLesson) {
        goBackFromSections();
        return;
      }
      if (viewMode === "topics" && lessonsCache.length) {
        goBackToLessons();
        return;
      }
      closeTopicsModal();
      return;
    }
    if (!reader || !reader.classList.contains("open")) return;
    if (e.key === "Escape") closeReader();
  });

  window.novaOpenRoboroxTopicsModal = openTopicsModal;
  window.novaOpenLearnHubModal = openLearnHub;
  window.novaOpenKaptanKabuk = openTopicsModal;
  window.novaFetchKaptanKabukLink = novaFetchKaptanKabukLink;
  window.novaOpenKaptanKabukTopic = novaOpenKaptanKabukTopic;
  window.novaOpenKaptanKabukForChampionTopic = novaOpenKaptanKabukForChampionTopic;
  window.novaDismissKaptanKabukOverlays = dismissAllKaptanKabukUi;
})();
