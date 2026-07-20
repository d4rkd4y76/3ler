/* Düello — duello-bg-loop.mp4
   Yıldız parıltı videosu, kare analizi + gömülü morph loop.
   Segment 2.5s→5.958s | son↔ilk kare diff 0.52 | native loop, sıfır JS efekti.
*/
(function () {
  if (window.__novaDuelArenaVideoInstalled) return;
  window.__novaDuelArenaVideoInstalled = true;

  function resolveArenaSrc() {
    if (typeof window.novaCdnIsEnabled === 'function' && window.novaCdnIsEnabled()) {
      if (typeof window.novaResolveAssetUrl === 'function') {
        return window.novaResolveAssetUrl('video/duello-bg-loop.mp4');
      }
    }
    return 'duello-bg-loop.mp4';
  }
  var layer, video, running;

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

  function ensureLayer() {
    var game = getGameScreen();
    if (!game) return null;

    layer = game.querySelector('.ndg-arena-video-layer');
    if (layer) {
      video = document.getElementById('ndg-arena-video-a');
      if (video && video.getAttribute('src') !== resolveArenaSrc()) {
        video.setAttribute('src', resolveArenaSrc());
      }
      return layer;
    }

    layer = document.createElement('div');
    layer.className = 'ndg-arena-video-layer';
    layer.setAttribute('aria-hidden', 'true');

    var scrim = document.createElement('div');
    scrim.className = 'ndg-arena-video-scrim';

    video = document.createElement('video');
    video.id = 'ndg-arena-video-a';
    video.className = 'ndg-arena-video is-front';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.controls = false;
    video.loop = true;
    video.src = resolveArenaSrc();

    layer.appendChild(video);
    layer.appendChild(scrim);
    game.insertBefore(layer, game.firstChild);
    return layer;
  }

  function onVisibility() {
    if (!running || !video) return;
    if (document.hidden) {
      try {
        video.pause();
      } catch (_) {}
    } else {
      try {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } catch (_) {}
    }
  }

  function playWithGestureFallback() {
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        var retry = function () {
          document.removeEventListener('pointerdown', retry, true);
          if (running && video) {
            var p2 = video.play();
            if (p2 && p2.catch) p2.catch(function () {});
          }
        };
        document.addEventListener('pointerdown', retry, true);
      });
    }
  }

  window.novaDuelArenaVideoStart = function novaDuelArenaVideoStart() {
    if (prefersReducedMotion()) return;
    var game = getGameScreen();
    if (!game) return;

    ensureLayer();
    if (!video) return;

    running = true;
    game.classList.add('ndg-arena-video-on');

    video.loop = true;
    video.style.opacity = '1';
    video.style.transform = 'translateZ(0)';
    video.style.filter = '';
    video.classList.add('is-front');

    playWithGestureFallback();
  };

  window.novaDuelArenaVideoStop = function novaDuelArenaVideoStop() {
    running = false;
    var game = getGameScreen();
    if (game) game.classList.remove('ndg-arena-video-on');
    try {
      if (video) video.pause();
    } catch (_) {}
  };

  document.addEventListener('visibilitychange', onVisibility, { passive: true });
})();
