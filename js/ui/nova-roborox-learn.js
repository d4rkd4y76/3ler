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
    if (!topic) return 0;
    if (topic.videos && topic.videos.length) return topic.videos.length;
    return topic.images ? topic.images.length : 0;
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
  const learnOpenBtn = document.getElementById("learn-open-button");
  const learnHubClose = document.getElementById("learn-hub-close");
  const learnHubRoborox = document.getElementById("learn-hub-roborox");
  const learnHubTools = document.getElementById("learn-hub-tools");

  const reader = document.getElementById("roborox-reader-overlay");
  const readerExit = document.getElementById("roborox-reader-exit");
  const readerCount = document.getElementById("roborox-reader-count");
  const readerPrev = document.getElementById("roborox-reader-prev");
  const readerNext = document.getElementById("roborox-reader-next");
  const readerNavWrap = document.getElementById("roborox-reader-nav-wrap");
  const readerVideo = document.getElementById("roborox-reader-video");
  const readerIframeWrap = document.getElementById("roborox-reader-iframe-wrap");
  const readerIframe = document.getElementById("roborox-reader-iframe");
  const readerLoading = document.getElementById("roborox-reader-loading");
  const topicIntro = document.getElementById("roborox-topic-intro");
  const topicIntroTitle = document.getElementById("roborox-topic-intro-title");
  const topicIntroHint = document.getElementById("roborox-topic-intro-hint");
  const topicIntroCards = document.getElementById("roborox-topic-intro-cards");

  const INTRO_MIN_MS = 1100;
  const INTRO_MIN_PERF_MS = 580;
  const INTRO_MAX_MS = 2600;
  const INTRO_EXIT_MS = 380;

  let viewMode = "lessons";
  let lessonsCache = [];
  let topicsCache = [];
  let selectedLesson = null;
  let studentGrade = null;
  let videos = [];
  let videoIndex = 0;
  let introActive = false;
  let readerReady = false;
  let loadToken = 0;

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
    if (viewMode === "topics" && selectedLesson) {
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

  function hideTopicIntro() {
    if (!topicIntro) return;
    topicIntro.classList.remove("open", "is-enter", "is-exit");
    topicIntro.hidden = true;
    topicIntro.setAttribute("aria-hidden", "true");
  }

  function preloadFirstVideo(topic, cb) {
    var list = topic && topic.videos ? topic.videos : [];
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

  function playTopicIntro(topic) {
    if (!topic || !topicContentCount(topic) || introActive) return;

    if (!topicIntro || !topicIntroTitle || prefersReducedMotion()) {
      closeTopicsModal();
      openReader(topic, false);
      return;
    }

    introActive = true;
    closeTopicsModal();
    ensureIntroPortal();

    const lowPerf = isLowPerfMode();
    const minMs = lowPerf ? INTRO_MIN_PERF_MS : INTRO_MIN_MS;
    const exitMs = lowPerf ? 260 : INTRO_EXIT_MS;
    let minTimeDone = false;
    let mediaReady = false;
    let introFinished = false;

    topicIntroTitle.textContent = topic.title;
    if (topicIntroCards) topicIntroCards.textContent = videoCountLabel(topicContentCount(topic));
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
        openReader(topic, true);
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

    preloadFirstVideo(topic, function () {
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

  function updateReaderUi() {
    var multi = videos.length > 1;
    if (readerNavWrap) {
      readerNavWrap.hidden = !multi;
      if (multi) readerNavWrap.removeAttribute("hidden");
      else readerNavWrap.setAttribute("hidden", "");
    }
    if (readerCount) {
      readerCount.textContent = videos.length ? videoIndex + 1 + " / " + videos.length : "";
    }
    if (readerPrev) readerPrev.disabled = videoIndex <= 0;
    if (readerNext) readerNext.disabled = videoIndex >= videos.length - 1;
  }

  function revealReaderUi() {
    setReaderLoading(false);
    setReaderReady(true);
    updateReaderUi();
  }

  function playVideoAt(index) {
    if (!reader || index < 0 || index >= videos.length) return;
    var token = ++loadToken;
    videoIndex = index;
    updateReaderUi();
    setReaderReady(false);
    setReaderLoading(true);
    hideAllPlayers();

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
        readerVideo.onended = function () {
          if (videoIndex < videos.length - 1) {
            playVideoAt(videoIndex + 1);
          }
        };
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

  function closeTopicsModal() {
    if (!topicsModal) return;
    topicsModal.classList.remove("open");
    topicsModal.setAttribute("aria-hidden", "true");
    topicsModal.hidden = true;
    viewMode = "lessons";
    selectedLesson = null;
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

  function renderTopics() {
    if (!topicsList) return;
    topicsList.innerHTML = "";
    topicsCache.forEach(function (t) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "roborox-topic-item";
      btn.dataset.topicId = t.id;
      btn.innerHTML = topicItemHtml(t.title, videoCountLabel(topicContentCount(t)), BRAND_EMOJI);
      topicsList.appendChild(btn);
    });
    syncGradeSubtitle();
    setBackVisible(true);
  }

  function showLessonTopics(lesson) {
    if (!lesson) return;
    selectedLesson = lesson;
    viewMode = "topics";
    topicsCache = lesson.topics.slice();
    renderTopics();
  }

  function goBackToLessons() {
    if (viewMode !== "topics" || !lessonsCache.length) return;
    viewMode = "lessons";
    selectedLesson = null;
    topicsCache = [];
    renderLessons();
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
      const snap = await database.ref(roboroxLearnPath()).get();
      const raw = snap.exists() ? snap.val() || {} : {};
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
        return;
      }

      var student = currentStudent();
      var grade = R.extractGrade(String((student && student.className) || (student && student.classId) || ""));
      var gradeText = R.gradeLabel(grade);
      topicsList.innerHTML =
        '<p class="roborox-topics-empty">Henüz ' +
        (gradeText ? "<strong>" + esc(gradeText) + "</strong> için " : "") +
        "ders videosu eklenmemiş.<br>Öğretmeniniz admin panelinden ders ve konu ekleyebilir.</p>";
      syncGradeSubtitle();
    } catch (e) {
      topicsList.innerHTML =
        '<p class="roborox-topics-empty">Yükleme hatası: ' + esc(e && e.message ? e.message : e) + "</p>";
    }
  }

  function openReader(topic, withIntroHandoff) {
    if (!reader || !topic) return;
    if (!topic.videos || !topic.videos.length) return;

    ensureReaderPortal();
    videos = topic.videos.slice();
    videoIndex = 0;
    loadToken += 1;
    reader.dataset.title = topic.title;
    closeTopicsModal();
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
    updateReaderUi();
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
    notifyMainScreenReturn();
  }

  if (learnOpenBtn) {
    learnOpenBtn.addEventListener("click", openLearnHub);
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
      const btn = e.target.closest("[data-topic-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-topic-id");
      const topic = topicsCache.find(function (t) {
        return t.id === id;
      });
      if (topic) playTopicIntro(topic);
    });
  }

  if (readerExit) {
    readerExit.addEventListener("click", closeReader);
  }

  if (readerPrev) {
    readerPrev.addEventListener("click", function () {
      if (videoIndex > 0) playVideoAt(videoIndex - 1);
    });
  }

  if (readerNext) {
    readerNext.addEventListener("click", function () {
      if (videoIndex < videos.length - 1) playVideoAt(videoIndex + 1);
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
      if (viewMode === "topics" && lessonsCache.length) {
        goBackToLessons();
        return;
      }
      closeTopicsModal();
      return;
    }
    if (!reader || !reader.classList.contains("open")) return;
    if (e.key === "Escape") closeReader();
    if (e.key === "ArrowRight" && videoIndex < videos.length - 1) playVideoAt(videoIndex + 1);
    if (e.key === "ArrowLeft" && videoIndex > 0) playVideoAt(videoIndex - 1);
  });

  window.novaOpenRoboroxTopicsModal = openTopicsModal;
  window.novaOpenLearnHubModal = openLearnHub;
})();
