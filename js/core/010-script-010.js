(function () {
  function isMeaningfulImage(el) {
    if (!el || el.tagName !== 'IMG') return false;
    var src = String(el.getAttribute('src') || el.src || '').trim();
    if (!src || src === 'about:blank' || src === '#') return false;
    try {
      var st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      if (parseFloat(st.opacity || '1') < 0.05) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return false;
    } catch (_) {}
    return true;
  }

  function elementHasVisibleBackgroundImage(el) {
    if (!el || el.nodeType !== 1) return false;
    try {
      var st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
      var bg = st.backgroundImage;
      if (!bg || bg === 'none' || bg.indexOf('url(') < 0) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return false;
    } catch (_) {
      return false;
    }
    return true;
  }

  function ensureBanner(container) {
    if (!container) return null;
    var banner = container.querySelector('.resimli-soru-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'resimli-soru-banner';
      banner.textContent = '📷 RESİMLİ SORU';
      container.insertBefore(banner, container.firstChild);
    }
    return banner;
  }

  function containerHasImage(container) {
    if (!container) return false;

    var imgs = container.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      if (isMeaningfulImage(imgs[i])) return true;
    }

    var nodes = container.querySelectorAll('*');
    for (var j = 0; j < nodes.length; j++) {
      if (elementHasVisibleBackgroundImage(nodes[j])) return true;
    }

    return false;
  }

  function shouldShowBannerForContainer(container, hasImg) {
    if (!hasImg) return false;
    var duelRoot = container.closest('#duel-game-screen');
    if (duelRoot && !container.classList.contains('nova-duel-q-panel')) {
      return false;
    }
    return true;
  }

  function updateAllBanners() {
    document.querySelectorAll('.question-container').forEach(function (container) {
      var banner = ensureBanner(container);
      var hasImg = containerHasImage(container);
      banner.style.display = shouldShowBannerForContainer(container, hasImg)
        ? 'block'
        : 'none';
    });
  }

  var _bannerDebounce = null;
  function scheduleUpdateAllBanners() {
    if (_bannerDebounce !== null) clearTimeout(_bannerDebounce);
    _bannerDebounce = setTimeout(function () {
      _bannerDebounce = null;
      updateAllBanners();
    }, 150);
  }

  window.onNewQuestionLoaded = function () {
    updateAllBanners();
  };

  document.addEventListener('DOMContentLoaded', updateAllBanners, { once: true });

  var obs = new MutationObserver(function () {
    scheduleUpdateAllBanners();
  });
  obs.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'style', 'class', 'data-info', 'data-image', 'data-img'],
  });

  setInterval(updateAllBanners, 8000);
})();
