/* Giriş ekranı — font + ejderha hazır olmadan açılmaz */

(function () {
  'use strict';

  var revealed = false;
  var ICE_MAX_MS = 9000;
  var MIN_SHOW_MS = 280;

  function hasStoredStudent() {
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o.studentId && o.classId);
    } catch (_) {
      return false;
    }
  }

  function neutralizeBodyScale() {
    try {
      if (!document.body) return;
      document.body.style.zoom = '1';
      document.body.style.transform = 'none';
      document.body.style.width = '100%';
      document.body.style.transformOrigin = '';
    } catch (_) {}
  }

  function markLoginReady() {
    try {
      document.documentElement.classList.add('nova-login-ready');
    } catch (_) {}
    try {
      if (typeof window.novaUnlockDeferredCss === 'function') {
        window.novaUnlockDeferredCss();
      }
    } catch (_) {}
  }

  function iceReady() {
    try {
      var html = document.documentElement;
      return (
        html.classList.contains('nova-login-ice-ready') ||
        html.classList.contains('nova-login-ice-fallback')
      );
    } catch (_) {
      return true;
    }
  }

  function whenFontReady(fn) {
    if (typeof window.novaWhenOkulFontReady === 'function') {
      window.novaWhenOkulFontReady(fn);
      return;
    }
    try {
      if (document.documentElement.classList.contains('nova-font-ready')) {
        fn();
        return;
      }
    } catch (_) {}
    requestAnimationFrame(fn);
  }

  function whenIceReady(fn) {
    var started = Date.now();
    function check() {
      if (iceReady() || Date.now() - started >= ICE_MAX_MS) {
        fn();
        return;
      }
      setTimeout(check, 60);
    }
    try {
      if (typeof window.novaStartLoginIceSprite === 'function') {
        window.novaStartLoginIceSprite();
      }
    } catch (_) {}
    check();
  }

  function ensureLoginBootEl() {
    var screen = document.getElementById('student-selection-screen');
    if (!screen) return null;
    var el = document.getElementById('nova-login-boot');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'nova-login-boot';
    el.className = 'nova-login-boot';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="nova-login-boot__orb" aria-hidden="true"></div>' +
      '<p class="nova-login-boot__title">Düellox</p>' +
      '<p class="nova-login-boot__text">Hazırlanıyor…</p>' +
      '<div class="nova-login-boot__bar" aria-hidden="true"><i></i></div>';
    screen.appendChild(el);
    return el;
  }

  function showLoginBoot() {
    try {
      document.documentElement.classList.add('nova-login-booting');
    } catch (_) {}
    var el = ensureLoginBootEl();
    if (el) {
      el.hidden = false;
      el.classList.add('is-open');
      el.classList.remove('is-leaving');
    }
  }

  function hideLoginBoot() {
    var el = document.getElementById('nova-login-boot');
    function done() {
      try {
        document.documentElement.classList.remove('nova-login-booting');
      } catch (_) {}
      if (el) {
        el.classList.remove('is-open', 'is-leaving');
        el.hidden = true;
      }
    }
    if (el) {
      el.classList.add('is-leaving');
      setTimeout(done, 260);
    } else {
      done();
    }
  }

  function revealLogin() {
    if (revealed) return;
    if (hasStoredStudent()) {
      whenFontReady(function () {
        try {
          document.documentElement.classList.add('nova-has-session');
          if (typeof window.novaHydrateSessionFromStorage === 'function') {
            window.novaHydrateSessionFromStorage();
          } else {
            try {
              window.selectedStudent = JSON.parse(localStorage.getItem('selectedStudent') || 'null');
            } catch (_) {}
          }
        } catch (_) {}
        try {
          if (typeof window.novaUnlockDeferredCss === 'function') window.novaUnlockDeferredCss();
        } catch (_) {}
      });
      return;
    }

    showLoginBoot();
    var shownAt = Date.now();

    whenFontReady(function () {
      whenIceReady(function () {
        var waitMore = Math.max(0, MIN_SHOW_MS - (Date.now() - shownAt));
        setTimeout(function () {
          if (revealed) return;
          revealed = true;

          try {
            if (typeof window.novaApplyGuestLoginShell === 'function') {
              window.novaApplyGuestLoginShell();
            }
          } catch (_) {}

          neutralizeBodyScale();

          var el = document.getElementById('student-selection-screen');
          if (!el) {
            hideLoginBoot();
            return;
          }

          el.style.display = 'flex';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.position = 'fixed';
          el.style.inset = '0';
          el.style.zoom = '1';
          el.style.transform = 'none';
          el.dataset.novaFastShown = '1';

          try {
            document.body.classList.add('nova-login-fast-visible');
          } catch (_) {}

          markLoginReady();
          hideLoginBoot();
        }, waitMore);
      });
    });
  }

  revealLogin();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealLogin, { once: true });
  }

  document.addEventListener(
    'focusin',
    function (e) {
      if (hasStoredStudent()) return;
      var t = e.target;
      if (!t || t.id !== 'student-password-input') return;
      neutralizeBodyScale();
      try {
        if (typeof window.novaSyncPerfRuntime === 'function') window.novaSyncPerfRuntime();
      } catch (_) {}
    },
    true
  );
})();
