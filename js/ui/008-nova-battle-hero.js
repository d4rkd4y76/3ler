/* Alev Bot — mağaza 5000 💎, tek kişilik doğru cevap FX */
(function () {
  var HERO_ID = 'blaze_robot';
  var HERO_NAME = 'Alev Bot';
  var HERO_DESC = 'Göğsünden alev fışkırtan eğlenceli savaş robotu. Doğru cevaplarda seni motive eder!';
  var HERO_COST = 5000;

  var MOTIVATE_LINES = [
    'Muhteşemsin, devam!',
    'Harika cevap!',
    'Süpersin şampiyon!',
    'Zekân parlıyor!',
    'Bravo, böyle devam!',
    'İnanılmaz gidiyorsun!',
    'Alev gibi güçlüsün!'
  ];

  var EPIC_LINES = ['EPİK VURUŞ!', 'MUHTEŞEM!', 'EFSANE!'];
  var FIRE_LINES = ['ALEV PATLAMASI!', 'GÜÇ MODU!', 'ISINDI!'];

  var fxBusy = false;
  var correctFxCount = 0;
  var uidSeq = 0;

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

  function isHeroEquipped(data) {
    if (!data) {
      var s = getStudent();
      return !!(s && s.battleHero === HERO_ID);
    }
    return data.battleHero === HERO_ID;
  }

  function ownsHero(data) {
    return !!(data && data.purchasedBattleHeroes && data.purchasedBattleHeroes[HERO_ID]);
  }

  function buildHeroSvgHtml() {
    var uid = 'b' + ++uidSeq;
    var raw = window.NOVA_BLAZE_BOT_SVG_TEMPLATE || '';
    if (!raw) return '';
    return raw.split('__UID__').join(uid).replace('<svg ', '<svg class="nova-hero-svg" ');
  }

  function mountHeroInto(host) {
    if (!host) return null;
    host.innerHTML = buildHeroSvgHtml();
    return host.querySelector('svg');
  }

  function waitMs(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function pickCaption(variant) {
    if (variant === 'epic') return EPIC_LINES[correctFxCount % EPIC_LINES.length];
    if (variant === 'fire') return FIRE_LINES[correctFxCount % FIRE_LINES.length];
    return MOTIVATE_LINES[correctFxCount % MOTIVATE_LINES.length];
  }

  function pickVariant() {
    var n = correctFxCount;
    if (n % 3 === 0) return 'epic';
    if (n % 2 === 0) return 'fire';
    return 'cheer';
  }

  function runFireBurst(svg, done) {
    var core = svg.querySelector('.nova-hero__core');
    var glow = svg.querySelector('.nova-hero__core-glow');
    var flames = svg.querySelector('.nova-hero__flames');
    var armL = svg.querySelector('.nova-hero__arm-l');
    var armR = svg.querySelector('.nova-hero__arm-r');
    var start = performance.now();
    var dur = 1000;

    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var pulse = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.55;
      if (core) core.setAttribute('r', String(22 + pulse * 6));
      if (glow) glow.setAttribute('opacity', String(pulse * 0.55));
      if (flames) flames.setAttribute('opacity', String(t < 0.2 ? 0 : Math.min(1, (t - 0.15) * 2) * (1 - Math.max(0, t - 0.75) * 3)));
      if (armL) armL.style.transform = 'rotate(' + (-8 - pulse * 18) + 'deg)';
      if (armR) armR.style.transform = 'rotate(' + (8 + pulse * 18) + 'deg)';
      if (t < 1) requestAnimationFrame(frame);
      else if (done) done();
    }
    if (flames) flames.setAttribute('opacity', '0');
    if (glow) glow.setAttribute('opacity', '0');
    if (armL) armL.style.transformOrigin = '88px 168px';
    if (armR) armR.style.transformOrigin = '152px 168px';
    requestAnimationFrame(frame);
  }

  function runCheer(svg, done) {
    var head = svg.querySelector('.nova-hero__head');
    var armL = svg.querySelector('.nova-hero__arm-l');
    var armR = svg.querySelector('.nova-hero__arm-r');
    var start = performance.now();
    var dur = 880;
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var w = Math.sin(t * Math.PI * 4);
      if (head) head.style.transform = 'rotate(' + (w * 4) + 'deg)';
      if (armL) armL.style.transform = 'rotate(' + (-28 + w * 12) + 'deg)';
      if (armR) armR.style.transform = 'rotate(' + (28 - w * 12) + 'deg)';
      if (t < 1) requestAnimationFrame(frame);
      else if (done) done();
    }
    requestAnimationFrame(frame);
  }

  function runEpic(svg, done) {
    runFireBurst(svg, function () {
      var sparks = svg.querySelector('.nova-hero__sparks');
      if (sparks) sparks.setAttribute('opacity', '1');
      setTimeout(function () {
        if (sparks) sparks.setAttribute('opacity', '0');
        if (done) done();
      }, 320);
    });
  }

  function runIdleAnimation(svg) {
    if (!svg || svg.__idleRunning) return;
    svg.__idleRunning = true;
    var core = svg.querySelector('.nova-hero__core');
    var glow = svg.querySelector('.nova-hero__core-glow');
    var start = performance.now();
    function breathe(now) {
      if (!svg.isConnected) { svg.__idleRunning = false; return; }
      var t = (now - start) / 1000;
      var p = 0.5 + Math.sin(t * 2.2) * 0.5;
      if (core) core.setAttribute('r', String(20 + p * 3));
      if (glow) glow.setAttribute('opacity', String(p * 0.22));
      requestAnimationFrame(breathe);
    }
    requestAnimationFrame(breathe);
  }

  function hideArena(arena) {
    if (!arena) arena = document.getElementById('nova-sp-hero-arena');
    if (!arena) return;
    arena.classList.remove('is-active', 'is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show');
    arena.setAttribute('aria-hidden', 'true');
    var host = arena.querySelector('.nova-sp-hero-arena__host');
    if (host) host.innerHTML = '';
  }

  function ensureArena() {
    var arena = document.getElementById('nova-sp-hero-arena');
    if (!arena) {
      arena = document.createElement('div');
      arena.id = 'nova-sp-hero-arena';
      arena.className = 'nova-sp-hero-arena';
      arena.setAttribute('aria-hidden', 'true');
      arena.innerHTML =
        '<div class="nova-sp-hero-arena__veil"></div>'
        + '<div class="nova-sp-hero-arena__inner">'
        + '<p class="nova-sp-hero-arena__caption"></p>'
        + '<div class="nova-sp-hero-arena__host"></div>'
        + '<div class="nova-sp-hero-arena__burst"></div>'
        + '<div class="nova-sp-hero-arena__ring"></div>'
        + '</div>';
      document.body.appendChild(arena);
    }
    return arena;
  }

  function spawnArenaFx(arena, variant) {
    arena.classList.remove('is-slamming', 'is-epic');
    void arena.offsetWidth;
    arena.classList.add(variant === 'epic' ? 'is-epic' : 'is-slamming');
    setTimeout(function () {
      arena.classList.remove('is-slamming', 'is-epic');
    }, 1200);
  }

  function triggerGameShake() {
    var game = document.getElementById('single-player-game-screen');
    if (!game) return;
    game.classList.remove('nova-sp-game-shake');
    void game.offsetWidth;
    game.classList.add('nova-sp-game-shake');
    setTimeout(function () { game.classList.remove('nova-sp-game-shake'); }, 450);
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

  function playHeroFx(variant) {
    return new Promise(function (resolve) {
      if (fxBusy || !isSinglePlayerGameVisible()) { resolve(); return; }
      var arena = ensureArena();
      var host = arena.querySelector('.nova-sp-hero-arena__host');
      var cap = arena.querySelector('.nova-sp-hero-arena__caption');
      var svg = mountHeroInto(host);
      if (!svg) { resolve(); return; }
      if (svg.__idleRunning) svg.__idleRunning = false;

      fxBusy = true;
      if (cap) cap.textContent = pickCaption(variant);

      arena.setAttribute('aria-hidden', 'false');
      arena.classList.add('is-active');
      ['is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show'].forEach(function (c) {
        arena.classList.remove(c);
      });

      runHeroSequence(arena, svg, variant).then(function () {
        hideArena(arena);
        fxBusy = false;
        resolve();
      });
    });
  }

  function runHeroSequence(arena, svg, variant) {
    return waitMs(60).then(function () {
      arena.classList.add('is-centered', 'is-caption-show');
      return waitMs(480);
    }).then(function () {
      spawnArenaFx(arena, variant);
      if (variant === 'epic') setTimeout(triggerGameShake, 380);
      else if (variant === 'fire') setTimeout(triggerGameShake, 420);
      return new Promise(function (res) {
        if (variant === 'epic') runEpic(svg, res);
        else if (variant === 'fire') runFireBurst(svg, res);
        else runCheer(svg, res);
      });
    }).then(function () {
      return waitMs(260);
    }).then(function () {
      arena.classList.remove('is-centered', 'is-caption-show', 'is-slamming', 'is-epic');
      arena.classList.add('is-exiting');
      return waitMs(500);
    });
  }

  async function novaTryPlayBattleHeroFx() {
    try {
      if (typeof getStoreStudentData === 'function') {
        var data = await getStoreStudentData();
        if (!isHeroEquipped(data)) return;
      } else if (!isHeroEquipped()) {
        return;
      }
      correctFxCount++;
      await playHeroFx(pickVariant());
    } catch (e) {
      console.warn('battle hero fx', e);
    }
  }

  function heroPreviewHtml() {
    return '<div class="nova-hero-preview nova-hero-preview--idle">'
      + '<div class="nova-hero-svg-host" data-nova-hero-host="1"></div>'
      + '</div>';
  }

  async function purchaseBlazeHero() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) {
      await showAlert('Önce giriş yapmalısın.');
      return false;
    }
    try {
      var ref = database.ref('classes/' + s.classId + '/students/' + s.studentId);
      var snap = await ref.once('value');
      var userData = snap.val() || {};
      var diamonds = Number(userData.diamond) || 0;
      if (ownsHero(userData)) {
        await showAlert('Bu kahraman zaten sende var.');
        return false;
      }
      if (diamonds < HERO_COST) {
        await showAlert('Yeterli elmasın yok! ' + HERO_COST + ' 💎 gerekli.');
        return false;
      }
      var ok = await showConfirmation(
        HERO_COST + ' 💎 karşılığında ' + HERO_NAME + ' satın alınsın mı?'
      );
      if (!ok) return false;

      await ref.update({
        diamond: diamonds - HERO_COST,
        ['purchasedBattleHeroes/' + HERO_ID]: true
      });
      try {
        var el = document.getElementById('diamond-value');
        if (el) el.textContent = diamonds - HERO_COST;
        var cur = document.getElementById('currentDiamonds');
        if (cur) cur.textContent = diamonds - HERO_COST;
      } catch (_) {}
      if (s) {
        s.diamond = diamonds - HERO_COST;
        if (!s.purchasedBattleHeroes) s.purchasedBattleHeroes = {};
        s.purchasedBattleHeroes[HERO_ID] = true;
        try {
          window.selectedStudent = s;
          localStorage.setItem('selectedStudent', JSON.stringify(s));
        } catch (_) {}
      }
      await showAlert('🔥 ' + HERO_NAME + ' artık senin! Mağazadan Kullan ile aktif et.');
      return true;
    } catch (e) {
      console.error('purchaseBlazeHero', e);
      await showAlert('Satın alma sırasında hata oluştu.');
      return false;
    }
  }

  async function equipBlazeHero() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) return;
    try {
      await database.ref('classes/' + s.classId + '/students/' + s.studentId).update({ battleHero: HERO_ID });
      syncHeroToStudent({ battleHero: HERO_ID });
      await showAlert('🔥 ' + HERO_NAME + ' aktif! Doğru cevaplarda ortaya gelip seni motive eder.');
    } catch (e) {
      console.error('equipBlazeHero', e);
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
    var owned = ownsHero(userData);
    var equipped = isHeroEquipped(userData);
    var diamonds = Number(userData && userData.diamond) || 0;

    var card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card nova-hero-store-card nova-hero-store-card--blaze';
    card.innerHTML =
      heroPreviewHtml()
      + '<div class="nova-hero-store-meta">'
      + '<h4 class="nova-hero-store-name">' + HERO_NAME + '</h4>'
      + '<p class="nova-hero-store-desc">' + HERO_DESC + '</p>'
      + '</div>'
      + '<div class="profile-photo-price">'
      + (owned
        ? '<span class="purchased-badge">Sende var</span>'
        : '<span class="purchased-badge nova-hero-diamond-price">💎 ' + HERO_COST + '</span>')
      + '</div>'
      + '<button type="button" class="profile-photo-button"></button>';

    var btn = card.querySelector('.profile-photo-button');
    if (!owned) {
      btn.className = 'profile-photo-button buy-button';
      btn.textContent = diamonds >= HERO_COST ? 'Satın Al' : 'Elmas yetersiz';
      btn.disabled = diamonds < HERO_COST;
      btn.onclick = async function () {
        if (await purchaseBlazeHero()) await novaRenderBattleHeroStore();
      };
    } else if (equipped) {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullanımda';
      btn.disabled = true;
    } else {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullan';
      btn.onclick = async function () {
        await equipBlazeHero();
        await novaRenderBattleHeroStore();
      };
    }
    container.appendChild(card);
    var host = card.querySelector('[data-nova-hero-host]');
    var svg = mountHeroInto(host);
    if (svg) runIdleAnimation(svg);
  }

  function patchStoreCategoryButtons() {
    var orig = window.renderStoreCategoryButtons;
    if (!orig || orig.__novaHeroPatched) return;
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
        document.querySelectorAll('.category-button').forEach(function (b) { b.classList.remove('active'); });
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
    window.renderStoreCategoryButtons.__novaHeroPatched = true;
  }

  function patchLoadProfilePhotos() {
    if (typeof loadProfilePhotos !== 'function' || loadProfilePhotos.__novaHeroPatched) return;
    var orig = loadProfilePhotos;
    window.loadProfilePhotos = async function (category) {
      if (category === '__battleHeroes') return novaRenderBattleHeroStore();
      return orig.apply(this, arguments);
    };
    window.loadProfilePhotos.__novaHeroPatched = true;
  }

  function patchStudentDataLoad() {
    if (typeof getStoreStudentData !== 'function' || getStoreStudentData.__novaHeroPatched) return;
    var orig = getStoreStudentData;
    window.getStoreStudentData = async function (force) {
      var data = await orig.apply(this, arguments);
      syncHeroToStudent(data);
      return data;
    };
    window.getStoreStudentData.__novaHeroPatched = true;
  }

  function patchSpGameOpen() {
    var open = window.novaOpenSinglePlayerGameScreen;
    if (!open || open.__novaHeroPatched) return;
    window.novaOpenSinglePlayerGameScreen = function () {
      open.apply(this, arguments);
      hideArena();
    };
    window.novaOpenSinglePlayerGameScreen.__novaHeroPatched = true;
    var close = window.novaCloseSinglePlayerGameScreen;
    if (close && !close.__novaHeroPatched) {
      window.novaCloseSinglePlayerGameScreen = function () {
        close.apply(this, arguments);
        hideArena();
      };
      window.novaCloseSinglePlayerGameScreen.__novaHeroPatched = true;
    }
  }

  function boot() {
    try {
      if (typeof photoCategories === 'object' && photoCategories) {
        photoCategories.__battleHeroes = photoCategories.__battleHeroes || [];
      }
    } catch (_) {}
    var oldArena = document.getElementById('nova-sp-knight-arena');
    if (oldArena) oldArena.remove();
    patchStoreCategoryButtons();
    patchLoadProfilePhotos();
    patchStudentDataLoad();
    patchSpGameOpen();
  }

  window.novaTryPlayBattleHeroFx = novaTryPlayBattleHeroFx;
  window.novaTryPlayKnightCorrectFx = novaTryPlayBattleHeroFx;
  window.NOVA_BATTLE_HERO_ID = HERO_ID;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  setTimeout(boot, 800);
})();
