(function(){
  function ensureNovaStyles(){
    if(document.getElementById('novaGradientDefs')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','0'); svg.setAttribute('height','0'); svg.style.position='absolute';
    svg.innerHTML = '<defs id="novaGradientDefs">' +
      '<linearGradient id="novaGrad" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#6EE7F9"/>' +
      '<stop offset="50%" stop-color="#A78BFA"/>' +
      '<stop offset="100%" stop-color="#F472B6"/>' +
      '</linearGradient>' +
    '</defs>';
    document.body.appendChild(svg);
  }

  function tryGetTotals(){
    let score = 0, total = 10;
    // Common globals
    if (typeof window.score === 'number') score = window.score;
    if (typeof window.singleScore === 'number') score = window.singleScore;
    if (typeof window.totalQuestions === 'number') total = window.totalQuestions;
    if (Array.isArray(window.questions)) total = window.questions.length;
    // Fallbacks from DOM
    const domScore = document.querySelector('.single-player-game-container .score-container .game-cup-score, .single-player-game-container .score-container .final-score, .single-player-game-container .score-container [data-score]');
    if (domScore){
      const n = parseInt(domScore.textContent,10);
      if(!isNaN(n)) score = n;
    }
    // Sensible clamp
    score = Math.max(0, score);
    total = Math.max(1, total);
    return {score, total, percent: Math.round((score/total)*100)};
  }

  function removeBadges(scope){
    const selectors = [
      '.trophy','.trophy-container','.trophy-inner','.game-cup-image','.game-cup-score','.kupa','.kupa-siralama',
      '.medal','.badge','.rozet','.winner-message'
    ];
    selectors.forEach(sel => scope.querySelectorAll(sel).forEach(el=>el.remove()));
    // NOTE: Daha önce tüm DOM'u tarayan querySelectorAll('*') bazı cihazlarda
    // sonuç ekranına geçişte tarayıcıyı kilitleyebiliyor. Bilerek kaldırıldı.
  }

  function renderRing(){
    if (document.getElementById('nova-summary')) return;
    const scope = document.querySelector('.single-player-game-container .score-container');
    if(!scope) return;
    const visible = (getComputedStyle(scope).display !== 'none') && (scope.offsetParent !== null);
    if(!visible) return;
    if (scope.dataset.novaRingBusy === '1') return;
    ensureNovaStyles();
    const {percent} = tryGetTotals();
    const targetPercent = Math.max(0, Math.min(100, percent));
    if (scope.dataset.novaRingRendered === String(targetPercent) && scope.querySelector('#novaCircular')) return;
    scope.dataset.novaRingBusy = '1';
    removeBadges(scope);
    const radius = 94/2; // since we use viewBox 0 0 120 120, use r=54
    const r = 54, c = 2*Math.PI*r;
    let wrap = scope.querySelector('#novaCircular');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'novaCircular';
      wrap.className = 'nova-circular-wrap';
      wrap.innerHTML = `
        <svg class="nova-circular nova-ring-glow" viewBox="0 0 120 120">
          <circle class="nova-track" cx="60" cy="60" r="${r}"></circle>
          <circle class="nova-progress" cx="60" cy="60" r="${r}" stroke="url(#novaGrad)" stroke-dasharray="${c}" stroke-dashoffset="${c}"></circle>
        </svg>
        <div class="nova-percent-text">0%</div>
      `;
      scope.prepend(wrap);
    } else {
      const progReset = wrap.querySelector('.nova-progress');
      const txtReset = wrap.querySelector('.nova-percent-text');
      if (progReset) progReset.style.strokeDashoffset = String(c);
      if (txtReset) txtReset.textContent = '0%';
    }
    // Animate
    requestAnimationFrame(function(){
      const prog = wrap.querySelector('.nova-progress');
      const txt = wrap.querySelector('.nova-percent-text');
      if(!prog || !txt) return;
      const target = targetPercent;
      const start = performance.now();
      const duration = 1000;
      const cLen = c;
      function tick(now){
        const t = Math.min(1, (now-start)/duration);
        const val = Math.round(target * t);
        prog.style.strokeDashoffset = String(cLen - (val/100)*cLen);
        txt.textContent = val + '%';
        if(t < 1) requestAnimationFrame(tick);
        else {
          scope.dataset.novaRingRendered = String(target);
          scope.dataset.novaRingBusy = '0';
        }
      }
      requestAnimationFrame(tick);
    });
  }

  // Patch endGame so ring renders exactly when results appear
  function attach(){
    if(typeof window.endGame === 'function' && !window.endGame.__novaPatched){
      const orig = window.endGame;
      window.endGame = function(){
        const ret = orig.apply(this, arguments);
        setTimeout(renderRing, 50);
        return ret;
      };
      window.endGame.__novaPatched = true;
    }
    // MutationObserver kaldırıldı: bazı cihazlarda sonuç ekranında aşırı tetikleme yapıp
    // tarayıcıyı kilitleyebiliyordu. endGame sonrası tek render yeterli.
  }

  document.addEventListener('DOMContentLoaded', attach);
  window.addEventListener('load', renderRing);
})();
