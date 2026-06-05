/* Ana ekran — HUD/lig/kupa/kahraman öncelikli paralel indirme */
(function () {
  'use strict';

  var prefetchPromise = null;
  var CUP_CACHE_KEY = 'nova_main_game_cup_v1';

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

  function cupCacheKey(student) {
    if (!student) return '';
    return String(student.classId || '') + ':' + String(student.studentId || '');
  }

  function readCupCache(student) {
    try {
      var raw = localStorage.getItem(CUP_CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || o.key !== cupCacheKey(student)) return null;
      return Number(o.cups);
    } catch (_) {
      return null;
    }
  }

  function writeCupCache(student, cups) {
    try {
      localStorage.setItem(
        CUP_CACHE_KEY,
        JSON.stringify({ key: cupCacheKey(student), cups: Number(cups) || 0, at: Date.now() })
      );
    } catch (_) {}
  }

  window.novaApplyGameCupLeague = function (cups) {
    var cnt = Number(cups);
    if (!isFinite(cnt) || cnt < 0) cnt = 0;
    window.__novaCachedGameCup = cnt;
    var cupEl = document.getElementById('game-cup-score');
    if (cupEl) cupEl.textContent = String(cnt);
    try {
      var st = document.getElementById('student-stars');
      var rk = document.getElementById('student-rank');
      if (st && typeof getStars === 'function') st.innerHTML = getStars(cnt);
      if (rk && typeof getRankHTML === 'function') rk.innerHTML = getRankHTML(cnt);
    } catch (_) {}
    try {
      if (typeof refreshDuelEntryGateNote === 'function') refreshDuelEntryGateNote();
    } catch (_) {}
    var student = getStoredStudent();
    if (student) {
      student.gameCup = cnt;
      try {
        if (typeof selectedStudent !== 'undefined') selectedStudent.gameCup = cnt;
      } catch (_) {}
      try {
        window.selectedStudent = student;
        localStorage.setItem('selectedStudent', JSON.stringify(student));
      } catch (_) {}
      writeCupCache(student, cnt);
    }
  };

  function applyDiamondUi(value) {
    var dia = Number(value);
    if (!isFinite(dia)) return;
    var el = document.getElementById('diamond-value');
    if (el) el.textContent = String(dia);
    var el2 = document.getElementById('currentDiamonds');
    if (el2) el2.textContent = String(dia);
  }

  function applyCreditsPrefetch() {
    var pref = window.__novaMainScreenCreditsPrefetch;
    if (!pref || !pref.at) return;
    if (typeof applyMainScreenCreditsState === 'function') {
      try {
        applyMainScreenCreditsState({
          duelCredits: pref.duelCredits,
          unlimitedCreditsUntil: pref.unlimitedCreditsUntil
        });
      } catch (_) {}
    }
  }

  window.novaApplyMainScreenHudFromData = function (data, student) {
    data = data || {};
    student = student || getStoredStudent();
    if (!student) return;

    var cups =
      data.gameCup != null
        ? Number(data.gameCup)
        : student.gameCup != null
          ? Number(student.gameCup)
          : readCupCache(student);
    if (cups != null && isFinite(cups)) {
      window.novaApplyGameCupLeague(cups);
    }

    var dia =
      data.diamond != null ? Number(data.diamond) : student.diamond != null ? Number(student.diamond) : null;
    if (dia != null && isFinite(dia)) applyDiamondUi(dia);

    applyCreditsPrefetch();
  };

  window.novaApplyMainScreenHudInstant = function () {
    var student = getStoredStudent();
    if (!student) return;
    window.novaApplyMainScreenHudFromData(window.__novaMainScreenStudentCache, student);
    if (student.gameCup == null) {
      var cached = readCupCache(student);
      if (cached != null) window.novaApplyGameCupLeague(cached);
    }
  };

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
        window.novaApplyMainScreenHudFromData(data, student);
        return data;
      })
      .catch(function () {
        window.novaApplyMainScreenHudInstant();
        return null;
      });
  }

  function prefetchGameCupDirect(student) {
    var db = getDatabase();
    if (!db || !student || !student.classId || !student.studentId) {
      return Promise.resolve(null);
    }
    return db
      .ref('classes/' + student.classId + '/students/' + student.studentId + '/gameCup')
      .once('value')
      .then(function (snap) {
        var cnt = snap.exists() ? Number(snap.val()) || 0 : 0;
        window.novaApplyGameCupLeague(cnt);
        return cnt;
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
        applyCreditsPrefetch();
      })
      .catch(function () {});
  }

  window.novaPrefetchMainScreenAssets = function (force) {
    if (prefetchPromise && !force) return prefetchPromise;

    var student = getStoredStudent();
    if (!student) return Promise.resolve(false);

    window.novaApplyMainScreenHudInstant();

    window.__novaMainScreenPrefetchStarted = true;
    prefetchPromise = Promise.all([
      prefetchStudentSnapshot(student),
      prefetchGameCupDirect(student),
      prefetchMainScreenCredits(student),
      prefetchImageUrl(student.photo),
      typeof window.novaPrefetchMainScreenBgMedia === 'function'
        ? window.novaPrefetchMainScreenBgMedia()
        : Promise.resolve(),
      typeof window.novaPreloadDragonEggAssets === 'function'
        ? window.novaPreloadDragonEggAssets()
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
        window.novaApplyMainScreenHudInstant();
        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-prefetch-done'));
        } catch (_) {}
        return true;
      })
      .catch(function () {
        window.__novaMainScreenPrefetchDone = true;
        window.novaApplyMainScreenHudInstant();
        try {
          document.dispatchEvent(new CustomEvent('nova:main-screen-prefetch-done'));
        } catch (_) {}
        return false;
      });

    return prefetchPromise;
  };

  function maybeStartEarly() {
    if (!getStoredStudent()) return;
    window.novaApplyMainScreenHudInstant();
    window.novaPrefetchMainScreenAssets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeStartEarly, { once: true });
  } else {
    maybeStartEarly();
  }
})();
