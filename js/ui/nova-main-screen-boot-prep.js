/* Yükleme ekranı sırasında yalnızca ana ekran UI — sprite/kahraman sonradan */
(function () {
  'use strict';

  function getStoredStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
        return selectedStudent;
      }
    } catch (_) {}
    try {
      if (window.selectedStudent && window.selectedStudent.studentId) return window.selectedStudent;
    } catch (_) {}
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return null;
      var o = JSON.parse(raw);
      return o && o.studentId ? o : null;
    } catch (_) {
      return null;
    }
  }

  function waitAppOnload(maxMs) {
    if (window.__novaAppOnloadDone) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      var t = setTimeout(finish, maxMs || 8000);
      document.addEventListener(
        'nova:app-onload-done',
        function () {
          clearTimeout(t);
          finish();
        },
        { once: true }
      );
    });
  }

  function ensureMainScreenLayout() {
    return new Promise(function (resolve) {
      var passes = 0;
      function pass() {
        passes += 1;
        try {
          if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
        } catch (_) {}
        try {
          if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
        } catch (_) {}
        try {
          if (typeof window.novaSyncPerfRuntime === 'function') window.novaSyncPerfRuntime();
        } catch (_) {}
        try {
          if (typeof window.novaSyncMainScreenScrollLock === 'function') window.novaSyncMainScreenScrollLock();
        } catch (_) {}
        if (passes >= 2) {
          resolve();
          return;
        }
        requestAnimationFrame(function () {
          requestAnimationFrame(pass);
        });
      }
      pass();
    });
  }

  window.novaStabilizeMainScreen = async function () {
    var student = getStoredStudent();
    if (!student) return false;

    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) main.style.removeProperty('display');

    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}

    if (typeof window.onMainScreenLoad === 'function') {
      try {
        window.onMainScreenLoad();
      } catch (_) {}
    } else if (typeof window.novaRequestHudFabRelayout === 'function') {
      try {
        window.novaRequestHudFabRelayout();
      } catch (_) {}
    }

    await ensureMainScreenLayout();

    try {
      if (typeof window.novaRefreshMainScreenHero === 'function') window.novaRefreshMainScreenHero();
    } catch (_) {}

    try {
      if (typeof window.novaSyncMainScreenBgVideo === 'function') {
        await window.novaSyncMainScreenBgVideo(false);
      }
    } catch (_) {}

    try {
      document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
    } catch (_) {}

    window.__novaMainScreenBootReady = true;
    return true;
  };

  window.novaPrepareMainScreenForBoot = function (onStatus) {
    if (window.__novaMainScreenBootPromise) return window.__novaMainScreenBootPromise;

    window.__novaMainScreenBootPromise = (async function () {
      function status(msg) {
        if (typeof onStatus === 'function') {
          try {
            onStatus(msg);
          } catch (_) {}
        }
      }

      status('Sistem başlatılıyor…');
      await waitAppOnload(8000);

      var student = getStoredStudent();
      if (!student) {
        status('Giriş ekranı hazır…');
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        status('Ana ekran hazırlanıyor…');
        await window.novaStabilizeMainScreen();
        status('Arayüz yerleşiyor…');
        return true;
      } finally {
        window.__novaBootMainPrep = false;
      }
    })().catch(function (e) {
      console.warn('[nova main boot prep]', e);
      window.__novaMainScreenBootReady = true;
      return false;
    });

    return window.__novaMainScreenBootPromise;
  };

  function bindMainScreenRecovery() {
    if (document.__novaMainScreenRecoveryBound) return;
    document.__novaMainScreenRecoveryBound = true;

    document.addEventListener(
      'nova:sprite-boot-complete',
      function () {
        if (getStoredStudent()) window.novaStabilizeMainScreen();
      },
      { passive: true }
    );

    window.addEventListener(
      'pageshow',
      function (ev) {
        if (!getStoredStudent()) return;
        window.novaStabilizeMainScreen();
      },
      { passive: true }
    );

    document.addEventListener(
      'visibilitychange',
      function () {
        if (document.hidden || !getStoredStudent()) return;
        window.novaStabilizeMainScreen();
      },
      { passive: true }
    );
  }

  bindMainScreenRecovery();
})();
