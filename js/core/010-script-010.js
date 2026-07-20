(function () {
  function isMeaningfulImage(el) {
    if (!el || el.tagName !== "IMG") return false;
    if (el.closest(".q-bunny-video")) return false;
    var src = String(el.getAttribute("src") || el.src || "").trim();
    if (!src || src === "about:blank" || src === "#") return false;
    return true;
  }

  function containerHasVideo(container) {
    if (!container) return false;
    if (container.getAttribute("data-q-has-video") === "1") return true;
    if (
      container.querySelector(
        ".question-preamble-block--video, .q-bunny-video[data-qbunny], .q-bunny-video iframe, .q-bunny-video video"
      )
    ) {
      return true;
    }
    if (container.querySelector('iframe[src*="mediadelivery.net"]')) return true;
    return false;
  }

  function containerHasImage(container) {
    if (!container) return false;
    if (container.getAttribute("data-q-has-image") === "1") return true;
    if (
      container.querySelector(
        ".question-preamble-block--image, .question-image, .question-info-image"
      )
    ) {
      return true;
    }
    var imgs = container.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      if (isMeaningfulImage(imgs[i])) return true;
    }
    return false;
  }

  function ensureBadgeRow(container) {
    if (!container) return null;
    var row = container.querySelector(".nova-q-type-badges");
    if (!row) {
      row = document.createElement("div");
      row.className = "nova-q-type-badges";
      row.setAttribute("aria-hidden", "true");
      container.insertBefore(row, container.firstChild);
    }
    var legacy = container.querySelector(".resimli-soru-banner");
    if (legacy) legacy.style.display = "none";
    return row;
  }

  function shouldShowBadgesForContainer(container) {
    var duelRoot = container.closest("#duel-game-screen");
    if (duelRoot && !container.classList.contains("nova-duel-q-panel")) {
      return false;
    }
    return true;
  }

  function updateContainerBadges(container) {
    if (!container) return;
    var row = ensureBadgeRow(container);
    if (!row) return;

    var show = shouldShowBadgesForContainer(container);
    var hasVideo = show && containerHasVideo(container);
    var hasImg = show && !hasVideo && containerHasImage(container);

    var wantVideo = hasVideo;
    var wantImage = hasImg;

    row.innerHTML = "";
    if (wantVideo) {
      var vb = document.createElement("span");
      vb.className = "nova-q-type-badge nova-q-type-badge--video";
      vb.textContent = "Videolu soru";
      row.appendChild(vb);
    } else if (wantImage) {
      var ib = document.createElement("span");
      ib.className = "nova-q-type-badge nova-q-type-badge--image";
      ib.textContent = "Resimli soru";
      row.appendChild(ib);
    }

    row.style.display = row.children.length ? "flex" : "none";
    container.classList.toggle("nova-q-has-video", wantVideo);
    container.classList.toggle("nova-q-has-image-badge", wantImage);
  }

  function updateAllBanners() {
    document.querySelectorAll(".question-container").forEach(updateContainerBadges);
  }

  window.novaUpdateQuestionTypeBadges = updateContainerBadges;

  var _bannerDebounce = null;
  function scheduleUpdateAllBanners() {
    if (_bannerDebounce !== null) clearTimeout(_bannerDebounce);
    _bannerDebounce = setTimeout(function () {
      _bannerDebounce = null;
      updateAllBanners();
    }, 40);
  }

  window.onNewQuestionLoaded = function () {
    updateAllBanners();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(updateAllBanners);
    }
    try {
      if (window.NovaQuestionMarkup && window.NovaQuestionMarkup.initBunnyVideos) {
        document.querySelectorAll(".question-container").forEach(function (c) {
          window.NovaQuestionMarkup.initBunnyVideos(c);
        });
      }
    } catch (_) {}
  };

  document.addEventListener("DOMContentLoaded", updateAllBanners, { once: true });

  var obs = new MutationObserver(function () {
    scheduleUpdateAllBanners();
  });
  obs.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src", "style", "class", "data-info", "data-image", "data-img", "data-q-has-image", "data-q-has-video"],
  });
})();
