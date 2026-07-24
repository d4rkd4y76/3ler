/**
 * NovaPortraitLock — uygulama genelinde yalnız dikey ekran.
 * Yatayda uyarı. Yazı Ustası “Geniş yaz” açıkken landscape serbest + kilit dener.
 */
(function (global) {
  "use strict";

  var OVERLAY_ID = "nova-portrait-lock";
  var allowLandscape = false;
  var mq = null;
  var bound = false;

  function isTouchOrCompact() {
    try {
      if (!global.matchMedia) return true;
      if (
        global.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1025px)").matches
      ) {
        return false;
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  function isLandscape() {
    try {
      if (global.matchMedia && global.matchMedia("(orientation: landscape)").matches) {
        return true;
      }
    } catch (e) {}
    return global.innerWidth > global.innerHeight;
  }

  function shouldBlock() {
    /* Yalnız açıkça serbest bırakıldığında (Geniş yaz) yatay kabul */
    if (allowLandscape) return false;
    if (!isTouchOrCompact()) return false;
    return isLandscape();
  }

  function ensureOverlay() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.className = "nova-portrait-lock";
    el.setAttribute("role", "alertdialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-live", "assertive");
    el.hidden = true;
    el.innerHTML =
      '<div class="nova-portrait-lock__card">' +
      '<div class="nova-portrait-lock__ico" aria-hidden="true">' +
      '<svg viewBox="0 0 64 64" width="72" height="72" fill="none">' +
      '<rect x="18" y="6" width="28" height="52" rx="5" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="50" r="2.5" fill="currentColor"/>' +
      '<path d="M48 22c6 4 8 10 6 16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M50 18l4 6h-8l4-6z" fill="currentColor"/>' +
      "</svg>" +
      "</div>" +
      '<p class="nova-portrait-lock__title">Telefonu dik tut</p>' +
      '<p class="nova-portrait-lock__text">Bu uygulama dikey ekranda çalışır. Lütfen cihazını dikey konuma çevir.</p>' +
      "</div>";
    (document.body || document.documentElement).appendChild(el);
    return el;
  }

  function lockOrientation(mode) {
    try {
      var o = global.screen && global.screen.orientation;
      if (!o || typeof o.lock !== "function") return Promise.resolve(false);
      var p = o.lock(mode);
      if (p && typeof p.then === "function") {
        return p.then(
          function () {
            return true;
          },
          function () {
            return false;
          }
        );
      }
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function unlockOrientation() {
    try {
      var o = global.screen && global.screen.orientation;
      if (o && typeof o.unlock === "function") o.unlock();
    } catch (e) {}
  }

  function sync() {
    var el = ensureOverlay();
    var block = shouldBlock();
    el.hidden = !block;
    el.classList.toggle("is-on", block);
    try {
      document.documentElement.classList.toggle("nova-portrait-locked", block);
    } catch (e) {}
    if (block) {
      lockOrientation("portrait");
    }
  }

  function setAllowLandscape(on) {
    allowLandscape = !!on;
    try {
      document.documentElement.classList.toggle("nova-allow-landscape", allowLandscape);
      if (document.body) {
        document.body.classList.toggle("nova-allow-landscape", allowLandscape);
      }
    } catch (e) {}
    if (allowLandscape) {
      /* Geniş yaz: yataya kilitlemeyi dene, paneli hemen aç */
      lockOrientation("landscape").then(function () {
        sync();
      });
    } else {
      unlockOrientation();
      lockOrientation("portrait").then(function () {
        sync();
      });
    }
    sync();
  }

  function bind() {
    if (bound) return;
    bound = true;
    try {
      mq = global.matchMedia("(orientation: landscape)");
      if (mq.addEventListener) mq.addEventListener("change", sync);
      else if (mq.addListener) mq.addListener(sync);
    } catch (e) {}
    global.addEventListener("orientationchange", sync, { passive: true });
    global.addEventListener("resize", sync, { passive: true });
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", sync, { once: true });
    } else {
      sync();
    }
  }

  bind();

  global.NovaPortraitLock = {
    sync: sync,
    allowLandscape: setAllowLandscape,
    lockOrientation: lockOrientation,
    isBlocking: shouldBlock,
    isLandscape: isLandscape
  };
})(typeof window !== "undefined" ? window : this);
