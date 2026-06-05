/* Giriş ekranını window.onload beklemeden göster (oturum yoksa) */
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

  function revealLogin() {
    if (hasStoredStudent()) return;
    var el = document.getElementById('student-selection-screen');
    if (!el) return;
    el.style.display = 'flex';
    el.dataset.novaFastShown = '1';
    try {
      document.body.classList.add('nova-login-fast-visible');
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealLogin, { once: true });
  } else {
    revealLogin();
  }
})();
