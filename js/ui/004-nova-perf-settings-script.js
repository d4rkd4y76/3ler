(function(){
  const KEY = 'novaPerfMode';
  /* Akıcı modda tam çözünürlük — sadece mini oyunlar */
  const HIGH_RES_GAME_IDS = [
    'daily-puzzle-screen',
    'fillblank-screen',
    'match-screen'
  ];
  /* Akıcı modda orta (iyi) çözünürlük — tek kişilik + düello (geri sayım dahil) */
  const FULLSCREEN_SCOPE_IDS = [
    'profileChangeOverlay',
    'rankingPanel'
  ];
  const SINGLE_PLAYER_PERF_IDS = [
    'single-player-screen',
    'single-player-game-screen',
    'duel-selection-screen',
    'duel-game-screen',
    'matchmakingScreen'
  ];
  const ULTRA_SCALE = 0.74;
  const SINGLE_PLAYER_ULTRA_SCALE = 0.86;
  const MODES = [
    {
      value: 'normal',
      title: 'Yüksek çözünürlük',
      tag: 'Tablet',
      desc: 'Büyük ekranlarda en net görüntü.'
    },
    {
      value: 'performance',
      title: 'İyi çözünürlük',
      tag: 'Telefon',
      desc: 'Dengeli kalite ve akıcılık.'
    },
    {
      value: 'ultra',
      title: 'Akıcı',
      tag: 'Önerilen',
      tagClass: 'nova-perf-tag--recommended',
      desc: 'Telefonda en hızlı deneyim.',
      recommended: true
    }
  ];

  let lastRuntimeKey = '';
  let syncTimer = null;

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
  function modeScale(mode){
    if (mode === 'performance') return 0.86;
    if (mode === 'ultra') return ULTRA_SCALE;
    return 1;
  }
  function updatePerfCssVars(mode, scale){
    if (!document.body) return;
    const s = String(scale);
    document.body.style.setProperty('--nova-perf-scale', s);
    document.body.style.setProperty('--nova-perf-counter-zoom', scale === 1 ? '1' : String(1 / scale));
  }
  function isElementVisible(el){
    if (!el) return false;
    try{
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
      if (el.id === 'daily-puzzle-screen' && !el.classList.contains('open')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }catch(_){
      return false;
    }
  }
  function isHighResGameActive(){
    for (let i = 0; i < HIGH_RES_GAME_IDS.length; i++){
      if (isElementVisible(document.getElementById(HIGH_RES_GAME_IDS[i]))) return true;
    }
    return false;
  }
  function isSinglePlayerPerfActive(){
    for (let i = 0; i < SINGLE_PLAYER_PERF_IDS.length; i++){
      if (isElementVisible(document.getElementById(SINGLE_PLAYER_PERF_IDS[i]))) return true;
    }
    return false;
  }
  function isSinglePlayerPerfScreen(screenId){
    return SINGLE_PLAYER_PERF_IDS.indexOf(screenId) >= 0;
  }
  function isDuelPerfScreen(screenId){
    return screenId === 'duel-selection-screen' || screenId === 'duel-game-screen' || screenId === 'matchmakingScreen';
  }
  function ensureHighResScopeMarkers(){
    HIGH_RES_GAME_IDS.forEach(function(id){
      const el = document.getElementById(id);
      if (el && !el.classList.contains('nova-perf-hq-scope')) {
        el.classList.add('nova-perf-hq-scope');
      }
    });
  }
  function ensureSinglePlayerScopeMarkers(){
    SINGLE_PLAYER_PERF_IDS.forEach(function(id){
      const el = document.getElementById(id);
      if (el && !el.classList.contains('nova-perf-sp-scope')) {
        el.classList.add('nova-perf-sp-scope');
      }
    });
  }
  function ensureFullscreenScopeMarkers(){
    FULLSCREEN_SCOPE_IDS.forEach(function(id){
      const el = document.getElementById(id);
      if (el && !el.classList.contains('nova-perf-fullscreen-scope')) {
        el.classList.add('nova-perf-fullscreen-scope');
      }
    });
  }
  function applyBodyScale(scale){
    if (!document.body) return;
    try{
      const supportsZoom = (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom','1'));
      if (supportsZoom){
        document.body.style.zoom = scale === 1 ? '' : String(scale);
        document.body.style.transform = '';
        document.body.style.width = '';
      } else if (scale !== 1){
        document.body.style.transformOrigin = 'top left';
        document.body.style.transform = 'scale(' + scale + ')';
        document.body.style.width = (100 / scale) + '%';
      } else {
        document.body.style.transform = '';
        document.body.style.width = '';
        document.body.style.zoom = '';
      }
    }catch(_){}
  }
  function syncPerfRuntime(){
    if (!document.body) return;
    const mode = window.__novaPerfMode || getDefaultMode();
    const hqActive = mode === 'ultra' && isHighResGameActive();
    const spMediumActive = mode === 'ultra' && !hqActive && isSinglePlayerPerfActive();
    const duelMediumActive = spMediumActive;
    let scale = modeScale(mode);
    if (mode === 'ultra' && hqActive) scale = 1;
    else if (spMediumActive) scale = SINGLE_PLAYER_ULTRA_SCALE;
    const nextKey = mode + '|' + (hqActive ? '1' : '0') + '|' + (spMediumActive ? '1' : '0') + '|' + scale;
    if (nextKey === lastRuntimeKey) return;
    lastRuntimeKey = nextKey;
    document.body.classList.toggle('nova-perf-hq-active', hqActive);
    document.body.classList.toggle('nova-perf-sp-medium-active', spMediumActive);
    document.body.classList.toggle('nova-perf-duel-medium-active', duelMediumActive);
    updatePerfCssVars(mode, scale);
    applyBodyScale(scale);
    try{ if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout(); }catch(_){}
  }
  function novaPerfBeforeGameScreen(screenId){
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    const mode = window.__novaPerfMode || getDefaultMode();
    if (mode !== 'ultra') return;
    lastRuntimeKey = '';
    if (isSinglePlayerPerfScreen(screenId) || isDuelPerfScreen(screenId)) {
      document.body.classList.remove('nova-perf-hq-active');
      document.body.classList.add('nova-perf-sp-medium-active', 'nova-perf-duel-medium-active');
      updatePerfCssVars(mode, SINGLE_PLAYER_ULTRA_SCALE);
      applyBodyScale(SINGLE_PLAYER_ULTRA_SCALE);
      return;
    }
    document.body.classList.remove('nova-perf-sp-medium-active', 'nova-perf-duel-medium-active');
    document.body.classList.add('nova-perf-hq-active');
    updatePerfCssVars(mode, 1);
    applyBodyScale(1);
  }
  function schedulePerfSync(){
    if (syncTimer) return;
    syncTimer = setTimeout(function(){
      syncTimer = null;
      ensureHighResScopeMarkers();
      ensureSinglePlayerScopeMarkers();
      ensureFullscreenScopeMarkers();
      syncPerfRuntime();
    }, 80);
  }
  function applyMode(mode){
    mode = mode || getDefaultMode();
    window.__novaPerfMode = mode;
    lastRuntimeKey = '';
    try{ localStorage.setItem(KEY, mode); }catch(_){}
    if (!document.body) return;
    document.body.classList.remove('nova-perf-performance','nova-perf-ultra','nova-perf-hq-active','nova-perf-sp-medium-active','nova-perf-duel-medium-active');
    if (mode === 'performance') document.body.classList.add('nova-perf-performance');
    if (mode === 'ultra') document.body.classList.add('nova-perf-ultra');
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    updatePerfCssVars(mode, modeScale(mode));
    syncPerfRuntime();
  }
  function buildOptionsHtml(){
    return MODES.map(function(m){
      const tagCls = m.tagClass ? (' ' + m.tagClass) : '';
      const rowCls = m.recommended ? ' nova-perf-option--featured' : '';
      return '<label class="nova-perf-option' + rowCls + '" data-mode="' + m.value + '">'
        + '<input class="nova-perf-option-input" type="radio" name="nova_perf_mode" value="' + m.value + '">'
        + '<span class="nova-perf-option-check" aria-hidden="true"></span>'
        + '<span class="nova-perf-option-main">'
        + '<span class="nova-perf-option-top">'
        + '<span class="nova-perf-option-title">' + m.title + '</span>'
        + '<span class="nova-perf-tag' + tagCls + '">' + m.tag + '</span>'
        + '</span>'
        + '<span class="nova-perf-option-desc">' + m.desc + '</span>'
        + '</span>'
        + '</label>';
    }).join('');
  }
  function syncOptionUi(ov, mode){
    if (!ov) return;
    const inputs = ov.querySelectorAll('.nova-perf-option-input');
    inputs.forEach(function(inp){
      const on = inp.value === mode;
      inp.checked = on;
      const row = inp.closest('.nova-perf-option');
      if (row) row.classList.toggle('nova-perf-option--active', on);
    });
  }
  function closeOverlay(ov){
    if (ov) ov.classList.remove('nova-perf-overlay--open');
  }
  function openOverlay(ov){
    syncOptionUi(ov, window.__novaPerfMode || getDefaultMode());
    ov.classList.add('nova-perf-overlay--open');
  }
  function startPerfRuntimeWatch(){
    if (window.__novaPerfWatchStarted) return;
    window.__novaPerfWatchStarted = true;
    setInterval(function(){
      if ((window.__novaPerfMode || getDefaultMode()) === 'ultra') schedulePerfSync();
    }, 700);
    window.addEventListener('resize', schedulePerfSync);
    window.addEventListener('orientationchange', schedulePerfSync);
    window.addEventListener('pageshow', schedulePerfSync);
    document.addEventListener('visibilitychange', schedulePerfSync);
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
    ov.className = 'nova-perf-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Görüntü ve akıcılık ayarları');
    ov.innerHTML = '<div class="nova-perf-card">'
      + '<header class="nova-perf-header">'
      + '<div class="nova-perf-header-text">'
      + '<h3 class="nova-perf-title">Görüntü Kalitesi</h3>'
      + '<p class="nova-perf-lead">Cihazınıza uygun modu seçin. Telefonda ilk açılışta <strong>Akıcı</strong> seçilir.</p>'
      + '</div>'
      + '<button type="button" class="nova-perf-close" id="nova_perf_close" aria-label="Kapat">×</button>'
      + '</header>'
      + '<div class="nova-perf-options">' + buildOptionsHtml() + '</div>'
      + '<footer class="nova-perf-footer">'
      + '<button type="button" class="nova-perf-done" id="nova_perf_done">Tamam</button>'
      + '</footer>'
      + '</div>';
    document.body.appendChild(ov);

    ov.querySelectorAll('.nova-perf-option').forEach(function(row){
      row.addEventListener('click', function(){
        const inp = row.querySelector('.nova-perf-option-input');
        if (!inp) return;
        applyMode(inp.value);
        syncOptionUi(ov, inp.value);
      });
    });

    btn.addEventListener('click', function(){ openOverlay(ov); });
    ov.querySelector('#nova_perf_close').addEventListener('click', function(){ closeOverlay(ov); });
    ov.querySelector('#nova_perf_done').addEventListener('click', function(){ closeOverlay(ov); });
    ov.addEventListener('click', function(e){
      if (e.target === ov) closeOverlay(ov);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && ov.classList.contains('nova-perf-overlay--open')) closeOverlay(ov);
    });
  }
  function boot(){
    if (!document.body){
      setTimeout(boot, 50);
      return;
    }
    applyMode(getDefaultMode());
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    ensureUi();
    startPerfRuntimeWatch();
    schedulePerfSync();
  }
  window.novaPerfBeforeGameScreen = novaPerfBeforeGameScreen;
  window.novaSyncPerfRuntime = function(){
    lastRuntimeKey = '';
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    syncPerfRuntime();
  };
  window.novaApplyPerfMode = applyMode;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
