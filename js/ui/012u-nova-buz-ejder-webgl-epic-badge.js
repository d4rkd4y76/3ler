/* Buz Ejderi — ana ekran EPİK rozeti (premium CSS) */
(function () {
  'use strict';

  var BADGE_ID = 'nova-main-hero-epic-badge';

  function unmount(floatEl) {
    if (!floatEl) return;
    var el = floatEl.querySelector('#' + BADGE_ID);
    if (el) el.remove();
  }

  function mount(floatEl) {
    if (!floatEl) return null;
    unmount(floatEl);
    var wrap = document.createElement('div');
    wrap.id = BADGE_ID;
    wrap.className = 'nova-main-hero-epic-label';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<span class="nova-main-hero-epic-label__halo" aria-hidden="true"></span>' +
      '<span class="nova-main-hero-epic-label__wing nova-main-hero-epic-label__wing--l" aria-hidden="true"></span>' +
      '<span class="nova-main-hero-epic-label__wing nova-main-hero-epic-label__wing--r" aria-hidden="true"></span>' +
      '<span class="nova-main-hero-epic-label__core">' +
      '<span class="nova-main-hero-epic-label__text">EPİK</span>' +
      '</span>';
    floatEl.insertBefore(wrap, floatEl.firstChild);
    return wrap;
  }

  function refreshForBuz(isBuz, visible) {
    var float = document.getElementById('nova-main-hero-float');
    if (!float) return;
    if (isBuz && visible) mount(float);
    else unmount(float);
  }

  window.novaBuzEjderMountMainEpicBadge = mount;
  window.novaBuzEjderUnmountMainEpicBadge = unmount;
  window.novaBuzEjderRefreshMainEpicBadge = refreshForBuz;
})();
