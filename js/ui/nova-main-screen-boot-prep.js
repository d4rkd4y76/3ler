/* Yükleme ekranı sırasında ana ekranın tam hazır olması (UI + arka plan videosu + kahraman) */
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

  function waitFrames(n) {
    n = n || 2;
    return new Promise(function (resolve) {
      function tick(left) {
        if (left <= 0) resolve();
        else requestAnimationFrame(function () { tick(left - 1); });
      }
      tick(n);
    });
  }

  function waitMainScreenDomReady(maxMs) {
    maxMs = maxMs || 6000;
    return new Promise(function (resolve) {
      var deadline = performance.now() + maxMs;
      function check() {
        var main = document.getElementById('main-screen');
        if (!main) {
          if (performance.now() < deadline) return requestAnimationFrame(check);
          resolve();
          return;
        }
        try {
          var st = window.getComputedStyle(main);
          if (st.display === 'none' || st.visibility === 'hidden') {
            if (performance.now() < deadline) return requestAnimationFrame(check);
            resolve();
            return;
          }
        } catch (_) {}
        var rect = main.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) {
          if (performance.now() < deadline) return requestAnimationFrame(check);
          resolve();
          return;
        }
        resolve();
      }
      check();
    });
  }

  function waitHudAnchors(maxMs) {
    maxMs = maxMs || 4000;
    return new Promise(function (resolve) {
      var deadline = performance.now() + maxMs;
      var ids = ['diamond-value', 'currentDiamonds', 'nova-main-hero-zone'];
      function check() {
        var ok = ids.every(function (id) {
          var el = document.getElementById(id);
          return el && el.getBoundingClientRect().width > 0;
        });
        if (ok || performance.now() >= deadline) resolve();
        else requestAnimationFrame(check);
      }
      check();
    });
  }

  function waitMainHeroMounted(maxMs) {
    var student = getStoredStudent();
    if (!student || !student.battleHero) return Promise.resolve();
    maxMs = maxMs || 3200;
    return new Promise(function (resolve) {
      var deadline = performance.now() + maxMs;
      function check() {
        var slot = document.getElementById('nova-main-hero-slot');
        var host = slot && slot.querySelector('[data-nova-hero-host]');
        if (host) {
          var rect = host.getBoundingClientRect();
          var painted = host.querySelector('canvas, svg, video, img, .nova-hero-gece-stack, .nova-hero-buz-stack');
          if (rect.width > 6 && rect.height > 6 && (painted || host.childElementCount > 0)) {
            resolve();
            return;
          }
        }
        if (performance.now() >= deadline) resolve();
        else requestAnimationFrame(check);
      }
      check();
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
        if (passes >= 3) {
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

  function waitMainScreenBgVideo(maxMs) {
    if (typeof window.novaPrepareMainScreenBgVideoForBoot === 'function') {
      return window.novaPrepareMainScreenBgVideoForBoot(maxMs || 16000);
    }
    if (typeof window.novaSyncMainScreenBgVideo === 'function') {
      return window.novaSyncMainScreenBgVideo(true).catch(function () {});
    }
    return Promise.resolve();
  }

  window.novaWaitMainScreenFullyReady = async function (onStatus) {
    function status(msg) {
      if (typeof onStatus === 'function') {
        try {
          onStatus(msg);
        } catch (_) {}
      }
    }

    status('Ana ekran doğrulanıyor…');
    await waitMainScreenDomReady(7000);
    await waitHudAnchors(4500);

    status('Arka plan videosu hazırlanıyor…');
    await waitMainScreenBgVideo(16000);

    status('Kahraman ve arayüz tamamlanıyor…');
    try {
      if (typeof window.novaRefreshMainScreenHero === 'function') window.novaRefreshMainScreenHero();
    } catch (_) {}
    await waitMainHeroMounted(3200);

    await ensureMainScreenLayout();
    await waitFrames(2);

    try {
      if (typeof window.novaSyncMainScreenBgVideo === 'function') {
        await window.novaSyncMainScreenBgVideo(false);
      }
    } catch (_) {}

    window.__novaMainScreenFullyReady = true;
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
        window.__novaMainScreenFullyReady = true;
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

        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
        } catch (_) {}

        await window.novaWaitMainScreenFullyReady(status);
        return true;
      } finally {
        window.__novaBootMainPrep = false;
      }
    })().catch(function (e) {
      console.warn('[nova main boot prep]', e);
      window.__novaMainScreenBootReady = true;
      window.__novaMainScreenFullyReady = true;
      return false;
    });

    return window.__novaMainScreenBootPromise;
  };
})();
