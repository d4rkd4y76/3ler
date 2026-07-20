/**
 * Statik medya (sprite, video, png) — Bunny Pull Zone üzerinden.
 * platformMeta/cdn veya cdn-config.public.json aktifken yerel yola düşmez.
 */
(function (global) {
  'use strict';

  var ASSET_EXT =
    /\.(webp|png|jpe?g|gif|svg|mp4|webm|json|woff2?|ttf|otf)(\?|#|$)/i;

  var CDN_PATH_ALIASES = {
    'duello-bg-loop.mp4': 'video/duello-bg-loop.mp4'
  };

  function normalizeRel(path) {
    return String(path || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .trim();
  }

  function isAssetPath(path) {
    var p = normalizeRel(path);
    if (!p) return false;
    if (ASSET_EXT.test(p)) return true;
    if (
      p.indexOf('hero/') === 0 ||
      p.indexOf('assets/') === 0 ||
      p.indexOf('egg_open/') === 0
    ) {
      return true;
    }
    return /\.(mp4|webp|png)$/i.test(p);
  }

  function localUrl(path) {
    try {
      return new URL(path, global.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function cdnUrl(path) {
    if (typeof global.novaCdnAssetUrl !== 'function') return null;
    if (typeof global.novaCdnIsEnabled === 'function' && !global.novaCdnIsEnabled()) {
      return null;
    }
    return global.novaCdnAssetUrl(path);
  }

  function resolve(path) {
    var rel = normalizeRel(path);
    if (!rel) return '';
    if (CDN_PATH_ALIASES[rel]) rel = CDN_PATH_ALIASES[rel];
    if (isAssetPath(rel)) {
      var cdn = cdnUrl(rel);
      if (cdn) return cdn;
    }
    return localUrl(rel);
  }

  function rewriteDomAsset(el, attr) {
    if (!el || !el.getAttribute) return;
    var raw = el.getAttribute(attr);
    if (!raw || /^https?:\/\//i.test(raw) || /^data:/i.test(raw) || /^blob:/i.test(raw)) {
      return;
    }
    var next = resolve(raw);
    if (next && next !== raw) el.setAttribute(attr, next);
  }

  function rewriteDomAssets(root) {
    var scope = root && root.querySelectorAll ? root : global.document;
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll('[src]').forEach(function (el) {
      rewriteDomAsset(el, 'src');
    });
    scope.querySelectorAll('[poster]').forEach(function (el) {
      rewriteDomAsset(el, 'poster');
    });
    scope.querySelectorAll('source[src]').forEach(function (el) {
      rewriteDomAsset(el, 'src');
    });
  }

  function installDomObserver() {
    if (global.__novaCdnDomObserver || !global.MutationObserver || !global.document.body) {
      return;
    }
    var timer = 0;
    var obs = new MutationObserver(function () {
      if (timer) return;
      timer = setTimeout(function () {
        timer = 0;
        if (typeof global.novaCdnIsEnabled === 'function' && global.novaCdnIsEnabled()) {
          rewriteDomAssets(global.document);
        }
      }, 120);
    });
    obs.observe(global.document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'poster']
    });
    global.__novaCdnDomObserver = obs;
  }

  function onCdnReady() {
    rewriteDomAssets(global.document);
    installDomObserver();
  }

  global.novaResolveAssetUrl = resolve;
  global.novaRewriteDomAssets = rewriteDomAssets;

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', onCdnReady);
  } else {
    setTimeout(onCdnReady, 0);
  }

  global.addEventListener('nova-cdn-ready', onCdnReady);
})(typeof window !== 'undefined' ? window : this);
