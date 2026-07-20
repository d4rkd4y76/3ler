/* Oturum: yenilemede kalır; sekme/uygulama kapanınca (sessionStorage silinir) tekrar giriş gerekir. */
(function () {
  'use strict';

  var PREF_KEY = 'duello_login_pref';
  var TAB_KEY = 'nova_tab_session';

  function parseStoredStudent() {
    try {
      var raw = localStorage.getItem('selectedStudent');
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.studentId || !o.classId) return null;
      return o;
    } catch (_) {
      return null;
    }
  }

  window.novaHasTabSession = function novaHasTabSession() {
    try {
      return sessionStorage.getItem(TAB_KEY) === '1';
    } catch (_) {
      return false;
    }
  };

  window.novaMarkTabSession = function novaMarkTabSession() {
    try {
      sessionStorage.setItem(TAB_KEY, '1');
    } catch (_) {}
  };

  window.novaClearTabSession = function novaClearTabSession() {
    try {
      sessionStorage.removeItem(TAB_KEY);
    } catch (_) {}
  };

  /** Beni hatırla tercihlerini silmeden oturumu kapat (çıkış / uygulama yeniden açılışı). */
  window.novaEndSessionKeepCredentials = function novaEndSessionKeepCredentials() {
    try {
      localStorage.removeItem('selectedStudent');
    } catch (_) {}
    try {
      window.novaClearTabSession();
    } catch (_) {}
    try {
      window.selectedStudent = null;
    } catch (_) {}
    try {
      var root = document.documentElement;
      if (root) {
        root.classList.remove(
          'nova-has-session',
          'nova-boot-pending',
          'nova-main-screen-visible',
          'nova-main-gate-on'
        );
      }
    } catch (_) {}
  };

  window.novaGetActiveStudent = function novaGetActiveStudent() {
    var s = window.selectedStudent;
    if (s && s.studentId && s.classId) return s;
    if (!window.novaHasTabSession()) return null;
    var o = parseStoredStudent();
    if (!o) return null;
    window.selectedStudent = o;
    return o;
  };

  window.novaHydrateSessionFromStorage = function novaHydrateSessionFromStorage(target) {
    if (!window.novaHasTabSession()) return false;
    var o = parseStoredStudent();
    if (!o) return false;
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(function (k) {
        delete target[k];
      });
      Object.assign(target, o);
      if (!target.avatarFrame) target.avatarFrame = 'default';
      if (!target.nameFrame) target.nameFrame = 'default';
      window.selectedStudent = target;
      return true;
    }
    if (!o.avatarFrame) o.avatarFrame = 'default';
    if (!o.nameFrame) o.nameFrame = 'default';
    window.selectedStudent = o;
    return true;
  };

  window.novaHasStoredStudentSession = function novaHasStoredStudentSession() {
    return window.novaHasTabSession() && !!parseStoredStudent();
  };

  window.novaReadLoginPref = function novaReadLoginPref() {
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {};
    } catch (_) {
      return {};
    }
  };

  window.novaWriteLoginPref = function novaWriteLoginPref(pref) {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(pref || {}));
    } catch (_) {}
  };

  window.novaApplyGuestLoginShell = function novaApplyGuestLoginShell() {
    try {
      window.selectedStudent = null;
    } catch (_) {}
    try {
      var root = document.documentElement;
      if (root) {
        root.classList.remove(
          'nova-has-session',
          'nova-boot-pending',
          'nova-main-screen-visible',
          'nova-main-gate-on'
        );
      }
    } catch (_) {}
    try {
      if (document.body) {
        document.body.classList.remove(
          'nova-sprite-boot-active',
          'nova-boot-handoff-active',
          'nova-main-screen-visible',
          'nova-main-gate-on'
        );
      }
    } catch (_) {}
    try {
      var ov = document.getElementById('nova_sprite_boot_overlay');
      if (ov) {
        ov.hidden = true;
        ov.classList.remove('is-exiting', 'is-handoff', 'is-fade-out', 'is-finishing-wait');
      }
    } catch (_) {}
    try {
      var main = document.getElementById('main-screen');
      if (main) {
        main.style.display = 'none';
        main.style.visibility = '';
        main.style.opacity = '';
      }
    } catch (_) {}
    try {
      var login = document.getElementById('student-selection-screen');
      if (login) login.style.display = 'flex';
    } catch (_) {}
  };

  /*
   * Sekme/uygulama kapanınca sessionStorage silinir.
   * Yenilemede sessionStorage kalır → oturum devam.
   * Kapanıp yeniden açılınca tab bayrağı yok → localStorage oturumu düşür, giriş ekranı.
   */
  try {
    if (window.novaHasTabSession()) {
      var early = parseStoredStudent();
      if (early) {
        if (!early.avatarFrame) early.avatarFrame = 'default';
        if (!early.nameFrame) early.nameFrame = 'default';
        window.selectedStudent = early;
        try {
          document.documentElement.classList.add(
            'nova-has-session',
            'nova-main-screen-visible',
            'nova-main-gate-on',
            'nova-boot-pending'
          );
        } catch (_) {}
        /* boot-pending kalsın; deferred CSS unlock temizler */
      } else {
        window.novaClearTabSession();
        window.selectedStudent = null;
      }
    } else {
      try {
        localStorage.removeItem('selectedStudent');
      } catch (_) {}
      window.selectedStudent = null;
    }
  } catch (_) {
    window.selectedStudent = null;
  }
})();
