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
      window.novaCloseSinglePlayerGameScreen();
    }

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
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('duel-selection-screen');
      if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime();
    } catch (_) {}
  }

  function novaOpenDuelGameScreen() {
    var duelSel = getEl('duel-selection-screen');
    var game = getEl('duel-game-screen');
    var mm = getEl('matchmakingScreen');

    document.body.classList.remove('nova-duel-select-open');
    document.body.classList.add('nova-duel-game-open');
    try {
      document.body.style.overflow = 'hidden';
      document.body.style.display = '';
      document.body.style.justifyContent = '';
      document.body.style.alignItems = '';
    } catch (_) {}

    hideMain();
    if (duelSel) {
      duelSel.style.display = 'none';
      duelSel.classList.remove('nova-duel-select-visible');
      duelSel.setAttribute('aria-hidden', 'true');
    }
    if (mm) {
      mm.style.display = 'none';
      mm.classList.remove('nova-duel-mm-visible');
    }

    if (game) {
      moveToBody(game);
      game.classList.add('nova-duel-game-visible');
      game.classList.remove('nova-scaled');
      game.style.removeProperty('transform');
      game.style.display = 'flex';
      game.setAttribute('aria-hidden', 'false');
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
    }

    try {
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('duel-game-screen');
      if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime();
    } catch (_) {}
  }

  function novaCloseDuelScreens() {
    var duelSel = getEl('duel-selection-screen');
    var game = getEl('duel-game-screen');
    var main = getEl('main-screen');

    document.body.classList.remove('nova-duel-select-open', 'nova-duel-game-open');
    try {
      document.body.style.overflow = '';
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
  }

  window.novaOpenDuelSelectionScreen = novaOpenDuelSelectionScreen;
  window.novaOpenDuelGameScreen = novaOpenDuelGameScreen;
  window.novaCloseDuelScreens = novaCloseDuelScreens;
})();
