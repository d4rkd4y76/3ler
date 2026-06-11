(function () {
  const KEY = 'novaPerfMode';
  const HIGH_RES_GAME_IDS = [
    'daily-puzzle-screen',
    'fillblank-screen',
    'match-screen'
  ];
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
  const PERF_TIERS = ['main', 'sp', 'hq', 'native'];
  const MODES = [
    {
      value: 'ultra',
      title: 'Akıcı',
      tag: 'Telefon',
      tagClass: 'nova-perf-tag--recommended',
      desc: 'En akıcı deneyim; mağaza ve ana ekranda takılma olmaz.',
      recommended: true
    },
    {
      value: 'normal',
      title: 'Yüksek çözünürlük',
      tag: 'Tablet / PC',
      desc: 'Tablet ve bilgisayarda en net görüntü.'
    }
  ];

  function normalizeMode(mode) {
    if (mode === 'performance') return 'ultra';
    if (mode === 'ultra' || mode === 'normal') return mode;
    return null;
  }

  let lastRuntimeKey = '';

  function isPhoneDevice() {
    try {
      if (window.matchMedia) {
        return window.matchMedia('(max-width: 768px), (max-width: 1024px) and (hover: none) and (pointer: coarse)').matches;
      }
    } catch (_) {}
    return (window.innerWidth || 0) <= 768;
  }

  function getSavedMode() {
    try {
      const v = normalizeMode(localStorage.getItem(KEY));
      if (v) return v;
    } catch (_) {}
    return null;
  }

  function getDefaultMode() {
    const saved = getSavedMode();
    if (saved) return saved;
    return isPhoneDevice() ? 'ultra' : 'normal';
  }

  function isHighResScreenId(screenId) {
    return HIGH_RES_GAME_IDS.indexOf(screenId) >= 0;
  }

  function isSinglePlayerPerfScreen(screenId) {
    return SINGLE_PLAYER_PERF_IDS.indexOf(screenId) >= 0;
  }

  function isDuelPerfScreen(screenId) {
    return screenId === 'duel-selection-screen' || screenId === 'duel-game-screen' || screenId === 'matchmakingScreen';
  }

  function isElementVisible(el) {
    if (!el) return false;
    try {
      const st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
      if (el.id === 'daily-puzzle-screen' && !el.classList.contains('open')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    } catch (_) {
      return false;
    }
  }

  function isHighResGameActive() {
    for (let i = 0; i < HIGH_RES_GAME_IDS.length; i++) {
      if (isElementVisible(document.getElementById(HIGH_RES_GAME_IDS[i]))) return true;
    }
    return false;
  }

  function isSinglePlayerPerfActive() {
    for (let i = 0; i < SINGLE_PLAYER_PERF_IDS.length; i++) {
      const id = SINGLE_PLAYER_PERF_IDS[i];
      if (id === 'duel-game-screen') continue;
      if (isElementVisible(document.getElementById(id))) return true;
    }
    return false;
  }

  function ensureHighResScopeMarkers() {
    HIGH_RES_GAME_IDS.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('nova-perf-hq-scope')) {
        el.classList.add('nova-perf-hq-scope');
      }
    });
  }

  function ensureSinglePlayerScopeMarkers() {
    SINGLE_PLAYER_PERF_IDS.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('nova-perf-sp-scope')) {
        el.classList.add('nova-perf-sp-scope');
      }
    });
  }

  function ensureFullscreenScopeMarkers() {
    FULLSCREEN_SCOPE_IDS.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('nova-perf-fullscreen-scope')) {
        el.classList.add('nova-perf-fullscreen-scope');
      }
    });
  }

  function updatePerfCssVars(mode) {
    if (!document.body) return;
    if (isLoginGateActive()) {
      resetBodyScaleNeutral();
      return;
    }
    const ultra = normalizeMode(mode) === 'ultra';
    const bodyZoom = ultra ? ULTRA_SCALE : 1;
    document.body.style.setProperty('--nova-perf-scale', String(bodyZoom));
    document.body.style.setProperty('--nova-perf-body-zoom', String(bodyZoom));
    document.body.style.setProperty('--nova-perf-counter-zoom', String(1 / bodyZoom));
    document.body.style.setProperty('--nova-perf-sp-boost', String(SINGLE_PLAYER_ULTRA_SCALE / bodyZoom));
  }

  function clearPerfTier() {
    if (!document.body) return;
    PERF_TIERS.forEach(function (t) {
      document.body.classList.remove('nova-perf-tier-' + t);
    });
  }

  function setPerfTier(tier) {
    if (!document.body) return;
    tier = PERF_TIERS.indexOf(tier) >= 0 ? tier : 'main';
    clearPerfTier();
    document.body.classList.add('nova-perf-tier-' + tier);
  }

  function isLoginGateActive() {
    try {
      return !document.documentElement.classList.contains('nova-has-session');
    } catch (_) {
      return true;
    }
  }

  function isNativeFullscreenContext() {
    return (
      document.body.classList.contains('nova-duel-game-open') ||
      document.body.classList.contains('roborox-reader-open')
    );
  }

  function resetBodyScaleNeutral() {
    if (!document.body) return;
    try {
      document.body.style.zoom = '1';
      document.body.style.transform = 'none';
      document.body.style.width = '100%';
      document.body.style.transformOrigin = '';
      document.body.style.setProperty('--nova-perf-scale', '1');
      document.body.style.setProperty('--nova-perf-body-zoom', '1');
      document.body.style.setProperty('--nova-perf-counter-zoom', '1');
      document.body.style.setProperty('--nova-perf-sp-boost', '1');
    } catch (_) {}
  }

  function applyBodyScaleForMode(mode) {
    if (!document.body) return;
    mode = normalizeMode(mode) || getDefaultMode();

    if (isLoginGateActive()) {
      resetBodyScaleNeutral();
      return;
    }

    if (isNativeFullscreenContext()) {
      try {
        document.body.style.zoom = '1';
        document.body.style.transform = 'none';
        document.body.style.width = '100%';
      } catch (_) {}
      return;
    }

    if (mode !== 'ultra') {
      try {
        document.body.style.zoom = '';
        document.body.style.transform = '';
        document.body.style.width = '';
        document.body.style.transformOrigin = '';
      } catch (_) {}
      return;
    }

    try {
      const supportsZoom = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '1');
      if (supportsZoom) {
        document.body.style.zoom = String(ULTRA_SCALE);
        document.body.style.transform = '';
        document.body.style.width = '';
        document.body.style.transformOrigin = '';
      } else {
        document.body.style.transformOrigin = 'top left';
        document.body.style.transform = 'scale(' + ULTRA_SCALE + ')';
        document.body.style.width = (100 / ULTRA_SCALE) + '%';
        document.body.style.zoom = '';
      }
    } catch (_) {}
  }

  function tierForScreenId(screenId) {
    if (screenId === 'duel-game-screen') return 'native';
    if (isHighResScreenId(screenId)) return 'hq';
    if (isSinglePlayerPerfScreen(screenId) || isDuelPerfScreen(screenId)) return 'sp';
    return 'main';
  }

  function tierFromVisibleScreens() {
    if (document.body.classList.contains('nova-duel-game-open')) return 'native';
    if (isHighResGameActive()) return 'hq';
    if (isSinglePlayerPerfActive()) return 'sp';
    return 'main';
  }

  function shouldUseUnifiedLiteFrames() {
    if (!document.body || document.body.classList.contains('nova-perf-hq-active')) return false;
    const mode = normalizeMode(window.__novaPerfMode) || getDefaultMode();
    if (mode === 'ultra' || mode === 'performance') return true;
    try {
      return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    } catch (_) {}
    return false;
  }

  function syncUnifiedFrameLiteClass() {
    if (!document.body) return;
    document.body.classList.toggle('nova-frames-unified-lite', shouldUseUnifiedLiteFrames());
  }

  function applyPerfTierState(tier, mode) {
    mode = normalizeMode(mode) || getDefaultMode();
    if (isLoginGateActive()) {
      clearPerfTier();
      resetBodyScaleNeutral();
      document.body.classList.toggle('nova-perf-hq-active', false);
      document.body.classList.toggle('nova-perf-sp-medium-active', false);
      document.body.classList.toggle('nova-perf-duel-medium-active', false);
      return;
    }
    setPerfTier(tier);
    document.body.classList.toggle('nova-perf-hq-active', tier === 'hq');
    document.body.classList.toggle('nova-perf-sp-medium-active', tier === 'sp');
    document.body.classList.toggle('nova-perf-duel-medium-active', tier === 'sp');
    updatePerfCssVars(mode);
    if (tier === 'native' || isNativeFullscreenContext()) {
      try {
        document.body.style.zoom = '1';
        document.body.style.transform = 'none';
        document.body.style.width = '100%';
      } catch (_) {}
    } else {
      applyBodyScaleForMode(mode);
    }
  }

  function syncPerfRuntime() {
    if (!document.body) return;
    const mode = normalizeMode(window.__novaPerfMode) || getDefaultMode();
    const tier = tierFromVisibleScreens();
    const nextKey = mode + '|' + tier;
    if (nextKey === lastRuntimeKey) return;
    lastRuntimeKey = nextKey;
    applyPerfTierState(tier, mode);
    syncUnifiedFrameLiteClass();
    try {
      if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
    } catch (_) {}
  }

  function novaPerfBeforeGameScreen(screenId) {
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    const mode = normalizeMode(window.__novaPerfMode) || getDefaultMode();
    if (mode !== 'ultra') return;
    lastRuntimeKey = '';
    const tier = screenId ? tierForScreenId(screenId) : 'hq';
    applyPerfTierState(tier, mode);
    syncUnifiedFrameLiteClass();
  }

  function novaPerfBeforeMainScreen() {
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    const mode = normalizeMode(window.__novaPerfMode) || getDefaultMode();
    lastRuntimeKey = '';
    applyPerfTierState('main', mode);
    syncUnifiedFrameLiteClass();
  }

  function schedulePerfSync() {
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    syncPerfRuntime();
  }

  function applyMode(mode) {
    mode = normalizeMode(mode) || getDefaultMode();
    window.__novaPerfMode = mode;
    lastRuntimeKey = '';
    try {
      localStorage.setItem(KEY, mode);
    } catch (_) {}
    if (!document.body) return;
    document.body.classList.remove(
      'nova-perf-performance',
      'nova-perf-ultra',
      'nova-perf-hq-active',
      'nova-perf-sp-medium-active',
      'nova-perf-duel-medium-active'
    );
    if (mode === 'ultra') document.body.classList.add('nova-perf-ultra');
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    applyPerfTierState(tierFromVisibleScreens(), mode);
    try {
      if (typeof window.novaStoreMountPendingHeroes === 'function') {
        window.novaStoreMountPendingHeroes();
      }
    } catch (_) {}
    syncUnifiedFrameLiteClass();
    try {
      document.dispatchEvent(new CustomEvent('nova:perf-mode-changed', { detail: { mode: mode } }));
    } catch (_) {}
  }

  function buildOptionsHtml() {
    return MODES.map(function (m) {
      const tagCls = m.tagClass ? ' ' + m.tagClass : '';
      const rowCls = m.recommended ? ' nova-perf-option--featured' : '';
      return (
        '<label class="nova-perf-option' +
        rowCls +
        '" data-mode="' +
        m.value +
        '">' +
        '<input class="nova-perf-option-input" type="radio" name="nova_perf_mode" value="' +
        m.value +
        '">' +
        '<span class="nova-perf-option-check" aria-hidden="true"></span>' +
        '<span class="nova-perf-option-main">' +
        '<span class="nova-perf-option-top">' +
        '<span class="nova-perf-option-title">' +
        m.title +
        '</span>' +
        '<span class="nova-perf-tag' +
        tagCls +
        '">' +
        m.tag +
        '</span>' +
        '</span>' +
        '<span class="nova-perf-option-desc">' +
        m.desc +
        '</span>' +
        '</span>' +
        '</label>'
      );
    }).join('');
  }

  function syncOptionUi(ov, mode) {
    if (!ov) return;
    const inputs = ov.querySelectorAll('.nova-perf-option-input');
    inputs.forEach(function (inp) {
      const on = inp.value === mode;
      inp.checked = on;
      const row = inp.closest('.nova-perf-option');
      if (row) row.classList.toggle('nova-perf-option--active', on);
    });
  }

  function closeOverlay(ov) {
    if (ov) ov.classList.remove('nova-perf-overlay--open');
  }

  function openOverlay(ov) {
    syncOptionUi(ov, window.__novaPerfMode || getDefaultMode());
    ov.classList.add('nova-perf-overlay--open');
  }

  function startPerfRuntimeWatch() {
    if (window.__novaPerfWatchStarted) return;
    window.__novaPerfWatchStarted = true;
    try {
      new MutationObserver(function () {
        if (document.documentElement.classList.contains('nova-has-session')) {
          lastRuntimeKey = '';
          schedulePerfSync();
        } else {
          resetBodyScaleNeutral();
          clearPerfTier();
        }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (_) {}
    setInterval(function () {
      if ((window.__novaPerfMode || getDefaultMode()) === 'ultra') schedulePerfSync();
    }, 2500);
    window.addEventListener('resize', function () {
      schedulePerfSync();
      syncUnifiedFrameLiteClass();
    });
    window.addEventListener('orientationchange', function () {
      schedulePerfSync();
      syncUnifiedFrameLiteClass();
    });
    window.addEventListener('pageshow', schedulePerfSync);
    document.addEventListener('visibilitychange', schedulePerfSync);
  }

  function ensureUi() {
    if (document.getElementById('nova_perf_open_btn')) return;
    const mainButtons = document.querySelector('#main-screen .buttons');
    if (!mainButtons) return;
    const btn = document.createElement('button');
    btn.id = 'nova_perf_open_btn';
    btn.type = 'button';
    btn.className = 'kupa-siralama-button';
    btn.innerHTML =
      '<span class="main-menu-icon" aria-hidden="true">⚙</span><span class="main-menu-label">Ayarlar</span>';
    const rankBtn = document.getElementById('kupa-siralama-button');
    if (rankBtn && rankBtn.parentNode === mainButtons) {
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
    ov.innerHTML =
      '<div class="nova-perf-card">' +
      '<header class="nova-perf-header">' +
      '<div class="nova-perf-header-text">' +
      '<h3 class="nova-perf-title">Görüntü Kalitesi</h3>' +
      '<p class="nova-perf-lead">Telefonda ilk açılışta <strong>Akıcı</strong>, tablet ve bilgisayarda <strong>Yüksek çözünürlük</strong> seçilir. İstediğiniz zaman değiştirebilirsiniz.</p>' +
      '</div>' +
      '<button type="button" class="nova-perf-close" id="nova_perf_close" aria-label="Kapat">×</button>' +
      '</header>' +
      '<div class="nova-perf-options">' +
      buildOptionsHtml() +
      '</div>' +
      '<footer class="nova-perf-footer">' +
      '<button type="button" class="nova-perf-done" id="nova_perf_done">Tamam</button>' +
      '</footer>' +
      '</div>';
    document.body.appendChild(ov);

    ov.querySelectorAll('.nova-perf-option').forEach(function (row) {
      row.addEventListener('click', function () {
        const inp = row.querySelector('.nova-perf-option-input');
        if (!inp) return;
        applyMode(inp.value);
        syncOptionUi(ov, inp.value);
      });
    });

    btn.addEventListener('click', function () {
      openOverlay(ov);
    });
    ov.querySelector('#nova_perf_close').addEventListener('click', function () {
      closeOverlay(ov);
    });
    ov.querySelector('#nova_perf_done').addEventListener('click', function () {
      closeOverlay(ov);
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeOverlay(ov);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('nova-perf-overlay--open')) closeOverlay(ov);
    });
  }

  function boot() {
    if (!document.body) {
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
  window.novaSyncPerfRuntime = function () {
    lastRuntimeKey = '';
    ensureHighResScopeMarkers();
    ensureSinglePlayerScopeMarkers();
    ensureFullscreenScopeMarkers();
    syncPerfRuntime();
  };
  window.novaApplyPerfMode = applyMode;
  window.novaSetPerfTier = setPerfTier;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
