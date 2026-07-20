(function(){
  const d = document;

  function ensureOnce(id, create) {
    if (!d.getElementById(id)) {
      const el = create();
      d.body.appendChild(el);
    }
    return d.getElementById(id);
  }

  function spaceDecorOn(){
    const aur = ensureOnce('nova-aurora',()=>{ const a=d.createElement('div'); a.id='nova-aurora'; return a; });
    const p1 = ensureOnce('nova-planet-1',()=>{ const p=d.createElement('div'); p.id='nova-planet-1'; p.className='nova-planet'; return p; });
    const p2 = ensureOnce('nova-planet-2',()=>{ const p=d.createElement('div'); p.id='nova-planet-2'; p.className='nova-planet'; return p; });
    [aur,p1,p2].forEach(el => { if (el) el.style.display = ''; });

    // Launch a single comet interval once
    if (!window.__novaCometInterval){
      const cometEveryMs = lowFxMode ? 4200 : 2600;
      window.__novaCometInterval = setInterval(()=>{
        const c = d.createElement('div');
        c.className = 'nova-comet';
        // randomize start offset a bit
        const rx = Math.random()*40; // vw
        const ry = Math.random()*20; // vh
        c.style.left = (60+rx) + 'vw';
        c.style.top  = (-5-ry) + 'vh';
        d.body.appendChild(c);
        setTimeout(()=> c.remove(), 2000);
      }, cometEveryMs);
    }
  }
  function spaceDecorOff(){
    ['nova-aurora','nova-planet-1','nova-planet-2'].forEach(id => {
      const el = d.getElementById(id);
      if (el) el.style.display = 'none';
    });
    if (window.__novaCometInterval){
      clearInterval(window.__novaCometInterval);
      window.__novaCometInterval = null;
    }
  }

  function hidePlayersVs(){
    const container = d.querySelector('.duel-game-container');
    if(!container) return;
    const candidates = Array.from(container.querySelectorAll('.vs-row, .players-vs, .duel-vs, [data-vs], h1, h2, .header, .top, .title, .subtitle, .row, div, span'));
    candidates.forEach(el=>{
      try{
        const txt = (el.textContent||'').toLowerCase().replace(/\s+/g,' ');
        if (/oyuncu\s*1.*vs.*oyuncu\s*2/.test(txt) || (/vs/.test(txt) && /oyuncu/.test(txt))) {
          el.classList.add('nova-hide-vs');
        }
      }catch(_){}
    });
  }

  function activate(){
    const duel = d.getElementById('duel-game-screen') || d.querySelector('.duel-game-container');
    if (!duel) return;
    const cs = getComputedStyle(duel);
    const visible = cs.display !== 'none' && cs.visibility !== 'hidden';
    if (visible){
      spaceDecorOn();
      hidePlayersVs();
    } else {
      spaceDecorOff();
    }
  }
  let __queuedActivate = false;
  const scheduleActivate = () => {
    if (__queuedActivate) return;
    __queuedActivate = true;
    requestAnimationFrame(() => { __queuedActivate = false; activate(); });
  };
  const duelNode = d.getElementById('duel-game-screen');
  const obs = new MutationObserver(()=> scheduleActivate());
  if (duelNode) obs.observe(duelNode,{attributes:true,attributeFilter:['style','class']});
  else obs.observe(d.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
  window.addEventListener('load', activate);
  document.addEventListener('visibilitychange', () => { if (document.hidden) spaceDecorOff(); else scheduleActivate(); });
})();
