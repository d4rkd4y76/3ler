(function(){
  // Helpers
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function q(sel,root=document){return root.querySelector(sel);}
  function qa(sel,root=document){return Array.from(root.querySelectorAll(sel));}

  // Build compact gauge card dynamically (after summary exists)
  function ensureCompactGauge(){
    const topRow=q('#nova-summary .nz-row'); if(!topRow) return;
    if(!q('#nzGaugeMini')){
      const card=document.createElement('div'); card.className='nz-card nz-compact-card';
      card.innerHTML = `<div style="position:relative"><canvas id="nzGaugeMini" width="160" height="160" aria-label="Başarı göstergesi"></canvas><div id="nzBadgeMini" class="nz-badge-mini">BRONZ</div></div>`;
      topRow.appendChild(card);
    }
  }

  // Draw gauge on either mini or legacy id
  function drawGauge(rate){
    const canvas = q('#nzGaugeMini') || q('#nzGauge');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 10;
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = 16;
    // Back arc
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2*Math.PI); ctx.stroke();
    // Value arc
    const end = Math.PI + (Math.max(0, Math.min(100, rate))/100)*Math.PI;
    ctx.strokeStyle = rate>=75 ? '#10b981' : (rate>=60 ? '#f59e0b' : '#ef4444');
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, end); ctx.stroke();
    // Text
    ctx.fillStyle = '#111827'; ctx.font = '800 28px system-ui,Segoe UI,Roboto'; ctx.textAlign='center';
    ctx.fillText(`${Math.round(rate)}%`, cx, cy+8);
  }

  function getBadge(rate){ if(rate>=90) return 'ELMAS'; if(rate>=75) return 'ALTIN'; if(rate>=60) return 'GÜMÜŞ'; return 'BRONZ'; }

  // Strong opener for lesson video
  function openLessonVideo(payload){
    // 1) Try explicit id
    const byId = q('#lesson-video-button');
    if(byId){ if(byId.tagName==='A' && byId.href){ window.open(byId.href,'_blank'); return; } byId.click(); return; }
    // 2) Try anchor candidates with href
    const link = qa('a[href*="youtube"],a[href*="video"],a[data-lesson],a[data-video],.lesson-video a,.ders-video a').find(a=>a.href);
    if(link){ window.open(link.href,'_blank'); return; }
    // 3) Try button candidates
    const btn = q('.lesson-video, .ders-video, button[data-lesson], button[data-video], button[id*="video"], button[onclick*="video"]');
    if(btn){ btn.click(); return; }
    // 4) Try text-based match on buttons/links
    const elems = qa('a,button'); 
    const t = (el)=> (el.textContent||'').toLowerCase().replace(/\s+/g,' ');
    const hit = elems.find(el=> t(el).includes('ders videosu') || t(el).includes('video'));
    if(hit){ if(hit.tagName==='A' && hit.href){ window.open(hit.href,'_blank'); return; } hit.click(); return; }
    // 5) Fallback: emit event for host app
    try{ window.dispatchEvent(new CustomEvent('nova:open-lesson-video', { detail: payload })); }catch(_){}
    // 6) Last resort: ask host to bind or show message
    alert('Ders videosu bağlantısı bulunamadı. Lütfen sayfada #lesson-video-button ya da bir video bağlantısı tanımlayın.');
  }

  // Play again handler
  function clickPlayAgain(){
    // Prefer known ids/classes
    let el = q('#play-again, .play-again, #btn-retry, .btn-retry, .retry, #retry, .again, #again, #btnTekrar');
    if(!el){
      const candidates = qa('button,a');
      el = candidates.find(x=> (x.textContent||'').trim().toLowerCase().includes('tekrar oyna') || (x.textContent||'').toLowerCase().includes('yeniden'));
    }
    if(el){ if(el.tagName==='A' && el.href){ window.location.href = el.href; } else { el.click(); } }
    else { location.reload(); }
  }

  // Patch existing NovaTracker render to update mini gauge & badges + inject Play Again button above wrong summary
  const patcher = setInterval(()=>{
    try{
      // Ensure compact gauge card exists
      ensureCompactGauge();
      // Wire action buttons row: left side "Tekrar Oyna"
      const actionsRow = q('#nzWrongList')?.parentElement?.querySelector('.nz-actions');
      if(actionsRow && !q('#nzPlayBtn')){
        const leftWrap = document.createElement('div'); leftWrap.className='nz-left-actions';
        leftWrap.innerHTML = `<button id="nzPlayBtn" class="nz-btn nz-primary">Tekrar Oyna</button>`;
        actionsRow.prepend(leftWrap);
        q('#nzPlayBtn').addEventListener('click', clickPlayAgain);
      }
      // Wire "Ders Videosu" button robustly
      const v = q('#nzVideoBtn'); if(v && !v.dataset.bound){ v.dataset.bound='1'; v.addEventListener('click', ()=>openLessonVideo({source:'nova'})); }

      // Monkey-patch renderSummary to also update mini
      if(window.NovaTracker && !window.NovaTracker.__v7patched){
        const orig = window.NovaTracker.renderSummary;
        window.NovaTracker.renderSummary = function(){
          const res = orig.apply(window.NovaTracker, arguments);
          // update rate text class & draw mini gauge
          try{
            const total = window.NovaTracker.state.total || 0;
            const correct = window.NovaTracker.state.correctCount || 0;
            const rate = total>0 ? (correct/total)*100 : 0;
            drawGauge(rate);
            const badge = getBadge(rate);
            const mini = q('#nzBadgeMini'); if(mini) mini.textContent = badge;
          }catch(_){}
          return res;
        };
        window.NovaTracker.__v7patched = true;
      }
      // First-time draw if possible
      if(window.NovaTracker && window.NovaTracker.state){
        const t = window.NovaTracker.state.total||0;
        const c = window.NovaTracker.state.correctCount||0;
        const rate = t>0 ? (c/t)*100 : 0;
        drawGauge(rate);
        const mini = q('#nzBadgeMini'); if(mini) mini.textContent = getBadge(rate);
        const rateEl = q('#nz-kpi-rate'); if(rateEl && !rateEl.textContent.trim()) rateEl.textContent='0%';
      }
      clearInterval(patcher);
    }catch(_){}
  }, 150);
})();
