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
  const pageBase = document.getElementById("roborox-page-base");
  const pageBaseImg = document.getElementById("roborox-page-base-img");
  const flipHost = document.getElementById("roborox-page-flip-host");

  let topicsCache = [];
  let images = [];
  let pageIndex = 0;
  let animating = false;
  let touchStartX = 0;

  function lockScroll(on) {
    document.body.style.overflow = on ? "hidden" : "";
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

  function setBaseImage(url) {
    if (!pageBaseImg) return;
    pageBaseImg.src = url || "";
    pageBaseImg.alt = (reader.dataset.title || "Sayfa") + " — " + (pageIndex + 1);
  }

  function clearFlipper() {
    if (flipHost) flipHost.innerHTML = "";
  }

  function openReader(topic) {
    if (!reader || !topic || !topic.images.length) return;
    images = topic.images.slice();
    pageIndex = 0;
    animating = false;
    reader.dataset.title = topic.title;
    clearFlipper();
    setBaseImage(images[0]);
    updateReaderUi();
    closeTopicsModal();
    reader.hidden = false;
    reader.classList.add("open");
    reader.setAttribute("aria-hidden", "false");
    lockScroll(true);
  }

  function closeReader() {
    if (!reader) return;
    reader.classList.remove("open");
    reader.setAttribute("aria-hidden", "true");
    reader.hidden = true;
    clearFlipper();
    images = [];
    pageIndex = 0;
    animating = false;
    lockScroll(false);
  }

  function buildFlipLayer(fromUrl, toUrl, direction) {
    const flip = document.createElement("div");
    flip.className = "roborox-page-flip";

    const front = document.createElement("div");
    front.className = "roborox-page-face roborox-page-face--front";
    const frontImg = document.createElement("img");
    frontImg.src = fromUrl;
    frontImg.alt = "";
    frontImg.draggable = false;
    front.appendChild(frontImg);

    const back = document.createElement("div");
    back.className = "roborox-page-face roborox-page-face--back";
    const backImg = document.createElement("img");
    backImg.src = toUrl;
    backImg.alt = "";
    backImg.draggable = false;
    back.appendChild(backImg);

    flip.appendChild(front);
    flip.appendChild(back);

    if (direction === "prev") {
      flip.style.transformOrigin = "right center";
      flip.style.transform = "rotateY(180deg)";
    }

    return flip;
  }

  function animatePage(direction) {
    if (animating || !flipHost || !pageBaseImg) return;
    if (direction === "next" && pageIndex >= images.length - 1) return;
    if (direction === "prev" && pageIndex <= 0) return;

    animating = true;
    updateReaderUi();

    const fromIdx = pageIndex;
    const toIdx = direction === "next" ? pageIndex + 1 : pageIndex - 1;
    const fromUrl = images[fromIdx];
    const toUrl = images[toIdx];

    clearFlipper();

    if (direction === "prev") {
      setBaseImage(toUrl);
      const flip = buildFlipLayer(toUrl, fromUrl, "prev");
      flip.style.transformOrigin = "right center";
      flip.style.transform = "rotateY(180deg)";
      flipHost.appendChild(flip);
      requestAnimationFrame(function () {
        flip.classList.add("is-turning");
        requestAnimationFrame(function () {
          flip.style.transform = "rotateY(0deg)";
        });
      });
      flip.addEventListener(
        "transitionend",
        function onEnd(ev) {
          if (ev.propertyName !== "transform") return;
          flip.removeEventListener("transitionend", onEnd);
          pageIndex = toIdx;
          setBaseImage(images[pageIndex]);
          clearFlipper();
          animating = false;
          updateReaderUi();
        },
        { once: false }
      );
      return;
    }

    const flip = buildFlipLayer(fromUrl, toUrl, "next");
    flipHost.appendChild(flip);
    requestAnimationFrame(function () {
      flip.classList.add("is-turning");
      requestAnimationFrame(function () {
        flip.classList.add("is-turned");
      });
    });

    flip.addEventListener(
      "transitionend",
      function onEnd(ev) {
        if (ev.propertyName !== "transform") return;
        flip.removeEventListener("transitionend", onEnd);
        pageIndex = toIdx;
        setBaseImage(images[pageIndex]);
        clearFlipper();
        animating = false;
        updateReaderUi();
      },
      { once: false }
    );
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

  if (reader) {
    reader.addEventListener("click", function (e) {
      if (e.target === reader) closeReader();
    });

    reader.addEventListener(
      "touchstart",
      function (e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );

    reader.addEventListener(
      "touchend",
      function (e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) animatePage("next");
        else animatePage("prev");
      },
      { passive: true }
    );
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
