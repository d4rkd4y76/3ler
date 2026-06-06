/* Oyuncu kartı — profil fotoğrafına dokununca tanıtım paneli */
(function () {
  'use strict';

  var PHOTO_SELECTORS =
    '.ranking-player-photo,' +
    '.duel-player-photo,' +
    '#duel-player-inviter-photo,' +
    '#duel-player-invited-photo,' +
    '#ndep-pA-photo,' +
    '#ndep-pB-photo,' +
    '#nova-pA-photo,' +
    '#nova-pB-photo';

  var state = { open: false, heroHost: null, fetchGen: 0 };

  function getDatabase() {
    try {
      if (typeof database !== 'undefined' && database) return database;
    } catch (_) {}
    try {
      if (window.database) return window.database;
    } catch (_) {}
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureOverlay() {
    if (document.getElementById('nova-player-card-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'nova-player-card-overlay';
    ov.className = 'nova-player-card-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
      '<div class="nova-player-card" id="nova_player_card" role="dialog" aria-modal="true" aria-labelledby="nova_player_card_name">' +
      '<div class="nova-player-card-loading" id="nova_player_card_loading">Yükleniyor…</div>' +
      '<header class="npc-header">' +
      '<span class="npc-header-accent" aria-hidden="true"></span>' +
      '<p class="nova-player-card-kicker">Oyuncu Kartı</p>' +
      '<button type="button" class="nova-player-card-close" id="nova_player_card_close" aria-label="Kapat">✕</button>' +
      '</header>' +
      '<div class="nova-player-card-body">' +
      '<section class="npc-profile-panel">' +
      '<div class="nova-player-card-identity">' +
      '<div class="nova-player-card-avatar-shell">' +
      '<div class="nova-player-card-avatar-wrap"><img id="nova_player_card_avatar" class="nova-player-card-avatar" alt="" decoding="async"></div>' +
      '</div>' +
      '<div class="nova-player-card-identity-meta">' +
      '<div class="npc-info-stack">' +
      '<div class="nova-player-card-name" id="nova_player_card_name"></div>' +
      '<div class="nova-player-card-league" id="nova_player_card_league"></div>' +
      '<div class="nova-player-card-cup-banner">' +
      '<span class="npc-cup-ico" aria-hidden="true">🏆</span>' +
      '<div class="npc-cup-body"><span class="npc-cup-val" id="nova_player_card_cups">0</span><span class="npc-cup-lbl">Toplam kupa</span></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</section>' +
      '<section class="npc-hero-panel nova-player-card-hero" id="nova_player_card_hero_section">' +
      '<div class="npc-section-head"><span>Takılı kahraman</span></div>' +
      '<div class="nova-player-card-hero-host" id="nova_player_card_hero"></div>' +
      '<div class="npc-hero-footer nova-player-card-hero-meta">' +
      '<span class="npc-hero-name" id="nova_player_card_hero_name">—</span>' +
      '<span class="npc-hero-stars" id="nova_player_card_hero_stars"></span>' +
      '</div>' +
      '</section>' +
      '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closePlayerCard();
    });
    document.getElementById('nova_player_card_close').addEventListener('click', closePlayerCard);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.open) closePlayerCard();
    });
  }

  function heroLabel(heroId) {
    heroId = String(heroId || '').trim();
    if (!heroId) return 'Kahraman seçilmemiş';
    try {
      if (typeof window.novaGetHeroDisplayName === 'function') {
        var fromApi = window.novaGetHeroDisplayName(heroId);
        if (fromApi) return fromApi;
      }
    } catch (_) {}
    try {
      var reg = window.NOVA_HERO_REGISTRY || window.NOVA_BATTLE_HERO_REGISTRY;
      if (reg && reg[heroId] && reg[heroId].name) return String(reg[heroId].name);
    } catch (_) {}
    return heroId.replace(/_/g, ' ');
  }

  function heroEpicThemeClass(heroId) {
    heroId = String(heroId || '').trim();
    if (heroId === 'buz_ejder') return 'is-epic-buz';
    if (heroId === 'alev_ejder') return 'is-epic-alev';
    if (heroId === 'gece_ejder') return 'is-epic-gece';
    return '';
  }

  function parseHeroLevel(studentSnap, heroId) {
    if (!heroId) return 0;
    if (typeof window.novaGetHeroLevel === 'function') {
      return Math.max(0, Math.min(4, Number(window.novaGetHeroLevel(studentSnap || {}, heroId)) || 0));
    }
    var pb = (studentSnap && studentSnap.purchasedBattleHeroes) || {};
    var row = pb[heroId];
    if (row && typeof row === 'object' && row.level != null) {
      return Math.max(0, Math.min(4, Number(row.level) || 0));
    }
    return 0;
  }

  function renderHeroStars(level, heroId) {
    heroId = String(heroId || '').trim();
    var isEpic =
      typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId);
    if (isEpic) {
      return '<span class="npc-hero-epic-tag">Epik kahraman</span>';
    }
    level = Math.max(0, Math.min(4, Number(level) || 0));
    var html = '';
    for (var i = 1; i <= 4; i++) {
      html += '<span class="npc-star' + (i <= level ? ' is-on' : '') + '" aria-hidden="true">★</span>';
    }
    if (level > 0) {
      html += '<span class="npc-hero-lvl">Seviye ' + level + '</span>';
    }
    return html;
  }

  function unmountHero() {
    var host = document.getElementById('nova_player_card_hero');
    if (!host) return;
    var inner = host.querySelector('[data-nova-hero-host], [data-hero-id]');
    if (inner && typeof window.novaSpriteUnmountHost === 'function') {
      try {
        window.novaSpriteUnmountHost(inner, inner.getAttribute('data-hero-id') || '');
      } catch (_) {}
    }
    host.innerHTML = '';
    state.heroHost = null;
  }

  function mountHero(heroId, studentSnap) {
    var host = document.getElementById('nova_player_card_hero');
    if (!host) return;
    unmountHero();
    heroId = String(heroId || '').trim();
    if (!heroId) {
      host.innerHTML = '<span class="npc-hero-empty">Kahraman seçilmemiş</span>';
      return;
    }
    var slot = document.createElement('div');
    slot.className = 'npc-hero-mount';
    slot.setAttribute('data-hero-id', heroId);
    host.appendChild(slot);
    state.heroHost = slot;
    try {
      if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId)) {
        if (typeof window.novaEpicDragonMountSprite === 'function') {
          window.novaEpicDragonMountSprite(slot, heroId, { profile: 'store', scale: 1.22 });
          return;
        }
      }
      if (typeof window.novaMountHeroInto === 'function') {
        window.novaMountHeroInto(slot, heroId);
        if (slot.querySelector('svg, canvas')) return;
      }
      if (typeof window.novaBuildHeroSvgHtml === 'function') {
        var html = window.novaBuildHeroSvgHtml(heroId);
        if (html) {
          slot.innerHTML = html;
          return;
        }
      }
    } catch (_) {}
    slot.innerHTML = '<span class="npc-hero-empty">' + esc(heroLabel(heroId)) + '</span>';
  }

  function applyPlayerCard(data) {
    data = data || {};
    var avatar = document.getElementById('nova_player_card_avatar');
    var nameEl = document.getElementById('nova_player_card_name');
    var leagueEl = document.getElementById('nova_player_card_league');
    var cupsEl = document.getElementById('nova_player_card_cups');
    var heroNameEl = document.getElementById('nova_player_card_hero_name');
    var heroStarsEl = document.getElementById('nova_player_card_hero_stars');
    var heroSection = document.getElementById('nova_player_card_hero_section');

    var name = String(data.name || 'Oyuncu').trim() || 'Oyuncu';
    var nameFrame = data.nameFrame || 'default';
    var avatarFrame =
      typeof resolveAvatarFrameByName === 'function'
        ? resolveAvatarFrameByName(nameFrame, data.avatarFrame)
        : data.avatarFrame || 'default';
    var photo = String(data.photo || '').trim();
    var cups = Math.max(0, Number(data.gameCup) || 0);
    var heroId = String(data.battleHero || data.heroId || '').trim();
    var studentSnap = data.studentSnap || { purchasedBattleHeroes: data.purchasedBattleHeroes, heroLevel: data.heroLevel };
    var heroLevel = parseHeroLevel(studentSnap, heroId);

    if (avatar) {
      avatar.alt = name;
      avatar.src = photo || 'https://via.placeholder.com/222x278?text=?';
      try {
        if (typeof applyAvatarFrameToImage === 'function') applyAvatarFrameToImage(avatar, avatarFrame);
      } catch (_) {}
    }

    if (nameEl) {
      try {
        if (typeof renderNameWithFrame === 'function') nameEl.innerHTML = renderNameWithFrame(name, nameFrame);
        else nameEl.textContent = name;
      } catch (_) {
        nameEl.textContent = name;
      }
    }

    if (leagueEl) {
      try {
        leagueEl.innerHTML =
          typeof getRankHTML === 'function' ? getRankHTML(cups, true) : '';
      } catch (_) {
        leagueEl.innerHTML = '';
      }
    }

    if (cupsEl) cupsEl.textContent = String(cups);
    if (heroNameEl) heroNameEl.textContent = heroLabel(heroId);
    if (heroStarsEl) heroStarsEl.innerHTML = renderHeroStars(heroLevel, heroId);
    if (heroSection) {
      heroSection.classList.remove('is-epic-buz', 'is-epic-alev', 'is-epic-gece');
      var theme = heroEpicThemeClass(heroId);
      if (theme) heroSection.classList.add(theme);
    }

    mountHero(heroId, studentSnap);
  }

  function setLoading(on) {
    var card = document.getElementById('nova_player_card');
    if (card) card.classList.toggle('is-loading', !!on);
  }

  async function fetchPlayerCardData(classId, studentId) {
    var db = getDatabase();
    if (!db || !classId || !studentId) return null;
    var ref = db.ref('classes/' + classId + '/students/' + studentId);
    var snaps = await Promise.all([
      ref.once('value'),
      ref.child('battleHero').once('value'),
      ref.child('gameCup').once('value'),
      ref.child('photo').once('value'),
      ref.child('name').once('value'),
      ref.child('nameFrame').once('value'),
      ref.child('avatarFrame').once('value'),
      ref.child('purchasedBattleHeroes').once('value'),
      ref.child('heroLevel').once('value')
    ]);
    var root = snaps[0].exists() ? snaps[0].val() || {} : {};
    var purchasedBattleHeroes = snaps[7].exists() ? snaps[7].val() || {} : root.purchasedBattleHeroes || {};
    var battleHero = snaps[1].exists()
      ? String(snaps[1].val() || '').trim()
      : String(root.battleHero || '').trim();
    if (!battleHero && purchasedBattleHeroes && typeof purchasedBattleHeroes === 'object') {
      var keys = Object.keys(purchasedBattleHeroes).filter(function (k) {
        return !!k && k !== 'null';
      });
      if (keys.length) battleHero = String(keys[0]).trim();
    }
    return {
      classId: classId,
      studentId: studentId,
      name: (snaps[4].exists() ? snaps[4].val() : root.name) || 'Oyuncu',
      photo: (snaps[3].exists() ? snaps[3].val() : root.photo) || '',
      nameFrame: (snaps[5].exists() ? snaps[5].val() : root.nameFrame) || 'default',
      avatarFrame: (snaps[6].exists() ? snaps[6].val() : root.avatarFrame) || 'default',
      gameCup: snaps[2].exists() ? Number(snaps[2].val()) || 0 : Number(root.gameCup) || 0,
      battleHero: battleHero,
      purchasedBattleHeroes: purchasedBattleHeroes,
      heroLevel: snaps[8].exists() ? snaps[8].val() : root.heroLevel,
      studentSnap: {
        purchasedBattleHeroes: purchasedBattleHeroes,
        heroLevel: snaps[8].exists() ? snaps[8].val() : root.heroLevel
      }
    };
  }

  function sideFromPhotoEl(el) {
    var id = String((el && el.id) || '');
    if (id.indexOf('inviter') >= 0 || id === 'ndep-pA-photo' || id === 'nova-pA-photo') return 'inviter';
    if (id.indexOf('invited') >= 0 || id === 'ndep-pB-photo' || id === 'nova-pB-photo') return 'invited';
    return '';
  }

  function resolvePlayerFromPhoto(el) {
    if (!el) return null;
    var classId = el.getAttribute('data-class-id') || el.dataset.classId || '';
    var studentId = el.getAttribute('data-student-id') || el.dataset.studentId || '';
    if (classId && studentId) {
      return {
        classId: classId,
        studentId: studentId,
        name: el.getAttribute('data-player-name') || '',
        photo: el.currentSrc || el.src || el.getAttribute('data-photo') || '',
        nameFrame: el.getAttribute('data-name-frame') || 'default',
        avatarFrame: el.getAttribute('data-avatar-frame') || el.dataset.avatarFrame || 'default',
        gameCup: Number(el.getAttribute('data-game-cup') || 0),
        duelCredits: Number(el.getAttribute('data-duel-credits') || NaN),
        battleHero: el.getAttribute('data-battle-hero') || '',
        heroId: el.getAttribute('data-hero-id') || '',
        heroLevel: Number(el.getAttribute('data-hero-level') || 0)
      };
    }
    var side = sideFromPhotoEl(el);
    if (side && window.__currentDuelData && window.__currentDuelData[side]) {
      var p = window.__currentDuelData[side];
      return {
        classId: p.classId || '',
        studentId: p.studentId || '',
        name: p.name || p.studentName || '',
        photo: p.photo || el.src || '',
        nameFrame: p.nameFrame || 'default',
        avatarFrame: p.avatarFrame || 'default',
        gameCup: Number(p.gameCup) || 0,
        duelCredits: NaN,
        battleHero: p.battleHero || '',
        heroId: p.battleHero || ''
      };
    }
    return null;
  }

  function closePlayerCard() {
    var ov = document.getElementById('nova-player-card-overlay');
    if (!ov) return;
    state.open = false;
    state.fetchGen += 1;
    ov.classList.remove('is-open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nova-player-card-open');
    setLoading(false);
    unmountHero();
  }

  async function openPlayerCard(ctx) {
    if (!ctx || !ctx.classId || !ctx.studentId) return;
    ensureOverlay();
    var ov = document.getElementById('nova-player-card-overlay');
    if (!ov) return;

    state.open = true;
    state.fetchGen += 1;
    var gen = state.fetchGen;

    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nova-player-card-open');

    applyPlayerCard(ctx);
    setLoading(!ctx.battleHero);

    try {
      var fresh = await fetchPlayerCardData(ctx.classId, ctx.studentId);
      if (!state.open || gen !== state.fetchGen || !fresh) {
        setLoading(false);
        return;
      }
      applyPlayerCard(fresh);
    } catch (e) {
      console.warn('[nova player card]', e);
    } finally {
      if (state.open && gen === state.fetchGen) setLoading(false);
    }
  }

  function onPhotoClick(e) {
    var img = e.target.closest(PHOTO_SELECTORS);
    if (!img) return;
    var ctx = resolvePlayerFromPhoto(img);
    if (!ctx || !ctx.classId || !ctx.studentId) return;
    e.preventDefault();
    e.stopPropagation();
    openPlayerCard(ctx);
  }

  function markTriggers() {
    try {
      document.querySelectorAll(PHOTO_SELECTORS).forEach(function (el) {
        el.classList.add('nova-player-card-trigger');
        if (!el.getAttribute('role')) el.setAttribute('role', 'button');
        if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Oyuncu kartını aç');
      });
    } catch (_) {}
  }

  function boot() {
    ensureOverlay();
    document.addEventListener('click', onPhotoClick, true);
    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var img = e.target.closest(PHOTO_SELECTORS);
        if (!img) return;
        e.preventDefault();
        onPhotoClick({ target: img, preventDefault: function () {}, stopPropagation: function () {} });
      },
      true
    );
    markTriggers();
    if (typeof MutationObserver !== 'undefined') {
      var mo = new MutationObserver(function () {
        markTriggers();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener('nova:ranking-rendered', markTriggers, { passive: true });
  }

  window.novaOpenPlayerCard = openPlayerCard;
  window.novaClosePlayerCard = closePlayerCard;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
