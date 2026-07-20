/* Düello — YILDIZ ARENASI açılış kartı (sorulardan hemen önce) */
(function () {
  if (window.__novaDuelArenaIntroInstalled) return;
  window.__novaDuelArenaIntroInstalled = true;

  var INTRO_MS = 3200;
  var REDUCED_MS = 1600;

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) {
      return false;
    }
  }

  function getGameScreen() {
    return document.getElementById('duel-game-screen');
  }

  function ensureIntroEl() {
    var game = getGameScreen();
    if (!game) return null;

    var el = document.getElementById('ndg-arena-intro');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'ndg-arena-intro';
    el.className = 'ndg-arena-intro';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="ndg-arena-intro__veil" aria-hidden="true"></div>' +
      '<div class="ndg-arena-intro__neon ndg-arena-intro__neon--left" aria-hidden="true"></div>' +
      '<div class="ndg-arena-intro__neon ndg-arena-intro__neon--right" aria-hidden="true"></div>' +
      '<div class="ndg-arena-intro__spark ndg-arena-intro__spark--a" aria-hidden="true"></div>' +
      '<div class="ndg-arena-intro__spark ndg-arena-intro__spark--b" aria-hidden="true"></div>' +
      '<div class="ndg-arena-intro__spark ndg-arena-intro__spark--c" aria-hidden="true"></div>' +
      '<div class="ndg-arena-intro__panel">' +
      '<div class="ndg-arena-intro__kicker">ARENA</div>' +
      '<h2 class="ndg-arena-intro__title" id="ndg-arena-intro-title">YILDIZ ARENASI</h2>' +
      '<div class="ndg-arena-intro__divider" aria-hidden="true"></div>' +
      '<p class="ndg-arena-intro__wish" id="ndg-arena-intro-wish">Başarılar</p>' +
      '</div>';

    var videoLayer = game.querySelector('.ndg-arena-video-layer');
    if (videoLayer && videoLayer.nextSibling) {
      game.insertBefore(el, videoLayer.nextSibling);
    } else {
      game.appendChild(el);
    }
    return el;
  }

  function setActive(on) {
    var game = getGameScreen();
    if (game) game.classList.toggle('ndg-arena-intro-active', !!on);
  }

  window.novaDuelShowArenaIntro = function novaDuelShowArenaIntro(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var game = getGameScreen();
      if (!game) {
        resolve();
        return;
      }

      var el = ensureIntroEl();
      if (!el) {
        resolve();
        return;
      }

      var title = opts.title || 'YILDIZ ARENASI';
      var wish = opts.wish || 'Başarılar';
      var titleEl = document.getElementById('ndg-arena-intro-title');
      var wishEl = document.getElementById('ndg-arena-intro-wish');
      if (titleEl) titleEl.textContent = title;
      if (wishEl) wishEl.textContent = wish;

      var reduced = prefersReducedMotion();
      var total = reduced ? REDUCED_MS : opts.durationMs || INTRO_MS;

      el.classList.remove('ndg-arena-intro--exit', 'ndg-arena-intro--visible');
      el.setAttribute('aria-hidden', 'false');
      setActive(true);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add('ndg-arena-intro--visible');
        });
      });

      var exitAt = Math.max(900, total - (reduced ? 400 : 850));

      setTimeout(function () {
        el.classList.add('ndg-arena-intro--exit');
      }, exitAt);

      setTimeout(function () {
        el.classList.remove('ndg-arena-intro--visible', 'ndg-arena-intro--exit');
        el.setAttribute('aria-hidden', 'true');
        setActive(false);
        resolve();
      }, total);
    });
  };

  window.novaDuelHideArenaIntro = function novaDuelHideArenaIntro() {
    var el = document.getElementById('ndg-arena-intro');
    if (el) {
      el.classList.remove('ndg-arena-intro--visible', 'ndg-arena-intro--exit');
      el.setAttribute('aria-hidden', 'true');
    }
    setActive(false);
  };
})();
