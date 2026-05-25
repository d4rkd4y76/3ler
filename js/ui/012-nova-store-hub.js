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
  var PSEUDO_KEYS = { __nameFrames: 1, __avatarFrames: 1, __battleHeroes: 1 };

  var state = { main: 'avatar', sub: null };

  function unique(arr) {
    var s = new Set();
    return arr.filter(function (x) { return x && !s.has(x) && s.add(x); });
  }

  function labelForKey(k) {
    if (k === '__nameFrames') return 'İsim Çerçevesi';
    if (k === '__avatarFrames') return 'Avatar Çerçevesi';
    if (k === 'duel') return 'Düello Biletleri';
    try {
      var m = window.storeCategoryMeta && window.storeCategoryMeta[k];
      if (m && m.label) return String(m.label);
    } catch (_) {}
    return k;
  }

  function sortAvatarKeys(keys) {
    keys = unique(keys).filter(function (k) { return k && !PSEUDO_KEYS[k]; });
    var meta = window.storeCategoryMeta || {};
    var hasDuel = keys.indexOf('duel') >= 0;
    var hasEfsane = keys.indexOf('EFSANE') >= 0;
    var rest = keys.filter(function (k) { return k !== 'duel' && k !== 'EFSANE'; });
    rest.sort(function (a, b) {
      var oa = (meta[a] && meta[a].order != null) ? Number(meta[a].order) : 1e12;
      var ob = (meta[b] && meta[b].order != null) ? Number(meta[b].order) : 1e12;
      if (oa !== ob) return oa - ob;
      return labelForKey(a).localeCompare(labelForKey(b), 'tr');
    });
    var out = [];
    if (hasDuel) out.push('duel');
    out = out.concat(rest);
    if (hasEfsane) out.push('EFSANE');
    return out;
  }

  function collectAvatarKeys() {
    var keys = [];
    try {
      if (typeof photoCategories === 'object' && photoCategories) {
        keys = Object.keys(photoCategories);
      }
    } catch (_) {}
    if (!keys.length) {
      keys = ['duel', 'TemelKarakterler', 'DünyaDevleri', 'KizlarKösesi', 'SüperLig', 'EFSANE'];
    }
    return sortAvatarKeys(keys);
  }

  function setPanelsForCategory(cat) {
    var duelStore = document.getElementById('duelCreditsStore');
    var photosContainer = document.getElementById('profilePhotosContainer');
    if (!duelStore || !photosContainer) return;
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
    if (typeof loadProfilePhotos === 'function') {
      loadProfilePhotos(cat);
    }
  }

  function renderSubNav() {
    var sub = document.getElementById('novaStoreSubNav');
    if (!sub) return;
    sub.innerHTML = '';
    if (state.main === 'heroes') {
      sub.classList.add('is-hidden');
      return;
    }
    sub.classList.remove('is-hidden');
    var items = state.main === 'frames' ? FRAME_SUB.slice() : collectAvatarKeys().map(function (k) {
      return { id: k, label: labelForKey(k) };
    });
    items.forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nova-store-sub-btn' + ((state.sub === item.id || (!state.sub && i === 0)) ? ' active' : '');
      btn.dataset.category = item.id;
      btn.setAttribute('role', 'tab');
      btn.textContent = item.label;
      if (item.id === 'EFSANE') {
        btn.classList.add('nova-store-sub-btn--legend');
        btn.title = '🔥 Efsane Seçkisi';
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
      cat = '__battleHeroes';
    } else if (mainId === 'frames') {
      cat = preferredSub || '__nameFrames';
    } else {
      var keys = collectAvatarKeys();
      cat = preferredSub || keys[0] || 'TemelKarakterler';
    }
    loadCategory(cat);
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

  window.novaStoreHubSelectMainTab = selectMainTab;
})();
