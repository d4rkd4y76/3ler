/* Epik ejder — akıcı gradient EPİK rozeti (tüm ejderler, tüm bağlamlar) */
(function () {
  'use strict';

  var BADGE_CLASS = 'nova-hero-epic-badge';

  var THEMES = {
    buz_ejder: {
      cls: 'buz',
      c1: '#67e8f9',
      c2: '#c084fc',
      c3: '#f472b6',
      glow: 'rgba(103, 232, 249, .38)',
      bg: 'linear-gradient(165deg, #0e1628 0%, #12102a 48%, #0a1020 100%)'
    },
    alev_ejder: {
      cls: 'alev',
      c1: '#fde68a',
      c2: '#f97316',
      c3: '#ef4444',
      glow: 'rgba(249, 115, 22, .4)',
      bg: 'linear-gradient(165deg, #241006 0%, #1a0804 48%, #120602 100%)'
    },
    gece_ejder: {
      cls: 'gece',
      c1: '#ede9fe',
      c2: '#a78bfa',
      c3: '#6d28d9',
      glow: 'rgba(124, 58, 237, .42)',
      bg: 'linear-gradient(165deg, #120820 0%, #0e0618 48%, #0a0414 100%)'
    }
  };

  function themeFor(heroId) {
    return THEMES[heroId] || THEMES.buz_ejder;
  }

  function tierFor(mod) {
    if (mod === 'rank' || mod === 'inv') return 'compact';
    if (mod === 'main') return 'hero';
    if (mod === 'store' || mod === 'detail' || mod === 'level' || mod === 'sheet') return 'standard';
    return 'standard';
  }

  function applyThemeVars(el, theme) {
    el.style.setProperty('--epic-c1', theme.c1);
    el.style.setProperty('--epic-c2', theme.c2);
    el.style.setProperty('--epic-c3', theme.c3);
    el.style.setProperty('--epic-glow', theme.glow);
    el.style.setProperty('--epic-bg', theme.bg);
  }

  function badgeHtml(tier) {
    var aura = tier === 'hero' ? '<span class="nova-epic-badge__aura" aria-hidden="true"></span>' : '';
    var sheen = tier !== 'compact' ? '<span class="nova-epic-badge__sheen" aria-hidden="true"></span>' : '';
    return (
      aura +
      '<div class="nova-epic-badge__frame">' +
      '<span class="nova-epic-badge__ring" aria-hidden="true"></span>' +
      '<span class="nova-epic-badge__body">' +
      sheen +
      '<span class="nova-epic-badge__gem nova-epic-badge__gem--l" aria-hidden="true"></span>' +
      '<span class="nova-epic-badge__gem nova-epic-badge__gem--r" aria-hidden="true"></span>' +
      '<span class="nova-epic-badge__text">' +
      '<span class="nova-epic-badge__text-glow" aria-hidden="true">EPİK</span>' +
      '<span class="nova-epic-badge__text-main">EPİK</span>' +
      '</span>' +
      '</span>' +
      '</div>'
    );
  }

  function unmountParent(parent) {
    if (!parent) return;
    var el = parent.querySelector('.' + BADGE_CLASS);
    if (el) el.remove();
  }

  function mountParent(parent, heroId, mod) {
    if (!parent) return null;
    unmountParent(parent);
    var theme = themeFor(heroId);
    var tier = tierFor(mod);
    var wrap = document.createElement('div');
    wrap.className =
      BADGE_CLASS +
      ' nova-main-hero-epic-label nova-main-hero-epic-label--' + theme.cls +
      ' nova-main-hero-epic-label--tier-' + tier +
      (mod ? ' nova-main-hero-epic-label--' + mod : '');
    wrap.setAttribute('aria-hidden', 'true');
    applyThemeVars(wrap, theme);
    wrap.innerHTML = badgeHtml(tier);
    parent.insertBefore(wrap, parent.firstChild);
    return wrap;
  }

  function refreshMain(heroId, visible) {
    var float = document.getElementById('nova-main-hero-float');
    if (!float) return;
    if (visible && THEMES[heroId]) mountParent(float, heroId, 'main');
    else unmountParent(float);
  }

  window.novaEpicDragonBadgeMount = mountParent;
  window.novaEpicDragonBadgeUnmount = unmountParent;
  window.novaEpicDragonBadgeRefreshMain = refreshMain;
  window.novaEpicDragonBadgeHtml = badgeHtml;

  window.novaBuzEjderMountEpicBadge = function (p, m) { return mountParent(p, 'buz_ejder', m); };
  window.novaBuzEjderUnmountEpicBadge = unmountParent;
  window.novaBuzEjderRefreshMainEpicBadge = function (isBuz, visible) {
    refreshMain('buz_ejder', isBuz && visible);
  };
  window.novaAlevEjderMountEpicBadge = function (p, m) { return mountParent(p, 'alev_ejder', m); };
  window.novaAlevEjderUnmountEpicBadge = unmountParent;
  window.novaAlevEjderRefreshMainEpicBadge = function (isAlev, visible) {
    refreshMain('alev_ejder', isAlev && visible);
  };
  window.novaGeceEjderMountEpicBadge = function (p, m) { return mountParent(p, 'gece_ejder', m); };
  window.novaGeceEjderUnmountEpicBadge = unmountParent;
  window.novaGeceEjderRefreshMainEpicBadge = function (isGece, visible) {
    refreshMain('gece_ejder', isGece && visible);
  };
})();
