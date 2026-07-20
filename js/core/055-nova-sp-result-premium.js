(function () {
  'use strict';

  function getResultMetrics() {
    var st = (window.NovaTracker && window.NovaTracker.state) || {};
    var total = Number(st.total) || 0;
    var correct = Number(st.correctCount);
    if (typeof window.score === 'number' && isFinite(window.score)) {
      correct = Number(window.score);
    }
    if (!total) {
      if (Array.isArray(window.gameQuestions) && window.gameQuestions.length) {
        total = window.gameQuestions.length;
      } else if (typeof window.totalQuestions === 'number' && window.totalQuestions > 0) {
        total = window.totalQuestions;
      } else {
        total = Number(window.NOVA_Q_LIMIT) || 10;
      }
    }
    if (!isFinite(correct) || correct < 0) correct = 0;
    if (correct > total) correct = total;
    var rate = total > 0 ? (correct / total) * 100 : 0;
    return {
      total: total,
      correct: correct,
      rate: Math.max(0, Math.min(100, Math.round(rate)))
    };
  }

  function tierFor(rate) {
    if (rate >= 75) return 'high';
    if (rate >= 40) return 'mid';
    return 'low';
  }

  function spawnBurst(container, rate) {
    if (!container) return;
    container.innerHTML = '';
    var n = Math.min(18, 6 + Math.round(rate / 8));
    var icons = ['✨', '⭐', '💫', '🎉', '🌟', '💥'];
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'nova-pct-show__spark';
      s.textContent = icons[i % icons.length];
      var angle = (360 / n) * i;
      s.style.setProperty('--a', angle + 'deg');
      s.style.animationDelay = (i * 0.06) + 's';
      container.appendChild(s);
    }
  }

  function playPercentAnimation(rate, correct, total) {
    var show = document.getElementById('novaPctShow');
    var ring = document.getElementById('novaPctRing');
    var num = document.getElementById('novaResultPctNum');
    var label = document.getElementById('novaResultPctLabel');
    var burst = document.getElementById('novaResultParticles');
    if (!show || !ring || !num) return false;

    var m = getResultMetrics();
    if (typeof rate !== 'number' || isNaN(rate)) rate = m.rate;
    if (correct === undefined || correct === null) correct = m.correct;
    if (!total) total = m.total;
    var target = Math.max(0, Math.min(100, Math.round(Number(rate) || 0)));

    show.setAttribute('data-tier', tierFor(target));
    show.classList.remove('is-done', 'is-pop', 'is-filling');
    ring.style.setProperty('--pct-angle', '0deg');
    num.textContent = '0';
    show.classList.add('is-filling');

    var kpiC = document.getElementById('nz-kpi-correct');
    var kpiT = document.getElementById('nz-kpi-total');
    var kpiR = document.getElementById('nz-kpi-rate');
    if (kpiC) kpiC.textContent = String(correct);
    if (kpiT) kpiT.textContent = String(total);
    if (kpiR) {
      kpiR.textContent = '0%';
      kpiR.className = 'value ' + (target >= 75 ? 'ok' : target >= 60 ? 'warn' : 'bad');
    }

    var t0 = performance.now();
    var dur = 1600;
    var lastBump = -1;

    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var pct = target * ease;
      var shown = Math.round(pct);
      var angle = (pct / 100) * 360;

      ring.style.setProperty('--pct-angle', angle.toFixed(2) + 'deg');
      num.textContent = String(shown);

      if (shown !== lastBump && (shown % 10 === 0 || shown === target) && shown > 0) {
        lastBump = shown;
        if (label) label.classList.add('is-bump');
        setTimeout(function () { if (label) label.classList.remove('is-bump'); }, 220);
      }

      if (kpiR) kpiR.textContent = shown + '%';

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        ring.style.setProperty('--pct-angle', ((target / 100) * 360).toFixed(2) + 'deg');
        num.textContent = String(target);
        if (kpiR) kpiR.textContent = target + '%';
        show.classList.remove('is-filling');
        show.classList.add('is-done');
        if (label) label.classList.add('is-bump');
        spawnBurst(burst, target);
      }
    }
    requestAnimationFrame(frame);
    return true;
  }

  function animateStatNumbers(correct, total) {
    var ids = [
      { id: 'nz-kpi-correct', end: correct },
      { id: 'nz-kpi-total', end: total }
    ];
    var t0 = performance.now();
    function tick(now) {
      var k = Math.min(1, (now - t0) / 700);
      var e = 1 - Math.pow(1 - k, 3);
      ids.forEach(function (item) {
        var el = document.getElementById(item.id);
        if (el) el.textContent = String(Math.round(item.end * e));
      });
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function removePlayAgainButtons() {
    ['#nzPlayBtn', '#btnTekrar', '#novaResultHeroHost', '#novaResultCheer'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.remove();
    });
  }

  function wireBackButton() {
    var btn = document.getElementById('final-back-button');
    if (!btn || btn.__novaResultBackWired) return;
    btn.__novaResultBackWired = true;
    btn.setAttribute('type', 'button');
    function go(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof window.novaSpResultGoBack === 'function') window.novaSpResultGoBack();
    }
    btn.addEventListener('click', go, true);
  }

  function placeAdviceCard() {
    var card = document.getElementById('teacher-advice-card');
    var game = document.getElementById('single-player-game-screen');
    if (card && game && card.parentElement !== game) game.appendChild(card);
  }

  function runResultPresentation() {
    removePlayAgainButtons();
    wireBackButton();
    placeAdviceCard();
    var m = getResultMetrics();
    animateStatNumbers(m.correct, m.total);
    var tries = 0;
    (function attempt() {
      if (playPercentAnimation(m.rate, m.correct, m.total)) return;
      if (++tries < 10) setTimeout(attempt, 100);
    })();
  }

  function patchRenderSummary() {
    if (!window.NovaTracker || window.NovaTracker.__premiumUiPatched) return;
    var orig = window.NovaTracker.renderSummary;
    window.NovaTracker.renderSummary = function () {
      var r = orig.apply(window.NovaTracker, arguments);
      setTimeout(runResultPresentation, 60);
      setTimeout(runResultPresentation, 350);
      return r;
    };
    window.NovaTracker.__premiumUiPatched = true;
  }

  window.novaPlayResultArena = playPercentAnimation;
  window.novaPolishSpResultScreen = runResultPresentation;
  window.novaGetSpResultMetrics = getResultMetrics;

  document.addEventListener('DOMContentLoaded', function () {
    wireBackButton();
    patchRenderSummary();
    setTimeout(patchRenderSummary, 500);
  });
})();
