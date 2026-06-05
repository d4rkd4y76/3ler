/* Mağaza hub — AVATAR | ÇERÇEVELER | KAHRAMANLAR */
(function () {
  var MAIN_TABS = [
    { id: 'avatar', label: 'AVATAR', icon: '🧑' },
    { id: 'frames', label: 'ÇERÇEVELER', icon: '✨' },
    { id: 'heroes', label: 'KAHRAMANLAR', icon: '🤖' }
  ];
  var FRAME_SUB = [
    { id: '__nameFrames', label: 'İsim Çerçevesi' },
    { id: '__avatarFrames', label: 'Avatar Çerçevesi' }
  ];
  var HERO_SUB = [
    { id: '__battleHeroesTemel', label: 'Temel' },
    { id: '__battleHeroesEpik', label: 'Epik' }
  ];
  var PSEUDO_KEYS = {
    __nameFrames: 1,
    __avatarFrames: 1,
    __battleHeroes: 1,
    __battleHeroesTemel: 1,
    __battleHeroesEpik: 1
  };

  var state = { main: 'avatar', sub: null };

  function unique(arr) {
    var s = new Set();
    return arr.filter(function (x) { return x && !s.has(x) && s.add(x); });
  }

  function labelForKey(k) {
    if (k === '__nameFrames') return 'İsim Çerçevesi';
    if (k === '__avatarFrames') return 'Avatar Çerçevesi';
    if (k === 'duel') return 'Düello Biletleri';
    if (typeof window.novaAvatarCategoryLabel === 'function') {
      return window.novaAvatarCategoryLabel(k);
    }
    try {
      var m = window.storeCategoryMeta && window.storeCategoryMeta[k];
      if (m && m.label) return String(m.label);
    } catch (_) {}
    return k;
  }

  function sortAvatarKeys(keys) {
    if (typeof window.novaSortAvatarStoreKeys === 'function') {
      var duel = keys.indexOf('duel') >= 0;
      var sorted = window.novaSortAvatarStoreKeys(keys);
      if (duel && sorted.indexOf('duel') < 0) sorted.unshift('duel');
      return sorted;
    }
    keys = unique(keys).filter(function (k) { return k && !PSEUDO_KEYS[k]; });
    var meta = window.storeCategoryMeta || {};
    var hasDuel = keys.indexOf('duel') >= 0;
    var rest = keys.filter(function (k) { return k !== 'duel'; });
    rest.sort(function (a, b) {
      var oa = (meta[a] && meta[a].order != null) ? Number(meta[a].order) : 1e12;
      var ob = (meta[b] && meta[b].order != null) ? Number(meta[b].order) : 1e12;
      if (oa !== ob) return oa - ob;
      return labelForKey(a).localeCompare(labelForKey(b), 'tr');
    });
    var out = [];
    if (hasDuel) out.push('duel');
    return out.concat(rest);
  }

  function collectAvatarKeys() {
    var keys = [];
    try {
      if (typeof photoCategories === 'object' && photoCategories) {
        keys = keys.concat(Object.keys(photoCategories));
      }
    } catch (_) {}
    try {
      if (window.storeCategoryMeta) {
        keys = keys.concat(Object.keys(window.storeCategoryMeta));
      }
    } catch (_) {}
    if (typeof window.novaFilterAvatarStoreKeys === 'function') {
      keys = window.novaFilterAvatarStoreKeys(keys);
    } else {
      keys = unique(keys).filter(function (k) { return k && !PSEUDO_KEYS[k]; });
    }
    if (!keys.length && typeof window.novaGetDefaultAvatarCategoryKeys === 'function') {
      keys = window.novaGetDefaultAvatarCategoryKeys();
    }
    return sortAvatarKeys(keys);
  }

  function setPanelsForCategory(cat) {
    var duelStore = document.getElementById('duelCreditsStore');
    var photosContainer = document.getElementById('profilePhotosContainer');
    if (!duelStore || !photosContainer) return;
    if (cat === '__battleHeroesTemel' || cat === '__battleHeroesEpik' || cat === '__battleHeroes') {
      duelStore.style.display = 'none';
      photosContainer.style.display = 'grid';
      return;
    }
    if (cat === 'duel') {
      duelStore.style.display = 'block';
      photosContainer.style.display = 'none';
    } else {
      duelStore.style.display = 'none';
      photosContainer.style.display = 'grid';
    }
  }

  function activateSubButton(cat) {
    var sub = document.getElementById('novaStoreSubNav');
    if (!sub) return;
    sub.querySelectorAll('.nova-store-sub-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.category === cat);
    });
  }

  function activateMainButton(mainId) {
    var main = document.getElementById('novaStoreMainTabs');
    if (!main) return;
    main.querySelectorAll('.nova-store-main-tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.main === mainId);
    });
  }

  function loadCategory(cat) {
    if (!cat) return;
    state.sub = cat;
    setPanelsForCategory(cat);
    activateSubButton(cat);
    try {
      if (typeof window.NOVA_HERO_LEVEL !== 'undefined' && window.NOVA_HERO_LEVEL.setStoreLevelBarVisible) {
        var showLevelBar = state.main === 'heroes' && cat === '__battleHeroesTemel';
        window.NOVA_HERO_LEVEL.setStoreLevelBarVisible(showLevelBar);
      }
    } catch (_) {}
    if (typeof loadProfilePhotos === 'function') {
      loadProfilePhotos(cat);
    }
  }

  function renderSubNav() {
    var sub = document.getElementById('novaStoreSubNav');
    if (!sub) return;
    sub.innerHTML = '';
    sub.classList.remove('is-hidden');
    var items;
    if (state.main === 'heroes') {
      items = HERO_SUB.slice();
    } else if (state.main === 'frames') {
      items = FRAME_SUB.slice();
    } else {
      items = collectAvatarKeys().map(function (k) {
      return { id: k, label: labelForKey(k) };
      });
    }
    items.forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nova-store-sub-btn' + ((state.sub === item.id || (!state.sub && i === 0)) ? ' active' : '');
      btn.dataset.category = item.id;
      btn.setAttribute('role', 'tab');
      btn.textContent = item.label;
      if (item.id === '__battleHeroesEpik') {
        btn.classList.add('nova-store-sub-btn--epic');
        btn.title = '👑 Epik kahramanlar';
      }
      btn.addEventListener('click', function () {
        loadCategory(item.id);
      });
      sub.appendChild(btn);
    });
  }

  function selectMainTab(mainId, preferredSub) {
    state.main = mainId;
    activateMainButton(mainId);
    renderSubNav();
    var cat;
    if (mainId === 'heroes') {
      cat = preferredSub || '__battleHeroesTemel';
    } else if (mainId === 'frames') {
      cat = preferredSub || '__nameFrames';
    } else {
      var keys = collectAvatarKeys();
      cat = preferredSub || keys[0] || (typeof window.novaGetDefaultAvatarCategoryKeys === 'function' ? window.novaGetDefaultAvatarCategoryKeys()[0] : 'bilim_kosesi');
    }
    loadCategory(cat);
    try {
      if (typeof window.NOVA_HERO_LEVEL !== 'undefined' && window.NOVA_HERO_LEVEL.setStoreLevelBarVisible) {
        var showLevelBar = mainId === 'heroes' && cat === '__battleHeroesTemel';
        window.NOVA_HERO_LEVEL.setStoreLevelBarVisible(showLevelBar);
      }
    } catch (_) {}
  }

  function renderMainTabs() {
    var main = document.getElementById('novaStoreMainTabs');
    if (!main) return;
    main.innerHTML = '';
    MAIN_TABS.forEach(function (tab, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nova-store-main-tab' + (i === 0 ? ' active' : '');
      btn.dataset.main = tab.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.innerHTML = '<span class="nova-store-main-tab__icon" aria-hidden="true">' + tab.icon + '</span><span class="nova-store-main-tab__label">' + tab.label + '</span>';
      btn.addEventListener('click', function () {
        if (state.main === tab.id) return;
        selectMainTab(tab.id);
      });
      main.appendChild(btn);
    });
  }

  window.renderStoreCategoryButtons = function renderStoreCategoryButtons() {
    renderMainTabs();
    renderSubNav();
  };

  window.novaStoreHubInit = async function novaStoreHubInit() {
    if (typeof novaFetchStoreCategories === 'function') {
      await novaFetchStoreCategories();
    } else if (typeof fetchStoreCategoriesFromDB === 'function') {
      await fetchStoreCategoriesFromDB();
    }
    renderMainTabs();
    selectMainTab('avatar');
  };

  function getActiveStoreCategory() {
    if (state.sub) return state.sub;
    var subBtn = document.querySelector('#novaStoreSubNav .nova-store-sub-btn.active');
    if (subBtn && subBtn.dataset.category) return subBtn.dataset.category;
    var legRoot = document.getElementById('novaStoreLegacyCategories');
    var legVisible = legRoot && !legRoot.hidden && legRoot.getAttribute('aria-hidden') !== 'true';
    if (legVisible) {
      var legBtn = legRoot.querySelector('.category-button.active');
      if (legBtn) return legBtn.dataset.categoryRaw || legBtn.dataset.category || null;
    }
    return null;
  }

  function refreshStoreInPlace() {
    var cat = getActiveStoreCategory();
    if (!cat) return Promise.resolve();
    syncSubCategory(cat);
    if (typeof loadProfilePhotos === 'function') return loadProfilePhotos(cat);
    return Promise.resolve();
  }

  function syncSubCategory(cat) {
    if (!cat) return;
    state.sub = cat;
    activateSubButton(cat);
    try {
      if (typeof window.NOVA_HERO_LEVEL !== 'undefined' && window.NOVA_HERO_LEVEL.setStoreLevelBarVisible) {
        window.NOVA_HERO_LEVEL.setStoreLevelBarVisible(state.main === 'heroes' && cat === '__battleHeroesTemel');
      }
    } catch (_) {}
  }

  window.novaStoreHubGetSubCategory = function () { return state.sub; };
  window.novaStoreHubGetMainTab = function () { return state.main; };
  window.novaStoreHubSyncSubCategory = syncSubCategory;
  window.novaGetActiveStoreCategory = getActiveStoreCategory;
  window.novaRefreshStoreInPlace = refreshStoreInPlace;
  window.novaStoreHubSelectMainTab = selectMainTab;
})();
