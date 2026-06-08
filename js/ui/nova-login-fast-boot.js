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



  function revealLogin() {

    if (hasStoredStudent()) {

      try {

        document.documentElement.classList.add('nova-has-session');

      } catch (_) {}

      return;

    }

    try {

      document.documentElement.classList.remove('nova-has-session');

    } catch (_) {}

    var el = document.getElementById('student-selection-screen');

    if (!el) return;

    el.style.display = 'flex';

    el.style.visibility = 'visible';

    el.style.position = 'fixed';

    el.style.inset = '0';

    el.dataset.novaFastShown = '1';

    try {

      document.body.classList.add('nova-login-fast-visible');

    } catch (_) {}

  }



  revealLogin();

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', revealLogin, { once: true });

  }

})();


