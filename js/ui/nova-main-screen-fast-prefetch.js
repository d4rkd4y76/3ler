/* Ana ekran — tüm kritik varlıkları paralel indir (boot + yenileme) */
(function () {
  'use strict';

  var prefetchPromise = null;

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

  function getDatabase() {
    try {
      if (typeof database !== 'undefined' && database) return database;
    } catch (_) {}
    try {
      if (window.database) return window.database;
    } catch (_) {}
    return null;
  }

  function prefetchImageUrl(url) {
    return new Promise(function (resolve) {
      var src = String(url || '').trim();
      if (!src) {
        resolve();
        return;
      }
      var img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = function () {
        resolve();
      };
      try {
        img.fetchPriority = 'high';
      } catch (_) {}
      img.src = src;
    });
  }

  function prefetchStudentSnapshot(student) {
    var db = getDatabase();
    if (!db || !student || !student.classId || !student.studentId) {
      return Promise.resolve(null);
    }
    var path = 'classes/' + student.classId + '/students/' + student.studentId;
    return db
      .ref(path)
      .once('value')
      .then(function (snap) {
        var data = snap.exists() ? snap.val() || {} : {};
        window.__novaMainScreenStudentCache = data;
        window.__novaMainScreenStudentCacheAt = Date.now();
        return data;
      })
      .catch(function () {
        return null;
      });
  }

  function resolveHeroId(student, data) {
    var fromData = data && data.battleHero ? String(data.battleHero).trim() : '';
    var fromStudent = student && student.battleHero ? String(student.battleHero).trim() : '';
    var fromGlobal = window.__novaEquippedHeroId ? String(window.__novaEquippedHeroId).trim() : '';
    return fromData || fromStudent || fromGlobal || 'star_fairy';
  }

  function prefetchEquippedHero(heroId) {
    var id = String(heroId || '').trim();
    if (!id) return Promise.resolve();
    var tasks = [];
    if (typeof window.novaSpritePreloadHero === 'function') {
      tasks.push(Promise.resolve(window.novaSpritePreloadHero(id)).catch(function () {}));
    }
    if (typeof window.novaSpritePreloadForHero === 'function') {
      tasks.push(Promise.resolve(window.novaSpritePreloadForHero(id)).catch(function () {}));
    }
    var clipFns = {
      firtina_okcu: 'novaFirtinaOkcuPreloadTrueClipsIfEquipped',
      star_fairy: 'novaYildizPerisiPreloadTrueClipsIfEquipped',
      tas_muhafiz: 'novaTasMuhafizPreloadTrueClipsIfEquipped',
      golge_parsi: 'novaGolgeParsiPreloadTrueClipsIfEquipped',
      bilge_baykus: 'novaBilgeBaykusPreloadTrueClipsIfEquipped',
      buz_ejder: 'novaBuzEjderPreloadTrueClipsIfEquipped',
      alev_ejder: 'novaAlevEjderPreloadTrueClipsIfEquipped',
      gece_ejder: 'novaGeceEjderPreloadTrueClipsIfEquipped'
    };
    var clipFn = clipFns[id];
    if (clipFn && typeof window[clipFn] === 'function') {
      tasks.push(
        Promise.resolve()
          .then(function () {
            window[clipFn]();
          })
          .catch(function () {})
      );
    }
    return Promise.all(tasks);
  }

  function prefetchMainScreenCredits(student) {
    var db = getDatabase();
    if (!db || !student || !student.classId || !student.studentId) return Promise.resolve();
    var ref = db.ref('classes/' + student.classId + '/students/' + student.studentId);
    return Promise.all([
      ref.child('duelCredits').once('value'),
      ref.child('unlimitedCreditsUntil').once('value')
    ])
      .then(function (snaps) {
        window.__novaMainScreenCreditsPrefetch = {
          duelCredits: snaps[0].exists() ? Number(snaps[0].val() || 0) : 0,
          unlimitedCreditsUntil: snaps[1].exists() ? Number(snaps[1].val() || 0) : 0,
          at: Date.now()
        };
      })
      .catch(function () {});
  }

  window.novaPrefetchMainScreenAssets = function (force) {
    if (prefetchPromise && !force) return prefetchPromise;

    var student = getStoredStudent();
    if (!student) return Promise.resolve(false);

    window.__novaMainScreenPrefetchStarted = true;
    prefetchPromise = Promise.all([
      prefetchStudentSnapshot(student),
      prefetchMainScreenCredits(student),
      prefetchImageUrl(student.photo),
      typeof window.novaPrefetchMainScreenBgMedia === 'function'
        ? window.novaPrefetchMainScreenBgMedia()
        : Promise.resolve()
    ])
      .then(function (results) {
        var data = results[0];
        var heroId = resolveHeroId(student, data);
        window.__novaEquippedHeroId = heroId;
        return prefetchEquippedHero(heroId);
      })
      .then(function () {
        window.__novaMainScreenPrefetchDone = true;
        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-prefetch-done'));
        } catch (_) {}
        return true;
      })
      .catch(function () {
        window.__novaMainScreenPrefetchDone = true;
        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-prefetch-done'));
        } catch (_) {}
        return false;
      });

    return prefetchPromise;
  };

  function maybeStartEarly() {
    if (!getStoredStudent()) return;
    window.novaPrefetchMainScreenAssets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeStartEarly, { once: true });
  } else {
    maybeStartEarly();
  }
})();
