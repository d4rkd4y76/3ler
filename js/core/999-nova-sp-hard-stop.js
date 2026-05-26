// === NOVA: Single Player Hard-Stop Result Mode (Emergency) ===
// Amaç: Son sorudan sonra tarayıcıyı kilitleyen ağır patch/observer zincirlerini bypass etmek.
(function () {
  if (window.__novaSpHardStopInstalled) return;
  window.__novaSpHardStopInstalled = true;

  function $(id) { return document.getElementById(id); }

  function safeShowResults() {
    if (window.__novaSpHardStopRunning) return;
    window.__novaSpHardStopRunning = true;
    try {
      // Stop timers if present
      try { if (typeof window.timer !== 'undefined' && window.timer) clearInterval(window.timer); } catch (_) {}
      try { if (typeof window.duelTimer !== 'undefined' && window.duelTimer) clearInterval(window.duelTimer); } catch (_) {}

      var game = $('single-player-game-screen');
      var scoreC = $('score-container') || document.querySelector('.single-player-game-container .score-container');
      var scoreText = $('score');
      var scoreMsg = $('score-message');
      var scoreImg = $('score-image');
      var backBtn = $('final-back-button');
      var againBtn = $('btnTekrar');

      // Hide question UI pieces quickly
      try { var qn = $('question-number'); if (qn) qn.style.display = 'none'; } catch (_) {}
      try { var pc = document.querySelector('.progress-container'); if (pc) pc.style.display = 'none'; } catch (_) {}
      try { var tc = document.querySelector('.timer-container'); if (tc) tc.style.display = 'none'; } catch (_) {}
      try { var qc = document.querySelector('.question-container'); if (qc) qc.style.display = 'none'; } catch (_) {}
      try { var oc = $('options-container'); if (oc) oc.style.display = 'none'; } catch (_) {}
      try { var expl = $('explanation-container'); if (expl) { expl.style.display = 'none'; expl.innerHTML = ''; } } catch (_) {}

      // Make sure game screen visible
      try {
        if (typeof window.novaOpenSinglePlayerGameScreen === 'function') window.novaOpenSinglePlayerGameScreen();
        else if (game) game.style.display = 'flex';
      } catch (_) {
        if (game) game.style.display = 'flex';
      }

      // Show score container
      try {
        if (game) game.classList.add('nova-sp-result-open');
      } catch (_) {}
      try {
        if (scoreC) {
          scoreC.style.display = 'flex';
          scoreC.style.visibility = 'visible';
          scoreC.style.opacity = '1';
        }
      } catch (_) {}
      try { if (backBtn) backBtn.style.display = 'inline-flex'; } catch (_) {}
      try { if (againBtn) againBtn.style.display = 'inline-flex'; } catch (_) {}

      // Compute totals
      var score = Number(window.score || window.singleScore || 0) || 0;
      var total = Array.isArray(window.gameQuestions) ? window.gameQuestions.length : (Number(window.totalQuestions) || Number(window.NOVA_Q_LIMIT) || 10);
      if (!total || total < 1) total = 10;
      if (score < 0) score = 0;
      if (score > total) score = total;
      window.score = score;
      window.singleScore = score;
      window.totalQuestions = total;

      try { if (scoreText) scoreText.textContent = 'Doğru Sayısı: ' + score + '/' + total; } catch (_) {}
      try { if (scoreText) scoreText.setAttribute('data-score', String(score)); } catch (_) {}

      // Minimal message (no heavy UI)
      var msg = (score >= Math.ceil(total * 0.8)) ? 'Gayet İyi' : (score >= Math.ceil(total * 0.5) ? 'İyi' : 'Tekrar dene');
      try { if (scoreMsg) { scoreMsg.style.display = 'block'; scoreMsg.textContent = msg; } } catch (_) {}
      try { if (scoreImg) scoreImg.style.display = 'none'; } catch (_) {}
    } catch (e) {
      try { console.error('NOVA hard stop endGame failed', e); } catch (_) {}
    } finally {
      // allow rerun after a bit (safety)
      setTimeout(function () { window.__novaSpHardStopRunning = false; }, 1000);
    }
  }

  // Override endGame very late in load order
  function installOverride() {
    try {
      window.novaEndGameHardStop = safeShowResults;
      window.endGame = safeShowResults;
      window.endGame.__novaHardStop = true;
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      installOverride();
      setTimeout(installOverride, 500);
      setTimeout(installOverride, 1500);
    }, { once: true });
  } else {
    installOverride();
    setTimeout(installOverride, 500);
    setTimeout(installOverride, 1500);
  }
})();

