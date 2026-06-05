/* Arka plan müziği kapalı — yalnızca efekt sesleri (Web Audio SFX) kullanılır */
(function () {
  'use strict';

  function createNoopTrack() {
    return {
      pause: function () {},
      play: function () {
        return Promise.resolve();
      },
      load: function () {},
      currentTime: 0,
      paused: true,
      loop: false
    };
  }

  window.__novaMusicDisabled = true;
  window.novaCreateMusicNoop = createNoopTrack;

  window.stopAllMusic = function () {
    if (typeof window.stopAllGameAudio === 'function') {
      try {
        window.stopAllGameAudio();
      } catch (_) {}
    }
  };
})();
