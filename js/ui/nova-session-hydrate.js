/* Oturumu localStorage'dan mümkün olan en erken anda window.selectedStudent'a yükler. */
(function () {
  'use strict';

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

  window.novaGetActiveStudent = function novaGetActiveStudent() {
    var s = window.selectedStudent;
    if (s && s.studentId && s.classId) return s;
    var o = parseStoredStudent();
    if (!o) return null;
    window.selectedStudent = o;
    return o;
  };

  window.novaHydrateSessionFromStorage = function novaHydrateSessionFromStorage(target) {
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
    return !!parseStoredStudent();
  };

  window.novaApplyGuestLoginShell = function novaApplyGuestLoginShell() {
    try {
      window.selectedStudent = null;
    } catch (_) {}
    try {
      var root = document.documentElement;
      if (root) {
        root.classList.remove('nova-has-session', 'nova-boot-pending', 'nova-main-screen-visible');
      }
    } catch (_) {}
    try {
      if (document.body) {
        document.body.classList.remove(
          'nova-sprite-boot-active',
          'nova-boot-handoff-active',
          'nova-main-screen-visible'
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

  var early = parseStoredStudent();
  if (early) {
    if (!early.avatarFrame) early.avatarFrame = 'default';
    if (!early.nameFrame) early.nameFrame = 'default';
    window.selectedStudent = early;
  }
})();
