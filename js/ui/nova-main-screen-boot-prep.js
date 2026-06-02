/* Yükleme ekranı sırasında ana ekranı arkada tam hazırla */
(function () {
  'use strict';

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

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
      var t = setTimeout(finish, maxMs || 22000);
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

  function waitMainHeroReady(timeoutMs) {
    var deadline = performance.now() + (timeoutMs || 15000);
    return new Promise(function (resolve) {
      function tick() {
        var student = getStoredStudent();
        if (!student || !student.classId) {
          resolve(true);
          return;
        }
        var main = document.getElementById('main-screen');
        if (!main || main.style.display === 'none') {
          if (performance.now() < deadline) {
            setTimeout(tick, 100);
            return;
          }
          resolve(false);
          return;
        }
        var slot = document.getElementById('nova-main-hero-slot');
        if (!slot) {
          if (performance.now() < deadline) {
            setTimeout(tick, 100);
            return;
          }
          resolve(false);
          return;
        }
        var host = slot.querySelector('[data-nova-main-hero], [data-nova-hero-host]');
        if (!host) {
          if (typeof window.novaRefreshMainScreenHero === 'function') {
            try {
              window.novaRefreshMainScreenHero();
            } catch (_) {}
          }
          if (performance.now() < deadline) {
            setTimeout(tick, 120);
            return;
          }
          resolve(false);
          return;
        }
        var canvas = host.querySelector('canvas');
        if (canvas && canvas.width > 8 && canvas.height > 8) {
          resolve(true);
          return;
        }
        if (host.querySelector('svg')) {
          resolve(true);
          return;
        }
        if (performance.now() >= deadline) {
          resolve(false);
          return;
        }
        setTimeout(tick, 100);
      }
      tick();
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
        if (passes >= 6) {
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
      await waitAppOnload(24000);

      var student = getStoredStudent();
      if (!student) {
        status('Giriş ekranı hazır…');
        window.__novaMainScreenBootReady = true;
        return true;
      }

      window.__novaBootMainPrep = true;
      try {
        status('Ana ekran hazırlanıyor…');

        var main = document.getElementById('main-screen');
        var login = document.getElementById('student-selection-screen');
        if (login) login.style.display = 'none';
        if (main) main.style.removeProperty('display');

        if (typeof window.novaEnsureLoggedInUi === 'function') {
          try {
            window.novaEnsureLoggedInUi();
          } catch (_) {}
        }

        if (typeof window.onMainScreenLoad === 'function') {
          try {
            window.onMainScreenLoad();
          } catch (_) {}
        }

        if (typeof window.novaRefreshMainScreenHero === 'function') {
          try {
            await window.novaRefreshMainScreenHero();
          } catch (_) {}
        }

        var heroId =
          student.battleHero ||
          window.__novaEquippedHeroId ||
          '';
        if (heroId && typeof window.novaSpritePreloadForHero === 'function') {
          status('Kahraman hazırlanıyor…');
          try {
            await window.novaSpritePreloadForHero(heroId);
          } catch (_) {}
        }

        status('Arayüz yerleşiyor…');
        await waitMainHeroReady(16000);
        await ensureMainScreenLayout();

        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
        } catch (_) {}

        window.__novaMainScreenBootReady = true;
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
})();
