/* Mağaza isim çerçeveleri — 5 sade çerçeve, 2500 elmas, bonus yok */
(function (global) {
  'use strict';

  var DEFAULT_NAME_FRAMES = [
    { id: 'okyanus', name: 'Okyanus', price: 2500, tone: 'okyanus', order: 1 },
    { id: 'orman', name: 'Orman', price: 2500, tone: 'orman', order: 2 },
    { id: 'gul', name: 'Gül', price: 2500, tone: 'gul', order: 3 },
    { id: 'kehribar', name: 'Kehribar', price: 2500, tone: 'kehribar', order: 4 },
    { id: 'gumus', name: 'Gümüş', price: 2500, tone: 'gumus', order: 5 }
  ];

  var LEGACY_NAME_FRAME_IDS = {
    spark: 1,
    wind: 1,
    neon: 1,
    fire: 1,
    ice: 1,
    legend: 1,
    inferno: 1,
    phoenix: 1,
    cosmic: 1,
    magma: 1,
    dragonfire: 1,
    wildfire: 1
  };

  function getDefaultNameFrames() {
    return DEFAULT_NAME_FRAMES.map(function (f) {
      return { id: f.id, name: f.name, price: f.price, tone: f.tone, order: f.order };
    });
  }

  function getDefaultNameFrameIds() {
    return DEFAULT_NAME_FRAMES.map(function (f) {
      return f.id;
    });
  }

  function isLegacyNameFrame(id) {
    return !!LEGACY_NAME_FRAME_IDS[String(id || '').trim()];
  }

  function isAllowedNameFrame(id) {
    id = String(id || '').trim();
    if (!id || id === 'default' || id === 'deneme_champion') return false;
    return getDefaultNameFrameIds().indexOf(id) >= 0;
  }

  function filterNameFrameCatalog(items) {
    var allowed = {};
    getDefaultNameFrameIds().forEach(function (id) {
      allowed[id] = true;
    });
    var out = [];
    (Array.isArray(items) ? items : []).forEach(function (item) {
      if (item && allowed[item.id]) out.push(item);
    });
    if (!out.length) return getDefaultNameFrames().map(function (f) {
      return { id: f.id, name: f.name, price: f.price, tone: f.tone };
    });
    out.sort(function (a, b) {
      var da = DEFAULT_NAME_FRAMES.find(function (x) { return x.id === a.id; });
      var db = DEFAULT_NAME_FRAMES.find(function (x) { return x.id === b.id; });
      return Number((da && da.order) || 1e9) - Number((db && db.order) || 1e9);
    });
    return out;
  }

  async function syncNameFramesCatalog(rdb) {
    if (!rdb || typeof rdb.ref !== 'function') {
      throw new Error('RTDB yok');
    }
    var snap = await rdb.ref('store/nameFrames').get();
    var curr = snap.exists() ? (snap.val() || {}) : {};
    var updates = {};
    var removed = [];
    Object.keys(curr).forEach(function (id) {
      if (!DEFAULT_NAME_FRAMES.some(function (f) { return f.id === id; })) {
        updates['store/nameFrames/' + id] = null;
        removed.push(id);
      }
    });
    DEFAULT_NAME_FRAMES.forEach(function (f) {
      if (!curr[f.id]) {
        updates['store/nameFrames/' + f.id] = {
          name: f.name,
          price: Number(f.price || 2500),
          tone: f.tone || f.id,
          order: Number(f.order || 1)
        };
      }
    });
    if (Object.keys(updates).length) {
      await rdb.ref().update(updates);
    }
    var frames = {};
    var nextSnap = await rdb.ref('store/nameFrames').get();
    var next = nextSnap.exists() ? (nextSnap.val() || {}) : {};
    DEFAULT_NAME_FRAMES.forEach(function (f) {
      frames[f.id] = next[f.id] || {
        name: f.name,
        price: Number(f.price || 2500),
        tone: f.tone || f.id,
        order: Number(f.order || 1)
      };
    });
    return { frames: frames, removed: removed };
  }

  async function ensureDefaultNameFrames(rdb) {
    if (!rdb || typeof rdb.ref !== 'function') {
      throw new Error('RTDB yok');
    }
    var snap = await rdb.ref('store/nameFrames').get();
    var curr = snap.exists() ? (snap.val() || {}) : {};
    var updates = {};
    var removed = [];
    DEFAULT_NAME_FRAMES.forEach(function (f) {
      updates['store/nameFrames/' + f.id] = {
        name: f.name,
        price: Number(f.price || 2500),
        tone: f.tone || f.id,
        order: Number(f.order || 1)
      };
    });
    Object.keys(curr).forEach(function (id) {
      if (!DEFAULT_NAME_FRAMES.some(function (f) { return f.id === id; })) {
        updates['store/nameFrames/' + id] = null;
        removed.push(id);
      }
    });
    await rdb.ref().update(updates);
    var frames = {};
    DEFAULT_NAME_FRAMES.forEach(function (f) {
      frames[f.id] = {
        name: f.name,
        price: Number(f.price || 2500),
        tone: f.tone || f.id,
        order: Number(f.order || 1)
      };
    });
    return { frames: frames, removed: removed };
  }

  global.NOVA_DEFAULT_NAME_FRAMES = DEFAULT_NAME_FRAMES;
  global.novaGetDefaultNameFrames = getDefaultNameFrames;
  global.novaGetDefaultNameFrameIds = getDefaultNameFrameIds;
  global.novaIsLegacyNameFrame = isLegacyNameFrame;
  global.novaIsAllowedNameFrame = isAllowedNameFrame;
  global.novaFilterNameFrameCatalog = filterNameFrameCatalog;
  global.novaSyncNameFramesCatalog = syncNameFramesCatalog;
  global.novaEnsureDefaultNameFrames = ensureDefaultNameFrames;
})(window);
