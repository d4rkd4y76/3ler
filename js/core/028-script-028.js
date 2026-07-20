/* === NOVA PREMIUM JS: End Screen Builder & Dedupe === */
(function(){
  const byText = (root, text) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
    const result = [];
    while (walker.nextNode()) {
      const el = walker.currentNode;
      if (el.textContent && el.textContent.trim().toLowerCase() === text.toLowerCase()) result.push(el);
    }
    return result;
  };

  const findButtonsByLabel = (root, label) => {
    const btns = Array.from(root.querySelectorAll('button, a'));
    return btns.filter(b => (b.textContent || '').trim().toLowerCase() === label.toLowerCase());
  };

  const percentToBadge = (p) => {
    if (p >= 90) return { cls: 'elmas', label: 'ELMAS' };
    if (p >= 75) return { cls: 'altin', label: 'ALTIN' };
    if (p >= 60) return { cls: 'gumus', label: 'GÜMÜŞ' };
    return { cls: 'bronz', label: 'BRONZ' };
  };

  const buildGauge = (percent) => {
    const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
    const r = 90, c = 2 * Math.PI * r;
    const filled = c * (p / 100);
    const empty = c - filled;
    return `
      <div class="nova-gauge">
        <svg viewBox="0 0 220 220">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#8b5cf6"/>
              <stop offset="100%" stop-color="#6366f1"/>
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="16" />
          <circle cx="110" cy="110" r="${r}" fill="none" stroke="url(#g)" stroke-linecap="round"
            stroke-width="16" stroke-dasharray="${filled} ${empty}" transform="rotate(-90 110 110)" />
        </svg>
        <div class="center">
          <div class="percent">${p}%</div>
          <div class="label">Başarı</div>
        </div>
      </div>`;
  };

  const enhance = () => {
    // Resmi sonuç UI: #nova-summary (NovaTracker). Bu script ikinci katman ekleyip ekranı bozuyordu.
    if (document.getElementById('nova-summary')) return;

    const sc = document.querySelector('#score-container, .score-container');
    if (!sc || getComputedStyle(sc).display === 'none') return;

    // Try to infer metrics from existing DOM or globals
    let total = window.totalQuestions || window.toplamSoru || null;
    let correct = window.correctAnswers || window.dogruSayisi || null;
    let percent = window.successPercent || window.yuzde || null;

    // Fallback: parse from any elements that look like numbers
    const numFrom = (sel) => {
      const el = sc.querySelector(sel);
      if (!el) return null;
      const m = (el.textContent||'').match(/\d+(?:[\.,]\d+)?/);
      return m ? Number(m[0].replace(',', '.')) : null;
    };
    if (total == null) total = numFrom('[data-total], .total, .toplam, .metric-total');
    if (correct == null) correct = numFrom('[data-correct], .correct, .dogru, .metric-correct');
    if (percent == null){
      percent = numFrom('[data-percent], .percent, .yuzde, .metric-percent');
      if (percent == null && total && (correct!=null)) percent = Math.round((correct/total)*100);
    }

    // Dedupe "Tekrar Oyna" buttons: keep the bottom-most
    const allReplay = findButtonsByLabel(sc, 'Tekrar Oyna');
    if (allReplay.length > 1){
      // sort by vertical position
      const sorted = [...allReplay].sort((a,b)=> (a.getBoundingClientRect().top)-(b.getBoundingClientRect().top));
      // keep the last (bottom-most)
      const keeper = sorted[sorted.length-1];
      sorted.slice(0,-1).forEach(x=> x.classList.add('nova-dedupe-hide'));
      keeper.classList.add('tekrar-oyna'); // style enhancer
    }else if(allReplay.length === 1){
      allReplay[0].classList.add('tekrar-oyna');
    }

    // Remove duplicate percentage/progress widgets commonly seen
    const dupSelectors = [
      '.progress-bar', '.progress', '.gauge', '.circle', '.meter',
      '.stats-item', '.student-stats', '.trophy', '.trophy-container'
    ];
    let seenOnce = false;
    dupSelectors.forEach(sel=>{
      const nodes = sc.querySelectorAll(sel);
      if (nodes.length){
        nodes.forEach((n,i)=>{
          if (!seenOnce){ seenOnce = true; return; }
          n.classList.add('nova-dedupe-hide');
        });
      }
    });

    // Build a premium wrapper on top (non-destructive): prepend
    const wrapper = document.createElement('div');
    wrapper.className = 'nova-end-wrapper';
    // Left: metrics card with single gauge
    const badge = percentToBadge(percent||0);
    wrapper.innerHTML = `
      <div class="nova-card">
        <div class="nova-top">
          ${buildGauge(percent||0)}
          <div class="nova-metrics">
            <div class="metric">
              <div class="kpi">${correct != null ? correct : '-'}</div>
              <div class="name">Doğru</div>
            </div>
            <div class="metric">
              <div class="kpi">${total != null ? total : '-'}</div>
              <div class="name">Toplam</div>
            </div>
            <div class="metric">
              <div class="kpi">${percent != null ? Math.round(percent) : '-' }%</div>
              <div class="name">Yüzde</div>
            </div>
          </div>
        </div>
        <div class="nova-badge ${badge.cls}" title="Başarı Rozeti">${badge.label}</div>
      </div>
      <div class="nova-card nova-wrongs">
        <div class="title">Yanlış Soru Özeti</div>
        <div class="subtitle">Yanlış cevapladığın sorular burada listelenir. (Varolan içerik korunur)</div>
        <div class="nova-wrong-list" id="novaWrongListHook"></div>
      </div>
    `;

    // Insert at top if not already present
    if (!sc.querySelector('.nova-end-wrapper')){
      sc.prepend(wrapper);
    }

    // Try to surface existing wrong items into our list (non-destructive copy)
    const hook = sc.querySelector('#novaWrongListHook');
    if (hook){
      // Heuristics: find wrong answer blocks
      const candidates = sc.querySelectorAll('.wrong, .yanlis, .wrong-item, .yanlis-item, .explanation-card, .explanation-text');
      if (candidates.length){
        candidates.forEach((c, idx)=>{
          // Extract lines for question / your answer / correct / explanation if present
          const txt = (c.innerText||'').trim().replace(/\s+/g,' ');
          if (!txt) return;
          const item = document.createElement('div');
          item.className = 'nova-wrong-item';
          item.innerHTML = `
            <div class="q">${txt.split('. ').slice(0,1)[0]}</div>
            <div class="row">
              <div><span class="lbl">Senin Cevabın</span><span class="val">—</span></div>
              <div><span class="lbl">Doğru Cevap</span><span class="val">—</span></div>
            </div>
          `;
          hook.appendChild(item);
        });
      }else{
        // If nothing found, keep area empty but visible
        hook.innerHTML = '<div class="nova-wrong-item"><div class="q">Harika! Listeleyecek yanlış yok.</div></div>';
      }
    }

    // Align the final existing replay button in a dedicated CTA row (if exists)
    const keeper = sc.querySelector('.tekrar-oyna');
    if (keeper){
      // Move keeper to the bottom CTA area visually
      const cta = document.createElement('div');
      cta.className = 'nova-cta';
      keeper.parentElement && keeper.parentElement.removeChild(keeper);
      cta.appendChild(keeper);
      sc.appendChild(cta);
    }
  };

  // Observe visibility/state changes
  const runWhenVisible = () => {
    if (document.getElementById('nova-summary')) return;
    try{
      enhance();
    }catch(e){ console.warn('NOVA premium end-screen enhance failed:', e); }
  };

  const scoreRoot = document.getElementById('score-container') || document.querySelector('.single-player-game-container .score-container');
  if (scoreRoot && !document.getElementById('nova-summary')){
    const mo = new MutationObserver(runWhenVisible);
    mo.observe(scoreRoot, { attributes: true, attributeFilter:['style','class'], childList: true, subtree: true });
  }

  // Also run after load + slight delay
  window.addEventListener('load', ()=> setTimeout(runWhenVisible, 300));
})();
