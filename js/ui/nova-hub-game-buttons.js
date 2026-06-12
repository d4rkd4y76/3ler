/**
 * Sağ ray ÖDEV/GÖREV + bonus mini butonları — tek tip görünüm.
 */
(function () {
  'use strict';

  var BONUS_BTNS = [
    { id: 'puzzle_fab', variant: 'puzzle', icon: '🧩', label: 'BULMACA' },
    { id: 'fillblank_fab', variant: 'fillblank', icon: '✏️', label: 'BOŞLUK' },
    { id: 'match_fab', variant: 'match', icon: '🔗', label: 'EŞLEŞTİR' }
  ];

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function upgradeRailButton(btn, opts) {
    if (!btn || btn.dataset.novaGameBtnUpgraded === '1') return btn;
    opts = opts || {};
    var badge = opts.badgeEl || btn.querySelector('.hw-badge, .q-badge, .nova-game-badge');

    btn.classList.add('nova-game-btn', 'nova-game-btn--' + (opts.variant || 'learn'));
    btn.innerHTML = '';
    btn.appendChild(el('span', 'nova-game-btn__icon', opts.icon || '⭐'));

    var textWrap = el('span', 'nova-game-btn__text');
    textWrap.appendChild(el('span', 'nova-game-btn__title', opts.title || ''));
    if (opts.sub) textWrap.appendChild(el('span', 'nova-game-btn__sub', opts.sub));
    btn.appendChild(textWrap);

    if (badge) btn.appendChild(badge);
    btn.dataset.novaGameBtnUpgraded = '1';
    return btn;
  }

  function applyBonusMiniBtn(btn, cfg) {
    if (!btn || !cfg) return;
    btn.type = 'button';
    btn.className = 'nova-bonus-mini-btn nova-bonus-mini-btn--' + cfg.variant;
    btn.innerHTML =
      '<span class="nova-bonus-mini-btn__ico" aria-hidden="true">' + cfg.icon + '</span>' +
      '<span class="nova-bonus-mini-btn__txt">' + cfg.label + '</span>' +
      '<span class="nova-bonus-mini-btn__egg" aria-hidden="true">🐉</span>';

    btn.style.removeProperty('width');
    btn.style.removeProperty('height');
    btn.style.removeProperty('min-height');
    btn.style.removeProperty('max-width');
    btn.style.removeProperty('font-size');
    btn.style.removeProperty('padding');

    var wrap = btn.parentElement;
    if (wrap) {
      var tag = wrap.querySelector('.nova-fab-reward-tag');
      if (tag) tag.remove();
    }
    btn.dataset.novaBonusMiniUpgraded = '1';
  }

  function upgradeBonusButtons() {
    for (var i = 0; i < BONUS_BTNS.length; i++) {
      applyBonusMiniBtn(document.getElementById(BONUS_BTNS[i].id), BONUS_BTNS[i]);
    }
  }

  function upgradeHomeworkFab() {
    var btn = document.getElementById('homework_fab');
    if (!btn) return;
    upgradeRailButton(btn, {
      variant: 'homework',
      icon: '🚀',
      title: 'ÖDEV',
      sub: 'Görevlerin',
      badgeEl: document.getElementById('homework_badge')
    });
  }

  function upgradeQuestFab() {
    var btn = document.getElementById('quest_fab');
    if (!btn) return;
    upgradeRailButton(btn, {
      variant: 'quest',
      icon: '⚔️',
      title: 'GÖREV',
      sub: 'Haftalık',
      badgeEl: document.getElementById('quest_badge')
    });
  }

  function upgradeAll() {
    upgradeHomeworkFab();
    upgradeQuestFab();
    upgradeBonusButtons();
  }

  function scheduleUpgrade() {
    upgradeAll();
    requestAnimationFrame(upgradeAll);
    var delays = [80, 200, 500, 1200, 2500, 4000];
    for (var i = 0; i < delays.length; i++) {
      setTimeout(upgradeAll, delays[i]);
    }
  }

  window.novaUpgradeHubGameButtons = upgradeAll;
  window.novaUpgradeBonusMiniButtons = upgradeBonusButtons;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleUpgrade, { once: true });
  } else {
    scheduleUpgrade();
  }

  document.addEventListener('nova:main-screen-visible', upgradeAll);
  document.addEventListener('nova:sprite-boot-complete', function () {
    setTimeout(upgradeAll, 80);
    setTimeout(upgradeAll, 600);
  });

  try {
    var panel = document.getElementById('nova_bonus_drawer_panel');
    if (panel) {
      new MutationObserver(function () {
        upgradeBonusButtons();
      }).observe(panel, { childList: true, subtree: true });
    }
  } catch (_) {}
})();
