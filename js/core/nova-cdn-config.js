/**
 * Bunny CDN — statik içerik (sorular, mağaza, ağaç, deneme).
 * platformMeta/cdn RTDB kaydı yüklendikten sonra enabled olur.
 */
(function (global) {
  'use strict';

  var DEFAULT = {
    enabled: false,
    base: '',
    version: 1,
    duelRefsOnly: true
  };

  global.NOVA_CDN = global.NOVA_CDN || Object.assign({}, DEFAULT);

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

  function normalizeBase(url) {
    return String(url || '').trim().replace(/\/+$/, '');
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

  function applyMeta(meta) {
    if (!meta || typeof meta !== 'object') return;
    var base = normalizeBase(meta.base || meta.cdnBase || meta.pullZoneUrl || '');
    var ver = Number(meta.version || meta.contentVersion || 0);
    if (base) global.NOVA_CDN.base = base;
    if (ver > 0) global.NOVA_CDN.version = ver;
    if (meta.enabled === true || (base && meta.enabled !== false)) {
      global.NOVA_CDN.enabled = !!base;
    }
    if (meta.duelRefsOnly === false) global.NOVA_CDN.duelRefsOnly = false;
  }

  function isEnabled() {
    return !!(global.NOVA_CDN && global.NOVA_CDN.enabled && global.NOVA_CDN.base);
  }

  function rtdbPathToCdnUrl(path) {
    if (!isEnabled() || !isContentPath(path)) return null;
    var segs = String(path).split('/').filter(Boolean).map(function (s) {
      return encodeURIComponent(s);
    });
    if (!segs.length) return null;
    return (
      normalizeBase(global.NOVA_CDN.base) +
      '/v' +
      String(global.NOVA_CDN.version || 1) +
      '/rtdb/' +
      segs.join('/') +
      '.json'
    );
  }

  function storeManifestUrl() {
    if (!isEnabled()) return null;
    return (
      normalizeBase(global.NOVA_CDN.base) +
      '/v' +
      String(global.NOVA_CDN.version || 1) +
      '/store/manifest.json'
    );
  }

  function assetUrl(relativePath) {
    if (!isEnabled()) return null;
    var segs = String(relativePath || '')
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean)
      .map(function (s) {
        return encodeURIComponent(s);
      });
    if (!segs.length) return null;
    return (
      normalizeBase(global.NOVA_CDN.base) +
      '/v' +
      String(global.NOVA_CDN.version || 1) +
      '/assets/' +
      segs.join('/')
    );
  }

  global.novaCdnIsEnabled = isEnabled;
  global.novaCdnIsContentPath = isContentPath;
  global.novaCdnRtdbPathToUrl = rtdbPathToCdnUrl;
  global.novaCdnStoreManifestUrl = storeManifestUrl;
  global.novaCdnApplyMeta = applyMeta;
  global.novaCdnAssetUrl = assetUrl;

  function bootstrapFromRtdb() {
    try {
      if (typeof firebase === 'undefined' || !firebase.database) return;
      firebase
        .database()
        .ref('platformMeta/cdn')
        .once('value')
        .then(function (snap) {
          if (snap.exists()) applyMeta(snap.val());
        })
        .catch(function () {});
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapFromRtdb);
  } else {
    setTimeout(bootstrapFromRtdb, 0);
  }
})(typeof window !== 'undefined' ? window : this);
