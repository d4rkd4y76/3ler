/* Alev Bot — mağaza 5000 💎, tek kişilik doğru cevap FX */
(function () {
  var HERO_ID = 'blaze_robot';
  var HERO_NAME = 'Alev Bot';
  var HERO_DESC = 'Göğsünden alev fışkırtan eğlenceli savaş robotu. Doğru cevaplarda seni motive eder!';
  var HERO_COST = 5000;
  var heroCatalogCache = null;

  var MOTIVATE_LINES = [
    '🔥 {n}, tam isabet! Böyle devam!',
    '⭐ {n}, zekân parlıyor!',
    '💪 Harika cevap {n}!',
    '🚀 {n}, süpersin şampiyon!',
    '✨ Bravo {n}! İnanılmaz gidiyorsun!',
    '🏆 {n}, sen bu işi biliyorsun!',
    '🔥 Alev gibi güçlüsün {n}!'
  ];

  var EPIC_LINES = [
    '🔥 {n} — EFSANE CEVAP!',
    '⚡ {n}, MUHTEŞEM VURUŞ!',
    '👑 {n}, KRALİYORSUN!'
  ];
  var FIRE_LINES = [
    '💥 {n}, ALEV PATLAMASI!',
    '🔥 {n}, GÜÇ MODU AÇIK!',
    '⚡ {n}, ISINDIN!'
  ];

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
    if (Object.prototype.hasOwnProperty.call(data, 'battleHero')) {
      s.battleHero = data.battleHero || null;
    }
    try {
      window.selectedStudent = s;
      localStorage.setItem('selectedStudent', JSON.stringify(s));
    } catch (_) {}
  }

  function getEquippedHeroId() {
    var s = getStudent();
    return (s && s.battleHero) ? String(s.battleHero).trim() : '';
  }

  function isMainScreenVisible() {
    var main = document.getElementById('main-screen');
    if (!main) return false;
    try {
      var st = window.getComputedStyle(main);
      return st.display !== 'none' && st.visibility !== 'hidden';
    } catch (_) {
      return main.style.display !== 'none';
    }
  }

  async function loadBattleHeroFromDb() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || typeof database === 'undefined') return '';
    try {
      var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId + '/battleHero').once('value');
      var heroId = snap.exists() ? String(snap.val() || '').trim() : '';
      syncHeroToStudent({ battleHero: heroId || null });
      return heroId;
    } catch (e) {
      console.warn('loadBattleHeroFromDb', e);
      return getEquippedHeroId();
    }
  }

  function clearMainHeroSlot(slot) {
    var zone = document.getElementById('nova-main-hero-zone');
    if (zone) {
      zone.classList.remove('is-visible', 'nova-main-hero-zone--blaze');
      zone.setAttribute('aria-hidden', 'true');
    }
    if (!slot) slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return;
    slot.innerHTML = '';
    slot.classList.remove('nova-main-hero-slot--blaze');
  }

  function mountMainScreenHero(heroId) {
    var zone = document.getElementById('nova-main-hero-zone');
    var slot = document.getElementById('nova-main-hero-slot');
    if (!zone || !slot) return;
    clearMainHeroSlot(slot);
    if (!heroId || heroId !== HERO_ID) return;
    if (!window.NOVA_BLAZE_BOT_SVG_TEMPLATE) return;
    zone.setAttribute('aria-hidden', 'false');
    zone.classList.add('is-visible', 'nova-main-hero-zone--blaze');
    slot.classList.add('nova-main-hero-slot--blaze');
    var host = document.createElement('div');
    host.className = 'nova-hero-svg-host nova-main-hero-host';
    host.setAttribute('data-nova-main-hero', heroId);
    slot.appendChild(host);
    mountHeroInto(host);
  }

  async function refreshMainScreenHero() {
    var slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return;
    if (!isMainScreenVisible()) return;
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) {
      clearMainHeroSlot(slot);
      return;
    }
    var heroId = getEquippedHeroId();
    if (!heroId) heroId = await loadBattleHeroFromDb();
    if (!heroId) {
      clearMainHeroSlot(slot);
      return;
    }
    if (heroId === HERO_ID) {
      try {
        var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value');
        var data = snap.val() || {};
        if (!ownsHero(data) || data.battleHero !== HERO_ID) {
          clearMainHeroSlot(slot);
          return;
        }
      } catch (_) {
        clearMainHeroSlot(slot);
        return;
      }
    } else {
      clearMainHeroSlot(slot);
      return;
    }
    mountMainScreenHero(heroId);
  }

  function isHeroEquipped(data) {
    if (!data) {
      var s = getStudent();
      return !!(s && s.battleHero === HERO_ID);
    }
    return data.battleHero === HERO_ID;
  }

  function ownsHero(data, heroId) {
    var id = heroId || HERO_ID;
    return !!(data && data.purchasedBattleHeroes && data.purchasedBattleHeroes[id]);
  }

  async function loadHeroCatalogFromDB() {
    if (heroCatalogCache) return heroCatalogCache;
    try {
      if (typeof database !== 'undefined') {
        var snap = await database.ref('store/battleHeroes').once('value');
        var val = snap.val() || {};
        var list = Object.keys(val).map(function (k) {
          var h = val[k] || {};
          if (h.active === false) return null;
          return {
            id: k,
            name: String(h.name || k),
            price: Math.max(0, Number(h.price) || 0),
            desc: String(h.desc || ''),
            order: Number(h.order) || 1e9
          };
        }).filter(Boolean);
        list.sort(function (a, b) { return a.order - b.order; });
        if (list.length) {
          heroCatalogCache = list;
          return list;
        }
      }
    } catch (e) {
      console.warn('loadHeroCatalogFromDB', e);
    }
    heroCatalogCache = [{
      id: HERO_ID,
      name: HERO_NAME,
      price: HERO_COST,
      desc: HERO_DESC,
      order: 1
    }];
    return heroCatalogCache;
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

  function heroDisplayName() {
    var s = getStudent();
    var n = (s && s.studentName) ? String(s.studentName).trim() : '';
    if (!n) return 'Şampiyon';
    if (n.length > 14) return n.slice(0, 13) + '…';
    return n;
  }

  function pickCaption(variant) {
    var name = heroDisplayName();
    var pool = MOTIVATE_LINES;
    if (variant === 'epic') pool = EPIC_LINES;
    else if (variant === 'fire') pool = FIRE_LINES;
    var line = pool[correctFxCount % pool.length];
    return String(line).replace(/\{n\}/g, name);
  }

  function pickVariant() {
    var n = correctFxCount;
    if (n % 3 === 0) return 'epic';
    if (n % 2 === 0) return 'fire';
    return 'cheer';
  }

  function hideArena(arena) {
    if (!arena) arena = document.getElementById('nova-sp-hero-arena');
    if (!arena) return;
    arena.classList.remove('is-active', 'is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show');
    arena.setAttribute('aria-hidden', 'true');
    var host = arena.querySelector('.nova-sp-hero-arena__host');
    if (host) {
      host.classList.remove('nova-sp-fx-live', 'nova-sp-fx-epic', 'nova-sp-fx-fire', 'nova-sp-fx-cheer');
      host.innerHTML = '';
    }
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
    var host = arena.querySelector('.nova-sp-hero-arena__host');
    return waitMs(40).then(function () {
      arena.classList.add('is-centered', 'is-caption-show');
      if (host) {
        host.classList.add('nova-sp-fx-live', 'nova-sp-fx-' + variant);
      }
      return waitMs(400);
    }).then(function () {
      spawnArenaFx(arena, variant);
      if (variant === 'epic') setTimeout(triggerGameShake, 260);
      else if (variant === 'fire') setTimeout(triggerGameShake, 300);
      return waitMs(850);
    }).then(function () {
      if (host) {
        host.classList.remove('nova-sp-fx-live', 'nova-sp-fx-epic', 'nova-sp-fx-fire', 'nova-sp-fx-cheer');
      }
      return waitMs(180);
    }).then(function () {
      arena.classList.remove('is-centered', 'is-caption-show', 'is-slamming', 'is-epic');
      arena.classList.add('is-exiting');
      return waitMs(440);
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
    return '<div class="nova-hero-preview nova-hero-preview--store-live">'
      + '<div class="nova-hero-svg-host" data-nova-hero-host="1"></div>'
      + '</div>';
  }

  async function purchaseBattleHero(hero) {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || !hero) {
      await showAlert('Önce giriş yapmalısın.');
      return false;
    }
    var heroId = hero.id;
    var cost = Number(hero.price) || HERO_COST;
    var heroName = hero.name || HERO_NAME;
    try {
      var ref = database.ref('classes/' + s.classId + '/students/' + s.studentId);
      var snap = await ref.once('value');
      var userData = snap.val() || {};
      var diamonds = Number(userData.diamond) || 0;
      if (ownsHero(userData, heroId)) {
        await showAlert('Bu kahraman zaten sende var.');
        return false;
      }
      if (diamonds < cost) {
        await showAlert('Yeterli elmasın yok! ' + cost + ' 💎 gerekli.');
        return false;
      }
      var ok = await showConfirmation(cost + ' 💎 karşılığında ' + heroName + ' satın alınsın mı?');
      if (!ok) return false;

      await ref.update({
        diamond: diamonds - cost,
        ['purchasedBattleHeroes/' + heroId]: true
      });
      try {
        var el = document.getElementById('diamond-value');
        if (el) el.textContent = diamonds - cost;
        var cur = document.getElementById('currentDiamonds');
        if (cur) cur.textContent = diamonds - cost;
      } catch (_) {}
      if (s) {
        s.diamond = diamonds - cost;
        if (!s.purchasedBattleHeroes) s.purchasedBattleHeroes = {};
        s.purchasedBattleHeroes[heroId] = true;
        try {
          window.selectedStudent = s;
          localStorage.setItem('selectedStudent', JSON.stringify(s));
        } catch (_) {}
      }
      await showAlert('🔥 ' + heroName + ' artık senin! Mağazadan Kullan ile aktif et.');
      return true;
    } catch (e) {
      console.error('purchaseBattleHero', e);
      await showAlert('Satın alma sırasında hata oluştu.');
      return false;
    }
  }

  async function equipBattleHero(hero) {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || !hero) return;
    var heroId = hero.id;
    var heroName = hero.name || HERO_NAME;
    try {
      await database.ref('classes/' + s.classId + '/students/' + s.studentId).update({ battleHero: heroId });
      syncHeroToStudent({ battleHero: heroId });
      try { refreshMainScreenHero(); } catch (_) {}
      await showAlert('🔥 ' + heroName + ' aktif! Doğru cevaplarda ortaya gelip seni motive eder.');
    } catch (e) {
      console.error('equipBattleHero', e);
      await showAlert('Kahraman seçilemedi.');
    }
  }

  function renderHeroStoreCard(hero, userData, container, index) {
    if (hero.id !== HERO_ID) return;
    var owned = ownsHero(userData, hero.id);
    var equipped = userData && userData.battleHero === hero.id;
    var diamonds = Number(userData && userData.diamond) || 0;
    var cost = Number(hero.price) || HERO_COST;

    var card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card nova-hero-store-card nova-hero-store-card--blaze';
    card.style.animationDelay = (index * 0.06) + 's';
    card.innerHTML =
      heroPreviewHtml()
      + '<div class="nova-hero-store-meta">'
      + '<h4 class="nova-hero-store-name">' + (hero.name || HERO_NAME) + '</h4>'
      + '<p class="nova-hero-store-desc">' + (hero.desc || HERO_DESC) + '</p>'
      + '</div>'
      + '<div class="profile-photo-price">'
      + (owned
        ? '<span class="purchased-badge">Sende var</span>'
        : '<span class="purchased-badge nova-hero-diamond-price">💎 ' + cost + '</span>')
      + '</div>'
      + '<button type="button" class="profile-photo-button"></button>';

    var btn = card.querySelector('.profile-photo-button');
    if (!owned) {
      btn.className = 'profile-photo-button buy-button';
      btn.textContent = diamonds >= cost ? 'Satın Al' : 'Elmas yetersiz';
      btn.disabled = diamonds < cost;
      btn.onclick = async function () {
        if (await purchaseBattleHero(hero)) await novaRenderBattleHeroStore();
      };
    } else if (equipped) {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullanımda';
      btn.disabled = true;
    } else {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullan';
      btn.onclick = async function () {
        await equipBattleHero(hero);
        await novaRenderBattleHeroStore();
      };
    }
    container.appendChild(card);
    var host = card.querySelector('[data-nova-hero-host]');
    mountHeroInto(host);
  }

  async function novaRenderBattleHeroStore() {
    if (typeof getStoreStudentData !== 'function') return;
    var container = document.getElementById('profilePhotosContainer');
    var duelStore = document.getElementById('duelCreditsStore');
    if (duelStore) duelStore.style.display = 'none';
    if (!container) return;
    container.style.display = 'grid';
    container.innerHTML = '';

    var catalog = await loadHeroCatalogFromDB();
    var userData = await getStoreStudentData(true);
    if (!catalog.length) {
      container.innerHTML = '<div class="no-champion">Henüz kahraman eklenmedi</div>';
      return;
    }
    catalog.forEach(function (hero, i) {
      renderHeroStoreCard(hero, userData, container, i);
    });
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
      try { refreshMainScreenHero(); } catch (_) {}
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

  function patchMainScreenHeroHooks() {
    if (typeof applyOwnNameFrame === 'function' && !applyOwnNameFrame.__novaHeroPatched) {
      var origApply = applyOwnNameFrame;
      window.applyOwnNameFrame = function () {
        origApply();
        try { refreshMainScreenHero(); } catch (_) {}
      };
      window.applyOwnNameFrame.__novaHeroPatched = true;
    }
    var main = document.getElementById('main-screen');
    if (main && !main.__novaHeroObs) {
      var obs = new MutationObserver(function () {
        if (isMainScreenVisible()) refreshMainScreenHero();
        else clearMainHeroSlot(document.getElementById('nova-main-hero-slot'));
      });
      obs.observe(main, { attributes: true, attributeFilter: ['style', 'class'] });
      main.__novaHeroObs = obs;
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
    patchLoadProfilePhotos();
    patchStudentDataLoad();
    patchSpGameOpen();
    patchMainScreenHeroHooks();
    try { refreshMainScreenHero(); } catch (_) {}
  }

  window.novaTryPlayBattleHeroFx = novaTryPlayBattleHeroFx;
  window.novaTryPlayKnightCorrectFx = novaTryPlayBattleHeroFx;
  window.novaRefreshMainScreenHero = refreshMainScreenHero;
  window.NOVA_BATTLE_HERO_ID = HERO_ID;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  setTimeout(boot, 800);
})();
