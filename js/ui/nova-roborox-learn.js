/**
 * Roborox ile Konuları Öğren — konu listesi + kitap sayfası okuyucu
 */
(function () {
  "use strict";

  function extractGrade(v) {
    if (typeof window.__novaExtractGradeNumber === "function") {
      const g = window.__novaExtractGradeNumber(v);
      if (g) return g;
    }
    const s = String(v || "");
    const m = s.match(/\b([1-4])\b/);
    return m ? Number(m[1]) : null;
  }

  function roboroxLearnPath() {
    let student = null;
    try {
      student = window.selectedStudent || JSON.parse(localStorage.getItem("selectedStudent") || "null");
    } catch (_) {}
    const classId = String((student && student.classId) || "").trim();
    const className = String((student && student.className) || "").trim();
    const grade = extractGrade(className || classId);
    if (grade === 3) return "roboroxLearn";
    if (grade >= 1 && grade <= 4) return "classContent/sinif" + grade + "/roboroxLearn";
    if (classId) return "classContent/class_" + classId.replace(/[^\w-]/g, "_") + "/roboroxLearn";
    return "roboroxLearn";
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

  const SLIDE_MS = 500;
  let activePage = pageA;
  let idlePage = pageB;

  let topicsCache = [];
  let images = [];
  let pageIndex = 0;
  let animating = false;
  let touchStartX = 0;

  function lockScroll(on) {
    document.body.style.overflow = on ? "hidden" : "";
  }

  function ensureReaderPortal() {
    if (reader && reader.parentElement !== document.body) {
      document.body.appendChild(reader);
    }
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
    lockScroll(false);
  }

  function openTopicsModal() {
    if (!topicsModal) return;
    topicsModal.hidden = false;
    topicsModal.classList.add("open");
    topicsModal.setAttribute("aria-hidden", "false");
    lockScroll(true);
    loadTopics();
  }

  async function loadTopics() {
    if (!topicsList) return;
    topicsList.innerHTML = '<p class="roborox-topics-empty">Konular yükleniyor…</p>';
    const database = db();
    if (!database) {
      topicsList.innerHTML = '<p class="roborox-topics-empty">Bağlantı kurulamadı.</p>';
      return;
    }
    try {
      const snap = await database.ref(roboroxLearnPath()).get();
      const raw = snap.exists() ? snap.val() || {} : {};
      topicsCache = Object.keys(raw)
        .map(function (id) {
          const v = raw[id] || {};
          const imgs = Array.isArray(v.images)
            ? v.images.filter(Boolean)
            : v.imageUrls && typeof v.imageUrls === "object"
              ? Object.keys(v.imageUrls)
                  .sort()
                  .map(function (k) {
                    return v.imageUrls[k];
                  })
                  .filter(Boolean)
              : [];
          return {
            id: id,
            title: String(v.title || "Konu").trim() || "Konu",
            order: Number(v.order) || 0,
            active: v.active !== false,
            images: imgs.filter(function (u) {
              return typeof u === "string" && u.trim();
            }),
          };
        })
        .filter(function (t) {
          return t.active && t.images.length > 0;
        })
        .sort(function (a, b) {
          return a.order - b.order || a.title.localeCompare(b.title, "tr");
        });

      if (!topicsCache.length) {
        topicsList.innerHTML =
          '<p class="roborox-topics-empty">Henüz bu sınıf için Roborox konusu eklenmemiş.<br>Öğretmeniniz admin panelinden ekleyebilir.</p>';
        return;
      }

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

  function setBaseImage(url) {
    showPage(activePage, url);
    resetPageClasses(idlePage);
    preloadAdjacent();
  }

  function openReader(topic) {
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
    reader.classList.add("open");
    reader.setAttribute("aria-hidden", "false");
    setReaderBodyLock(true);
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

  if (topicsModal) {
    topicsModal.addEventListener("click", function (e) {
      if (e.target === topicsModal) closeTopicsModal();
    });
  }

  if (topicsList) {
    topicsList.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-topic-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-topic-id");
      const topic = topicsCache.find(function (t) {
        return t.id === id;
      });
      if (topic) openReader(topic);
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
    if (!reader || !reader.classList.contains("open")) return;
    if (e.key === "Escape") closeReader();
    if (e.key === "ArrowRight") animatePage("next");
    if (e.key === "ArrowLeft") animatePage("prev");
  });

  window.novaOpenRoboroxTopicsModal = openTopicsModal;
  window.novaOpenLearnHubModal = openLearnHub;
})();
