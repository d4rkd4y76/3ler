/* Demir Şövalye — oyun altında canlı kılıç vuruşu (PNG yok, fetch yok) */
(function () {
  var HERO_ID = 'knight_champion';
  var HERO_NAME = 'Demir Şövalye';
  var HERO_DESC = 'Doğru cevapta kılıcı kaldırır ve yere vurur — gerçek hareket animasyonu.';

  var fxBusy = false;
  var correctFxCount = 0;
  var arenaMounted = false;
  var uidSeq = 0;

  var ARM_ORIGIN = '158px 158px';
  var SLAM_KEYFRAMES = [
    { t: 0, arm: -108, torso: 0, ty: 0 },
    { t: 0.32, arm: -12, torso: -4, ty: -6 },
    { t: 0.52, arm: 72, torso: 10, ty: 8 },
    { t: 0.68, arm: 58, torso: 5, ty: 4 },
    { t: 1, arm: 50, torso: 4, ty: 4 }
  ];

  function getStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) {
        return selectedStudent;
      }
      return JSON.parse(localStorage.getItem('selectedStudent') || 'null');
    } catch (_) {
      return null;
    }
  }

  function syncHeroToStudent(data) {
    var s = getStudent();
    if (!s || !data) return;
    s.battleHero = data.battleHero || null;
    try {
      window.selectedStudent = s;
      localStorage.setItem('selectedStudent', JSON.stringify(s));
    } catch (_) {}
  }

  function isKnightEquipped(data) {
    if (!data) {
      var s = getStudent();
      return !!(s && s.battleHero === HERO_ID);
    }
    return data.battleHero === HERO_ID;
  }

  function ownsKnight(data) {
    return !!(data && data.purchasedBattleHeroes && data.purchasedBattleHeroes[HERO_ID]);
  }

  function buildKnightSvgHtml() {
    var uid = 'k' + ++uidSeq;
    var raw = window.NOVA_KNIGHT_SVG_TEMPLATE || '';
    if (!raw) return '';
    return raw.split('__UID__').join(uid).replace('<svg ', '<svg class="nova-knight-svg" ');
  }

  function mountKnightInto(host) {
    if (!host) return null;
    var html = buildKnightSvgHtml();
    host.innerHTML = html;
    var svg = host.querySelector('svg');
    if (!svg) return null;
    var arm = svg.querySelector('.nova-knight-svg__arm');
    if (arm) {
      arm.style.transformOrigin = ARM_ORIGIN;
      arm.style.transform = 'rotate(-108deg)';
    }
    return svg;
  }

  function lerpKeyframes(frames, t) {
    var i = 0;
    while (i < frames.length - 2 && t > frames[i + 1].t) i++;
    var a = frames[i];
    var b = frames[i + 1];
    var span = b.t - a.t || 1;
    var n = (t - a.t) / span;
    return {
      arm: a.arm + (b.arm - a.arm) * n,
      torso: a.torso + (b.torso - a.torso) * n,
      ty: a.ty + (b.ty - a.ty) * n
    };
  }

  function runSlamAnimation(svg, done) {
    if (!svg) {
      if (done) done();
      return;
    }
    var arm = svg.querySelector('.nova-knight-svg__arm');
    var torso = svg.querySelector('.nova-knight-svg__torso');
    var sparks = svg.querySelector('.nova-knight-svg__sparks');
    var glint = svg.querySelector('.nova-knight-svg__blade-glint');
    var start = performance.now();
    var duration = 920;

    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var v = lerpKeyframes(SLAM_KEYFRAMES, t);
      if (arm) arm.style.transform = 'rotate(' + v.arm + 'deg)';
      if (torso) torso.style.transform = 'translateY(' + v.ty + 'px) rotate(' + (v.torso * 0.35) + 'deg)';
      if (t >= 0.48 && sparks) sparks.setAttribute('opacity', '1');
      if (t >= 0.5 && t <= 0.62 && glint) glint.setAttribute('opacity', '1');
      if (t > 0.65 && glint) glint.setAttribute('opacity', '0');
      if (t < 1) {
        requestAnimationFrame(frame);
      } else if (done) {
        done();
      }
    }
    if (sparks) sparks.setAttribute('opacity', '0');
    if (glint) glint.setAttribute('opacity', '0');
    if (arm) arm.style.transform = 'rotate(-108deg)';
    if (torso) torso.style.transform = 'translateY(0)';
    requestAnimationFrame(frame);
  }

  function runIdleAnimation(svg) {
    if (!svg || svg.__idleRunning) return;
    var arm = svg.querySelector('.nova-knight-svg__arm');
    if (!arm) return;
    svg.__idleRunning = true;
    arm.style.transformOrigin = ARM_ORIGIN;
    var start = performance.now();
    function breathe(now) {
      if (!svg.isConnected) {
        svg.__idleRunning = false;
        return;
      }
      var t = (now - start) / 1000;
      var deg = -22 + Math.sin(t * 1.8) * 14;
      arm.style.transform = 'rotate(' + deg + 'deg)';
      requestAnimationFrame(breathe);
    }
    requestAnimationFrame(breathe);
  }

  function waitMs(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function hideArena(arena) {
    if (!arena) arena = document.getElementById('nova-sp-knight-arena');
    if (!arena) return;
    arena.classList.remove(
      'is-active', 'is-centered', 'is-exiting',
      'is-slamming', 'is-caption-show'
    );
    arena.setAttribute('aria-hidden', 'true');
    var host = arena.querySelector('.nova-sp-knight-arena__host');
    if (host) host.innerHTML = '';
    arenaMounted = false;
  }

  function ensureArena() {
    var arena = document.getElementById('nova-sp-knight-arena');
    if (!arena) {
      arena = document.createElement('div');
      arena.id = 'nova-sp-knight-arena';
      arena.className = 'nova-sp-knight-arena';
      arena.setAttribute('aria-hidden', 'true');
      arena.innerHTML =
        '<div class="nova-sp-knight-arena__veil"></div>'
        + '<div class="nova-sp-knight-arena__inner">'
        + '<p class="nova-sp-knight-arena__caption"></p>'
        + '<div class="nova-sp-knight-arena__host"></div>'
        + '<div class="nova-sp-knight-arena__ground-flash"></div>'
        + '<div class="nova-sp-knight-arena__shockwave"></div>'
        + '</div>';
      document.body.appendChild(arena);
    }
    return arena;
  }

  function refreshSpKnightArena() {
    ensureArena();
    hideArena();
  }

  function spawnArenaHit(arena) {
    if (!arena) return;
    arena.classList.remove('is-slamming');
    void arena.offsetWidth;
    arena.classList.add('is-slamming');
    setTimeout(function () {
      arena.classList.remove('is-slamming');
    }, 1100);
  }

  function triggerGameShake() {
    var game = document.getElementById('single-player-game-screen');
    if (!game) return;
    game.classList.remove('nova-sp-game-shake');
    void game.offsetWidth;
    game.classList.add('nova-sp-game-shake');
    setTimeout(function () {
      game.classList.remove('nova-sp-game-shake');
    }, 450);
  }

  function isSinglePlayerGameVisible() {
    var el = document.getElementById('single-player-game-screen');
    if (!el) return false;
    try {
      var st = window.getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden';
    } catch (_) {
      return el.style.display === 'flex';
    }
  }

  function playKnightFx(variant) {
    return new Promise(function (resolve) {
      if (fxBusy || !isSinglePlayerGameVisible()) {
        resolve();
        return;
      }
      var arena = ensureArena();
      var host = arena.querySelector('.nova-sp-knight-arena__host');
      var cap = arena.querySelector('.nova-sp-knight-arena__caption');
      var svg = mountKnightInto(host);
      if (!svg) {
        resolve();
        return;
      }
      if (svg.__idleRunning) svg.__idleRunning = false;

      fxBusy = true;
      if (cap) cap.textContent = variant === 'victory' ? 'ZAFER!' : 'GÜÇLÜ VURUŞ!';

      arena.setAttribute('aria-hidden', 'false');
      arena.classList.add('is-active');
      hideArenaClasses(arena, ['is-centered', 'is-exiting', 'is-slamming', 'is-caption-show']);

      runKnightSequence(arena, svg, variant).then(function () {
        hideArena(arena);
        fxBusy = false;
        resolve();
      });
    });
  }

  function hideArenaClasses(arena, list) {
    list.forEach(function (c) { arena.classList.remove(c); });
  }

  function runKnightSequence(arena, svg, variant) {
    return waitMs(60).then(function () {
      arena.classList.add('is-centered', 'is-caption-show');
      return waitMs(500);
    }).then(function () {
      spawnArenaHit(arena);
      if (variant === 'slam') {
        setTimeout(triggerGameShake, 400);
        return new Promise(function (res) {
          runSlamAnimation(svg, res);
        });
      }
      var arm = svg.querySelector('.nova-knight-svg__arm');
      if (arm) {
        arm.style.transformOrigin = ARM_ORIGIN;
        arm.style.transform = 'rotate(-75deg)';
      }
      return waitMs(900);
    }).then(function () {
      return waitMs(280);
    }).then(function () {
      arena.classList.remove('is-centered', 'is-caption-show', 'is-slamming');
      arena.classList.add('is-exiting');
      return waitMs(520);
    });
  }

  async function novaTryPlayKnightCorrectFx() {
    try {
      if (typeof getStoreStudentData === 'function') {
        var data = await getStoreStudentData();
        if (!isKnightEquipped(data)) return;
      } else if (!isKnightEquipped()) {
        return;
      }
      correctFxCount++;
      var variant = correctFxCount % 3 === 0 ? 'victory' : 'slam';
      await playKnightFx(variant);
    } catch (e) {
      console.warn('knight fx', e);
    }
  }

  function knightPreviewHtml(idleClass) {
    return '<div class="nova-knight-preview' + (idleClass ? ' nova-knight-preview--idle' : '') + '">'
      + '<div class="nova-knight-svg-host" data-nova-knight-host="1"></div>'
      + '</div>';
  }

  async function grantKnightHero() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) {
      await showAlert('Önce giriş yapmalısın.');
      return false;
    }
    try {
      var ref = database.ref('classes/' + s.classId + '/students/' + s.studentId);
      await ref.child('purchasedBattleHeroes/' + HERO_ID).set(true);
      await showAlert('Ücretsiz kahraman sandığa eklendi!');
      return true;
    } catch (e) {
      console.error('grantKnight', e);
      await showAlert('Kahraman eklenirken hata oluştu.');
      return false;
    }
  }

  async function equipKnightHero() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) return;
    try {
      await database.ref('classes/' + s.classId + '/students/' + s.studentId).update({ battleHero: HERO_ID });
      syncHeroToStudent({ battleHero: HERO_ID });
      await showAlert('Demir Şövalye aktif! Doğru cevapta ortaya gelip kılıç vuruşu yapar.');
      refreshSpKnightArena();
    } catch (e) {
      console.error('equipKnight', e);
      await showAlert('Kahraman seçilemedi.');
    }
  }

  async function novaRenderBattleHeroStore() {
    if (typeof getStoreStudentData !== 'function') return;
    var container = document.getElementById('profilePhotosContainer');
    var duelStore = document.getElementById('duelCreditsStore');
    if (duelStore) duelStore.style.display = 'none';
    if (!container) return;
    container.style.display = 'grid';
    container.innerHTML = '';

    var userData = await getStoreStudentData(true);
    var owned = ownsKnight(userData);
    var equipped = isKnightEquipped(userData);

    var card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card nova-hero-store-card';
    card.innerHTML =
      knightPreviewHtml(true)
      + '<div class="nova-hero-store-meta">'
      + '<h4 class="nova-hero-store-name">' + HERO_NAME + '</h4>'
      + '<p class="nova-hero-store-desc">' + HERO_DESC + '</p>'
      + '</div>'
      + '<div class="profile-photo-price">'
      + (owned ? '<span class="purchased-badge">Ücretsiz — Sende var</span>' : '<span class="purchased-badge">Ücretsiz</span>')
      + '</div>'
      + '<button type="button" class="profile-photo-button"></button>';

    var btn = card.querySelector('.profile-photo-button');
    if (!owned) {
      btn.className = 'profile-photo-button buy-button';
      btn.textContent = 'Ücretsiz Al';
      btn.onclick = async function () {
        if (await grantKnightHero()) await novaRenderBattleHeroStore();
      };
    } else if (equipped) {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullanımda';
      btn.disabled = true;
    } else {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullan';
      btn.onclick = async function () {
        await equipKnightHero();
        await novaRenderBattleHeroStore();
      };
    }
    container.appendChild(card);
    var host = card.querySelector('[data-nova-knight-host]');
    var svg = mountKnightInto(host);
    if (svg) runIdleAnimation(svg);
  }

  function patchStoreCategoryButtons() {
    var orig = window.renderStoreCategoryButtons;
    if (!orig || orig.__novaKnightPatched) return;
    window.renderStoreCategoryButtons = function () {
      orig();
      var area = document.querySelector('.profile-categories');
      if (!area || area.querySelector('[data-category="__battleHeroes"]')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-button';
      btn.dataset.category = '__battleHeroes';
      btn.textContent = 'Kahramanlar';
      btn.title = 'Savaş kahramanları';
      btn.addEventListener('click', function () {
        document.querySelectorAll('.category-button').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        var duelStore = document.getElementById('duelCreditsStore');
        var photosContainer = document.getElementById('profilePhotosContainer');
        if (duelStore) duelStore.style.display = 'none';
        if (photosContainer) photosContainer.style.display = 'grid';
        if (typeof loadProfilePhotos === 'function') loadProfilePhotos('__battleHeroes');
      });
      var anchor = area.querySelector('[data-category="__avatarFrames"]');
      if (anchor && anchor.nextSibling) area.insertBefore(btn, anchor.nextSibling);
      else area.appendChild(btn);
    };
    window.renderStoreCategoryButtons.__novaKnightPatched = true;
  }

  function patchLoadProfilePhotos() {
    if (typeof loadProfilePhotos !== 'function' || loadProfilePhotos.__novaKnightPatched) return;
    var orig = loadProfilePhotos;
    window.loadProfilePhotos = async function (category) {
      if (category === '__battleHeroes') return novaRenderBattleHeroStore();
      return orig.apply(this, arguments);
    };
    window.loadProfilePhotos.__novaKnightPatched = true;
  }

  function patchStudentDataLoad() {
    if (typeof getStoreStudentData !== 'function' || getStoreStudentData.__novaKnightPatched) return;
    var orig = getStoreStudentData;
    window.getStoreStudentData = async function (force) {
      var data = await orig.apply(this, arguments);
      syncHeroToStudent(data);
      return data;
    };
    window.getStoreStudentData.__novaKnightPatched = true;
  }

  function patchSpGameOpen() {
    var open = window.novaOpenSinglePlayerGameScreen;
    if (!open || open.__novaKnightPatched) return;
    window.novaOpenSinglePlayerGameScreen = function () {
      open.apply(this, arguments);
      hideArena();
    };
    window.novaOpenSinglePlayerGameScreen.__novaKnightPatched = true;

    var close = window.novaCloseSinglePlayerGameScreen;
    if (close && !close.__novaKnightPatched) {
      window.novaCloseSinglePlayerGameScreen = function () {
        close.apply(this, arguments);
        hideArena();
      };
      window.novaCloseSinglePlayerGameScreen.__novaKnightPatched = true;
    }
  }

  function boot() {
    try {
      if (typeof photoCategories === 'object' && photoCategories) {
        photoCategories.__battleHeroes = photoCategories.__battleHeroes || [];
      }
    } catch (_) {}
    patchStoreCategoryButtons();
    patchLoadProfilePhotos();
    patchStudentDataLoad();
    patchSpGameOpen();
    var oldFx = document.getElementById('nova-knight-fx-root');
    if (oldFx) oldFx.remove();
  }

  window.novaTryPlayKnightCorrectFx = novaTryPlayKnightCorrectFx;
  window.novaRefreshSpKnightArena = refreshSpKnightArena;
  window.NOVA_KNIGHT_HERO_ID = HERO_ID;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  setTimeout(boot, 800);
})();
