/* Ana ekran hazır olana kadar hafif dolum kapısı — eski splash yok */
(function () {
  'use strict';

  var MIN_SHOW_MS = 480;
  var MAX_SHOW_MS = 16000;
  var HARD_FAILSAFE_MS = 22000;
  var POLL_MS = 50;
  var READY_STREAK_NEED = 3;
  var startedAt = 0;
  var shown = false;
  var done = false;
  var raf = 0;
  var pollTimer = 0;
  var displayRatio = 0;
  var readyStreak = 0;

  function hasSession() {
    if (typeof window.novaHasStoredStudentSession === 'function') {
      try {
        return !!window.novaHasStoredStudentSession();
      } catch (_) {}
    }
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o.studentId && o.classId);
    } catch (_) {
      return false;
    }
  }

  function gateEl() {
    return document.getElementById('nova-main-gate');
  }

  function fillEl() {
    var g = gateEl();
    return g ? g.querySelector('.nova-main-gate__fill') : null;
  }

  function pctEl() {
    var g = gateEl();
    return g ? g.querySelector('.nova-main-gate__pct') : null;
  }

  function readiness() {
    try {
      if (typeof window.novaMainScreenReadinessRatio === 'function') {
        return Math.max(0, Math.min(1, Number(window.novaMainScreenReadinessRatio()) || 0));
      }
    } catch (_) {}
    try {
      if (typeof window.novaMainScreenElementsReady === 'function' && window.novaMainScreenElementsReady()) {
        return 1;
      }
    } catch (_) {}
    return 0;
  }

  function fontReady() {
    try {
      if (typeof window.novaOkulFontIsReady === 'function') {
        return !!window.novaOkulFontIsReady();
      }
    } catch (_) {}
    try {
      return document.documentElement.classList.contains('nova-font-ready');
    } catch (_) {}
    return true;
  }

  function elementsReady() {
    if (!fontReady()) return false;
    try {
      if (typeof window.novaMainScreenElementsReady === 'function') {
        return !!window.novaMainScreenElementsReady();
      }
    } catch (_) {}
    return readiness() >= 0.999;
  }

  function setVisual(ratio) {
    displayRatio = Math.max(displayRatio, Math.max(0, Math.min(1, ratio)));
    var shownR = displayRatio;
    if (shownR < 1) {
      shownR = Math.max(0.04, Math.min(0.97, displayRatio));
    }
    var fill = fillEl();
    if (fill) fill.style.width = Math.round(shownR * 1000) / 10 + '%';
    var pct = pctEl();
    if (pct) pct.textContent = Math.round(shownR * 100) + '%';
  }

  function showGate() {
    if (done || !hasSession()) return;
    var g = gateEl();
    if (!g) return;
    if (!shown) {
      shown = true;
      startedAt = Date.now();
      displayRatio = 0;
      readyStreak = 0;
    }
    g.hidden = false;
    g.removeAttribute('hidden');
    g.classList.add('is-open');
    g.classList.remove('is-done', 'is-leaving');
    g.setAttribute('aria-hidden', 'false');
    try {
      document.documentElement.classList.add('nova-main-gate-on');
      if (document.body) document.body.classList.add('nova-main-gate-on');
    } catch (_) {}
    setVisual(Math.max(displayRatio, readiness(), 0.05));
  }

  function hideGate() {
    if (done) return;
    done = true;
    shown = false;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = 0;
    }
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    setVisual(1);
    var g = gateEl();
    function finish() {
      if (!g) return;
      g.classList.add('is-done');
      g.classList.remove('is-open', 'is-leaving');
      g.hidden = true;
      g.setAttribute('hidden', '');
      g.setAttribute('aria-hidden', 'true');
      try {
        document.documentElement.classList.remove('nova-main-gate-on');
        if (document.body) document.body.classList.remove('nova-main-gate-on');
      } catch (_) {}
      try {
        document.documentElement.classList.remove('nova-boot-pending');
      } catch (_) {}
      try {
        if (typeof window.novaUnlockDeferredCss === 'function') {
          window.novaUnlockDeferredCss();
        }
      } catch (_) {}
      try {
        g.remove();
      } catch (_) {}
    }
    if (g) {
      g.classList.add('is-leaving');
      setTimeout(finish, 280);
    } else {
      finish();
    }
  }

  function maybeFinish() {
    if (done) return;
    var ratio = readiness();
    setVisual(ratio);
    var elapsed = Date.now() - (startedAt || Date.now());
    var readyNow = elementsReady() && ratio >= 0.999;
    if (readyNow) readyStreak += 1;
    else readyStreak = 0;

    /* Birkaç ardışık hazır tick — yavaş ağda yarım yerleşmiş ekranı açma */
    if (readyStreak >= READY_STREAK_NEED && elapsed >= MIN_SHOW_MS) {
      hideGate();
      return;
    }
    /* Zaman aşımında yalnız neredeyse tam hazırsa kapat */
    if (elapsed >= MAX_SHOW_MS && elementsReady() && ratio >= 0.83 && readyStreak >= 1) {
      hideGate();
      return;
    }
    if (elapsed >= HARD_FAILSAFE_MS) {
      hideGate();
    }
  }

  function tick() {
    if (done) return;
    maybeFinish();
    if (done) return;
    pollTimer = setTimeout(function () {
      raf = requestAnimationFrame(tick);
    }, POLL_MS);
  }

  function start() {
    if (done) return;
    if (!hasSession()) {
      var g = gateEl();
      if (g) {
        g.hidden = true;
        g.setAttribute('hidden', '');
        g.classList.remove('is-open');
      }
      return;
    }
    showGate();
    try {
      if (typeof window.novaEnsureMainScreenReady === 'function') {
        window.novaEnsureMainScreenReady({ afterBoot: true }).catch(function () {});
      }
    } catch (_) {}
    try {
      if (typeof window.novaRefreshMainScreenHero === 'function') {
        window.novaRefreshMainScreenHero({ urgent: true }).catch(function () {});
      }
    } catch (_) {}
    tick();
  }

  window.novaMainGateStart = start;
  window.novaMainGateHide = hideGate;

  document.addEventListener(
    'nova:main-screen-ready',
    function () {
      maybeFinish();
    },
    { passive: true }
  );

  document.addEventListener(
    'nova:sprite-boot-complete',
    function () {
      if (!done && hasSession()) {
        showGate();
        if (!pollTimer && !raf) tick();
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'nova:app-main-ready',
    function () {
      if (!done && hasSession()) start();
    },
    { passive: true }
  );

  function boot() {
    if (hasSession()) start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
