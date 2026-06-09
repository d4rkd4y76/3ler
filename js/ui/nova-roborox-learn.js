/**
 * Roborox ile Konuları Öğren — ders listesi → konu listesi → kitap sayfası okuyucu
 */
(function () {
  "use strict";

  var R = window.NovaRoboroxData;

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
  const readerTitle = document.getElementById("roborox-reader-title");
  const readerCount = document.getElementById("roborox-reader-count");
  const readerClose = document.getElementById("roborox-reader-close");
  const readerPrev = document.getElementById("roborox-reader-prev");
  const readerNext = document.getElementById("roborox-reader-next");
  const pageViewport = document.getElementById("roborox-page-viewport");
  const pageA = document.getElementById("roborox-page-a");
  const pageB = document.getElementById("roborox-page-b");
  const topicIntro = document.getElementById("roborox-topic-intro");
  const topicIntroTitle = document.getElementById("roborox-topic-intro-title");

  const SLIDE_MS = 500;
  const INTRO_MIN_MS = 1100;
  const INTRO_MIN_PERF_MS = 580;
  const INTRO_MAX_MS = 2600;
  const INTRO_EXIT_MS = 380;
  let activePage = pageA;
  let idlePage = pageB;

  let viewMode = "lessons";
  let lessonsCache = [];
  let topicsCache = [];
  let selectedLesson = null;
  let studentGrade = null;
  let images = [];
  let pageIndex = 0;
  let animating = false;
  let introActive = false;
  let touchStartX = 0;

  function lockScroll(on) {
    document.body.style.overflow = on ? "hidden" : "";
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
      topicsSubtitle.textContent = "Görsel derslerle konuları adım adım keşfet.";
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

  function preloadFirstImage(url, cb) {
    if (!url) {
      cb(false);
      return;
    }
    const img = new Image();
    img.decoding = "async";
    let done = false;
    function finish(ok) {
      if (done) return;
      done = true;
      cb(!!ok);
    }
    img.onload = function () {
      finish(true);
    };
    img.onerror = function () {
      finish(false);
    };
    img.src = url;
  }

  function playTopicIntro(topic) {
    if (!topic || !topic.images.length || introActive) return;

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
    let imageReady = false;
    let introFinished = false;

    topicIntroTitle.textContent = topic.title;
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
      if (!minTimeDone || !imageReady || introFinished) return;
      finishIntro();
    }

    window.setTimeout(function () {
      minTimeDone = true;
      tryFinishIntro();
    }, minMs);

    window.setTimeout(function () {
      imageReady = true;
      tryFinishIntro();
    }, INTRO_MAX_MS);

    preloadFirstImage(topic.images[0], function () {
      imageReady = true;
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
      btn.innerHTML =
        '<span class="roborox-topic-item__ico" aria-hidden="true">' +
        esc(lesson.icon || "📚") +
        "</span>" +
        '<span><span class="roborox-topic-item__title">' +
        esc(lesson.name) +
        '</span><span class="roborox-topic-item__meta">' +
        lesson.topics.length +
        " konu</span></span>";
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
      btn.innerHTML =
        '<span class="roborox-topic-item__ico" aria-hidden="true">📖</span>' +
        '<span><span class="roborox-topic-item__title">' +
        esc(t.title) +
        '</span><span class="roborox-topic-item__meta">' +
        t.images.length +
        " sayfa</span></span>";
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
        "Roborox dersi eklenmemiş.<br>Öğretmeniniz admin panelinden ders ve konu ekleyebilir.</p>";
      syncGradeSubtitle();
    } catch (e) {
      topicsList.innerHTML =
        '<p class="roborox-topics-empty">Yükleme hatası: ' + esc(e && e.message ? e.message : e) + "</p>";
    }
  }

  function updateReaderUi() {
    if (readerTitle) readerTitle.textContent = reader.dataset.title || "Roborox";
    if (readerCount) readerCount.textContent = images.length ? pageIndex + 1 + " / " + images.length : "";
    if (readerPrev) readerPrev.disabled = animating || pageIndex <= 0;
    if (readerNext) readerNext.disabled = animating || pageIndex >= images.length - 1;
  }

  function resetPageClasses(img) {
    if (!img) return;
    img.className = "roborox-page-layer";
  }

  function showPage(img, url) {
    if (!img) return;
    resetPageClasses(img);
    img.classList.add("is-active", "is-settled");
    img.src = url || "";
    img.alt = (reader && reader.dataset.title ? reader.dataset.title : "Sayfa") + " — " + (pageIndex + 1);
  }

  function preloadAdjacent() {
    [pageIndex - 1, pageIndex + 1].forEach(function (i) {
      if (i < 0 || i >= images.length) return;
      const pre = new Image();
      pre.decoding = "async";
      pre.src = images[i];
    });
  }

  function openReader(topic, withIntroHandoff) {
    if (!reader || !topic || !topic.images.length) return;
    ensureReaderPortal();
    images = topic.images.slice();
    pageIndex = 0;
    animating = false;
    reader.dataset.title = topic.title;
    activePage = pageA;
    idlePage = pageB;
    resetPageClasses(pageA);
    resetPageClasses(pageB);
    showPage(activePage, images[0]);
    preloadAdjacent();
    updateReaderUi();
    closeTopicsModal();
    reader.hidden = false;
    reader.classList.remove("is-open-ready");
    if (withIntroHandoff) reader.classList.add("is-opening");
    else reader.classList.remove("is-opening");
    reader.classList.add("open");
    reader.setAttribute("aria-hidden", "false");
    setReaderBodyLock(true);
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
    reader.classList.remove("open");
    reader.setAttribute("aria-hidden", "true");
    reader.hidden = true;
    resetPageClasses(pageA);
    resetPageClasses(pageB);
    if (pageA) pageA.removeAttribute("src");
    if (pageB) pageB.removeAttribute("src");
    images = [];
    pageIndex = 0;
    animating = false;
    setReaderBodyLock(false);
  }

  function finishSlide(toIdx, incoming, outgoing) {
    pageIndex = toIdx;
    resetPageClasses(outgoing);
    resetPageClasses(incoming);
    incoming.classList.add("is-active", "is-settled");
    animating = false;
    updateReaderUi();
    preloadAdjacent();
  }

  function whenPageReady(img, cb) {
    if (!img) {
      cb();
      return;
    }
    if (img.complete && img.naturalWidth > 0) {
      cb();
      return;
    }
    function done() {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      cb();
    }
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  }

  function runSlideTransition(incoming, outgoing, enterClass, exitClass, toIdx) {
    incoming.classList.add(enterClass);
    outgoing.classList.add("is-active");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        incoming.classList.remove(enterClass);
        incoming.classList.add("is-settled");
        outgoing.classList.add(exitClass);
      });
    });

    let finished = false;
    function complete() {
      if (finished) return;
      finished = true;
      activePage = incoming;
      idlePage = outgoing;
      finishSlide(toIdx, incoming, outgoing);
    }

    const timer = window.setTimeout(complete, SLIDE_MS + 80);
    function onEnd(ev) {
      if (ev.target !== incoming) return;
      if (ev.propertyName !== "transform" && ev.propertyName !== "opacity") return;
      window.clearTimeout(timer);
      incoming.removeEventListener("transitionend", onEnd);
      complete();
    }
    incoming.addEventListener("transitionend", onEnd, { passive: true });
  }

  function animatePage(direction) {
    if (animating || !activePage || !idlePage || !pageViewport) return;
    if (direction === "next" && pageIndex >= images.length - 1) return;
    if (direction === "prev" && pageIndex <= 0) return;

    const toIdx = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    const incoming = idlePage;
    const outgoing = activePage;
    const toUrl = images[toIdx];

    animating = true;
    updateReaderUi();

    resetPageClasses(incoming);
    resetPageClasses(outgoing);
    incoming.src = toUrl;
    incoming.alt = (reader.dataset.title || "Sayfa") + " — " + (toIdx + 1);

    const enterClass = direction === "next" ? "is-enter-right" : "is-enter-left";
    const exitClass = direction === "next" ? "is-exit-left" : "is-exit-right";

    whenPageReady(incoming, function () {
      if (!animating || incoming.src !== toUrl) return;
      runSlideTransition(incoming, outgoing, enterClass, exitClass, toIdx);
    });
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

  if (readerClose) {
    readerClose.addEventListener("click", closeReader);
  }

  if (readerPrev) {
    readerPrev.addEventListener("click", function () {
      animatePage("prev");
    });
  }

  if (readerNext) {
    readerNext.addEventListener("click", function () {
      animatePage("next");
    });
  }

  if (pageViewport) {
    pageViewport.addEventListener(
      "touchstart",
      function (e) {
        if (animating) return;
        if (!e.changedTouches || !e.changedTouches[0]) return;
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );

    pageViewport.addEventListener(
      "touchend",
      function (e) {
        if (animating) return;
        if (!e.changedTouches || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 52) return;
        if (dx < 0) animatePage("next");
        else animatePage("prev");
      },
      { passive: true }
    );
  }

  if (reader) {
    reader.addEventListener("click", function (e) {
      if (e.target === reader && !animating) closeReader();
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
    if (e.key === "ArrowRight") animatePage("next");
    if (e.key === "ArrowLeft") animatePage("prev");
  });

  window.novaOpenRoboroxTopicsModal = openTopicsModal;
  window.novaOpenLearnHubModal = openLearnHub;
})();
