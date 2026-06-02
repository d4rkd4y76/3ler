/* Düello seçim + oyun ekranı — tam ekran (tek kişilik ile aynı mantık) */
(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function moveToBody(el) {
    if (el && el.parentElement && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }

  function hideMain() {
    var main = getEl('main-screen');
    if (main) main.style.setProperty('display', 'none', 'important');
  }

  function novaOpenDuelSelectionScreen() {
    var duel = getEl('duel-selection-screen');
    var mm = getEl('matchmakingScreen');
    if (mm) {
      mm.style.display = 'none';
      mm.classList.remove('nova-duel-mm-visible');
    }
    document.body.classList.remove('nova-duel-game-open');
    document.body.classList.add('nova-duel-select-open');
    try {
      document.body.style.overflow = 'hidden';
      document.body.style.display = '';
      document.body.style.justifyContent = '';
      document.body.style.alignItems = '';
      document.body.style.minHeight = '';
    } catch (_) {}

    hideMain();
    if (typeof window.novaHideSinglePlayerSelectForGame === 'function') {
      window.novaHideSinglePlayerSelectForGame();
    }
    if (typeof window.novaCloseSinglePlayerGameScreen === 'function') {
      window.novaCloseSinglePlayerGameScreen({ showMain: false });
    }

    try {
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('duel-selection-screen');
    } catch (_) {}

    if (duel) {
      moveToBody(duel);
      duel.classList.add('nova-duel-select-visible', 'container');
      duel.classList.remove('nova-duel-game-visible');
      duel.style.removeProperty('width');
      duel.style.removeProperty('maxWidth');
      duel.style.removeProperty('background');
      duel.style.removeProperty('padding');
      duel.style.removeProperty('borderRadius');
      duel.style.removeProperty('boxShadow');
      duel.style.display = 'flex';
      duel.style.flexDirection = 'column';
      duel.setAttribute('aria-hidden', 'false');
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
    }

    try {
      if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime();
    } catch (_) {}
  }

  function forceHideEpicAndToolbar() {
    try {
      if (typeof window.novaEpicHideAll === 'function') window.novaEpicHideAll();
    } catch (_) {}
    var epic = getEl('nova-duel-epic-root');
    if (epic) {
      epic.classList.remove('ndep-open');
      epic.hidden = true;
      epic.setAttribute('aria-hidden', 'true');
    }
    var toolbar = getEl('nova-duel-scale-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
      toolbar.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('nova-duel-epic-active');
  }

  function novaOpenDuelGameScreen() {
    try {
      if (typeof window.hideWaitOverlay === 'function') window.hideWaitOverlay();
      forceHideEpicAndToolbar();
    } catch (_) {}
    var duelSel = getEl('duel-selection-screen');
    var game = getEl('duel-game-screen');
    var mm = getEl('matchmakingScreen');

    document.body.classList.remove('nova-duel-select-open');
    document.body.classList.add('nova-duel-game-open');
    try {
      document.documentElement.classList.add('nova-duel-game-open');
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.documentElement.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.inset = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.zoom = '1';
      document.body.style.transform = 'none';
      document.body.style.background = '#0a0f1c';
      document.body.style.display = 'block';
      document.body.style.justifyContent = '';
      document.body.style.alignItems = '';
      window.scrollTo(0, 0);
    } catch (_) {}

    hideMain();
    ['nova-duel-epic-root', 'matchmakingScreen', 'duel-selection-screen'].forEach(function (id) {
      var el = getEl(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.setAttribute('aria-hidden', 'true');
      }
    });
    if (duelSel) {
      duelSel.style.display = 'none';
      duelSel.classList.remove('nova-duel-select-visible');
      duelSel.setAttribute('aria-hidden', 'true');
    }
    if (mm) {
      mm.style.display = 'none';
      mm.classList.remove('nova-duel-mm-visible');
    }

    try {
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('duel-game-screen');
    } catch (_) {}

    if (game) {
      moveToBody(game);
      game.classList.add('nova-duel-game-visible');
      game.classList.remove('nova-scaled', 'ndg-duel-finished');
      game.style.setProperty('zoom', '1', 'important');
      game.style.setProperty('transform', 'none', 'important');
      game.style.setProperty('max-width', 'none', 'important');
      game.style.setProperty('width', '100vw', 'important');
      game.style.setProperty('height', '100dvh', 'important');
      game.style.removeProperty('transform');
      game.style.display = 'flex';
      game.setAttribute('aria-hidden', 'false');
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
    }

    try {
      if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime();
    } catch (_) {}

    try {
      if (typeof window.novaDuelArenaVideoStart === 'function') {
        window.novaDuelArenaVideoStart();
      }
    } catch (_) {}
  }

  function novaCloseDuelScreens() {
    var duelSel = getEl('duel-selection-screen');
    var game = getEl('duel-game-screen');
    var main = getEl('main-screen');

    try {
      if (window.novaPerfBeforeMainScreen) window.novaPerfBeforeMainScreen();
    } catch (_) {}

    document.body.classList.remove('nova-duel-select-open', 'nova-duel-game-open');
    try {
      document.documentElement.classList.remove('nova-duel-game-open');
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.inset = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.zoom = '';
      document.body.style.transform = '';
      document.body.style.background = '';
    } catch (_) {}

    if (duelSel) {
      duelSel.style.display = 'none';
      duelSel.classList.remove('nova-duel-select-visible');
      duelSel.setAttribute('aria-hidden', 'true');
    }
    if (game) {
      game.style.display = 'none';
      game.classList.remove('nova-duel-game-visible', 'nova-scaled');
      game.setAttribute('aria-hidden', 'true');
    }
    if (main) main.style.removeProperty('display');

    try {
      if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime();
    } catch (_) {}

    try {
      if (typeof window.novaDuelArenaVideoStop === 'function') {
        window.novaDuelArenaVideoStop();
      }
    } catch (_) {}
  }
  window.novaOpenDuelSelectionScreen = novaOpenDuelSelectionScreen;
  window.novaOpenDuelGameScreen = novaOpenDuelGameScreen;
  window.novaCloseDuelScreens = novaCloseDuelScreens;
})();
