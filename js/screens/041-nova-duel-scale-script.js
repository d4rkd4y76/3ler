(function(){
  const DUEL_ID = 'duel-game-screen';
  const TOOL_ID = 'nova-duel-scale-toolbar';
  const RANGE_ID = 'nova-duel-scale-range';
  const PCT_ID = 'nova-duel-scale-pct';
  const LS_KEY = 'novaDuelScale';

  function getEl(id){ return document.getElementById(id); }

  function unwrapIfWrapped(){
    const duel = getEl(DUEL_ID);
    if (!duel) return;
    const p = duel.parentElement;
    if (p && p.id === 'nova-duel-scale-wrapper'){
      // Move duel out and remove wrapper to avoid affecting other screens
      p.parentElement.insertBefore(duel, p);
      p.remove();
    }
  }

  function setScale(k){
    if (isNaN(k)) k = 1;
    k = Math.max(0.70, Math.min(1.20, k));
    document.documentElement.style.setProperty('--duel-scale', String(k));
    const pct = Math.round(k*100);
    const pctEl = getEl(PCT_ID); if (pctEl) pctEl.textContent = pct + '%';
    const rng = getEl(RANGE_ID); if (rng) rng.value = String(pct);
    try{ localStorage.setItem(LS_KEY, String(k)); }catch(_){}
  }
  function getScale(){
    const val = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duel-scale'));
    if (!isNaN(val) && val>0) return val;
    try { const v = parseFloat(localStorage.getItem(LS_KEY)); return isNaN(v)?1:v; } catch(_){}
    return 1;
  }
  function isVisible(el){
    if (!el) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return (r.width>1 && r.height>1);
  }
  function showToolbar(show){
    const t = getEl(TOOL_ID);
    if (!t) return;
    t.style.display = show ? 'flex' : 'none';
    t.setAttribute('aria-hidden', show ? 'false' : 'true');
  }
  function fitToViewport(){
    const duel = getEl(DUEL_ID);
    if (!duel) return;
    const prev = getScale();
    setScale(1);
    const rect = duel.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const availH = vh - 70;
    const k = Math.max(0.70, Math.min(1.20, Math.min(vw/rect.width, availH/rect.height)));
    setScale(k);
  }
  function mountToolbarOnce(){
    if (getEl(TOOL_ID)) return true;
    document.body.insertAdjacentHTML('beforeend', `
<!-- NOVA: Duel Scale Toolbar -->
<div id="nova-duel-scale-toolbar" aria-hidden="true">
  <span class="label">Ölçek</span>
  <div class="group grow">
    <button class="btn small" data-act="minus">−</button>
    <input id="nova-duel-scale-range" type="range" min="70" max="120" value="100" step="1" />
    <button class="btn small" data-act="plus">+</button>
  </div>
  <span class="pct badge" id="nova-duel-scale-pct">100%</span>
  <div class="sep"></div>
  <button class="btn" data-act="fit">Sığdır</button>
  <button class="btn" data-act="reset">Sıfırla</button>
</div>
`);
    const rng = getEl(RANGE_ID);
    if (rng){
      rng.addEventListener('input', ()=>{
        const pct = parseInt(rng.value, 10);
        setScale(pct/100);
      });
    }
    document.body.addEventListener('click', (e)=>{
      const btn = e.target.closest('#'+TOOL_ID+' [data-act]');
      if (!btn) return;
      const act = btn.getAttribute('data-act');
      let k = getScale();
      if (act==='minus') setScale((Math.round(k*100)-1)/100);
      else if (act==='plus') setScale((Math.round(k*100)+1)/100);
      else if (act==='reset') setScale(1);
      else if (act==='fit') fitToViewport();
    });
    return true;
  }

  (function init(){
    mountToolbarOnce();
    unwrapIfWrapped(); // migrate from v1/v2, remove wrapper if present
    setScale(getScale());
    let lastShown = false;
    setInterval(()=>{
      const duel = getEl(DUEL_ID);
      const shouldShow = isVisible(duel);
      if (shouldShow !== lastShown){
        var fullscreen = document.body.classList.contains('nova-duel-game-open');
        showToolbar(shouldShow && !fullscreen);
        if (duel){
          if (shouldShow && !fullscreen) duel.classList.add('nova-scaled');
          else duel.classList.remove('nova-scaled');
        }
        lastShown = shouldShow;
      }
    }, 700);
  })();

  window.addEventListener('resize', function(){
    const t = getEl(TOOL_ID);
    if (t && t.style.display !== 'none'){
      // kullanıcı manuel ayarı korunur
    }
  });
})();
