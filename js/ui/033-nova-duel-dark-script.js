(function(){
  const d = document;
  const perfMode = (window.__novaPerfMode || 'normal');
  const lowFxMode = !!(perfMode !== 'normal' || (navigator && navigator.deviceMemory && navigator.deviceMemory <= 4) || window.matchMedia('(pointer: coarse)').matches);

  function ensureOnce(id, create) {
    if (!d.getElementById(id)) {
      const el = create();
      d.body.appendChild(el);
    }
    return d.getElementById(id);
  }

  function activateDarkIfDuelVisible(){
    const duel = d.querySelector('.duel-game-container');
    if (!duel) return;
    const visible = getComputedStyle(duel).display !== 'none';
    d.body.classList.toggle('nova-dark-duel', visible);
    // Layer starfield under everything
    if (visible) {
      ensureOnce('nova-starfield', () => {
        const sf = d.createElement('div');
        sf.id = 'nova-starfield';
        return sf;
      });
      ensureOnce('nova-nebula', () => {
        const nb = d.createElement('div');
        nb.id = 'nova-nebula';
        return nb;
      });
      ensureOnce('nova-judge', () => {
        const j = d.createElement('div');
        j.id = 'nova-judge';
        j.textContent = '';
        return j;
      });

      // Try to hide redundant duel banner texts at top (without touching scores)
      const candidates = Array.from(d.querySelectorAll('.duel-game-container h1, .duel-game-container h2, .duel-game-container .duel-title, .duel-game-container .duel-banner, [data-duel-indicator]'));
      candidates.forEach(el => {
        const t = (el.textContent || '').toLowerCase();
        if (/(düello|duello).*başladı|iki.*oyuncu/.test(t)) el.classList.add('nova-hidden-banner');
      });
    }
  }

  // Observe duel container visibility changes (scoped; avoid full-document observer cost)
  const scheduleDarkCheck = (() => {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; activateDarkIfDuelVisible(); });
    };
  })();
  const duelRootForDark = d.getElementById('duel-game-screen') || d.querySelector('.duel-game-container');
  const obs = new MutationObserver(scheduleDarkCheck);
  if (duelRootForDark) obs.observe(duelRootForDark, { attributes:true, attributeFilter:['style','class'] });
  else obs.observe(d.documentElement, { attributes:true, childList:true, subtree:true, attributeFilter:['style','class'] });
  window.addEventListener('load', scheduleDarkCheck);

  // Detect answer result by watching class changes on option buttons
  const optionObs = new MutationObserver((mutations)=>{
    mutations.forEach(m => {
      if (m.type === 'attributes' && m.attributeName === 'class' && m.target.classList) {
        const btn = m.target;
        if (btn.classList.contains('option-chosen')) {
          if (btn.classList.contains('correct')) {
            showJudge(true);
            if (typeof window.novaDuelFlyPlusOne !== 'function') {
              runPlusToMyScore(btn);
            }
          } else if (btn.classList.contains('wrong')) {
            showJudge(false);
          }
        }
      }
    });
  });

  function hookOptions(){
    d.querySelectorAll('.option-button').forEach(btn => {
      if (btn.dataset.novaOptionObserved === '1') return;
      btn.dataset.novaOptionObserved = '1';
      optionObs.observe(btn, { attributes:true, attributeFilter:['class'] });
    });
  }
  // Initial hook + observe future questions
  hookOptions();
  const listObs = new MutationObserver(()=> hookOptions());
  const optionsRoot = d.getElementById('duel-options-container') || d.querySelector('.duel-game-container') || d.body;
  listObs.observe(optionsRoot, { childList:true, subtree:true });

  function showJudge(isCorrect){
    const el = d.getElementById('nova-judge');
    if (!el) return;
    el.textContent = isCorrect ? 'SÜPER DOĞRU!' : 'YANLIŞ!';
    el.classList.remove('nova-show','nova-correct','nova-wrong');
    el.offsetHeight; // reflow
    el.classList.add('nova-show', isCorrect ? 'nova-correct' : 'nova-wrong');
  }

  function runPlusToMyScore(sourceBtn){
    try {
      const rect = sourceBtn.getBoundingClientRect();
      const sx = rect.left + rect.width/2;
      const sy = rect.top + rect.height/2;

      const counters = Array.from(d.querySelectorAll('.duel-player-correct-count'));
      if (!counters.length) return spawnPlus(sx, sy, sx+260, sy-240);

      // pick nearest counter center
      const centers = counters.map(el => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left + r.width/2, y: r.top + r.height/2 };
      });
      let best = centers[0];
      let bestDist = (best.x - sx)**2 + (best.y - sy)**2;
      for (let i=1;i<centers.length;i++){
        const c = centers[i];
        const d2 = (c.x - sx)**2 + (c.y - sy)**2;
        if (d2 < bestDist) { best = c; bestDist = d2; }
      }
      spawnPlus(sx, sy, best.x, best.y);
    } catch(e){ /* fail silently */ }
  }


function runPlusToMyScore(sourceBtn){
  try {
    const rect = sourceBtn.getBoundingClientRect();
    const sx = rect.left + rect.width/2;
    const sy = rect.top + rect.height/2;

    // inviter = sol HUD, invited = sağ HUD
    const localIsInviter = (typeof window.isInviter !== 'undefined')
      ? !!window.isInviter
      : (typeof isInviter !== 'undefined' ? !!isInviter : null);

    let targetEl = null;
    if (localIsInviter !== null) {
      targetEl = document.getElementById(localIsInviter ? 'novaLeftCount' : 'novaRightCount');
    }

    // HUD görünmüyorsa alttaki sayaçlara düş
    if (!targetEl || getComputedStyle(targetEl).display === 'none') {
      targetEl = document.getElementById(localIsInviter ? 'inviter-correct-count' : 'invited-correct-count');
    }

    if (!targetEl) {
      // En son çare: en yakın hedef
      const counters = Array.from(document.querySelectorAll('.duel-player-correct-count, .nova-hp-count'));
      if (!counters.length){ spawnPlus(sx, sy, sx+260, sy-240); return; }
      let best = counters[0], bestd2 = Infinity;
      counters.forEach(el => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width/2, y = r.top + r.height/2;
        const d2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
        if (d2 < bestd2) { bestd2 = d2; best = el; }
      });
      const r = best.getBoundingClientRect();
      spawnPlus(sx, sy, r.left + r.width/2, r.top + r.height/2);
      return;
    }

    const tr = targetEl.getBoundingClientRect();
    spawnPlus(sx, sy, tr.left + tr.width/2, tr.top + tr.height/2);
  } catch (e) { /* silent */ }
}




  function spawnPlus(sx, sy, tx, ty){
    const plus = d.createElement('div');
    plus.className = 'nova-plus';
    plus.textContent = '+' + (window.NovaDuelPointsPerCorrect || 10);

    const dx = (sx - window.innerWidth/2) * -1 + (tx - sx) * .45;
    const dy = (sy - window.innerHeight/2) * -1 + (ty - sy) * .45;
    plus.style.left = sx + 'px';
    plus.style.top  = sy + 'px';
    plus.style.setProperty('--dx', dx+'px');
    plus.style.setProperty('--dy', dy+'px');
    plus.style.setProperty('--tx', (tx - sx) + 'px');
    plus.style.setProperty('--ty', (ty - sy) + 'px');

    d.body.appendChild(plus);
    // star particles
    for (let i=0;i<18;i++){
      const star = d.createElement('div');
      star.className = 'nova-star';
      star.style.left = sx + 'px';
      star.style.top = sy + 'px';
      const ang = Math.random()*Math.PI*2;
      const dist = 60 + Math.random()*140;
      const sxv = Math.cos(ang)*dist;
      const syv = Math.sin(ang)*dist * -1; // bias upward
      star.style.setProperty('--sx', sxv+'px');
      star.style.setProperty('--sy', syv+'px');
      d.body.appendChild(star);
      setTimeout(()=> star.remove(), 900);
    }
    setTimeout(()=> plus.remove(), 1300);
  }

})();
