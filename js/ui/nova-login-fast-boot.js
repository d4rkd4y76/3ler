/* Giriş ekranı — ComfortaaOkul hazır olmadan açılmaz */

(function () {
  'use strict';

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

  function revealLogin() {
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

    whenFontReady(function () {
      try {
        if (typeof window.novaApplyGuestLoginShell === 'function') {
          window.novaApplyGuestLoginShell();
        }
      } catch (_) {}

      neutralizeBodyScale();

      var el = document.getElementById('student-selection-screen');
      if (!el) return;

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
