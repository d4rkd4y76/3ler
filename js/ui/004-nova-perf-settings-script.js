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
  /* Akıcı mod: sabit ölçek 1 — geçişte büyüyüp küçülme yok (performans efektleri CSS ile) */
  const RUNTIME_SCALE = 1;
  const MODES = [
    {
      value: 'ultra',
      title: 'Akıcı',
      tag: 'Telefon',
      tagClass: 'nova-perf-tag--recommended',
      desc: 'En akıcı deneyim; görüntü ölçeği sabit kalır, efektler hafifletilir.',
      recommended: true
    },
    {
      value: 'normal',
      title: 'Yüksek çözünürlük',
      tag: 'Tablet / PC',
      desc: 'Tablet ve bilgisayarda en net görüntü.'
    }
  ];

  function normalizeMode(mode){
    if (mode === 'performance') return 'ultra';
    if (mode === 'ultra' || mode === 'normal') return mode;
    return null;
  }

  let lastRuntimeKey = '';

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
      const v = normalizeMode(localStorage.getItem(KEY));
      if (v) return v;
    }catch(_){}
    return null;
  }
  function getDefaultMode(){
    const saved = getSavedMode();
    if (saved) return saved;
    return isPhoneDevice() ? 'ultra' : 'normal';
  }
  function modeScale(mode){
    return RUNTIME_SCALE;
  }
  function updatePerfCssVars(mode, scale){
    if (!document.body) return;
    document.body.style.setProperty('--nova-perf-scale', '1');
    document.body.style.setProperty('--nova-perf-counter-zoom', '1');
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
    if (document.body.classList.contains('nova-duel-game-open')) {
      try {
        document.body.style.zoom = '1';
        document.body.style.transform = 'none';
        document.body.style.width = '100%';
      } catch (_) {}
      return;
    }
    try{
      document.body.style.zoom = '';
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.width = '';
    }catch(_){}
  }
  function setPerfScreenClasses(hqActive, spMediumActive){
    const duelMediumActive = spMediumActive;
    document.body.classList.toggle('nova-perf-hq-active', hqActive);
    document.body.classList.toggle('nova-perf-sp-medium-active', spMediumActive);
    document.body.classList.toggle('nova-perf-duel-medium-active', duelMediumActive);
  }
  function syncPerfRuntime(){
    if (!document.body) return;
    const mode = window.__novaPerfMode || getDefaultMode();
    const hqActive = mode === 'ultra' && isHighResGameActive();
    const spMediumActive = mode === 'ultra' && !hqActive && isSinglePlayerPerfActive();
    const nextKey = mode + '|' + (hqActive ? '1' : '0') + '|' + (spMediumActive ? '1' : '0');
    if (nextKey === lastRuntimeKey) return;
    lastRuntimeKey = nextKey;
    setPerfScreenClasses(hqActive, spMediumActive);
    updatePerfCssVars(mode, RUNTIME_SCALE);
    applyBodyScale(RUNTIME_SCALE);
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
      setPerfScreenClasses(false, true);
    } else {
      setPerfScreenClasses(true, false);
    }
    updatePerfCssVars(mode, RUNTIME_SCALE);
    applyBodyScale(RUNTIME_SCALE);
  }
  function novaPerfBeforeMainScreen(){
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    lastRuntimeKey = '';
    setPerfScreenClasses(false, false);
    updatePerfCssVars(window.__novaPerfMode || getDefaultMode(), RUNTIME_SCALE);
    applyBodyScale(RUNTIME_SCALE);
  }
  function schedulePerfSync(){
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    syncPerfRuntime();
  }
  function applyMode(mode){
    mode = normalizeMode(mode) || getDefaultMode();
    window.__novaPerfMode = mode;
    lastRuntimeKey = '';
    try{ localStorage.setItem(KEY, mode); }catch(_){}
    if (!document.body) return;
    document.body.classList.remove('nova-perf-performance','nova-perf-ultra','nova-perf-hq-active','nova-perf-sp-medium-active','nova-perf-duel-medium-active');
    if (mode === 'ultra') document.body.classList.add('nova-perf-ultra');
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    updatePerfCssVars(mode, modeScale(mode));
    syncPerfRuntime();
    try {
      if (typeof window.novaStoreMountPendingHeroes === 'function') {
        window.novaStoreMountPendingHeroes();
      }
    } catch (_) {}
    try {
      document.dispatchEvent(new CustomEvent('nova:perf-mode-changed', { detail: { mode: mode } }));
    } catch (_) {}
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
    }, 2500);
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
      + '<p class="nova-perf-lead">Telefonda ilk açılışta <strong>Akıcı</strong>, tablet ve bilgisayarda <strong>Yüksek çözünürlük</strong> seçilir. İstediğiniz zaman değiştirebilirsiniz.</p>'
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
  window.novaPerfBeforeMainScreen = novaPerfBeforeMainScreen;
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
