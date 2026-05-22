/* Tek kişilik oyun seçim ekranı — tam ekran katman */
(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function novaCloseSinglePlayerSelectScreen() {
    var sp = getEl('single-player-screen');
    var main = getEl('main-screen');
    document.body.classList.remove('nova-sp-screen-open');
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    if (sp) {
      sp.style.display = 'none';
      sp.classList.remove('nova-sp-screen-visible');
      sp.setAttribute('aria-hidden', 'true');
    }
    if (main) main.style.removeProperty('display');
  }

  function novaOpenSinglePlayerSelectScreen() {
    var sp = getEl('single-player-screen');
    var main = getEl('main-screen');
    var student = getEl('student-selection-screen');
    document.body.classList.add('nova-sp-screen-open');
    try {
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    if (main) main.style.setProperty('display', 'none', 'important');
    if (student) student.style.display = 'none';
    if (sp) {
      if (sp.parentElement && sp.parentElement !== document.body) {
        document.body.appendChild(sp);
      }
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

  window.novaOpenSinglePlayerSelectScreen = novaOpenSinglePlayerSelectScreen;
  window.novaCloseSinglePlayerSelectScreen = novaCloseSinglePlayerSelectScreen;
  window.novaHideSinglePlayerSelectForGame = novaHideSinglePlayerSelectForGame;
})();
