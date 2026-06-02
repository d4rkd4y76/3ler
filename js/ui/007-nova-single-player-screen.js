/* Tek kişilik oyun — seçim ve soru ekranı tam ekran katman */
(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function moveToBody(el) {
    if (el && el.parentElement && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }

  function novaCloseSinglePlayerSelectScreen() {
    var sp = getEl('single-player-screen');
    var main = getEl('main-screen');
    try {
      if (window.novaPerfBeforeMainScreen) window.novaPerfBeforeMainScreen();
    } catch (_) {}
    document.body.classList.remove('nova-sp-screen-open');
    if (!document.body.classList.contains('nova-sp-game-open')) {
      try {
        document.body.style.overflow = '';
      } catch (_) {}
    }
    if (sp) {
      sp.style.display = 'none';
      sp.classList.remove('nova-sp-screen-visible');
      sp.setAttribute('aria-hidden', 'true');
    }
    if (main && !document.body.classList.contains('nova-sp-game-open')) {
      main.style.removeProperty('display');
    }
  }

  function novaOpenSinglePlayerSelectScreen() {
    var sp = getEl('single-player-screen');
    var main = getEl('main-screen');
    var student = getEl('student-selection-screen');
    try {
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-screen');
    } catch (_) {}
    document.body.classList.add('nova-sp-screen-open');
    try {
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    if (main) main.style.setProperty('display', 'none', 'important');
    if (student) student.style.display = 'none';
    if (sp) {
      moveToBody(sp);
      sp.classList.add('nova-sp-screen-visible');
      sp.style.display = 'flex';
      sp.setAttribute('aria-hidden', 'false');
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
    }
  }

  function novaHideSinglePlayerSelectForGame() {
    var sp = getEl('single-player-screen');
    document.body.classList.remove('nova-sp-screen-open');
    if (sp) {
      sp.style.display = 'none';
      sp.classList.remove('nova-sp-screen-visible');
      sp.setAttribute('aria-hidden', 'true');
    }
  }

  function novaOpenSinglePlayerGameScreen() {
    var game = getEl('single-player-game-screen');
    var main = getEl('main-screen');
    try {
      if (window.novaPerfBeforeGameScreen) window.novaPerfBeforeGameScreen('single-player-game-screen');
    } catch (_) {}
    document.body.classList.remove('nova-sp-screen-open');
    document.body.classList.add('nova-sp-game-open');
    try {
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    if (main) main.style.setProperty('display', 'none', 'important');
    if (game) {
      moveToBody(game);
      game.classList.add('nova-sp-game-visible');
      game.style.display = 'flex';
      game.setAttribute('aria-hidden', 'false');
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
    }
  }

  function novaCloseSinglePlayerGameScreen(opts) {
    var showMain = !opts || opts.showMain !== false;
    var game = getEl('single-player-game-screen');
    var main = getEl('main-screen');
    if (showMain) {
      try {
        if (window.novaPerfBeforeMainScreen) window.novaPerfBeforeMainScreen();
      } catch (_) {}
    }
    document.body.classList.remove('nova-sp-game-open');
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    if (game) {
      game.style.display = 'none';
      game.classList.remove('nova-sp-game-visible');
      game.setAttribute('aria-hidden', 'true');
    }
    if (main && showMain) main.style.removeProperty('display');
  }

  window.novaOpenSinglePlayerSelectScreen = novaOpenSinglePlayerSelectScreen;
  window.novaCloseSinglePlayerSelectScreen = novaCloseSinglePlayerSelectScreen;
  window.novaHideSinglePlayerSelectForGame = novaHideSinglePlayerSelectForGame;
  window.novaOpenSinglePlayerGameScreen = novaOpenSinglePlayerGameScreen;
  window.novaCloseSinglePlayerGameScreen = novaCloseSinglePlayerGameScreen;
})();
