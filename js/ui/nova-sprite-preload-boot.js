/* Açılış splash kaldırıldı — oturum varsa ana ekran anında */
(function () {
  'use strict';

  window.__novaSpriteBootManaged = true;
  window.__novaSpriteBootDone = false;
  window.__novaSpriteBootActive = false;
  window.__novaSpriteBootHandoffDispatched = false;

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

  function revealMainNow() {
    try {
      document.documentElement.classList.remove('nova-boot-pending');
      document.documentElement.classList.add('nova-has-session', 'nova-main-screen-visible');
    } catch (_) {}
    try {
      if (document.body) {
        document.body.classList.remove('nova-sprite-boot-active', 'nova-boot-handoff-active', 'nova-login-fast-visible');
        document.body.classList.add('nova-main-screen-visible');
      }
    } catch (_) {}
    try {
      var ov = document.getElementById('nova_sprite_boot_overlay');
      if (ov) {
        ov.hidden = true;
        ov.setAttribute('hidden', '');
        ov.remove();
      }
    } catch (_) {}
    try {
      if (typeof window.novaMainGateStart === 'function') window.novaMainGateStart();
    } catch (_) {}
    try {
      var login = document.getElementById('student-selection-screen');
      if (login) login.style.display = 'none';
    } catch (_) {}
    try {
      var main = document.getElementById('main-screen');
      if (main) {
        main.style.removeProperty('display');
        main.style.visibility = 'visible';
        main.style.opacity = '1';
      }
    } catch (_) {}
    try {
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
    } catch (_) {}
    try {
      if (typeof window.novaSyncMainScreenBgVideo === 'function') {
        window.novaSyncMainScreenBgVideo(false);
      }
    } catch (_) {}
  }

  function finishBoot() {
    if (window.__novaSpriteBootDone) {
      revealMainNow();
      return Promise.resolve();
    }
    window.__novaSpriteBootDone = true;
    window.__novaSpriteBootActive = false;
    window.__novaSpriteBootHandoffDispatched = true;
    revealMainNow();
    try {
      sessionStorage.setItem('nova_sprite_boot_done_v9', '1');
    } catch (_) {}
    try {
      document.dispatchEvent(new CustomEvent('nova:sprite-boot-complete'));
    } catch (_) {}
    try {
      document.dispatchEvent(new CustomEvent('nova:main-screen-visible'));
    } catch (_) {}
    try {
      if (typeof window.novaEnsureMainScreenReady === 'function') {
        window.novaEnsureMainScreenReady({ afterBoot: true });
      }
    } catch (_) {}
    try {
      if (typeof window.novaContinueMainSlotLoading === 'function') {
        window.novaContinueMainSlotLoading();
      }
    } catch (_) {}
    return Promise.resolve();
  }

  window.novaStartSpriteBoot = function (opts) {
    opts = opts || {};
    if (!hasSession()) {
      try {
        if (typeof window.novaApplyGuestLoginShell === 'function') {
          window.novaApplyGuestLoginShell();
        }
      } catch (_) {}
      return Promise.resolve();
    }
    window.__novaSpriteBootActive = true;
    window.__novaSpriteBootTriggered = opts.trigger || 'instant';
    return finishBoot();
  };

  window.novaWaitSpriteBootComplete = function () {
    if (window.__novaSpriteBootDone) return Promise.resolve();
    return window.novaStartSpriteBoot({ trigger: 'wait' });
  };

  window.novaForceBootHandoff = function () {
    return finishBoot();
  };

  window.novaSpriteBootReset = function () {
    window.__novaSpriteBootDone = false;
    window.__novaSpriteBootActive = false;
    window.__novaSpriteBootHandoffDispatched = false;
    try {
      document.documentElement.classList.remove('nova-main-gate-on');
      if (document.body) document.body.classList.remove('nova-main-gate-on', 'nova-sprite-boot-active');
    } catch (_) {}
    try {
      if (typeof window.novaMainGateHide === 'function') window.novaMainGateHide();
    } catch (_) {}
  };

  function autoStart() {
    if (!hasSession()) return;
    window.novaStartSpriteBoot({ trigger: 'remembered' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart, { once: true });
  } else {
    autoStart();
  }
})();
