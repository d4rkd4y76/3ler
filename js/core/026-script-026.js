(function(){
  function ensureGaugeRedraw(){
    try{
      const cvs=document.getElementById('nzGauge');
      if(!cvs) return;
      // Recompute canvas intrinsic size based on container
      const box=cvs.parentElement;
      const w=Math.min(520, Math.max(260, Math.floor(box.clientWidth*0.9)));
      cvs.width=w; cvs.height=w;
      // If NovaTracker available, force render
      if(window.NovaTracker && typeof window.NovaTracker.renderSummary==='function'){
        window.NovaTracker.renderSummary();
      }
    }catch(_){}
  }

  // Hook into strict mount function if present
  const tryHook = setInterval(()=>{
    try{
      const sc=document.querySelector('.score-container, #score-container');
      const nova=document.getElementById('nova-summary');
      if(sc && nova && nova.parentElement===sc){
        clearInterval(tryHook);
        setTimeout(ensureGaugeRedraw, 50);
        window.addEventListener('resize', ensureGaugeRedraw);
      }
    }catch(_){}
  }, 120);

  // Make the KPI "Yüzde" always show a value even when total=0
  const safeRate = setInterval(()=>{
    try{
      const rateEl=document.getElementById('nz-kpi-rate');
      if(rateEl && !rateEl.textContent.trim()){
        rateEl.textContent='0%';
        rateEl.className='value bad';
      }
    }catch(_){}
  }, 300);

  // Decorate Video button with icon text
  window.addEventListener('DOMContentLoaded', ()=>{
    const v=document.getElementById('nzVideoBtn');
    if(v && !v.dataset.decorated){
      v.dataset.decorated='1';
      v.innerHTML = '<span class="nz-cta-icon">▶</span>Ders Videosu';
    }
  });
})();
