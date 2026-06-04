/**
 * Admin panel — Firebase kayıtlarını Bunny Storage CDN ile anında senkronlar.
 * Öğrenci uygulaması CDN-first okur; admin her .set/.update/.remove sonrası CDN güncellenir.
 */
(function (global) {
  'use strict';

  var LS_KEY = 'nova_admin_bunny_storage';
  var CONTENT_PREFIXES = [
    'championData/',
    'fillBlanks/',
    'dailyPuzzles/',
    'matchingGame/',
    'classContent/',
    'denemeQuestions',
    'store/',
    'lessonVideoLookup/',
    'platformMeta/hikayeVideo',
    'platformMeta/mainScreenBgVideo'
  ];

  var state = {
    ready: false,
    cdn: { enabled: false, base: '', version: 1 },
    storage: { zone: '', apiKey: '', region: 'de' },
    host: 'storage.bunnycdn.com'
  };

  var storeManifestTimer = null;
  var topicIndexTimers = {};

  var REGION_HOST = {
    de: 'storage.bunnycdn.com',
    ny: 'ny.storage.bunnycdn.com',
    la: 'la.storage.bunnycdn.com',
    sg: 'sg.storage.bunnycdn.com',
    syd: 'syd.storage.bunnycdn.com'
  };

  function quotePath(path) {
    return path
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean)
      .map(function (s) {
        return encodeURIComponent(s);
      })
      .join('/');
  }

  function isContentPath(path) {
    var p = String(path || '');
    if (!p) return false;
    for (var i = 0; i < CONTENT_PREFIXES.length; i++) {
      var pre = CONTENT_PREFIXES[i];
      if (p === pre.replace(/\/$/, '') || p.indexOf(pre) === 0) return true;
    }
    return false;
  }

  function getRefPath(ref) {
    if (!ref) return '';
    var parts = [];
    var node = ref;
    while (node && node.parent) {
      if (node.key != null && node.key !== '') parts.unshift(String(node.key));
      node = node.parent;
    }
    return parts.join('/');
  }

  function normalizeBase(url) {
    return String(url || '')
      .trim()
      .replace(/\/+$/, '');
  }

  function loadLocalStorageCreds() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o.zone) state.storage.zone = String(o.zone).trim();
      if (o.apiKey) state.storage.apiKey = String(o.apiKey).trim();
      if (o.region) state.storage.region = String(o.region).trim() || 'de';
    } catch (_) {}
    state.host = REGION_HOST[state.storage.region] || REGION_HOST.de;
  }

  function saveLocalStorageCreds(zone, apiKey, region) {
    state.storage.zone = String(zone || '').trim();
    state.storage.apiKey = String(apiKey || '').trim();
    state.storage.region = String(region || 'de').trim() || 'de';
    state.host = REGION_HOST[state.storage.region] || REGION_HOST.de;
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          zone: state.storage.zone,
          apiKey: state.storage.apiKey,
          region: state.storage.region
        })
      );
    } catch (_) {}
  }

  function storageReady() {
    return !!(state.storage.zone && state.storage.apiKey);
  }

  function cdnRtdbObjectUrl(rtdbPath) {
    var ver = Number(state.cdn.version) || 1;
    return (
      'https://' +
      state.host +
      '/' +
      encodeURIComponent(state.storage.zone) +
      '/v' +
      ver +
      '/rtdb/' +
      quotePath(rtdbPath)
    );
  }

  function cdnStoreManifestUrl() {
    var ver = Number(state.cdn.version) || 1;
    return (
      'https://' +
      state.host +
      '/' +
      encodeURIComponent(state.storage.zone) +
      '/v' +
      ver +
      '/store/manifest.json'
    );
  }

  async function bunnyPut(url, bodyBytes, contentType) {
    var res = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: state.storage.apiKey,
        'Content-Type': contentType || 'application/json; charset=utf-8'
      },
      body: bodyBytes
    });
    if (!res.ok) {
      var t = await res.text().catch(function () {
        return '';
      });
      throw new Error('Bunny PUT ' + res.status + (t ? ': ' + t.slice(0, 120) : ''));
    }
  }

  async function bunnyDelete(url) {
    var res = await fetch(url, {
      method: 'DELETE',
      headers: { AccessKey: state.storage.apiKey }
    });
    if (res.status === 404) return;
    if (!res.ok) {
      var t = await res.text().catch(function () {
        return '';
      });
      throw new Error('Bunny DELETE ' + res.status + (t ? ': ' + t.slice(0, 120) : ''));
    }
  }

  async function publishPath(rtdbPath, value) {
    if (!storageReady() || !isContentPath(rtdbPath)) return { skipped: true };
    var url = cdnRtdbObjectUrl(rtdbPath);
    if (value === null || typeof value === 'undefined') {
      await bunnyDelete(url);
      return { deleted: true, path: rtdbPath };
    }
    var json = JSON.stringify(value);
    var bytes = new TextEncoder().encode(json);
    await bunnyPut(url, bytes);
    return { ok: true, path: rtdbPath };
  }

  function topicBaseFromQuestionPath(path) {
    var m = String(path).match(/^(championData\/headings\/[^/]+\/lessons\/[^/]+\/topics\/[^/]+)\/questions\//);
    return m ? m[1] : null;
  }

  function scheduleTopicQuestionIndex(rdb, topicBase) {
    if (!rdb || !topicBase) return;
    if (topicIndexTimers[topicBase]) clearTimeout(topicIndexTimers[topicBase]);
    topicIndexTimers[topicBase] = setTimeout(function () {
      rdb
        .ref(topicBase + '/questions')
        .get()
        .then(function (snap) {
          var idMap = {};
          if (snap.exists()) {
            var v = snap.val() || {};
            Object.keys(v).forEach(function (k) {
              idMap[k] = true;
            });
          }
          return publishPath(topicBase + '/questionIds', idMap);
        })
        .catch(function (e) {
          console.warn('[NovaAdminCdn] questionIds', topicBase, e);
        });
    }, 400);
  }

  function scheduleStoreManifestRebuild(rdb) {
    if (!rdb) return;
    if (storeManifestTimer) clearTimeout(storeManifestTimer);
    storeManifestTimer = setTimeout(function () {
      rebuildStoreManifest(rdb).catch(function (e) {
        console.warn('[NovaAdminCdn] store manifest', e);
      });
    }, 600);
  }

  async function rebuildStoreManifest(rdb) {
    if (!storageReady()) return;
    var snaps = await Promise.all([
      rdb.ref('store/profilePhotos').get(),
      rdb.ref('store/categoryMeta').get(),
      rdb.ref('store/profilePhotosIndex').get(),
      rdb.ref('store/nameFrames').get(),
      rdb.ref('store/battleHeroes').get(),
      rdb.ref('store/battleHeroLevelConfig').get().catch(function () {
        return { exists: function () { return false; } };
      })
    ]);
    var manifest = {
      profilePhotos: snaps[0].exists() ? snaps[0].val() : {},
      categoryMeta: snaps[1].exists() ? snaps[1].val() : {},
      profilePhotosIndex: snaps[2].exists() ? snaps[2].val() : {},
      nameFrames: snaps[3].exists() ? snaps[3].val() : {},
      battleHeroes: snaps[4].exists() ? snaps[4].val() : {},
      battleHeroLevelConfig: snaps[5].exists() ? snaps[5].val() : {}
    };
    var url = cdnStoreManifestUrl();
    var bytes = new TextEncoder().encode(JSON.stringify(manifest));
    await bunnyPut(url, bytes);
    return manifest;
  }

  async function publishRefValue(ref, value, rdb) {
    var path = getRefPath(ref);
    if (!path || !isContentPath(path)) return;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      var keys = Object.keys(value);
      var looksLikeMulti =
        keys.length > 0 &&
        keys.every(function (k) {
          return k.indexOf('/') >= 0;
        });
      if (looksLikeMulti) {
        return onUpdates(value, rdb);
      }
      for (var i = 0; i < keys.length; i++) {
        var childPath = path + '/' + keys[i];
        await publishPath(childPath, value[keys[i]]);
        afterPublishSideEffects(childPath, rdb);
      }
      return;
    }
    await publishPath(path, value);
    afterPublishSideEffects(path, rdb);
  }

  function afterPublishSideEffects(path, rdb) {
    var topicBase = topicBaseFromQuestionPath(path);
    if (topicBase) scheduleTopicQuestionIndex(rdb, topicBase);
    if (path.indexOf('store/') === 0) scheduleStoreManifestRebuild(rdb);
  }

  async function onRefWrite(ref, value, rdb) {
    try {
      await publishRefValue(ref, value, rdb);
    } catch (e) {
      console.warn('[NovaAdminCdn] publish failed', getRefPath(ref), e);
      global.__novaAdminCdnLastError = String(e && e.message ? e.message : e);
    }
  }

  async function onRefRemove(ref, rdb) {
    var path = getRefPath(ref);
    if (!path || !isContentPath(path)) return;
    try {
      await publishPath(path, null);
      var topicBase = topicBaseFromQuestionPath(path);
      if (topicBase) scheduleTopicQuestionIndex(rdb, topicBase);
      if (path.indexOf('store/') === 0) scheduleStoreManifestRebuild(rdb);
    } catch (e) {
      console.warn('[NovaAdminCdn] delete failed', path, e);
      global.__novaAdminCdnLastError = String(e && e.message ? e.message : e);
    }
  }

  async function onUpdates(updates, rdb) {
    if (!updates || typeof updates !== 'object') return;
    var keys = Object.keys(updates);
    for (var i = 0; i < keys.length; i++) {
      var p = keys[i];
      if (!isContentPath(p)) continue;
      try {
        await publishPath(p, updates[p]);
        afterPublishSideEffects(p, rdb);
      } catch (e) {
        console.warn('[NovaAdminCdn] batch publish', p, e);
        global.__novaAdminCdnLastError = String(e && e.message ? e.message : e);
      }
    }
  }

  function installFirebasePatches(rdb) {
    if (!global.firebase || !global.firebase.database || global.__novaAdminCdnPatched) return;
    var RefProto = global.firebase.database.Reference.prototype;
    var origSet = RefProto.set;
    var origUpdate = RefProto.update;
    var origRemove = RefProto.remove;

    RefProto.set = function (value) {
      var self = this;
      return origSet.call(self, value).then(function () {
        if (storageReady()) return onRefWrite(self, value, rdb);
      });
    };

    RefProto.update = function (values) {
      var self = this;
      return origUpdate.call(self, values).then(function () {
        if (!storageReady()) return;
        if (self.key === null && self.parent === null) {
          return onUpdates(values, rdb);
        }
        return onRefWrite(self, values, rdb);
      });
    };

    RefProto.remove = function () {
      var self = this;
      return origRemove.call(self).then(function () {
        if (storageReady()) return onRefRemove(self, rdb);
      });
    };

    global.__novaAdminCdnPatched = true;
  }

  async function loadPlatformCdnConfig(rdb) {
    if (!rdb) return;
    try {
      var snap = await rdb.ref('platformMeta/cdn').get();
      if (snap.exists() && typeof global.novaCdnApplyMeta === 'function') {
        global.novaCdnApplyMeta(snap.val());
      }
      if (snap.exists()) {
        var v = snap.val() || {};
        state.cdn.enabled = v.enabled !== false && !!normalizeBase(v.base || v.cdnBase);
        state.cdn.base = normalizeBase(v.base || v.cdnBase || '');
        state.cdn.version = Number(v.version || v.contentVersion) || 1;
      }
    } catch (e) {
      console.warn('[NovaAdminCdn] platformMeta/cdn', e);
    }
  }

  async function savePlatformCdnConfig(rdb, patch) {
    if (!rdb) return;
    var prev = {};
    try {
      var snap = await rdb.ref('platformMeta/cdn').get();
      if (snap.exists()) prev = snap.val() || {};
    } catch (_) {}
    var next = Object.assign({}, prev, patch || {});
    await rdb.ref('platformMeta/cdn').set(next);
    if (typeof global.novaCdnApplyMeta === 'function') global.novaCdnApplyMeta(next);
    state.cdn.enabled = next.enabled !== false && !!normalizeBase(next.base);
    state.cdn.base = normalizeBase(next.base || '');
    state.cdn.version = Number(next.version) || 1;
    return next;
  }

  function assetStorageUrl(relativePath) {
    var ver = Number(state.cdn.version) || 1;
    return (
      'https://' +
      state.host +
      '/' +
      encodeURIComponent(state.storage.zone) +
      '/v' +
      ver +
      '/assets/' +
      quotePath(relativePath)
    );
  }

  function assetPublicUrl(relativePath) {
    var base = normalizeBase(state.cdn.base);
    if (!base) return null;
    var ver = Number(state.cdn.version) || 1;
    return base + '/v' + ver + '/assets/' + quotePath(relativePath);
  }

  async function uploadAsset(relativePath, file) {
    if (!file) throw new Error('Dosya seçilmedi.');
    if (!storageReady()) throw new Error('Storage zone ve API şifresi gerekli (CDN Yayın sekmesi).');
    var rel = String(relativePath || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    if (!rel) throw new Error('Dosya yolu boş.');
    var url = assetStorageUrl(rel);
    var bytes = new Uint8Array(await file.arrayBuffer());
    var ct = String(file.type || 'application/octet-stream');
    await bunnyPut(url, bytes, ct);
    var publicUrl = assetPublicUrl(rel);
    if (!publicUrl) {
      throw new Error('CDN base URL yok — önce CDN Yayın ayarlarını kaydedin.');
    }
    return { path: rel, publicUrl: publicUrl };
  }

  async function testConnection() {
    if (!storageReady()) throw new Error('Storage zone ve API şifresi gerekli.');
    var ver = Number(state.cdn.version) || 1;
    var testPath = '_nova_admin_cdn_ping';
    var url = cdnRtdbObjectUrl(testPath);
    var payload = { ok: true, at: Date.now() };
    await bunnyPut(url, new TextEncoder().encode(JSON.stringify(payload)));
    await bunnyDelete(url);
    return true;
  }

  async function init(rdb) {
    loadLocalStorageCreds();
    await loadPlatformCdnConfig(rdb);
    installFirebasePatches(rdb);
    state.ready = storageReady();
    return state;
  }

  global.NovaAdminCdn = {
    init: init,
    loadLocalStorageCreds: loadLocalStorageCreds,
    saveLocalStorageCreds: saveLocalStorageCreds,
    savePlatformCdnConfig: savePlatformCdnConfig,
    loadPlatformCdnConfig: loadPlatformCdnConfig,
    rebuildStoreManifest: rebuildStoreManifest,
    publishPath: publishPath,
    uploadAsset: uploadAsset,
    assetPublicUrl: assetPublicUrl,
    testConnection: testConnection,
    isContentPath: isContentPath,
    storageReady: storageReady,
    getState: function () {
      return state;
    }
  };
})(typeof window !== 'undefined' ? window : this);
