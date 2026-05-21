(function(){
  const KEY = 'novaPerfMode';
  function isPhoneDevice(){
    try{
      if (window.matchMedia){
        return window.matchMedia('(max-width: 768px), (max-width: 1024px) and (hover: none) and (pointer: coarse)').matches;
      }
    }catch(_){}
    return (window.innerWidth || 0) <= 768;
  }
  function getSavedMode(){
    try{
      const v = localStorage.getItem(KEY);
      if (v === 'normal' || v === 'performance' || v === 'ultra') return v;
    }catch(_){}
    return null;
  }
  function getDefaultMode(){
    const saved = getSavedMode();
    if (saved) return saved;
    return isPhoneDevice() ? 'ultra' : 'normal';
  }
  function modeScale(mode){ if (mode === 'performance') return 0.86; if (mode === 'ultra') return 0.74; return 1; }
  function applyMode(mode){
    mode = mode || getDefaultMode();
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
      + '<h3 style="margin:0 0 6px 0">Görüntü ve Akıcılık Ayarları</h3>'
      + '<div style="font-size:13px;color:#94a3b8;line-height:1.45">Cihazınıza göre çözünürlük ve efekt yoğunluğunu seçin. Telefonlarda ilk açılışta <b>Akıcı</b> mod otomatik seçilir; isterseniz sonra değiştirebilirsiniz.</div>'
      + '<label class="nova-perf-row"><input type="radio" name="nova_perf_mode" value="normal"><div><b>YÜKSEK ÇÖZÜNÜRLÜK (TABLETLER İÇİN UYGUN)</b><div style="font-size:12px;color:#94a3b8">Tablet ve güçlü cihazlarda en net görüntü. Büyük ekranlarda önerilir.</div></div></label>'
      + '<label class="nova-perf-row"><input type="radio" name="nova_perf_mode" value="performance"><div><b>İYİ ÇÖZÜNÜRLÜK (TELEFONLAR İÇİN UYGUN)</b><div style="font-size:12px;color:#94a3b8">Telefonda dengeli kalite ve akıcılık. Orta düzey efekt azaltma.</div></div></label>'
      + '<label class="nova-perf-row nova-perf-row--recommended"><input type="radio" name="nova_perf_mode" value="ultra"><div><b>AKICI (TELEFONLAR İÇİN UYGUN) — ÖNERİLEN</b><div style="font-size:12px;color:#94a3b8">Telefonda en akıcı deneyim. Daha düşük çözünürlük, minimum efekt.</div></div></label>'
      + '<div class="nova-perf-actions"><button class="nova-perf-btn cancel" type="button" id="nova_perf_cancel">Kapat</button><button class="nova-perf-btn ok" type="button" id="nova_perf_apply">Uygula</button></div>'
      + '</div>';
    document.body.appendChild(ov);
    btn.addEventListener('click', ()=>{
      const mode = window.__novaPerfMode || getDefaultMode();
      const pick = ov.querySelector(`input[name="nova_perf_mode"][value="${mode}"]`);
      if (pick) pick.checked = true;
      ov.style.display = 'flex';
    });
    ov.querySelector('#nova_perf_cancel').addEventListener('click', ()=>{ ov.style.display='none'; });
    ov.querySelector('#nova_perf_apply').addEventListener('click', ()=>{
      const selected = ov.querySelector('input[name="nova_perf_mode"]:checked');
      applyMode(selected ? selected.value : getDefaultMode());
      ov.style.display='none';
    });
  }
  function boot(){
    applyMode(getDefaultMode());
    ensureUi();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
