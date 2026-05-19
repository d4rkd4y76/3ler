(function(){
  const KEY = 'novaPerfMode';
  function modeScale(mode){ if (mode === 'performance') return 0.86; if (mode === 'ultra') return 0.74; return 1; }
  function applyMode(mode){
    mode = mode || 'normal';
    window.__novaPerfMode = mode;
    try{ localStorage.setItem(KEY, mode); }catch(_){}
    document.body.classList.remove('nova-perf-performance','nova-perf-ultra');
    if (mode === 'performance') document.body.classList.add('nova-perf-performance');
    if (mode === 'ultra') document.body.classList.add('nova-perf-ultra');
    const scale = modeScale(mode);
    try{
      const supportsZoom = (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom','1'));
      if (supportsZoom){
        document.body.style.zoom = String(scale);
        document.body.style.transform = '';
        document.body.style.width = '';
      } else if (scale !== 1){
        document.body.style.transformOrigin = 'top left';
        document.body.style.transform = `scale(${scale})`;
        document.body.style.width = `${100/scale}%`;
      } else {
        document.body.style.transform = '';
        document.body.style.width = '';
      }
    }catch(_){}
    try{ if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout(); }catch(_){}
  }
  function ensureUi(){
    if (document.getElementById('nova_perf_open_btn')) return;
    const mainButtons = document.querySelector('#main-screen .buttons');
    if (!mainButtons) return;
    const btn = document.createElement('button');
    btn.id = 'nova_perf_open_btn';
    btn.type = 'button';
    btn.className = 'kupa-siralama-button';
    btn.innerHTML = '<span class="main-menu-icon" aria-hidden="true">⚙</span><span class="main-menu-label">Ayarlar</span>';
    const rankBtn = document.getElementById('kupa-siralama-button');
    if (rankBtn && rankBtn.parentNode === mainButtons){
      if (rankBtn.nextSibling) mainButtons.insertBefore(btn, rankBtn.nextSibling);
      else mainButtons.appendChild(btn);
    } else {
      mainButtons.appendChild(btn);
    }
    const ov = document.createElement('div');
    ov.id = 'nova_perf_overlay';
    ov.innerHTML = '<div class="nova-perf-card">'
      + '<h3 style="margin:0 0 6px 0">Performans Ayarları</h3>'
      + '<div style="font-size:13px;color:#94a3b8">Eski telefonlarda daha akıcı kullanım için çözünürlük ve efekt seviyesi düşürülebilir.</div>'
      + '<label class="nova-perf-row"><input type="radio" name="nova_perf_mode" value="normal"><div><b>Normal</b><div style="font-size:12px;color:#94a3b8">Tam kalite görünüm</div></div></label>'
      + '<label class="nova-perf-row"><input type="radio" name="nova_perf_mode" value="performance"><div><b>Performans</b><div style="font-size:12px;color:#94a3b8">Biraz düşük çözünürlük, hafif efekt</div></div></label>'
      + '<label class="nova-perf-row"><input type="radio" name="nova_perf_mode" value="ultra"><div><b>Ultra Akıcı</b><div style="font-size:12px;color:#94a3b8">Daha düşük çözünürlük, minimum efekt</div></div></label>'
      + '<div class="nova-perf-actions"><button class="nova-perf-btn cancel" type="button" id="nova_perf_cancel">Kapat</button><button class="nova-perf-btn ok" type="button" id="nova_perf_apply">Uygula</button></div>'
      + '</div>';
    document.body.appendChild(ov);
    btn.addEventListener('click', ()=>{
      const mode = window.__novaPerfMode || 'normal';
      const pick = ov.querySelector(`input[name="nova_perf_mode"][value="${mode}"]`);
      if (pick) pick.checked = true;
      ov.style.display = 'flex';
    });
    ov.querySelector('#nova_perf_cancel').addEventListener('click', ()=>{ ov.style.display='none'; });
    ov.querySelector('#nova_perf_apply').addEventListener('click', ()=>{
      const selected = ov.querySelector('input[name="nova_perf_mode"]:checked');
      applyMode(selected ? selected.value : 'normal');
      ov.style.display='none';
    });
  }
  function boot(){
    let saved = 'normal';
    try{ saved = localStorage.getItem(KEY) || 'normal'; }catch(_){}
    applyMode(saved);
    ensureUi();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
