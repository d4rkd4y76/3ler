/* Nova Epic Duel Flow: lig → rakip bulundu → senkron 10sn hazırlık */
(function () {
  if (window.__novaEpicDuelFlowInstalled) return;
  window.__novaEpicDuelFlowInstalled = true;

  var PREP_MS = 10000;
  var MATCH_FOUND_MS = 2800;
  var LEAGUE_REVEAL_MS = 2400;

  var root, leaguePhase, foundPhase, prepPhase;

  function $(id) {
    return document.getElementById(id);
  }

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function openRoot() {
    if (!root) return;
    root.classList.add('ndep-open');
    root.hidden = false;
    document.body.classList.add('nova-duel-epic-active');
    try {
      if (typeof hideWaitOverlay === 'function') hideWaitOverlay();
    } catch (_) {}
    var sel = $('duel-selection-screen');
    if (sel) sel.style.setProperty('display', 'none', 'important');
  }

  function closeOverlayOnly() {
    if (!root) return;
    root.classList.remove('ndep-open');
    root.hidden = true;
    [leaguePhase, foundPhase, prepPhase].forEach(function (p) {
      if (p) p.classList.remove('ndep-active');
    });
  }

  window.novaEpicHideAll = function novaEpicHideAll() {
    closeOverlayOnly();
    document.body.classList.remove('nova-duel-epic-active');
    window.__novaDuelPrepBlocking = false;
    window.__novaDuelPrepUntil = 0;
    stopEpicGameWatcher();
  };

  function tryLaunchDuelGame(d) {
    if (!d || !d.gameStarted) return false;
    if (!Array.isArray(d.questions) || d.questions.length < 10) return false;
    if (window.__novaDuelPrepBlocking) {
      window.__novaQueuedDuelStart = d;
      return false;
    }
    var ge = document.getElementById('duel-game-screen');
    if (ge && window.getComputedStyle(ge).display !== 'none') {
      window.novaEpicHideAll();
      return true;
    }
    if (typeof window.startDuelGame !== 'function') {
      console.warn('tryLaunchDuelGame: startDuelGame yok');
      return false;
    }
    window.__novaStartDuelGameLock = null;
    try {
      window.startDuelGame(d);
      return true;
    } catch (err) {
      console.error('startDuelGame hatası:', err);
      return false;
    }
  }

  function stopEpicGameWatcher() {
    try {
      if (typeof window.__novaEpicGameWatchUnsub === 'function') {
        window.__novaEpicGameWatchUnsub();
      }
    } catch (_) {}
    window.__novaEpicGameWatchUnsub = null;
  }

  window.novaEpicStartGameWatcher = function novaEpicStartGameWatcher(duelKey) {
    if (!window.database || !duelKey) return;
    stopEpicGameWatcher();
    var ref = window.database.ref('duels/' + duelKey);
    var handler = function (snap) {
      if (!snap.exists()) return;
      tryLaunchDuelGame(snap.val() || {});
    };
    ref.on('value', handler);
    window.__novaEpicGameWatchUnsub = function () {
      try {
        ref.off('value', handler);
      } catch (_) {}
    };
    ref.once('value').then(function (s) {
      if (s.exists()) tryLaunchDuelGame(s.val() || {});
    }).catch(function () {});
  };

  async function amDuelInviter(duelKey) {
    if (!window.selectedStudent || !window.database) return false;
    try {
      var snap = await window.database.ref('duels/' + duelKey).once('value');
      if (!snap.exists()) return false;
      var d = snap.val() || {};
      return (
        d.inviter &&
        String(d.inviter.studentId) === String(window.selectedStudent.studentId)
      );
    } catch (_) {
      return false;
    }
  }

  var _ndepPrepScaleBound = false;

  var NDEP_PREP_MOBILE_MAX = 520;
  var NDEP_PREP_DESIGN_W = 400;

  function ndepFitPrepScale() {
    if (!prepPhase || !prepPhase.classList.contains('ndep-active')) return;
    var shell = prepPhase.querySelector('.ndep-prep-shell');
    if (!shell) return;

    shell.style.transform = 'none';
    shell.style.transformOrigin = 'center center';

    var vw = window.innerWidth;
    var pad = 16;
    var availW = Math.max(280, vw - pad * 2);
    var availH = Math.max(360, window.innerHeight - pad * 2);

    if (vw > NDEP_PREP_MOBILE_MAX) {
      shell.style.width = '';
      shell.style.maxWidth = '';
      prepPhase.style.setProperty('--ndep-prep-scale', '1');
      return;
    }

    shell.style.width = NDEP_PREP_DESIGN_W + 'px';
    shell.style.maxWidth = NDEP_PREP_DESIGN_W + 'px';
    var w = shell.offsetWidth || NDEP_PREP_DESIGN_W;
    var h = shell.offsetHeight || 640;
    var scale = Math.min(1, availW / w, availH / h);
    scale = Math.max(0.58, Math.min(1, scale));
    if (scale >= 0.98) {
      shell.style.transform = 'none';
    } else {
      shell.style.transform = 'scale(' + scale + ')';
    }
    prepPhase.style.setProperty('--ndep-prep-scale', String(scale));
  }

  function ndepBindPrepScale() {
    if (_ndepPrepScaleBound) return;
    _ndepPrepScaleBound = true;
    window.addEventListener('resize', ndepFitPrepScale, { passive: true });
    window.addEventListener(
      'orientationchange',
      function () {
        setTimeout(ndepFitPrepScale, 80);
        setTimeout(ndepFitPrepScale, 280);
      },
      { passive: true }
    );
    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', ndepFitPrepScale, {
          passive: true,
        });
      }
    } catch (_) {}
  }

  function showPhase(phase) {
    [leaguePhase, foundPhase, prepPhase].forEach(function (p) {
      if (p) p.classList.toggle('ndep-active', p === phase);
    });
    openRoot();
    if (phase === prepPhase) {
      ndepBindPrepScale();
      requestAnimationFrame(ndepFitPrepScale);
      setTimeout(ndepFitPrepScale, 50);
      setTimeout(ndepFitPrepScale, 200);
    }
  }

  async function serverNow() {
    if (typeof window.novaGetServerTimeMs === 'function') {
      return window.novaGetServerTimeMs();
    }
    return Date.now();
  }

  async function resolveSyncEnterAt(duelKey, duelData) {
    var target = Number(duelData && duelData.syncEnterAt) || 0;
    if (!target && window.database && duelKey) {
      try {
        var s = await window.database.ref('duels/' + duelKey + '/syncEnterAt').once('value');
        if (s.exists()) target = Number(s.val()) || 0;
      } catch (_) {}
    }
    if (!target) {
      var created = Number(duelData && duelData.createdAt) || Date.now();
      target = created + MATCH_FOUND_MS;
    }
    return target;
  }

  async function resolvePrepEndAt(duelKey, duelData, syncEnterAt) {
    var end = Number(duelData && duelData.prepEndAt) || 0;
    if (!end && window.database && duelKey) {
      try {
        var s = await window.database.ref('duels/' + duelKey + '/prepEndAt').once('value');
        if (s.exists()) end = Number(s.val()) || 0;
      } catch (_) {}
    }
    if (!end) end = syncEnterAt + PREP_MS;
    return end;
  }

  async function fetchStudentExtras(classId, studentId) {
    var out = { battleHero: '', gameCup: 0, studentSnap: {} };
    if (!window.database || !classId || !studentId) return out;
    try {
      var ref = window.database.ref(
        'classes/' + classId + '/students/' + studentId
      );
      var snaps = await Promise.all([
        ref.child('battleHero').once('value'),
        ref.child('gameCup').once('value'),
        ref.child('purchasedBattleHeroes').once('value'),
        ref.child('heroLevel').once('value')
      ]);
      if (snaps[0].exists()) out.battleHero = String(snaps[0].val() || '').trim();
      if (snaps[1].exists()) out.gameCup = Number(snaps[1].val()) || 0;
      if (snaps[2].exists()) out.studentSnap.purchasedBattleHeroes = snaps[2].val() || {};
      if (snaps[3].exists()) out.studentSnap.heroLevel = snaps[3].val();
    } catch (_) {}
    return out;
  }

  function ndepIsEpicHero(heroId) {
    if (!heroId) return false;
    if (typeof window.novaIsEpicStoreHero === 'function') {
      return window.novaIsEpicStoreHero(heroId);
    }
    if (typeof window.novaIsEpicDragonHero === 'function') {
      return window.novaIsEpicDragonHero(heroId);
    }
    return /ejder|dragon|wyvern/i.test(String(heroId));
  }

  function ndepHeroLevel(studentSnap, heroId) {
    if (!heroId || !studentSnap) return 0;
    if (typeof window.novaGetHeroLevel === 'function') {
      return Math.max(0, Math.min(4, Number(window.novaGetHeroLevel(studentSnap, heroId)) || 0));
    }
    var pb = studentSnap.purchasedBattleHeroes || {};
    var row = pb[heroId];
    if (row && typeof row === 'object' && row.level != null) {
      return Math.max(0, Math.min(4, Number(row.level) || 0));
    }
    if (row && typeof row === 'number') return Math.max(0, Math.min(4, row));
    return 0;
  }

  function ndepRenderCups(el, cups) {
    if (!el) return;
    var n = Number(cups) || 0;
    el.innerHTML =
      '<div class="ndep-cups-card">' +
      '<span class="ndep-cup-ico" aria-hidden="true">🏆</span>' +
      '<span class="ndep-cup-val">' +
      String(n) +
      '</span>' +
      '<span class="ndep-cup-lbl">Kupa</span>' +
      '</div>';
  }

  function ndepMountHeroBadge(side, heroId, studentSnap) {
    var badgeHost = $('ndep-p' + side + '-hero-badge');
    if (!badgeHost) return;
    badgeHost.innerHTML = '';
    if (!heroId) return;

    if (ndepIsEpicHero(heroId)) {
      var slot = document.createElement('div');
      slot.className = 'ndep-hero-epic-slot';
      slot.setAttribute('data-epic-dragon-slot', '1');
      slot.setAttribute('data-hero-id', heroId);
      badgeHost.appendChild(slot);
      if (typeof window.novaEpicDragonBadgeMount === 'function') {
        requestAnimationFrame(function () {
          try {
            window.novaEpicDragonBadgeMount(slot, heroId, 'standard');
          } catch (_) {}
        });
        setTimeout(function () {
          try {
            window.novaEpicDragonBadgeMount(slot, heroId, 'standard');
          } catch (_) {}
        }, 200);
      }
      return;
    }

    var lvl = ndepHeroLevel(studentSnap, heroId);
    if (lvl > 0) {
      var stars = document.createElement('div');
      stars.className = 'ndep-hero-stars';
      stars.setAttribute('aria-label', 'Kahraman seviyesi ' + lvl);
      for (var i = 1; i <= 4; i++) {
        var s = document.createElement('span');
        s.className = 'ndep-hero-star' + (i <= lvl ? ' is-on' : '');
        s.textContent = '★';
        stars.appendChild(s);
      }
      badgeHost.appendChild(stars);
    }
  }

  function mountHero(host, heroId, studentSnap) {
    if (!host) return;
    host.innerHTML = '';
    host.classList.remove('ndep-has-hero', 'ndep-hero-epic');
    if (!heroId) {
      host.innerHTML =
        '<div class="ndep-hero-empty-wrap" aria-label="Kahraman yok">' +
        '<span class="ndep-hero-empty-silhouette" aria-hidden="true"></span>' +
        '<span class="ndep-hero-empty">Kahraman yok</span></div>';
      return;
    }
    host.classList.add('ndep-has-hero');
    if (ndepIsEpicHero(heroId)) host.classList.add('ndep-hero-epic');
    var stage = document.createElement('div');
    stage.className = 'ndep-hero-stage';
    var inner = document.createElement('div');
    inner.className = 'nova-hero-mount-host ndep-hero-mount';
    stage.appendChild(inner);
    host.appendChild(stage);
    try {
      if (typeof window.novaMountHeroInto === 'function') {
        window.novaMountHeroInto(inner, heroId);
      }
      var refit = function () {
        ndepFitHeroInBox(host, heroId);
      };
      requestAnimationFrame(refit);
      setTimeout(refit, 120);
      setTimeout(refit, 350);
      setTimeout(refit, 700);
    } catch (e) {
      console.warn('ndep mountHero', e);
    }
  }

  function ndepFitHeroInBox(host, heroId) {
    if (!host) return;
    var stage = host.querySelector('.ndep-hero-stage');
    var mount = host.querySelector('.ndep-hero-mount');
    if (!stage || !mount) return;
    var id = String(heroId || '');
    var epic = ndepIsEpicHero(id);
    var scale = epic ? 1.22 : 0.78;
    if (!epic) {
      if (id === 'firtina_okcu' || id === 'star_fairy' || id === 'tas_muhafiz' || id === 'golge_parsi') scale = 1.22;
      else if (id.indexOf('turbo') >= 0) scale = 0.68;
      else if (id.indexOf('fairy') >= 0 || id === 'star_fairy') scale = 0.74;
      else if (id.indexOf('robot') >= 0 || id === 'blaze_robot') scale = 0.76;
      else if (id.indexOf('wyvern') >= 0 || id.indexOf('mythic') >= 0) scale = 0.7;
    }
    stage.style.setProperty('--ndep-hero-scale', String(scale));
    mount.style.setProperty('--ndep-hero-scale', String(scale));
  }

  function ndepEnsurePrepTitle() {
    var main = $('ndep-prep-title-main');
    var sub = $('ndep-prep-title-sub');
    if (main) main.textContent = 'DÜELLO';
    if (sub) sub.textContent = 'HAZIRLIĞI';
    var heroesTitle = $('ndep-heroes-dock-title');
    if (heroesTitle) heroesTitle.textContent = 'KAHRAMANLAR';
  }

  function setAvatar(photoEl, photo, frame) {
    if (!photoEl) return;
    photoEl.src = photo || 'https://via.placeholder.com/80';
    photoEl.alt = '';
    try {
      if (typeof applyAvatarFrameToImage === 'function') {
        applyAvatarFrameToImage(photoEl, frame || 'default');
      }
    } catch (_) {}
  }

  function setName(el, name, frame) {
    if (!el) return;
    try {
      if (typeof setNameWithFrame === 'function') {
        setNameWithFrame(el, name || 'Oyuncu', frame || 'default');
      } else {
        el.textContent = name || 'Oyuncu';
      }
    } catch (_) {
      el.textContent = name || 'Oyuncu';
    }
  }

  async function populatePrepPlayers(duelKey, duelData) {
    var data = duelData || {};
    if (window.database && duelKey) {
      try {
        var snap = await window.database.ref('duels/' + duelKey).once('value');
        if (snap.exists()) data = snap.val() || data;
      } catch (_) {}
    }
    var inv = data.inviter || {};
    var in_ = data.invited || {};
    var mySid =
      window.selectedStudent && window.selectedStudent.studentId
        ? String(window.selectedStudent.studentId)
        : '';
    var meIsInviter = String(inv.studentId) === mySid;
    var left = meIsInviter ? inv : in_;
    var right = meIsInviter ? in_ : inv;

    var [exL, exR] = await Promise.all([
      fetchStudentExtras(left.classId, left.studentId),
      fetchStudentExtras(right.classId, right.studentId)
    ]);

    var cupsL = left.gameCup != null ? Number(left.gameCup) : exL.gameCup;
    var cupsR = right.gameCup != null ? Number(right.gameCup) : exR.gameCup;

    setAvatar($('ndep-pA-photo'), left.photo, left.avatarFrame);
    setAvatar($('ndep-pB-photo'), right.photo, right.avatarFrame);
    setName($('ndep-pA-name'), left.name, left.nameFrame);
    setName($('ndep-pB-name'), right.name, right.nameFrame);

    var tagA = $('ndep-pA-hero-tag');
    var tagB = $('ndep-pB-hero-tag');
    if (tagA) tagA.textContent = left.name || 'Sen';
    if (tagB) tagB.textContent = right.name || 'Rakip';

    ndepRenderCups($('ndep-pA-cups'), cupsL);
    ndepRenderCups($('ndep-pB-cups'), cupsR);

    var snapL = Object.assign({}, left, exL.studentSnap || {});
    var snapR = Object.assign({}, right, exR.studentSnap || {});
    var heroL = exL.battleHero || left.battleHero || '';
    var heroR = exR.battleHero || right.battleHero || '';
    mountHero($('ndep-pA-hero'), heroL, snapL);
    mountHero($('ndep-pB-hero'), heroR, snapR);
    ndepMountHeroBadge('A', heroL, snapL);
    ndepMountHeroBadge('B', heroR, snapR);

    try {
      window.__currentDuelData = data;
    } catch (_) {}
  }

  window.novaEpicShowLeagueReveal = async function novaEpicShowLeagueReveal(cups) {
    initDom();
    var c = Number(cups);
    if (!isFinite(c) || c < 0) c = 0;
    var league =
      typeof getLeagueFromCups === 'function' ? getLeagueFromCups(c) : 1;
    var badge = $('ndep-league-badge');
    var nameEl = $('ndep-league-name');
    if (badge) {
      if (typeof getRankHTML === 'function') {
        badge.innerHTML = getRankHTML(c, false);
      } else if (typeof getLeagueEmblemSvg === 'function') {
        badge.innerHTML = getLeagueEmblemSvg(league);
      }
    }
    if (nameEl && typeof getLeagueFullName === 'function') {
      var ligName = getLeagueFullName(league);
      try {
        nameEl.textContent = ligName.toLocaleUpperCase('tr-TR');
      } catch (_) {
        nameEl.textContent = ligName.toUpperCase();
      }
    }
    showPhase(leaguePhase);
    await sleep(LEAGUE_REVEAL_MS);
    closeOverlayOnly();
    document.body.classList.remove('nova-duel-epic-active');
  };

  window.novaEpicShowMatchFoundSync = async function novaEpicShowMatchFoundSync(
    duelKey,
    duelData
  ) {
    initDom();
    var syncAt = await resolveSyncEnterAt(duelKey, duelData);
    var mm = $('matchmakingScreen');
    if (mm) mm.style.display = 'none';
    showPhase(foundPhase);
    var countEl = $('ndep-found-count');
    while (true) {
      var now = await serverNow();
      var remain = Math.max(0, syncAt - now);
      var sec = Math.max(1, Math.ceil(remain / 1000));
      if (countEl) countEl.textContent = String(sec);
      if (remain <= 0) break;
      await sleep(200);
    }
  };

  window.novaEpicRunPrepCountdown = async function novaEpicRunPrepCountdown(
    duelKey,
    duelData
  ) {
    initDom();
    var syncAt = await resolveSyncEnterAt(duelKey, duelData);
    var prepEnd = await resolvePrepEndAt(duelKey, duelData, syncAt);

    window.__novaDuelPrepBlocking = true;
    window.__novaDuelPrepUntil = prepEnd;

    var mm = $('matchmakingScreen');
    if (mm) mm.style.display = 'none';

    await populatePrepPlayers(duelKey, duelData);
    ndepEnsurePrepTitle();
    ndepBindPrepScale();
    ndepFitPrepScale();

    if (typeof window.novaWaitUntilMs === 'function') {
      await window.novaWaitUntilMs(syncAt);
    } else {
      var w = Math.max(0, syncAt - Date.now());
      if (w > 0) await sleep(w);
    }

    showPhase(prepPhase);
    setTimeout(ndepFitPrepScale, 400);
    setTimeout(ndepFitPrepScale, 900);
    var ring = $('ndep-ring');
    var countEl = $('ndep-count');
    var total = Math.max(1000, prepEnd - syncAt);

    while (true) {
      var now = await serverNow();
      var remain = Math.max(0, prepEnd - now);
      var sec = Math.max(0, Math.ceil(remain / 1000));
      var pct = Math.min(100, ((total - remain) / total) * 100);
      if (countEl) {
        countEl.textContent = String(sec);
        if (sec <= 3) countEl.classList.add('ndep-count-urgent');
        else countEl.classList.remove('ndep-count-urgent');
      }
      if (ring) ring.style.setProperty('--ndep-pct', pct + '%');
      if (remain <= 0) break;
      await sleep(100);
    }

    var hint = document.querySelector('.ndep-prep-hint');
    if (hint) hint.textContent = 'Düello başlıyor…';
    var titleMain = $('ndep-prep-title-main');
    var titleSub = $('ndep-prep-title-sub');
    if (titleMain) titleMain.textContent = 'HAZIR';
    if (titleSub) titleSub.textContent = '!';
    /* Hazırlık katmanını hemen kapat — oyun yüklenirken arkada kalmasın */
    closeOverlayOnly();
    document.body.classList.remove('nova-duel-epic-active');
  };

  window.novaDuelPrepFinishAndLaunch = async function novaDuelPrepFinishAndLaunch(duelKey) {
    closeOverlayOnly();
    document.body.classList.remove('nova-duel-epic-active');
    window.__novaDuelPrepBlocking = false;
    window.__novaDuelPrepUntil = 0;
    window.novaEpicStartGameWatcher(duelKey);

    var launched = false;
    if (await amDuelInviter(duelKey)) {
      for (var attempt = 0; attempt < 5 && !launched; attempt++) {
        if (typeof window.novaEpicInviterCommitStart === 'function') {
          try {
            launched = !!(await window.novaEpicInviterCommitStart());
          } catch (e) {
            console.warn('novaEpicInviterCommitStart', e);
          }
        }
        if (!launched && typeof window.novaNudgeInviterStartDuel === 'function') {
          await window.novaNudgeInviterStartDuel();
        }
        if (!launched) await sleep(400);
        try {
          var snap0 = await window.database.ref('duels/' + duelKey).once('value');
          if (snap0.exists()) launched = tryLaunchDuelGame(snap0.val() || {});
        } catch (_) {}
      }
    }

    if (window.__novaQueuedDuelStart) {
      launched = tryLaunchDuelGame(window.__novaQueuedDuelStart) || launched;
      window.__novaQueuedDuelStart = null;
    }

    if (!launched && window.database && duelKey) {
      for (var i = 0; i < 50; i++) {
        try {
          var snap = await window.database.ref('duels/' + duelKey).once('value');
          if (!snap.exists()) break;
          if (tryLaunchDuelGame(snap.val() || {})) {
            launched = true;
            break;
          }
        } catch (_) {}
        await sleep(300);
      }
    }

    if (!launched) {
      var hint = document.querySelector('.ndep-prep-hint');
      if (hint) hint.textContent = 'Oyun yükleniyor, lütfen bekleyin…';
    }
  };

  function initDom() {
    root = $('nova-duel-epic-root');
    if (!root) return;
    leaguePhase = $('nova-duel-league-phase');
    foundPhase = $('nova-duel-found-phase');
    prepPhase = $('nova-duel-prep-phase');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDom);
  } else {
    initDom();
  }
})();
