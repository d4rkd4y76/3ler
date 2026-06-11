/**
 * Ana ekran sekmeleri — Avatar (varsayılan) / Kahraman / Lig
 * Kahraman ve Lig verileri yalnızca sekme ilk açıldığında yüklenir.
 */
(function () {
  'use strict';

  var loaded = { avatar: false, kahraman: false, lig: false };
  var ligLoadPromise = null;
  var heroLoadPromise = null;
  var activeTab = 'avatar';

  function hubActive() {
    var hero = document.getElementById('main-profile-hero');
    return !!(hero && hero.classList.contains('nova-main-hub'));
  }

  function getTabButtons() {
    return document.querySelectorAll('#nova-main-tabs [data-nova-main-tab]');
  }

  function getPanel(name) {
    return document.getElementById('nova-main-tab-' + name);
  }

  function afterPanelPaint(fn) {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          Promise.resolve()
            .then(fn)
            .then(resolve)
            .catch(function () {
              resolve();
            });
        });
      });
    });
  }

  function kahramanContentReady() {
    var zone = document.getElementById('nova-main-hero-zone');
    var slot = document.getElementById('nova-main-hero-slot');
    if (!zone || !slot || !zone.classList.contains('is-visible')) return false;
    var host = slot.querySelector('[data-nova-main-hero]');
    if (!host) return false;
    var canvas = host.querySelector('canvas');
    if (canvas && canvas.width > 8 && canvas.height > 8) return true;
    return !!host.querySelector('svg');
  }

  function ligContentReady() {
    var rank = document.getElementById('student-rank');
    if (rank && rank.querySelector('.nova-lig')) return true;
    return !!window.__novaLigCupLoaded;
  }

  function finishHeroTabUi() {
    var shell = document.getElementById('nova-main-hero-showcase');
    var zone = document.getElementById('nova-main-hero-zone');
    if (shell && zone && zone.classList.contains('is-visible')) {
      shell.classList.add('is-visible');
      shell.setAttribute('aria-hidden', 'false');
    }
    try {
      if (typeof window.novaRefreshMainHeroStars === 'function') {
        window.novaRefreshMainHeroStars();
      }
    } catch (_) {}
    try {
      if (typeof window.novaSpriteRefreshMainHeroCanvases === 'function') {
        window.novaSpriteRefreshMainHeroCanvases();
      }
    } catch (_) {}
  }

  function setTab(name) {
    if (!hubActive()) return;
    var panel = getPanel(name);
    if (!panel) return;
    activeTab = name;

    getTabButtons().forEach(function (btn) {
      var on = btn.getAttribute('data-nova-main-tab') === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });

    ['avatar', 'kahraman', 'lig'].forEach(function (key) {
      var p = getPanel(key);
      if (!p) return;
      var isActive = key === name;
      p.classList.toggle('is-active', isActive);
      if (isActive) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });

    try {
      document.dispatchEvent(
        new CustomEvent('nova:main-tab-activate', { detail: { tab: name } })
      );
    } catch (_) {}

    loadTabContent(name);
  }

  function ensureAvatarTab() {
    if (loaded.avatar) return Promise.resolve();
    loaded.avatar = true;
    var tasks = [];
    if (typeof window.novaApplyMainScreenProfileUi === 'function') {
      tasks.push(window.novaApplyMainScreenProfileUi().catch(function () {}));
    }
    try {
      if (typeof applyOwnAvatarFrame === 'function') applyOwnAvatarFrame();
    } catch (_) {}
    return Promise.all(tasks);
  }

  function showTabLoading(panelName, on, message) {
    var panel = getPanel(panelName);
    if (!panel) return;
    var cls = 'nova-main-tab-panel-loading';
    var existing = panel.querySelector('.' + cls);
    if (!on) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var wrap = document.createElement('div');
    wrap.className = cls;
    wrap.innerHTML =
      '<span class="nova-main-tab-lig-loading__spinner" aria-hidden="true"></span>' +
      '<span>' + (message || 'Yükleniyor…') + '</span>';
    panel.appendChild(wrap);
  }

  function showLigLoading(on) {
    showTabLoading('lig', on, 'Lig bilgileri yükleniyor…');
  }

  function showKahramanLoading(on) {
    showTabLoading('kahraman', on, 'Kahraman yükleniyor…');
  }

  function ensureKahramanTab() {
    if (loaded.kahraman && kahramanContentReady()) {
      finishHeroTabUi();
      return heroLoadPromise || Promise.resolve();
    }
    if (heroLoadPromise && !kahramanContentReady()) {
      return heroLoadPromise;
    }

    showKahramanLoading(true);
    heroLoadPromise = afterPanelPaint(function () {
      if (typeof window.novaRefreshMainScreenHero === 'function') {
        return window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
      }
    })
      .then(function () {
        if (!kahramanContentReady() && typeof window.novaRefreshMainScreenHero === 'function') {
          return window.novaRefreshMainScreenHero({ urgent: true, force: true }).catch(function () {});
        }
      })
      .then(function () {
        finishHeroTabUi();
        if (kahramanContentReady()) loaded.kahraman = true;
      })
      .finally(function () {
        showKahramanLoading(false);
        try {
          if (typeof window.novaSyncMainSlotPlaceholders === 'function') {
            window.novaSyncMainSlotPlaceholders();
          }
        } catch (_) {}
      });

    return heroLoadPromise;
  }

  function ensureLigTab() {
    if (loaded.lig && ligContentReady()) {
      return ligLoadPromise || Promise.resolve();
    }
    if (ligLoadPromise && !ligContentReady()) {
      return ligLoadPromise;
    }

    showLigLoading(true);
    ligLoadPromise = afterPanelPaint(function () {
      if (typeof window.fetchAndDisplayGameCup === 'function') {
        return Promise.resolve(window.fetchAndDisplayGameCup(true)).catch(function () {});
      }
    })
      .then(function () {
        if (typeof updateDiamondCount === 'function') {
          return updateDiamondCount().catch(function () {});
        }
      })
      .then(function () {
        return loadCreditsIfNeeded();
      })
      .then(function () {
        loaded.lig = true;
        window.__novaLigCupLoaded = true;
      })
      .finally(function () {
        showLigLoading(false);
        try {
          if (typeof refreshDuelEntryGateNote === 'function') refreshDuelEntryGateNote();
        } catch (_) {}
        try {
          if (typeof window.novaSyncMainSlotPlaceholders === 'function') {
            window.novaSyncMainSlotPlaceholders();
          }
        } catch (_) {}
      });

    return ligLoadPromise;
  }

  function loadCreditsIfNeeded() {
    return new Promise(function (resolve) {
      if (window.__novaLigCreditsLoaded) {
        resolve();
        return;
      }
      try {
        var student = window.selectedStudent;
        if (!student && typeof selectedStudent !== 'undefined') student = selectedStudent;
        if (!student || !student.classId || !student.studentId) {
          resolve();
          return;
        }
        var db = window.database;
        if (!db) {
          resolve();
          return;
        }
        Promise.all([
          db.ref('classes/' + student.classId + '/students/' + student.studentId + '/duelCredits').once('value'),
          db.ref('classes/' + student.classId + '/students/' + student.studentId + '/unlimitedCreditsUntil').once('value')
        ])
          .then(function (snaps) {
            window.__novaLigCreditsLoaded = true;
            if (typeof applyMainScreenCreditsState === 'function') {
              applyMainScreenCreditsState({
                duelCredits: snaps[0].exists() ? Number(snaps[0].val() || 0) : 0,
                unlimitedCreditsUntil: snaps[1].exists() ? Number(snaps[1].val() || 0) : 0
              });
            }
            resolve();
          })
          .catch(function () {
            resolve();
          });
      } catch (_) {
        resolve();
      }
    });
  }

  function loadTabContent(name) {
    if (name === 'avatar') return ensureAvatarTab();
    if (name === 'kahraman') return ensureKahramanTab();
    if (name === 'lig') return ensureLigTab();
    return Promise.resolve();
  }

  function bindTabs() {
    var nav = document.getElementById('nova-main-tabs');
    if (!nav) return;
    if (nav.dataset.novaTabsBound !== '1') {
      nav.dataset.novaTabsBound = '1';
      nav.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-nova-main-tab]');
        if (!btn || !nav.contains(btn)) return;
        e.preventDefault();
        setTab(btn.getAttribute('data-nova-main-tab'));
      });
    }
  }

  function boot() {
    if (!hubActive()) return;
    bindTabs();
    setTab(activeTab || 'avatar');
    ensureAvatarTab();
  }

  window.novaMainTabsLazyEnabled = hubActive;
  window.novaMainTabsSetTab = setTab;
  window.novaMainTabsLoadTab = loadTabContent;
  window.novaMainTabsAvatarReady = function () {
    return loaded.avatar && hubActive();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('nova:main-screen-visible', function () {
    if (!hubActive()) return;
    bindTabs();
    if (!loaded.avatar) ensureAvatarTab();
    if (activeTab === 'kahraman') ensureKahramanTab();
    if (activeTab === 'lig') ensureLigTab();
  });

  document.addEventListener('nova:main-tab-activate', function (e) {
    var tab = e && e.detail ? e.detail.tab : '';
    if (tab === 'kahraman') {
      setTimeout(finishHeroTabUi, 180);
    }
  });
})();
