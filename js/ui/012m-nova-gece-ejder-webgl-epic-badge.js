/* Gece Ejderi — EPİK rozeti (ana ekran + paneller) */
(function () {
  'use strict';

  var BADGE_CLASS = 'nova-hero-epic-badge';

  function badgeHtml() {
    return (
      '<span class="nova-main-hero-epic-label__halo" aria-hidden="true"></span>' +
      '<span class="nova-main-hero-epic-label__wing nova-main-hero-epic-label__wing--l" aria-hidden="true"></span>' +
      '<span class="nova-main-hero-epic-label__wing nova-main-hero-epic-label__wing--r" aria-hidden="true"></span>' +
      '<span class="nova-main-hero-epic-label__core">' +
      '<span class="nova-main-hero-epic-label__text">EPİK</span>' +
      '</span>'
    );
  }

  function unmountParent(parent) {
    if (!parent) return;
    var el = parent.querySelector('.' + BADGE_CLASS);
    if (el) el.remove();
  }

  function mountParent(parent, mod) {
    if (!parent) return null;
    unmountParent(parent);
    var wrap = document.createElement('div');
    wrap.className = BADGE_CLASS + ' nova-main-hero-epic-label nova-main-hero-epic-label--gece' + (mod ? ' nova-main-hero-epic-label--' + mod : '');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = badgeHtml();
    parent.insertBefore(wrap, parent.firstChild);
    return wrap;
  }

  function refreshMain(isGece, visible) {
    var float = document.getElementById('nova-main-hero-float');
    if (!float) return;
    if (isGece && visible) mountParent(float, 'main');
    else unmountParent(float);
  }

  window.novaGeceEjderEpicBadgeHtml = badgeHtml;
  window.novaGeceEjderMountEpicBadge = mountParent;
  window.novaGeceEjderUnmountEpicBadge = unmountParent;
  window.novaGeceEjderMountMainEpicBadge = function (p) { return mountParent(p, 'main'); };
  window.novaGeceEjderUnmountMainEpicBadge = unmountParent;
  window.novaGeceEjderRefreshMainEpicBadge = refreshMain;
})();
