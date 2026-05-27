/* Savaş kahramanları — mağaza, ana ekran, tek kişilik doğru cevap FX */
(function () {
  var HERO_REGISTRY = {
    blaze_robot: {
      id: 'blaze_robot',
      templateKey: 'NOVA_BLAZE_BOT_SVG_TEMPLATE',
      theme: 'blaze',
      name: 'Alev Bot',
      desc: 'Göğsünden alev fışkırtan eğlenceli savaş robotu. Doğru cevaplarda seni motive eder!',
      price: 5000,
      order: 1,
      equipEmoji: '🔥',
      lines: {
        cheer: [
          '🔥 {n}, tam isabet! Böyle devam!',
          '⭐ {n}, zekân parlıyor!',
          '💪 Harika cevap {n}!',
          '🚀 {n}, süpersin şampiyon!',
          '✨ Bravo {n}! İnanılmaz gidiyorsun!',
          '🏆 {n}, sen bu işi biliyorsun!',
          '🔥 Alev gibi güçlüsün {n}!'
        ],
        fire: [
          '💥 {n}, ALEV PATLAMASI!',
          '🔥 {n}, GÜÇ MODU AÇIK!',
          '⚡ {n}, ISINDIN!'
        ],
        epic: [
          '🔥 {n} — EFSANE CEVAP!',
          '⚡ {n}, MUHTEŞEM VURUŞ!',
          '👑 {n}, KRALİYORSUN!'
        ]
      }
    },
    star_fairy: {
      id: 'star_fairy',
      templateKey: 'NOVA_STAR_FAIRY_SVG_TEMPLATE',
      theme: 'star',
      name: 'Yıldız Perisi',
      desc: 'Kozmik güçle seni kutlayan yıldız perisi. Doğru cevaplarda yıldız yağmuru ve sihirli motivasyon!',
      price: 6500,
      order: 2,
      equipEmoji: '✨',
      lines: {
        cheer: [
          '✨ {n}, yıldız gibi parladın!',
          '⭐ Harika cevap {n}! Evren seninle!',
          '💫 {n}, takımyıldızı kadar net!',
          '🌟 Bravo {n}! Işığın göz kamaştırıyor!',
          '✨ {n}, sihirli bir cevap!',
          '🪄 Muhteşem {n}, peri onayladı!',
          '⭐ {n}, gökyüzü seninle dans ediyor!'
        ],
        fire: [
          '💫 {n}, YILDIZ PATLAMASI!',
          '✨ {n}, KOZMİK GÜÇ AÇIK!',
          '⭐ {n}, IŞILDIYORSUN!'
        ],
        epic: [
          '✨ {n} — KOZMİK ZAFER!',
          '🌟 {n}, GALAKSİ SEVİYESİ!',
          '👑 {n}, YILDIZLARIN KRALİÇESİ!'
        ]
      }
    },
    turbo_turtle: {
      id: 'turbo_turtle',
      templateKey: 'NOVA_TURBO_TURTLE_SVG_TEMPLATE',
      theme: 'turbo',
      name: 'Kaplumbağa Turbo',
      desc: 'Kabuğunda turbo gücü olan sevimli yarışçı. Doğru cevaplarda hızla seni kutlar!',
      price: 5500,
      order: 3,
      equipEmoji: '🐢',
      lines: {
        cheer: [
          '🐢 {n}, turbo hızında doğru cevap!',
          '💨 Harika {n}! Turbo mod açık!',
          '⭐ {n}, kabuğun parlıyor!',
          '🏁 Bravo {n}! Bitiş çizgisine yakınsın!',
          '✨ Süpersin {n}, turbo güç!',
          '🚀 {n}, roket gibi gidiyorsun!',
          '🐢 {n}, şampiyon kaplumbağa!'
        ],
        fire: [
          '💨 {n}, TURBO PATLAMASI!',
          '🐢 {n}, NİTRO MODU!',
          '⚡ {n}, IŞIK HIZI!'
        ],
        epic: [
          '🏆 {n} — TURBO ŞAMPİYON!',
          '💨 {n}, EFSANE TUR!',
          '👑 {n}, PİSTİN KRALI!'
        ]
      }
    }
  };

  var fxBusy = false;
  var correctFxCount = 0;
  var uidSeq = 0;
  var heroCatalogCache = null;

  function getHeroDef(heroId) {
    if (!heroId) return null;
    return HERO_REGISTRY[String(heroId).trim()] || null;
  }

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
    if (data.purchasedBattleHeroes) {
      s.purchasedBattleHeroes = data.purchasedBattleHeroes;
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

  function getEquippedHeroDef() {
    return getHeroDef(getEquippedHeroId());
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
      zone.classList.remove('is-visible', 'nova-main-hero-zone--blaze', 'nova-main-hero-zone--star', 'nova-main-hero-zone--turbo');
      zone.setAttribute('aria-hidden', 'true');
    }
    if (!slot) slot = document.getElementById('nova-main-hero-slot');
    if (!slot) return;
    slot.innerHTML = '';
    slot.classList.remove('nova-main-hero-slot--blaze', 'nova-main-hero-slot--star');
  }

  function mountMainScreenHero(heroId) {
    var def = getHeroDef(heroId);
    var zone = document.getElementById('nova-main-hero-zone');
    var slot = document.getElementById('nova-main-hero-slot');
    if (!def || !zone || !slot) return;
    if (!window[def.templateKey]) return;
    clearMainHeroSlot(slot);
    zone.setAttribute('aria-hidden', 'false');
    zone.classList.add('is-visible', 'nova-main-hero-zone--' + def.theme);
    slot.classList.add('nova-main-hero-slot--' + def.theme);
    var host = document.createElement('div');
    host.className = 'nova-hero-svg-host nova-main-hero-host nova-hero-mount--' + heroId.replace(/_/g, '-');
    host.setAttribute('data-nova-main-hero', heroId);
    slot.appendChild(host);
    mountHeroInto(host, heroId);
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
    var def = getHeroDef(heroId);
    if (!heroId || !def) {
      clearMainHeroSlot(slot);
      return;
    }
    try {
      var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value');
      var data = snap.val() || {};
      if (!ownsHero(data, heroId) || data.battleHero !== heroId) {
        clearMainHeroSlot(slot);
        return;
      }
      try {
        syncHeroToStudent({
          battleHero: heroId,
          purchasedBattleHeroes: data.purchasedBattleHeroes
        });
        window.__novaMainHeroLevelFetched = getHeroLevel(data, heroId);
      } catch (_) {}
    } catch (_) {
      clearMainHeroSlot(slot);
      return;
    }
    mountMainScreenHero(heroId);
  }

  function isHeroEquipped(data) {
    var heroId = data ? String(data.battleHero || '').trim() : getEquippedHeroId();
    if (!heroId || !getHeroDef(heroId)) return false;
    if (data) return data.battleHero === heroId && ownsHero(data, heroId);
    var s = getStudent();
    return !!(s && s.battleHero === heroId && ownsHero({ purchasedBattleHeroes: s.purchasedBattleHeroes }, heroId));
  }

  function parseHeroOwn(val) {
    if (!val) return { owned: false, level: 0 };
    if (val === true) return { owned: true, level: 1 };
    if (typeof val === 'object') {
      return { owned: true, level: Math.min(4, Math.max(1, Number(val.level) || 1)) };
    }
    return { owned: !!val, level: val ? 1 : 0 };
  }

  function getHeroLevel(data, heroId) {
    if (!data || !heroId) return 0;
    return parseHeroOwn(data.purchasedBattleHeroes && data.purchasedBattleHeroes[heroId]).level;
  }

  function ownsHero(data, heroId) {
    if (!heroId) return false;
    return parseHeroOwn(data && data.purchasedBattleHeroes && data.purchasedBattleHeroes[heroId]).owned;
  }

  function defaultCatalog() {
    return Object.keys(HERO_REGISTRY).map(function (id) {
      var h = HERO_REGISTRY[id];
      return {
        id: h.id,
        name: h.name,
        price: h.price,
        desc: h.desc,
        order: h.order,
        theme: h.theme
      };
    }).sort(function (a, b) { return a.order - b.order; });
  }

  async function loadHeroCatalogFromDB() {
    if (heroCatalogCache) return heroCatalogCache;
    var merged = {};
    defaultCatalog().forEach(function (h) { merged[h.id] = h; });
    try {
      if (typeof database !== 'undefined') {
        var snap = await database.ref('store/battleHeroes').once('value');
        var val = snap.val() || {};
        Object.keys(val).forEach(function (k) {
          var row = val[k] || {};
          if (row.active === false) return;
          var local = HERO_REGISTRY[k];
          merged[k] = {
            id: k,
            name: String(row.name || (local && local.name) || k),
            price: Math.max(0, Number(row.price) || (local && local.price) || 0),
            desc: String(row.desc || (local && local.desc) || ''),
            order: Number(row.order) || (local && local.order) || 1e9,
            theme: (local && local.theme) || 'blaze'
          };
        });
      }
    } catch (e) {
      console.warn('loadHeroCatalogFromDB', e);
    }
    heroCatalogCache = Object.keys(merged).map(function (k) { return merged[k]; })
      .filter(function (h) { return !!HERO_REGISTRY[h.id]; })
      .sort(function (a, b) { return a.order - b.order; });
    return heroCatalogCache;
  }

  function buildHeroSvgHtml(heroId) {
    var def = getHeroDef(heroId);
    if (!def) return '';
    var uid = 'h' + ++uidSeq;
    var raw = window[def.templateKey] || '';
    if (!raw) return '';
    return raw.split('__UID__').join(uid).replace('<svg ', '<svg class="nova-hero-svg nova-hero-svg--' + def.theme + '" ');
  }

  function mountHeroInto(host, heroId) {
    if (!host) return null;
    var id = heroId || getEquippedHeroId();
    host.innerHTML = buildHeroSvgHtml(id);
    host.classList.remove('nova-hero-mount--blaze-robot', 'nova-hero-mount--star-fairy', 'nova-hero-mount--turbo-turtle');
    if (id) host.classList.add('nova-hero-mount--' + id.replace(/_/g, '-'));
    var svg = host.querySelector('svg');
    if (id === 'turbo_turtle' && typeof window.novaTurboTurtlePlayStoreIdle === 'function') {
      requestAnimationFrame(function () {
        try { window.novaTurboTurtlePlayStoreIdle(host); } catch (_) {}
      });
    }
    return svg;
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
    var def = getEquippedHeroDef() || HERO_REGISTRY.blaze_robot;
    var name = heroDisplayName();
    var pool = def.lines.cheer;
    if (variant === 'epic') pool = def.lines.epic;
    else if (variant === 'fire') pool = def.lines.fire;
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
    arena.classList.remove(
      'is-active', 'is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show',
      'nova-sp-theme-blaze', 'nova-sp-theme-star', 'nova-sp-theme-turbo'
    );
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
      var equippedId = getEquippedHeroId();
      var def = getHeroDef(equippedId);
      if (!def) { resolve(); return; }

      var arena = ensureArena();
      arena.classList.remove('nova-sp-theme-blaze', 'nova-sp-theme-star', 'nova-sp-theme-turbo');
      arena.classList.add('nova-sp-theme-' + def.theme);

      var host = arena.querySelector('.nova-sp-hero-arena__host');
      var cap = arena.querySelector('.nova-sp-hero-arena__caption');
      var svg = mountHeroInto(host, equippedId);
      if (!svg) { resolve(); return; }

      fxBusy = true;
      if (cap) cap.textContent = pickCaption(variant);

      arena.setAttribute('aria-hidden', 'false');
      arena.classList.add('is-active');
      ['is-centered', 'is-exiting', 'is-slamming', 'is-epic', 'is-caption-show'].forEach(function (c) {
        arena.classList.remove(c);
      });

      runHeroSequence(arena, variant).then(function () {
        hideArena(arena);
        fxBusy = false;
        resolve();
      });
    });
  }

  function runHeroSequence(arena, variant) {
    var host = arena.querySelector('.nova-sp-hero-arena__host');
    var isTurbo = getEquippedHeroId() === 'turbo_turtle'
      && typeof window.novaTurboTurtlePlaySpFx === 'function';
    return waitMs(40).then(function () {
      arena.classList.add('is-centered', 'is-caption-show');
      if (host) {
        host.classList.add('nova-sp-fx-live');
        if (isTurbo) {
          host.classList.add('nova-sp-fx-turbo-js');
        } else {
          host.classList.add('nova-sp-fx-' + variant);
        }
      }
      return waitMs(isTurbo ? 60 : 400);
    }).then(function () {
      spawnArenaFx(arena, variant);
      if (variant === 'epic') setTimeout(triggerGameShake, isTurbo ? 320 : 260);
      else if (variant === 'fire') setTimeout(triggerGameShake, isTurbo ? 360 : 300);
      var fxWait = isTurbo && host
        ? window.novaTurboTurtlePlaySpFx(host, variant).then(function () { return waitMs(720); })
        : waitMs(850);
      return fxWait;
    }).then(function () {
      if (host) {
        host.classList.remove(
          'nova-sp-fx-live', 'nova-sp-fx-epic', 'nova-sp-fx-fire', 'nova-sp-fx-cheer', 'nova-sp-fx-turbo-js'
        );
        if (typeof window.novaTurboTurtleResetSvg === 'function') {
          try {
            var svg = host.querySelector('svg');
            window.novaTurboTurtleResetSvg(svg);
          } catch (_) {}
        }
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

  function heroPreviewHtml(heroId, theme) {
    var mount = heroId ? ' nova-hero-mount--' + heroId.replace(/_/g, '-') : '';
    var th = theme || (getHeroDef(heroId) && getHeroDef(heroId).theme) || 'blaze';
    return '<div class="nova-store-preview nova-store-preview--hero nova-store-preview--' + th + ' nova-hero-preview--store-live' + mount + '">'
      + '<div class="nova-hero-svg-host" data-nova-hero-host="1" data-hero-id="' + (heroId || '') + '"></div>'
      + '</div>';
  }

  function heroLevelLabel(lvl) {
    var labels = { 1: 'Giriş', 2: 'Usta', 3: 'Efsane', 4: 'Kozmik' };
    return labels[lvl] || ('Seviye ' + lvl);
  }

  function openHeroStoreDetail(hero, userData) {
    if (typeof window.novaOpenStoreDetail !== 'function') return;
    var def = getHeroDef(hero.id);
    if (!def) return;
    var owned = ownsHero(userData, hero.id);
    var equipped = userData && userData.battleHero === hero.id;
    var diamonds = Number(userData && userData.diamond) || 0;
    var cost = Number(hero.price) || def.price;
    var lvl = owned ? getHeroLevel(userData, hero.id) : 0;
    var name = hero.name || def.name;
    var desc = hero.desc || def.desc || '';
    var extra = owned
      ? '<span class="nova-hero-level-badge">★ Seviye ' + lvl + ' · ' + heroLevelLabel(lvl) + '</span>'
      : '';
    var btnClass = 'buy-button';
    var btnText = 'Satın Al';
    var btnDisabled = false;
    if (owned && equipped) {
      btnClass = 'use-button';
      btnText = 'Kullanımda';
      btnDisabled = true;
    } else if (owned) {
      btnClass = 'use-button';
      btnText = 'Kullan';
      btnDisabled = false;
    } else if (diamonds < cost) {
      btnText = 'Elmas yetersiz';
      btnDisabled = true;
    }
    window.novaOpenStoreDetail({
      kicker: 'Kahraman',
      title: name,
      meta: '',
      desc: desc,
      extraHtml: extra,
      priceHtml: owned ? '' : ('💎 ' + cost),
      previewClass: 'nova-store-detail-preview--hero nova-store-detail-preview--' + def.theme,
      previewHtml: '',
      mountPreview: function (box) {
        if (!box || !hero.id) return;
        box.innerHTML = heroPreviewHtml(hero.id, def.theme);
        var h = box.querySelector('[data-nova-hero-host]');
        if (h) mountHeroInto(h, hero.id);
      },
      btnClass: btnClass,
      btnText: btnText,
      btnDisabled: btnDisabled,
      inUse: equipped && owned,
      onAction: async function () {
        if (!owned) {
          if (await purchaseBattleHero(hero)) {
            window.novaCloseStoreDetail();
            await novaRenderBattleHeroStore();
          }
        } else if (!equipped) {
          await equipBattleHero(hero);
          window.novaCloseStoreDetail();
          await novaRenderBattleHeroStore();
        } else {
          window.novaCloseStoreDetail();
        }
      }
    });
  }

  async function purchaseBattleHero(hero) {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || !hero) {
      await showAlert('Önce giriş yapmalısın.');
      return false;
    }
    var def = getHeroDef(hero.id);
    if (!def) return false;
    var heroId = hero.id;
    var cost = Number(hero.price) || def.price;
    var heroName = hero.name || def.name;
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
        ['purchasedBattleHeroes/' + heroId]: { level: 1, purchasedAt: Date.now() }
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
        s.purchasedBattleHeroes[heroId] = { level: 1, purchasedAt: Date.now() };
        try {
          window.selectedStudent = s;
          localStorage.setItem('selectedStudent', JSON.stringify(s));
        } catch (_) {}
      }
      await showAlert((def.equipEmoji || '✨') + ' ' + heroName + ' artık senin! Mağazadan Kullan ile aktif et.');
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
    var def = getHeroDef(hero.id);
    if (!def) return;
    try {
      await database.ref('classes/' + s.classId + '/students/' + s.studentId).update({ battleHero: hero.id });
      syncHeroToStudent({ battleHero: hero.id });
      try { refreshMainScreenHero(); } catch (_) {}
      try {
        var eqLvl = 0;
        if (window.NOVA_HERO_LEVEL && typeof window.NOVA_HERO_LEVEL.getHeroLevelFromData === 'function') {
          eqLvl = window.NOVA_HERO_LEVEL.getHeroLevelFromData(s, hero.id) || 0;
        }
        window.__novaMainHeroLevelFetched = eqLvl;
        if (typeof window.novaRefreshMainHeroStars === 'function') window.novaRefreshMainHeroStars();
      } catch (_) {}
      await showAlert((def.equipEmoji || '✨') + ' ' + def.name + ' aktif! Doğru cevaplarda seni motive eder.');
    } catch (e) {
      console.error('equipBattleHero', e);
      await showAlert('Kahraman seçilemedi.');
    }
  }

  function renderHeroStoreCard(hero, userData, container, index) {
    var def = getHeroDef(hero.id);
    if (!def || !window[def.templateKey]) return;

    var owned = ownsHero(userData, hero.id);
    var equipped = userData && userData.battleHero === hero.id;
    var diamonds = Number(userData && userData.diamond) || 0;
    var cost = Number(hero.price) || def.price;
    var lvl = owned ? getHeroLevel(userData, hero.id) : 0;
    var heroName = hero.name || def.name;

    var card = document.createElement('div');
    card.className = 'profile-photo-item nova-store-card nova-hero-store-card nova-hero-store-card--' + def.theme;
    card.style.animationDelay = (index * 0.06) + 's';
    card.innerHTML =
      heroPreviewHtml(hero.id, def.theme)
      + '<div class="nova-hero-store-vitrine-name">' + heroName + '</div>'
      + (owned ? '<span class="nova-hero-level-badge">★ Sv. ' + lvl + '</span>' : '')
      + '<div class="profile-photo-price">'
      + (owned ? '' : ('<span class="purchased-badge nova-hero-diamond-price">💎 ' + cost + '</span>'))
      + '</div>'
      + (equipped && owned
        ? ((typeof window.novaStoreInUseMarkup === 'function')
          ? window.novaStoreInUseMarkup()
          : '<span class="nova-store-in-use" role="status">Kullanımda</span>')
        : '<button type="button" class="profile-photo-button"></button>');

    var btn = card.querySelector('.profile-photo-button');
    if (!owned) {
      btn.className = 'profile-photo-button buy-button';
      btn.textContent = diamonds >= cost ? 'Satın Al' : 'Elmas yetersiz';
      btn.disabled = diamonds < cost;
      btn.onclick = async function (e) {
        e.stopPropagation();
        if (await purchaseBattleHero(hero)) await novaRenderBattleHeroStore();
      };
    } else if (!equipped) {
      btn.className = 'profile-photo-button use-button';
      btn.textContent = 'Kullan';
      btn.onclick = async function (e) {
        e.stopPropagation();
        await equipBattleHero(hero);
        await novaRenderBattleHeroStore();
      };
    }

    if (typeof window.novaBindStoreCardDetail === 'function') {
      window.novaBindStoreCardDetail(card, async function () {
        var fresh = userData;
        try {
          if (typeof getStoreStudentData === 'function') fresh = await getStoreStudentData(true);
        } catch (_) {}
        openHeroStoreDetail(hero, fresh || userData);
      });
    }

    container.appendChild(card);
    var host = card.querySelector('[data-nova-hero-host]');
    mountHeroInto(host, hero.id);
  }

  async function novaRenderBattleHeroStore() {
    if (typeof getStoreStudentData !== 'function') return;
    var container = document.getElementById('profilePhotosContainer');
    var duelStore = document.getElementById('duelCreditsStore');
    if (duelStore) duelStore.style.display = 'none';
    if (!container) return;
    container.style.display = 'grid';
    container.innerHTML = '';
    container.classList.add('nova-store-products--heroes');

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

  function renderHeroStarsHtml(lvl) {
    var html = '<div class="char-inv-hero-stars">';
    for (var i = 1; i <= 4; i++) {
      html += '<span class="char-inv-hero-star ' + (i <= lvl ? 'is-on' : '') + '" aria-hidden="true">★</span>';
    }
    html += '</div>';
    return html;
  }

  async function novaFillCharacterInventoryHeroes() {
    var panel = document.getElementById('char_inv_panel_heroes');
    if (!panel) return;
    var s = getStudent();
    if (!s || !s.studentId || !s.classId) {
      panel.innerHTML = '<p class="char-inv-warn">Önce giriş yapmalısın.</p>';
      return;
    }
    var userData = {};
    try {
      if (typeof getCharacterInventoryStudentData === 'function') {
        userData = await getCharacterInventoryStudentData() || {};
      } else if (typeof database !== 'undefined') {
        var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value');
        userData = snap.val() || {};
      }
    } catch (_) {}
    syncHeroToStudent(userData);

    var catalog = await loadHeroCatalogFromDB();
    var ownedList = catalog.filter(function (h) {
      return ownsHero(userData, h.id);
    });
    var equippedId = String(userData.battleHero || s.battleHero || '').trim();
    var html = '';

    if (equippedId && ownsHero(userData, equippedId)) {
      var eqDef = getHeroDef(equippedId);
      var eqName = eqDef ? eqDef.name : equippedId;
      var eqLvl = getHeroLevel(userData, equippedId);
      html += '<div class="char-inv-hero-equipped">'
        + '<div class="char-inv-hero-equipped__preview" data-char-inv-hero-host="' + equippedId + '"></div>'
        + '<div class="char-inv-hero-equipped__info">'
        + '<p class="char-inv-kicker" style="margin:0">Aktif kahraman</p>'
        + '<h3>' + eqName + '</h3>'
        + '<p style="margin:4px 0;font-size:12px;color:#94a3b8">Seviye ' + eqLvl + ' · ' + heroLevelLabel(eqLvl) + '</p>'
        + renderHeroStarsHtml(eqLvl)
        + '</div></div>';
    }

    if (!ownedList.length) {
      html += '<div class="char-inv-empty">'
        + '<div class="big" aria-hidden="true">🤖</div>'
        + '<h3>Henüz kahramanın yok</h3>'
        + '<p>Mağazadan kahraman satın alıp seviye atlayabilirsin.</p>'
        + '<button type="button" class="char-inv-cta char-inv-cta-store">Mağazaya git 🛒</button>'
        + '</div>';
    } else {
      html += '<div class="char-inv-grid" id="char_inv_grid_heroes">';
      ownedList.forEach(function (hero) {
        var def = getHeroDef(hero.id);
        if (!def) return;
        var lvl = getHeroLevel(userData, hero.id);
        var eq = hero.id === equippedId;
        html += '<div class="char-inv-card char-inv-hero-card' + (eq ? ' equipped' : '') + '">'
          + (eq ? '<span class="char-inv-badge">Takılı</span>' : '')
          + '<div class="char-inv-hero-thumb-host" data-char-inv-hero-host="' + hero.id + '"></div>'
          + '<div class="char-inv-card-title">' + (hero.name || def.name) + '</div>'
          + '<p style="margin:0 0 6px;font-size:11px;color:#a5b4fc">★ Sv. ' + lvl + ' · ' + heroLevelLabel(lvl) + '</p>'
          + renderHeroStarsHtml(lvl)
          + (eq
            ? '<span class="char-inv-in-use" role="status">Kullanımda</span>'
            : '<button type="button" class="char-inv-action" data-char-equip-hero="' + hero.id + '">⚔️ Kullan</button>')
          + '</div>';
      });
      html += '</div>';
    }

    panel.innerHTML = html;
    panel.querySelectorAll('[data-char-inv-hero-host]').forEach(function (el) {
      mountHeroInto(el, el.getAttribute('data-char-inv-hero-host'));
    });
    panel.querySelector('.char-inv-cta-store')?.addEventListener('click', function () {
      if (typeof novaCloseCharacterInventory === 'function') novaCloseCharacterInventory();
      if (typeof novaOpenStore === 'function') {
        novaOpenStore();
        setTimeout(function () {
          if (typeof window.novaStoreHubSelectMainTab === 'function') window.novaStoreHubSelectMainTab('heroes');
        }, 400);
      }
    });
    panel.querySelectorAll('[data-char-equip-hero]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var hid = btn.getAttribute('data-char-equip-hero');
        var h = catalog.find(function (x) { return x.id === hid; });
        if (!h) return;
        await equipBattleHero(h);
        if (typeof novaRefreshCharacterInventoryIfOpen === 'function') {
          await novaRefreshCharacterInventoryIfOpen();
        } else {
          await novaFillCharacterInventoryHeroes();
        }
      });
    });
  }

  function patchCharacterInventory() {
    if (typeof window.novaRenderCharacterInventory !== 'function' || window.novaRenderCharacterInventory.__novaHeroInvPatched) return;
    var orig = window.novaRenderCharacterInventory;
    window.novaRenderCharacterInventory = async function () {
      await orig.apply(this, arguments);
      await novaFillCharacterInventoryHeroes();
    };
    window.novaRenderCharacterInventory.__novaHeroInvPatched = true;
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
    patchCharacterInventory();
    try { refreshMainScreenHero(); } catch (_) {}
  }

  window.novaTryPlayBattleHeroFx = novaTryPlayBattleHeroFx;
  window.novaTryPlayKnightCorrectFx = novaTryPlayBattleHeroFx;
  window.novaRefreshMainScreenHero = refreshMainScreenHero;
  window.NOVA_BATTLE_HERO_REGISTRY = HERO_REGISTRY;
  window.NOVA_HERO_REGISTRY = HERO_REGISTRY;
  window.novaGetHeroLevel = getHeroLevel;
  window.novaMountHeroInto = mountHeroInto;
  window.mountHeroInto = mountHeroInto;
  window.novaBuildHeroSvgHtml = buildHeroSvgHtml;
  window.novaRenderBattleHeroStore = novaRenderBattleHeroStore;
  window.novaFillCharacterInventoryHeroes = novaFillCharacterInventoryHeroes;
  window.NOVA_BATTLE_HERO_ID = 'blaze_robot';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  setTimeout(boot, 800);
})();
