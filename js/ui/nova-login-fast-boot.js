/* Giriş ekranı — parse sırasında anında göster (oturum yoksa) */

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
  }

  function scheduleLoginReady() {
    function afterPaint() {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          markLoginReady();
        });
      });
    }
    try {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(afterPaint).catch(afterPaint);
        return;
      }
    } catch (_) {}
    afterPaint();
  }

  function revealLogin() {
    if (hasStoredStudent()) {
      try {
        document.documentElement.classList.add('nova-has-session');
      } catch (_) {}
      return;
    }

    try {
      document.documentElement.classList.remove('nova-has-session', 'nova-login-ready');
    } catch (_) {}

    neutralizeBodyScale();

    var el = document.getElementById('student-selection-screen');
    if (!el) return;

    el.style.display = 'flex';
    el.style.visibility = 'visible';
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zoom = '1';
    el.style.transform = 'none';
    el.dataset.novaFastShown = '1';

    try {
      document.body.classList.add('nova-login-fast-visible');
    } catch (_) {}

    scheduleLoginReady();
  }

  revealLogin();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealLogin, { once: true });
  }

  document.addEventListener('focusin', function (e) {
    if (hasStoredStudent()) return;
    var t = e.target;
    if (!t || t.id !== 'student-password-input') return;
    neutralizeBodyScale();
    try {
      if (typeof window.novaSyncPerfRuntime === 'function') window.novaSyncPerfRuntime();
    } catch (_) {}
  }, true);
})();
