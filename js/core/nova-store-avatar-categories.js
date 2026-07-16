/* Mağaza avatar köşeleri — BİLİM / LİDERLER / PADİŞAHLAR */
(function (global) {
  'use strict';

  var DEFAULT_CATEGORIES = [
    { key: 'bilim_kosesi', label: 'BİLİM KÖŞESİ', order: 1 },
    { key: 'liderler_kosesi', label: 'LİDERLER KÖŞESİ', order: 2 },
    { key: 'padisahlar_kosesi', label: 'PADİŞAHLAR KÖŞESİ', order: 3 }
  ];

  var PSEUDO_STORE_CATEGORY_KEYS = {
    __nameFrames: 1,
    __avatarFrames: 1,
    __battleHeroes: 1,
    __battleHeroesTemel: 1,
    __battleHeroesEpik: 1
  };

  var LEGACY_AVATAR_CATEGORY_KEYS = {
    TemelKarakterler: 1,
    'Temel Karakterler': 1,
    KizlarKösesi: 1,
    KizlarKosesi: 1,
    'KızlarKöşesi': 1,
    'KızlarKösesi': 1,
    KIZLARKÖŞESİ: 1,
    KIZLARKOŞESİ: 1,
    Süperlig: 1,
    SüperLig: 1,
    SÜPERLİG: 1,
    SUPERLIG: 1,
    DünyaDevleri: 1,
    DunyaDevleri: 1,
    'Dünya Devleri': 1,
    EFSANE: 1,
    Efsane: 1
  };

  function normalizeKey(k) {
    return String(k || '').trim();
  }

  function isPseudoStoreCategory(key) {
    return !!PSEUDO_STORE_CATEGORY_KEYS[normalizeKey(key)];
  }

  function isLegacyAvatarCategory(key) {
    var k = normalizeKey(key);
    if (!k || k === 'duel' || k === '_meta') return false;
    return !!LEGACY_AVATAR_CATEGORY_KEYS[k];
  }

  function labelForAvatarCategory(key) {
    var k = normalizeKey(key);
    if (!k) return '';
    try {
      var meta = global.storeCategoryMeta && global.storeCategoryMeta[k];
      if (meta && meta.label) return String(meta.label);
    } catch (_) {}
    for (var i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      if (DEFAULT_CATEGORIES[i].key === k) return DEFAULT_CATEGORIES[i].label;
    }
    return k;
  }

  function getDefaultAvatarCategoryKeys() {
    return DEFAULT_CATEGORIES.map(function (c) {
      return c.key;
    });
  }

  function filterAvatarStoreKeys(keys) {
    var input = Array.isArray(keys) ? keys.slice() : [];
    var seen = {};
    var extras = [];
    input.forEach(function (k) {
      k = normalizeKey(k);
      if (!k || k === '_meta' || seen[k]) return;
      if (k === 'duel') return;
      if (isPseudoStoreCategory(k)) return;
      if (isLegacyAvatarCategory(k)) return;
      seen[k] = true;
      extras.push(k);
    });

    var defaults = getDefaultAvatarCategoryKeys();
    var out = defaults.slice();
    extras.forEach(function (k) {
      if (out.indexOf(k) < 0) out.push(k);
    });
    return out;
  }

  function sortAvatarStoreKeys(keys) {
    keys = filterAvatarStoreKeys(keys);
    var meta = global.storeCategoryMeta || {};
    var defaultOrder = {};
    DEFAULT_CATEGORIES.forEach(function (c) {
      defaultOrder[c.key] = Number(c.order);
    });

    var rest = keys.filter(function (k) {
      return k !== 'duel';
    });

    rest.sort(function (a, b) {
      var da = defaultOrder[a];
      var db = defaultOrder[b];
      if (da != null && db != null && da !== db) return da - db;
      if (da != null && db == null) return -1;
      if (da == null && db != null) return 1;
      var oa = meta[a] && meta[a].order != null ? Number(meta[a].order) : 1e9;
      var ob = meta[b] && meta[b].order != null ? Number(meta[b].order) : 1e9;
      if (oa !== ob) return oa - ob;
      return labelForAvatarCategory(a).localeCompare(labelForAvatarCategory(b), 'tr');
    });

    return rest;
  }

  function autoKeyFromTurkishLabel(label) {
    var s = String(label || '').trim();
    var pairs = [
      ['İ', 'I'],
      ['I', 'I'],
      ['ı', 'i'],
      ['Ğ', 'G'],
      ['ğ', 'g'],
      ['Ü', 'U'],
      ['ü', 'u'],
      ['Ş', 'S'],
      ['ş', 's'],
      ['Ö', 'O'],
      ['ö', 'o'],
      ['Ç', 'C'],
      ['ç', 'c']
    ];
    for (var i = 0; i < pairs.length; i++) {
      s = s.split(pairs[i][0]).join(pairs[i][1]);
    }
    s = s.replace(/\s+/g, '_').replace(/[.#$\[\]\/]/g, '').toLowerCase();
    return s.slice(0, 64);
  }

  function collectKeysFromSnapshot(snap) {
    if (!snap || typeof snap.val !== 'function' || !snap.exists()) return [];
    return Object.keys(snap.val() || {});
  }

  async function purgeLegacyAvatarCategories(rdb) {
    if (!rdb || typeof rdb.ref !== 'function') {
      throw new Error('RTDB yok');
    }
    var snaps = await Promise.all([
      rdb.ref('store/profilePhotos').get(),
      rdb.ref('store/categoryMeta').get(),
      rdb.ref('store/profilePhotosIndex').get()
    ]);
    var allKeys = {};
    snaps.forEach(function (snap) {
      collectKeysFromSnapshot(snap).forEach(function (k) {
        if (k && k !== '_meta') allKeys[k] = true;
      });
    });
    var legacy = Object.keys(allKeys).filter(isLegacyAvatarCategory);
    if (!legacy.length) return { removed: [] };
    var updates = {};
    legacy.forEach(function (k) {
      updates['store/profilePhotos/' + k] = null;
      updates['store/categoryMeta/' + k] = null;
      updates['store/profilePhotosIndex/' + k] = null;
    });
    await rdb.ref().update(updates);
    return { removed: legacy.slice() };
  }

  async function ensureDefaultAvatarCategories(rdb) {
    if (!rdb || typeof rdb.ref !== 'function') {
      throw new Error('RTDB yok');
    }
    var purgeResult = await purgeLegacyAvatarCategories(rdb);
    var updates = {};
    var now = Date.now();
    DEFAULT_CATEGORIES.forEach(function (c) {
      updates['store/categoryMeta/' + c.key] = {
        label: c.label,
        order: c.order,
        createdAt: now
      };
      updates['store/profilePhotosIndex/' + c.key] = { count: 0, updatedAt: now };
    });
    await rdb.ref().update(updates);
    return { categories: DEFAULT_CATEGORIES.slice(), removed: purgeResult.removed || [] };
  }

  global.NOVA_AVATAR_STORE_CATEGORIES = DEFAULT_CATEGORIES;
  global.novaAvatarCategoryLabel = labelForAvatarCategory;
  global.novaIsLegacyAvatarCategory = isLegacyAvatarCategory;
  global.novaIsPseudoStoreCategory = isPseudoStoreCategory;
  global.novaGetDefaultAvatarCategoryKeys = getDefaultAvatarCategoryKeys;
  global.novaFilterAvatarStoreKeys = filterAvatarStoreKeys;
  global.novaSortAvatarStoreKeys = sortAvatarStoreKeys;
  global.novaAutoAvatarCategoryKeyFromLabel = autoKeyFromTurkishLabel;
  global.novaPurgeLegacyAvatarCategories = purgeLegacyAvatarCategories;
  global.novaEnsureDefaultAvatarCategories = ensureDefaultAvatarCategories;
})(window);
