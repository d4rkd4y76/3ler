/* Buz Ejderi — EPİK rozeti (ana ekran + ilgili paneller) */
(function () {
  'use strict';

  var BADGE_CLASS = 'nova-hero-epic-badge';

  function badgeHtml(mod) {
    var m = mod ? ' nova-main-hero-epic-label--' + mod : '';
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
    wrap.className = BADGE_CLASS + ' nova-main-hero-epic-label' + (mod ? ' nova-main-hero-epic-label--' + mod : '');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = badgeHtml(mod);
    parent.insertBefore(wrap, parent.firstChild);
    return wrap;
  }

  function refreshMain(isBuz, visible) {
    var float = document.getElementById('nova-main-hero-float');
    if (!float) return;
    if (isBuz && visible) mountParent(float, 'main');
    else unmountParent(float);
  }

  window.novaBuzEjderEpicBadgeHtml = badgeHtml;
  window.novaBuzEjderMountEpicBadge = mountParent;
  window.novaBuzEjderUnmountEpicBadge = unmountParent;
  window.novaBuzEjderMountMainEpicBadge = function (p) { return mountParent(p, 'main'); };
  window.novaBuzEjderUnmountMainEpicBadge = unmountParent;
  window.novaBuzEjderRefreshMainEpicBadge = refreshMain;
})();
