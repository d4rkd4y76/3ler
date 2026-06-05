/* Yükleme ekranı sırasında ana ekran UI — paralel ön-yükleme ile hızlı açılış */
(function () {
  'use strict';

  var stabilizePromise = null;

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

  function waitMainScreenPrefetch(maxMs) {
    if (window.__novaMainScreenPrefetchDone) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      var limit = maxMs == null ? 3200 : maxMs;
      var t = setTimeout(finish, limit);
      document.addEventListener(
        'nova:main-screen-prefetch-done',
        function () {
          clearTimeout(t);
          finish();
        },
        { once: true }
      );
      document.addEventListener(
        'nova:app-main-ready',
        function () {
          clearTimeout(t);
          finish();
        },
        { once: true }
      );
      if (typeof window.novaPrefetchMainScreenAssets === 'function') {
        window.novaPrefetchMainScreenAssets().finally(function () {
          clearTimeout(t);
          finish();
        });
      }
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

  async function stabilizeMainScreenCore(opts) {
    opts = opts || {};
    var student = getStoredStudent();
    if (!student) return false;

    var main = document.getElementById('main-screen');
    var login = document.getElementById('student-selection-screen');
    if (login) login.style.display = 'none';
    if (main) main.style.removeProperty('display');

    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}

    var prefetchP =
      typeof window.novaPrefetchMainScreenAssets === 'function'
        ? window.novaPrefetchMainScreenAssets()
        : Promise.resolve();

    await Promise.all([prefetchP, ensureMainScreenLayout()]);

    var uiTasks = [];
    if (typeof window.onMainScreenLoad === 'function') {
      uiTasks.push(
        Promise.resolve()
          .then(function () {
            window.onMainScreenLoad();
          })
          .catch(function () {})
      );
    } else if (typeof window.novaRequestHudFabRelayout === 'function') {
      uiTasks.push(
        Promise.resolve()
          .then(function () {
            window.novaRequestHudFabRelayout();
          })
          .catch(function () {})
      );
    }
    if (typeof window.novaRefreshMainScreenHero === 'function') {
      uiTasks.push(window.novaRefreshMainScreenHero({ urgent: true }));
    }
    await Promise.all(uiTasks);

    if (typeof window.novaSyncMainScreenBgVideo === 'function') {
      var bgP = window.novaSyncMainScreenBgVideo(false);
      if (opts.awaitBg) {
        try {
          await bgP;
        } catch (_) {}
      } else if (bgP && typeof bgP.catch === 'function') {
        bgP.catch(function () {});
      }
    }

    try {
      document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
    } catch (_) {}

    window.__novaMainScreenBootReady = true;
    return true;
  }

  window.novaStabilizeMainScreen = function (opts) {
    if (stabilizePromise && !(opts && opts.force)) return stabilizePromise;
    stabilizePromise = stabilizeMainScreenCore(opts).finally(function () {
      setTimeout(function () {
        stabilizePromise = null;
      }, 400);
    });
    return stabilizePromise;
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

      status('Varlıklar indiriliyor…');
      if (typeof window.novaPrefetchMainScreenAssets === 'function') {
        window.novaPrefetchMainScreenAssets();
      }

      var student = getStoredStudent();
      if (!student) {
        status('Giriş ekranı hazır…');
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        status('Ana ekran hazırlanıyor…');
        await waitMainScreenPrefetch(3200);
        await window.novaStabilizeMainScreen({ awaitBg: false, force: true });
        status('Hazır!');
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
        if (getStoredStudent()) {
          if (typeof window.novaPrefetchMainScreenAssets === 'function') {
            window.novaPrefetchMainScreenAssets();
          }
          window.novaStabilizeMainScreen({ force: true });
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'pageshow',
      function () {
        if (!getStoredStudent()) return;
        if (typeof window.novaPrefetchMainScreenAssets === 'function') {
          window.novaPrefetchMainScreenAssets(true);
        }
        window.novaStabilizeMainScreen({ force: true });
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
