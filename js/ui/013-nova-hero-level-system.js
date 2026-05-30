/* Kahraman seviye yükseltme + seviye özellikleri */
(function () {
  var MAX_LEVEL = 4;
  var Z_OVERLAY = 101200;

  var UPGRADE_COSTS = {
    2: { diamonds: 5000, duelCredits: 1000 },
    3: { diamonds: 5000, duelCredits: 2000 },
    4: { diamonds: 5000, duelCredits: 2500 }
  };

  var UPGRADE_CHANCE = {
    2: 0.5,
    3: 0.2,
    4: 0.05
  };

  var LEVEL_LABELS = {
    1: 'Giriş',
    2: 'Usta',
    3: 'Efsane',
    4: 'Kozmik'
  };

  var PERK_LINES = {
    1: [
      'Düello galibiyeti: +1 ek kupa',
      'Boşluk · Bulmaca · Eşleştir: yanlışta 1 ek deneme hakkı',
      'Tek kişilik: oyunda 1 kez yanlış şıkkı kırmızıyla göster'
    ],
    2: [
      'Seviye 1 özelliklerinin tamamı',
      'Düello galibiyeti: toplam +3 ek kupa (+2 bonus)',
      'Görev ödülü: tamamlanan her görevde +20 💎 kahraman bonusu',
      'Tek kişilik: oyunda 2 kez yanlış şıkkı göster'
    ],
    3: [
      'Seviye 2 özelliklerinin tamamı',
      'Düello galibiyeti: toplam +8 ek kupa (+5 bonus)',
      'Düello galibiyeti: +10 düello kredisi',
      'Görev ödülü: tamamlanan her görevde +120 💎 kahraman bonusu (toplam)',
      'Tek kişilik: 2 soruda yanlış şık gösterme (oyun başına 2 hak)'
    ],
    4: [
      'Seviye 3 özelliklerinin tamamı',
      'Düello galibiyeti: toplam +18 ek kupa (+10 bonus)',
      'Düello galibiyeti: +30 düello kredisi (toplam)',
      'Görev ödülü: tamamlanan her görevde +320 💎 kahraman bonusu (toplam)',
      'Boşluk · Bulmaca · Eşleştir: kazanılan elmaslar 2 kat'
    ]
  };

  var CUMULATIVE = {
    1: { duelCupBonus: 1, duelCreditBonusOnWin: 0, questBonusDiamonds: 0, spWrongRevealPerGame: 1, dailyRetryOnWrong: true, dailyDiamondMultiplier: 1 },
    2: { duelCupBonus: 3, duelCreditBonusOnWin: 0, questBonusDiamonds: 20, spWrongRevealPerGame: 2, dailyRetryOnWrong: true, dailyDiamondMultiplier: 1 },
    3: { duelCupBonus: 8, duelCreditBonusOnWin: 10, questBonusDiamonds: 120, spWrongRevealPerGame: 2, dailyRetryOnWrong: true, dailyDiamondMultiplier: 1 },
    4: { duelCupBonus: 18, duelCreditBonusOnWin: 30, questBonusDiamonds: 320, spWrongRevealPerGame: 2, dailyRetryOnWrong: true, dailyDiamondMultiplier: 2 }
  };

  var dailyRetryUsed = {};
  var spRevealState = { max: 0, used: 0, questionIndex: -1 };

  function getStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) return selectedStudent;
      return JSON.parse(localStorage.getItem('selectedStudent') || 'null');
    } catch (_) {
      return null;
    }
  }

  function parseHeroOwnership(val) {
    if (!val) return { owned: false, level: 0 };
    if (val === true) return { owned: true, level: 1 };
    if (typeof val === 'object') {
      return {
        owned: true,
        level: Math.min(MAX_LEVEL, Math.max(1, Number(val.level) || 1))
      };
    }
    return { owned: !!val, level: val ? 1 : 0 };
  }

  function getHeroLevelFromData(data, heroId) {
    if (!data || !heroId) return 0;
    var raw = data.purchasedBattleHeroes && data.purchasedBattleHeroes[heroId];
    return parseHeroOwnership(raw).level;
  }

  function ownsHeroLevel(data, heroId) {
    return getHeroLevelFromData(data, heroId) >= 1;
  }

  function getEquippedHeroId() {
    var s = getStudent();
    return (s && s.battleHero) ? String(s.battleHero).trim() : '';
  }

  function getEquippedHeroLevel(data) {
    data = data || null;
    var heroId = data ? String(data.battleHero || '').trim() : getEquippedHeroId();
    if (!heroId) return 0;
    var lvl = 0;
    if (data) lvl = getHeroLevelFromData(data, heroId);
    else {
      var s = getStudent();
      if (s && s.purchasedBattleHeroes) lvl = getHeroLevelFromData(s, heroId);
    }
    return lvl;
  }

  function getEquippedHeroLevelForPerks(data) {
    var heroId = data ? String(data.battleHero || '').trim() : getEquippedHeroId();
    if (isEpicHeroId(heroId)) return 0;
    var lvl = getEquippedHeroLevel(data);
    if (lvl < 1 && heroId) return 1;
    return lvl;
  }

  function getPerksForLevel(level) {
    level = Math.min(MAX_LEVEL, Math.max(0, Number(level) || 0));
    return CUMULATIVE[level] || CUMULATIVE[1];
  }

  function getActivePerks(data) {
    var lvl = getEquippedHeroLevelForPerks(data);
    if (lvl < 1) return null;
    return getPerksForLevel(lvl);
  }

  function isEpicHeroId(heroId) {
    if (!heroId) return false;
    if (typeof window.novaIsEpicStoreHero === 'function') return window.novaIsEpicStoreHero(heroId);
    if (typeof window.novaIsEpicDragonHero === 'function') return window.novaIsEpicDragonHero(heroId);
    return false;
  }

  function listOwnedHeroes(data) {
    var out = [];
    var pb = (data && data.purchasedBattleHeroes) || {};
    var reg = null;
    try { reg = window.NOVA_HERO_REGISTRY || null; } catch (_) { reg = null; }
    Object.keys(pb).forEach(function (id) {
      /* Kaldırılmış/olmayan kahramanlar (örn. anka_phoenix) UI'da boş görünmesin */
      if (reg && !reg[id]) return;
      var o = parseHeroOwnership(pb[id]);
      if (o.owned) out.push({ id: id, level: o.level });
    });
    return out;
  }

  function listLevelableOwnedHeroes(data) {
    return listOwnedHeroes(data).filter(function (h) {
      return !isEpicHeroId(h.id);
    });
  }

  function heroName(heroId) {
    try {
      if (window.NOVA_HERO_REGISTRY && window.NOVA_HERO_REGISTRY[heroId]) return window.NOVA_HERO_REGISTRY[heroId].name;
    } catch (_) {}
    if (heroId === 'blaze_robot') return 'Alev Bot';
    if (heroId === 'star_fairy') return 'Yıldız Perisi';
    if (heroId === 'turbo_turtle') return 'Kaplumbağa Turbo';
    if (heroId === 'mythic_wyvern') return 'Çılgın Kanat';
    if (heroId === 'bilge_hayalet') return 'Sihirli Buba';
    if (heroId === 'simsek_sincap') return 'Parlak Pati';
    if (heroId === 'buz_ejder') return 'Buz Ejderi';
    if (heroId === 'alev_ejder') return 'Alev Ejderi';
    if (heroId === 'gece_ejder') return 'Gece Ejderi';
    return heroId;
  }

  function heroTheme(heroId) {
    try {
      if (window.NOVA_HERO_REGISTRY && window.NOVA_HERO_REGISTRY[heroId]) return window.NOVA_HERO_REGISTRY[heroId].theme || 'blaze';
    } catch (_) {}
    if (heroId === 'star_fairy') return 'star';
    if (heroId === 'turbo_turtle') return 'turbo';
    if (heroId === 'mythic_wyvern') return 'mythic';
    if (heroId === 'bilge_hayalet') return 'bilge';
    if (heroId === 'simsek_sincap') return 'simsek';
    if (heroId === 'buz_ejder') return 'buz';
    if (heroId === 'alev_ejder') return 'alev';
    if (heroId === 'gece_ejder') return 'gece';
    return 'blaze';
  }

  async function sanitizePurchasedHeroes(data) {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId || !data) return data;
    var pb = (data && data.purchasedBattleHeroes) || null;
    if (!pb) return data;
    var reg = null;
    try { reg = window.NOVA_HERO_REGISTRY || null; } catch (_) { reg = null; }
    if (!reg) return data;

    var updates = null;
    Object.keys(pb).forEach(function (id) {
      if (reg[id]) return;
      if (!updates) updates = {};
      updates['purchasedBattleHeroes/' + id] = null;
    });
    /* Equip edilmiş kahraman kaldırıldıysa temizle */
    try {
      var eq = data && data.battleHero ? String(data.battleHero).trim() : '';
      if (eq && !reg[eq]) {
        if (!updates) updates = {};
        updates.battleHero = null;
      }
    } catch (_) {}

    if (!updates) return data;
    try {
      await database.ref('classes/' + s.classId + '/students/' + s.studentId).update(updates);
      // local cache
      try {
        Object.keys(updates).forEach(function (k) {
          if (k.indexOf('purchasedBattleHeroes/') === 0) {
            var id2 = k.split('/')[1];
            if (data.purchasedBattleHeroes) delete data.purchasedBattleHeroes[id2];
          }
        });
        if (Object.prototype.hasOwnProperty.call(updates, 'battleHero')) data.battleHero = null;
        var loc = getStudent();
        if (loc) {
          loc.purchasedBattleHeroes = data.purchasedBattleHeroes;
          if (Object.prototype.hasOwnProperty.call(updates, 'battleHero')) loc.battleHero = null;
          window.selectedStudent = loc;
          localStorage.setItem('selectedStudent', JSON.stringify(loc));
        }
      } catch (_) {}
    } catch (_) {}
    return data;
  }

  function getUpgradeCost(targetLevel) {
    return UPGRADE_COSTS[targetLevel] || null;
  }

  function getUpgradeChance(targetLevel) {
    return UPGRADE_CHANCE[targetLevel] || 0;
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function waitMs(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function nhDialogConfirm(message) {
    return new Promise(function (resolve) {
      var host = document.getElementById('nova-hero-level-overlay');
      if (!host) { resolve(false); return; }
      var dlg = document.createElement('div');
      dlg.className = 'nh-level-dialog';
      dlg.innerHTML =
        '<div class="nh-level-dialog__card">'
        + '<p class="nh-level-dialog__msg">' + message + '</p>'
        + '<div class="nh-level-dialog__actions">'
        + '<button type="button" class="nh-level-dialog__yes">Evet, harca</button>'
        + '<button type="button" class="nh-level-dialog__no">Vazgeç</button>'
        + '</div></div>';
      host.appendChild(dlg);
      requestAnimationFrame(function () { dlg.classList.add('is-open'); });
      function close(v) {
        dlg.classList.remove('is-open');
        setTimeout(function () { dlg.remove(); resolve(v); }, 180);
      }
      dlg.querySelector('.nh-level-dialog__yes').addEventListener('click', function () { close(true); });
      dlg.querySelector('.nh-level-dialog__no').addEventListener('click', function () { close(false); });
    });
  }

  function ensureLevelUi() {
    if (document.getElementById('nova-hero-level-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'nova-hero-level-overlay';
    ov.className = 'nh-level-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.style.zIndex = String(Z_OVERLAY);
    ov.innerHTML =
      '<div class="nh-level-panel" role="dialog" aria-labelledby="nh_level_title">'
      + '<div class="nh-level-panel__glow" aria-hidden="true"></div>'
      + '<header class="nh-level-head">'
      + '<div><h2 id="nh_level_title">Kahraman Seviye Artışı</h2>'
      + '<p class="nh-level-sub">Yalnızca kuşandığın Temel kahraman için deneme yapılır</p></div>'
      + '<button type="button" class="nh-level-close" id="nh_level_close" aria-label="Kapat">✕</button>'
      + '</header>'
      + '<section class="nh-level-arena" id="nh_level_stage">'
      + '<div class="nh-level-arena__pedestal" aria-hidden="true"></div>'
      + '<h3 class="nh-level-arena__name" id="nh_level_hero_name">—</h3>'
      + '<div class="nh-level-hero-preview" id="nh_level_hero_preview"></div>'
      + '<div class="nh-level-arena__stars" id="nh_level_stars"></div>'
      + '<section class="nh-level-stats nh-level-stats--arena">'
      + '<div class="nh-level-stat" id="nh_level_cost"></div>'
      + '<div class="nh-level-stat nh-level-stat--chance" id="nh_level_chance"></div>'
      + '</section>'
      + '<div class="nh-level-arena__upgrade">'
      + '<button type="button" class="nh-level-btn nh-level-btn--roll" id="nh_level_roll" disabled>⬆️ Seviye Yükselt</button>'
      + '</div>'
      + '<div class="nh-level-banner" id="nh_level_result" hidden role="status"></div>'
      + '<div class="nh-level-roll-fx" id="nh_level_roll_fx" hidden aria-hidden="true">'
      + '<span class="nh-level-roll-fx__beams" aria-hidden="true"></span>'
      + '<span class="nh-level-roll-fx__scan" aria-hidden="true"></span>'
      + '<span class="nh-level-roll-fx__sparks" aria-hidden="true"></span>'
      + '<span class="nh-level-roll-fx__txt">Şans deneniyor…</span></div>'
      + '</section>'
      + '<button type="button" class="nh-level-perks-toggle" id="nh_level_perks_toggle" aria-expanded="false">'
      + '<span class="nh-level-perks-toggle__label">⚡ Kahraman güçlerini incele</span>'
      + '<span class="nh-level-perks-toggle__chev" aria-hidden="true"></span>'
      + '</button>'
      + '<div class="nh-level-perks-drawer" id="nh_level_perks_drawer" hidden>'
      + '<section class="nh-level-perks-block">'
      + '<div class="nh-level-perks-card">'
      + '<h4 class="nh-level-perks-title">Mevcut güçler</h4>'
      + '<ul class="nh-level-perks" id="nh_level_perks_now"></ul>'
      + '</div>'
      + '<div class="nh-level-perks-card nh-level-perks-card--next" id="nh_level_next_wrap">'
      + '<h4 class="nh-level-perks-title">Sonraki seviye güçleri</h4>'
      + '<ul class="nh-level-perks nh-level-perks--next" id="nh_level_perks_next"></ul>'
      + '</div>'
      + '</section>'
      + '</div>'
      + '<div class="nh-level-actions">'
      + '<button type="button" class="nh-level-btn nh-level-btn--ghost" id="nh_level_done">Kapat</button>'
      + '</div>'
      + '<div class="nh-level-victory" id="nh_level_victory" hidden aria-hidden="true"></div>'
      + '</div>';
    document.body.appendChild(ov);
    document.getElementById('nh_level_close').addEventListener('click', closeLevelOverlay);
    document.getElementById('nh_level_done').addEventListener('click', closeLevelOverlay);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeLevelOverlay();
    });
    document.getElementById('nh_level_roll').addEventListener('click', onRollUpgrade);
    var perksToggle = document.getElementById('nh_level_perks_toggle');
    if (perksToggle) {
      perksToggle.addEventListener('click', function () {
        var drawer = document.getElementById('nh_level_perks_drawer');
        if (!drawer) return;
        var open = drawer.hidden;
        drawer.hidden = !open;
        perksToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        perksToggle.classList.toggle('is-open', open);
      });
    }
  }

  function closePerksDrawer() {
    var drawer = document.getElementById('nh_level_perks_drawer');
    var btn = document.getElementById('nh_level_perks_toggle');
    if (drawer) drawer.hidden = true;
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-open');
    }
  }

  function ensureStoreLevelBar() {
    if (document.getElementById('novaStoreHeroLevelBar')) return;
    var bar = document.createElement('div');
    bar.id = 'novaStoreHeroLevelBar';
    bar.className = 'nova-store-hero-level-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<button type="button" class="nova-store-hero-level-btn" id="novaStoreHeroLevelBtn">'
      + '<span class="nova-store-hero-level-btn__shine" aria-hidden="true"></span>'
      + '<span class="nova-store-hero-level-btn__icon">⬆️</span>'
      + '<span class="nova-store-hero-level-btn__text">'
      + '<span class="nova-store-hero-level-btn__title">Kahraman Seviye Artışı</span>'
      + '<span class="nova-store-hero-level-btn__sub">Kahramanı kuşan · şansını dene</span>'
      + '</span>'
      + '<span class="nova-store-hero-level-btn__arrow" aria-hidden="true">›</span>'
      + '</button>';
    var stage = document.querySelector('.nova-store-stage');
    var nav = document.querySelector('.nova-store-nav-section');
    if (stage && nav && nav.parentNode) {
      nav.parentNode.insertBefore(bar, stage);
    } else if (stage) {
      stage.parentNode.insertBefore(bar, stage);
    } else {
      document.body.appendChild(bar);
    }
    document.getElementById('novaStoreHeroLevelBtn').addEventListener('click', openLevelOverlay);
  }

  function setStoreLevelBarVisible(show) {
    ensureStoreLevelBar();
    var bar = document.getElementById('novaStoreHeroLevelBar');
    if (bar) bar.hidden = !show;
  }

  var uiState = { heroId: '', data: null };

  function renderStars(level) {
    var html = '';
    for (var i = 1; i <= MAX_LEVEL; i++) {
      html += '<span class="nh-level-star' + (i <= level ? ' is-on' : '') + '" aria-hidden="true">★</span>';
    }
    return html;
  }

  function getPerkSummaryLines(level) {
    level = Math.min(MAX_LEVEL, Math.max(0, Number(level) || 0));
    var p = CUMULATIVE[level];
    if (!p || level < 1) return [];
    var lines = [];
    if (p.duelCupBonus > 0) {
      lines.push('Düello galibiyeti: toplam +' + p.duelCupBonus + ' ek kupa');
    }
    if (p.duelCreditBonusOnWin > 0) {
      lines.push('Düello galibiyeti: +' + p.duelCreditBonusOnWin + ' düello kredisi');
    }
    if (p.questBonusDiamonds > 0) {
      lines.push('Görev ödülü: tamamlanan her görevde +' + p.questBonusDiamonds + ' 💎 kahraman bonusu');
    }
    if (p.dailyRetryOnWrong) {
      lines.push('Boşluk · Bulmaca · Eşleştir: yanlışta 1 ek deneme hakkı');
    }
    if (p.spWrongRevealPerGame > 0) {
      lines.push('Tek kişilik: oyunda ' + p.spWrongRevealPerGame + ' kez yanlış şıkkı göster');
    }
    if (p.dailyDiamondMultiplier > 1) {
      lines.push('Boşluk · Bulmaca · Eşleştir: kazanılan elmaslar ' + p.dailyDiamondMultiplier + ' kat');
    }
    return lines;
  }

  function renderPerkList(el, level) {
    if (!el) return;
    var lines = getPerkSummaryLines(level);
    el.innerHTML = lines.map(function (l) {
      return '<li>' + l + '</li>';
    }).join('');
  }

  function showResultBanner(kind, title, sub) {
    var el = document.getElementById('nh_level_result');
    if (!el) return;
    el.hidden = false;
    el.className = 'nh-level-banner nh-level-banner--' + (kind === 'win' ? 'win' : 'fail');
    el.innerHTML =
      '<span class="nh-level-banner__icon" aria-hidden="true">' + (kind === 'win' ? '✓' : '✕') + '</span>'
      + '<span class="nh-level-banner__title">' + title + '</span>'
      + '<span class="nh-level-banner__sub">' + (sub || '') + '</span>';
  }

  function hideResultBanner() {
    var el = document.getElementById('nh_level_result');
    if (el) el.hidden = true;
  }

  function mountHeroPreview(heroId) {
    var box = document.getElementById('nh_level_hero_preview');
    if (!box || !heroId) return;
    box.innerHTML = '';
    box.className = 'nh-level-hero-preview nh-level-hero-preview--' + heroTheme(heroId) + ' is-enter';
    var host = document.createElement('div');
    host.className = 'nh-level-hero-preview__host nova-hero-mount--' + heroId.replace(/_/g, '-');
    box.appendChild(host);
    if (typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId) && typeof window.novaEpicDragonMountSprite === 'function') {
      window.novaEpicDragonMountSprite(host, heroId, { profile: 'store' });
    } else if (typeof window.novaMountHeroInto === 'function') {
      window.novaMountHeroInto(host, heroId);
    }
    var nameEl = document.getElementById('nh_level_hero_name');
    if (nameEl) nameEl.textContent = heroName(heroId) + ' · Kuşanılıyor';
    requestAnimationFrame(function () {
      box.classList.remove('is-enter');
    });
  }

  function updatePanelStats() {
    var data = uiState.data;
    var heroId = uiState.heroId;
    if (!heroId || !data) return;
    var lvl = getHeroLevelFromData(data, heroId);
    var next = Math.min(MAX_LEVEL, lvl + 1);
    var stars = document.getElementById('nh_level_stars');
    var costEl = document.getElementById('nh_level_cost');
    var chanceEl = document.getElementById('nh_level_chance');
    var rollBtn = document.getElementById('nh_level_roll');
    var nextWrap = document.getElementById('nh_level_next_wrap');

    if (isEpicHeroId(heroId)) {
      if (costEl) {
        costEl.innerHTML = '<span class="nh-level-stat__label">Epik kahraman</span><span class="nh-level-stat__value nh-level-maxed">👑 Seviye yükseltilemez</span>';
      }
      if (chanceEl) chanceEl.innerHTML = '';
      if (nextWrap) nextWrap.hidden = true;
      if (rollBtn) {
        rollBtn.disabled = true;
        rollBtn.textContent = 'Epik kahramanlar yükseltilemez';
      }
      if (stars) {
        stars.classList.add('nh-level-arena__stars--epic');
        stars.innerHTML = '';
        if (typeof window.novaEpicDragonMountBadge === 'function') {
          window.novaEpicDragonMountBadge(stars, heroId, 'level');
        }
      }
      renderPerkList(document.getElementById('nh_level_perks_now'), 0);
      return;
    }

    if (stars) {
      stars.classList.remove('nh-level-arena__stars--epic');
      if (typeof window.novaEpicDragonUnmountBadge === 'function') {
        window.novaEpicDragonUnmountBadge(stars);
      }
      stars.innerHTML = renderStars(lvl)
        + '<span class="nh-level-arena__rank">Seviye ' + lvl + ' · ' + (LEVEL_LABELS[lvl] || '') + '</span>';
    }
    renderPerkList(document.getElementById('nh_level_perks_now'), lvl);

    if (lvl >= MAX_LEVEL) {
      if (costEl) costEl.innerHTML = '<span class="nh-level-stat__label">Durum</span><span class="nh-level-stat__value nh-level-maxed">🏆 Maksimum seviye</span>';
      if (chanceEl) chanceEl.innerHTML = '';
      if (nextWrap) nextWrap.hidden = true;
      if (rollBtn) {
        rollBtn.disabled = true;
        rollBtn.textContent = 'Maksimum Seviyeye Ulaşıldı';
      }
    } else {
      var cost = getUpgradeCost(next);
      var pct = Math.round(getUpgradeChance(next) * 100);
      if (costEl) {
        costEl.innerHTML =
          '<span class="nh-level-stat__label">Maliyet</span>'
          + '<span class="nh-level-stat__value">💎 ' + cost.diamonds
          + (cost.duelCredits ? ' · 🎫 ' + cost.duelCredits : '')
          + '</span>'
          + '<span class="nh-level-stat__note">Başarısız olsa da harcanır</span>';
      }
      if (chanceEl) {
        chanceEl.innerHTML =
          '<span class="nh-level-stat__label">Başarı şansı</span>'
          + '<span class="nh-level-stat__value nh-level-stat__value--pct">%' + pct + '</span>'
          + '<span class="nh-level-stat__note">Hedef: Seviye ' + next + '</span>';
      }
      if (nextWrap) {
        nextWrap.hidden = false;
        renderPerkList(document.getElementById('nh_level_perks_next'), next);
      }
      var diamonds = Number(data.diamond) || 0;
      var credits = Number(data.duelCredits) || 0;
      var canPay = diamonds >= cost.diamonds && credits >= cost.duelCredits;
      if (rollBtn) {
        rollBtn.disabled = !canPay;
        rollBtn.textContent = canPay
          ? ('⬆️ ' + heroName(heroId) + ' · Seviye ' + next + ' Dene (%' + pct + ')')
          : 'Kaynak yetersiz';
      }
    }
  }

  function resolveEquippedLevelTarget(data) {
    data = data || uiState.data || null;
    var eq = '';
    if (data && data.battleHero) eq = String(data.battleHero).trim();
    if (!eq) eq = getEquippedHeroId();
    if (!eq) return { ok: false, reason: 'no_equip' };
    if (isEpicHeroId(eq)) return { ok: false, reason: 'epic', heroId: eq };
    if (!ownsHeroLevel(data, eq)) return { ok: false, reason: 'not_owned', heroId: eq };
    return { ok: true, heroId: eq };
  }

  function levelOverlayBlockedMessage(reason) {
    if (reason === 'epic') {
      return 'Epik ejderler seviye atlamaz. Mağazadan bir Temel kahraman seçip Kullan ile kuşanmalısın.';
    }
    if (reason === 'not_owned') {
      return 'Kuşandığın kahraman hesabında bulunamadı. Mağazadan Temel bir kahraman kuşanıp tekrar dene.';
    }
    return 'Seviye yükseltmek için önce mağazadan bir Temel kahraman satın alıp Kullan ile kuşanmalısın.';
  }

  async function refreshLevelPanel() {
    var data = uiState.data;
    if (!data && typeof getStoreStudentData === 'function') {
      data = await getStoreStudentData(true);
      uiState.data = data;
    }
    var target = resolveEquippedLevelTarget(data);
    if (!target.ok) {
      closeLevelOverlay();
      if (typeof showAlert === 'function') {
        await showAlert(levelOverlayBlockedMessage(target.reason));
      }
      return;
    }
    uiState.heroId = target.heroId;
    mountHeroPreview(target.heroId);
    hideResultBanner();
    updatePanelStats();
  }

  async function openLevelOverlay() {
    var existing = document.getElementById('nova-hero-level-overlay');
    if (existing && !document.querySelector('.nh-level-arena__upgrade')) {
      existing.remove();
    }
    ensureLevelUi();
    try {
      var fx = document.getElementById('nh_level_roll_fx');
      if (fx) {
        fx.hidden = true;
        fx.classList.remove('is-enter', 'is-win', 'is-fail');
        fx.setAttribute('aria-hidden', 'true');
        var t = fx.querySelector('.nh-level-roll-fx__txt');
        if (t) t.textContent = 'Şans deneniyor…';
      }
    } catch (_) {}
    closePerksDrawer();
    var ov = document.getElementById('nova-hero-level-overlay');
    if (!ov) return;
    document.body.appendChild(ov);
    ov.style.zIndex = String(Z_OVERLAY);
    uiState.data = null;
    if (typeof getStoreStudentData === 'function') {
      uiState.data = await getStoreStudentData(true);
    }
    /* Kaldırılan kahramanlar (örn. Anka) için migrasyon/temizlik */
    uiState.data = await sanitizePurchasedHeroes(uiState.data);
    var target = resolveEquippedLevelTarget(uiState.data);
    if (!target.ok) {
      if (typeof showAlert === 'function') {
        await showAlert(levelOverlayBlockedMessage(target.reason));
      }
      return;
    }
    uiState.heroId = target.heroId;
    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nova-hero-level-open');
    document.body.style.overflow = 'hidden';
    await refreshLevelPanel();
  }

  function closeLevelOverlay() {
    var ov = document.getElementById('nova-hero-level-overlay');
    if (!ov) return;
    closePerksDrawer();
    ov.classList.remove('is-open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nova-hero-level-open');
    document.body.style.overflow = '';
    var vic = document.getElementById('nh_level_victory');
    if (vic) {
      vic.hidden = true;
      vic.classList.remove('is-show');
      vic.innerHTML = '';
    }
  }

  function playVictoryFx(heroId, newLvl) {
    var vic = document.getElementById('nh_level_victory');
    var preview = document.getElementById('nh_level_hero_preview');
    if (!vic) return;
    vic.hidden = false;
    vic.setAttribute('aria-hidden', 'false');
    vic.innerHTML =
      '<div class="nh-level-victory__burst"></div>'
      + '<div class="nh-level-victory__ring"></div>'
      + '<div class="nh-level-victory__content">'
      + '<div class="nh-level-victory__title">SEVİYE ATLADI!</div>'
      + '<div class="nh-level-victory__level">★ ' + newLvl + ' · ' + (LEVEL_LABELS[newLvl] || '') + '</div>'
      + '<div class="nh-level-victory__name">' + heroName(heroId) + ' güçlendi</div>'
      + '</div>';
    vic.classList.add('is-show');
    if (preview) preview.classList.add('nh-level-hero-preview--power-up');
    setTimeout(function () {
      if (preview) preview.classList.remove('nh-level-hero-preview--power-up');
      vic.classList.remove('is-show');
      setTimeout(function () {
        vic.hidden = true;
        vic.innerHTML = '';
      }, 600);
    }, 2400);
    try {
      if (typeof window.novaPlayDiamondRewardSfx === 'function') window.novaPlayDiamondRewardSfx();
    } catch (_) {}
  }

  async function onRollUpgrade() {
    var s = getStudent();
    if (!s || !s.classId || !s.studentId) return;

    var ref = database.ref('classes/' + s.classId + '/students/' + s.studentId);
    var snap = await ref.once('value');
    var user = snap.val() || {};
    uiState.data = user;
    var target = resolveEquippedLevelTarget(user);
    if (!target.ok) {
      if (typeof showAlert === 'function') {
        await showAlert(levelOverlayBlockedMessage(target.reason));
      }
      closeLevelOverlay();
      return;
    }
    var heroId = target.heroId;
    uiState.heroId = heroId;
    if (String(user.battleHero || '').trim() !== heroId) {
      showResultBanner('fail', 'BAŞARISIZ', 'Seviye denemesi yalnızca kuşandığın kahraman için yapılabilir.');
      return;
    }
    var lvl = getHeroLevelFromData(user, heroId);
    if (lvl >= MAX_LEVEL) return;
    var target = lvl + 1;
    var cost = getUpgradeCost(target);
    var chance = getUpgradeChance(target);
    if (!cost) return;

    var diamonds = Number(user.diamond) || 0;
    var credits = Number(user.duelCredits) || 0;
    if (diamonds < cost.diamonds || credits < cost.duelCredits) {
      showResultBanner('fail', 'BAŞARISIZ', 'Yeterli elmas veya düello kredin yok.');
      return;
    }

    var msg = cost.duelCredits
      ? (cost.diamonds + ' 💎 ve ' + cost.duelCredits + ' 🎫 harcanacak. Başarı şansı %' + Math.round(chance * 100) + '. Devam?')
      : (cost.diamonds + ' 💎 harcanacak. Başarı şansı %' + Math.round(chance * 100) + '. Devam?');
    var ok = await nhDialogConfirm(msg);
    if (!ok) return;

    var rollBtn = document.getElementById('nh_level_roll');
    var rollFx = document.getElementById('nh_level_roll_fx');
    var panel = document.querySelector('.nh-level-panel');
    var arena = document.getElementById('nh_level_stage');
    hideResultBanner();
    if (rollBtn) rollBtn.disabled = true;
    if (panel) panel.classList.add('is-rolling');
    if (arena) arena.classList.add('is-rolling');
    if (rollFx) {
      rollFx.classList.remove('is-win', 'is-fail');
      rollFx.classList.add('is-enter');
      rollFx.hidden = false;
      rollFx.setAttribute('aria-hidden', 'false');
      try {
        var t = rollFx.querySelector('.nh-level-roll-fx__txt');
        if (t) t.textContent = 'Şans deneniyor…';
      } catch (_) {}
      requestAnimationFrame(function () {
        try { rollFx.classList.remove('is-enter'); } catch (_) {}
      });
    }
    await waitMs(1600);

    var success = Math.random() < chance;
    var entry = user.purchasedBattleHeroes && user.purchasedBattleHeroes[heroId];
    var base = parseHeroOwnership(entry);
    if (!base.owned) {
      showResultBanner('fail', 'BAŞARISIZ', 'Bu kahraman hesabında bulunamadı.');
      if (rollBtn) rollBtn.disabled = false;
      if (panel) panel.classList.remove('is-rolling');
      if (arena) arena.classList.remove('is-rolling');
      if (rollFx) rollFx.hidden = true;
      return;
    }

    var newLevel = base.level;
    if (success && target > base.level) newLevel = target;

    try {
      await ref.update({
        diamond: diamonds - cost.diamonds,
        duelCredits: credits - cost.duelCredits,
        ['purchasedBattleHeroes/' + heroId]: {
          level: newLevel,
          upgradedAt: Date.now()
        }
      });
    } catch (e) {
      console.error('hero level upgrade', e);
      if (panel) panel.classList.remove('is-rolling');
      if (arena) arena.classList.remove('is-rolling');
      if (rollFx) rollFx.hidden = true;
      showResultBanner('fail', 'BAŞARISIZ', 'Bağlantı hatası. Tekrar dene.');
      if (rollBtn) rollBtn.disabled = false;
      return;
    }

    if (panel) panel.classList.remove('is-rolling');
    if (arena) arena.classList.remove('is-rolling');
    // Sonucu ortada göster (kısa süre), sonra kapat
    if (rollFx) {
      try {
        var txt = rollFx.querySelector('.nh-level-roll-fx__txt');
        if (success) {
          rollFx.classList.add('is-win');
          if (txt) txt.textContent = 'BAŞARILI!';
        } else {
          rollFx.classList.add('is-fail');
          if (txt) txt.textContent = 'BAŞARISIZ';
        }
      } catch (_) {}
      setTimeout(function () {
        try {
          rollFx.classList.remove('is-win', 'is-fail');
          rollFx.hidden = true;
          rollFx.setAttribute('aria-hidden', 'true');
          var t2 = rollFx.querySelector('.nh-level-roll-fx__txt');
          if (t2) t2.textContent = 'Şans deneniyor…';
        } catch (_) {}
      }, success ? 1100 : 900);
    }
    // no-op

    var fresh = await ref.once('value');
    user = fresh.val() || {};
    uiState.data = user;
    try {
      s.diamond = user.diamond;
      s.duelCredits = user.duelCredits;
      s.purchasedBattleHeroes = user.purchasedBattleHeroes;
      window.selectedStudent = s;
      localStorage.setItem('selectedStudent', JSON.stringify(s));
    } catch (_) {}
    try {
      if (typeof updateDiamondCount === 'function') updateDiamondCount();
      var cv = document.getElementById('currentDiamonds');
      if (cv) cv.textContent = String(user.diamond || 0);
      var dv = document.getElementById('duel-credits-value');
      if (dv) dv.textContent = String(user.duelCredits || 0);
    } catch (_) {}

    var preview = document.getElementById('nh_level_hero_preview');
    if (success) {
      playVictoryFx(heroId, newLevel);
      showResultBanner('win', 'BAŞARILI!', heroName(heroId) + ' artık Seviye ' + newLevel + ' · ' + (LEVEL_LABELS[newLevel] || ''));
      if (preview) {
        preview.classList.add('nh-level-hero-preview--success-flash');
        setTimeout(function () { preview.classList.remove('nh-level-hero-preview--success-flash'); }, 1200);
      }
    } else {
      showResultBanner('fail', 'BAŞARISIZ', 'Kaynaklar harcandı. Şansını tekrar dene!');
      if (preview) {
        preview.classList.add('nh-level-hero-preview--fail-shake');
        setTimeout(function () { preview.classList.remove('nh-level-hero-preview--fail-shake'); }, 700);
      }
    }

  // Not: animasyonların görünmesi için preview'ı hemen yeniden mount etmiyoruz.
    updatePanelStats();
    setTimeout(function () {
      try { mountHeroPreview(heroId); } catch (_) {}
    }, success ? 1200 : 800);
    try {
      if (typeof novaRenderBattleHeroStore === 'function') {
        await novaRenderBattleHeroStore('__battleHeroesTemel');
      }
    } catch (_) {}
    try {
      window.__novaMainHeroLevelFetched = newLevel;
      if (heroId === getEquippedHeroId()) {
        window.__novaMainHeroLevelFetched = newLevel;
      }
      if (typeof window.novaRefreshMainHeroStars === 'function') window.novaRefreshMainHeroStars();
      if (typeof window.refreshMainScreenHero === 'function') window.refreshMainScreenHero();
    } catch (_) {}
  }

  function dailyRetryKey(activity) {
    return activity + ':' + todayKey();
  }

  function canUseDailyRetry(activity) {
    var perks = getActivePerks();
    if (!perks || !perks.dailyRetryOnWrong) return false;
    return !dailyRetryUsed[dailyRetryKey(activity)];
  }

  function markDailyRetryUsed(activity) {
    dailyRetryUsed[dailyRetryKey(activity)] = true;
  }

  async function offerDailyHeroRetry(activityLabel, opts) {
    opts = opts || {};
    if (!canUseDailyRetry(activityLabel)) return false;
    var waitMs = opts.waitMs;
    if (waitMs !== 0) {
      await new Promise(function (resolve) {
        setTimeout(resolve, waitMs > 0 ? waitMs : 1500);
      });
    }
    var ok = await nhGlobalConfirm(
      '❌ Yanlış cevap verdin.\n\n'
      + '🦸 Kahraman gücün bugün sana 1 ek deneme hakkı veriyor.\n'
      + 'Tekrar denemek ister misin?'
    );
    if (!ok) return false;
    markDailyRetryUsed(activityLabel);
    return true;
  }

  function resetSpRevealForGame() {
    var perks = getActivePerks();
    spRevealState.max = perks ? perks.spWrongRevealPerGame : 0;
    spRevealState.used = 0;
    spRevealState.questionIndex = -1;
  }

  function ensureSpHeroFeatureBar() {
    var hud = document.querySelector('#single-player-game-screen .nova-sp-game-hud');
    if (!hud) return;
    var existing = document.getElementById('nova-sp-hero-feature-bar');
    if (existing && !document.getElementById('nova_sp_hero_reveal_btn')) {
      existing.remove();
      existing = null;
    }
    if (existing) return;
    var bar = document.createElement('div');
    bar.id = 'nova-sp-hero-feature-bar';
    bar.className = 'nova-sp-hero-feature-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<button type="button" class="nova-sp-hero-reveal-btn" id="nova_sp_hero_reveal_btn" aria-label="Yanlış şık göster">'
      + '<span class="nova-sp-hero-feature-bar__icon" id="nova_sp_hero_feat_icon">🦸</span>'
      + '<span class="nova-sp-hero-feature-bar__text" id="nova_sp_hero_feat_text">Kahraman özelliği</span>'
      + '<span class="nova-sp-hero-feature-bar__count" id="nova_sp_hero_feat_count"></span>'
      + '</button>';
    hud.appendChild(bar);
    bindSpRevealButton(btn);
  }

  function bindSpRevealButton(btn) {
    if (!btn || btn.__novaRevealBound) return;
    btn.__novaRevealBound = true;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      revealOneWrongOption(e);
    });
  }

  function refreshSpHeroFeatureBar() {
    ensureSpHeroFeatureBar();
    var bar = document.getElementById('nova-sp-hero-feature-bar');
    if (!bar) return;
    var perks = getActivePerks();
    if (!perks || !perks.spWrongRevealPerGame) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    var left = Math.max(0, spRevealState.max - spRevealState.used);
    var txt = document.getElementById('nova_sp_hero_feat_text');
    var cnt = document.getElementById('nova_sp_hero_feat_count');
    var icon = document.getElementById('nova_sp_hero_feat_icon');
    var lvl = getEquippedHeroLevel();
    if (txt) txt.textContent = 'Kahraman özelliği · Yanlış şıkkı göster';
    if (cnt) cnt.textContent = left + ' / ' + spRevealState.max;
    if (icon) icon.textContent = lvl >= 4 ? '👑' : (lvl >= 3 ? '✨' : '🦸');
    var btn = document.getElementById('nova_sp_hero_reveal_btn');
    var disabled = left <= 0;
    if (btn) btn.disabled = disabled;
    bar.classList.toggle('is-disabled', disabled);
  }

  function revealOneWrongOption() {
    var perks = getActivePerks();
    if (!perks || !perks.spWrongRevealPerGame) return;
    if (spRevealState.max < 1) resetSpRevealForGame();
    if (spRevealState.used >= spRevealState.max) { refreshSpHeroFeatureBar(); return; }
    var buttons = Array.prototype.slice.call(document.querySelectorAll('#options-container .option-button'));
    if (!buttons.length) return;
    var target = buttons.find(function (b) {
      if (!b || b.disabled) return false;
      if (b.classList.contains('option-chosen')) return false;
      if (b.classList.contains('nova-hero-revealed-wrong')) return false;
      return String(b.dataset.correct) !== 'true';
    }) || null;
    if (!target) return;
    animateHeroToOptionAndDisable(target);
  }

  function isCorrectOption(btn) {
    if (!btn) return false;
    var v = btn.dataset.correct;
    return v === 'true' || v === true || v === '1';
  }

  function finishRevealWrong(btn, fly) {
    if (fly && fly.parentNode) fly.parentNode.removeChild(fly);
    markOptionRevealedWrong(btn);
    spRevealState.used++;
    var revealBtn = document.getElementById('nova_sp_hero_reveal_btn');
    if (revealBtn) revealBtn.disabled = false;
    refreshSpHeroFeatureBar();
  }

  function animateHeroToOptionAndDisable(btn) {
    var revealBtn = document.getElementById('nova_sp_hero_reveal_btn');
    if (revealBtn) revealBtn.disabled = true;

    try {
      var barIcon = document.getElementById('nova_sp_hero_feat_icon');
      var fromRect = barIcon ? barIcon.getBoundingClientRect() : null;
      var toRect = btn.getBoundingClientRect();
      if (!toRect || !toRect.width) {
        finishRevealWrong(btn, null);
        return;
      }

      var fly = document.createElement('div');
      fly.className = 'nh-sp-fly-hero';
      document.body.appendChild(fly);

      var heroId = getEquippedHeroId();
      if (heroId && typeof window.novaMountHeroInto === 'function') {
        var host = document.createElement('div');
        host.className = 'nova-hero-svg-host';
        fly.appendChild(host);
        window.novaMountHeroInto(host, heroId);
      } else {
        fly.textContent = '🦸';
        fly.style.fontSize = '32px';
      }

      var sx = fromRect ? (fromRect.left + fromRect.width / 2) : (window.innerWidth * 0.5);
      var sy = fromRect ? (fromRect.top + fromRect.height / 2) : (toRect.top - 40);
      fly.style.left = (sx - 23) + 'px';
      fly.style.top = (sy - 23) + 'px';

      var tx = (toRect.left + toRect.width / 2) - sx;
      var ty = (toRect.top + toRect.height / 2) - sy;

      var done = false;
      function complete() {
        if (done) return;
        done = true;
        finishRevealWrong(btn, fly);
      }

      if (typeof fly.animate === 'function') {
        var anim = fly.animate([
          { transform: 'translate(0px, 0px) scale(1) rotate(-8deg)', opacity: 1 },
          { transform: 'translate(' + (tx * 0.55) + 'px, ' + (ty * 0.55) + 'px) scale(1.12) rotate(6deg)', opacity: 1 },
          { transform: 'translate(' + tx + 'px, ' + ty + 'px) scale(0.95) rotate(0deg)', opacity: 1 }
        ], { duration: 580, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'forwards' });
        anim.onfinish = complete;
        anim.oncancel = complete;
        setTimeout(complete, 700);
      } else {
        complete();
      }
    } catch (_) {
      finishRevealWrong(btn, null);
    }
  }

  function bindSpRevealOnOptions() {
    refreshSpHeroFeatureBar();
  }

  function markOptionRevealedWrong(btn) {
    if (!btn) return;
    btn.classList.add('nova-hero-revealed-wrong');
    btn.setAttribute('aria-disabled', 'true');
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
  }

  function nhGlobalConfirm(message) {
    return new Promise(function (resolve) {
      var existing = document.getElementById('nh-global-confirm');
      if (existing) existing.remove();
      var host = document.createElement('div');
      host.id = 'nh-global-confirm';
      host.style.position = 'fixed';
      host.style.inset = '0';
      host.style.zIndex = '101350';
      host.style.background = 'rgba(0,0,0,.62)';
      host.style.display = 'flex';
      host.style.alignItems = 'center';
      host.style.justifyContent = 'center';
      host.style.padding = '16px';
      host.innerHTML =
        '<div style="width:min(92vw,420px);border-radius:18px;border:1px solid rgba(255,255,255,.14);'
        + 'background:linear-gradient(165deg,#1a2138 0%,#0e121f 52%,#141c2e 100%);'
        + 'box-shadow:0 28px 70px rgba(0,0,0,.55);padding:16px 16px 14px;color:#e2e8f0;">'
        + '<p style="margin:0 0 12px;font-weight:800;line-height:1.45;white-space:pre-line;">' + message + '</p>'
        + '<div style="display:flex;gap:10px;justify-content:flex-end;">'
        + '<button type="button" id="nh_global_yes" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(34,197,94,.45);'
        + 'background:linear-gradient(135deg,#22c55e,#16a34a);color:#052e16;font-weight:900;cursor:pointer;">Evet</button>'
        + '<button type="button" id="nh_global_no" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);'
        + 'background:rgba(15,23,42,.7);color:#e2e8f0;font-weight:900;cursor:pointer;">Vazgeç</button>'
        + '</div></div>';
      document.body.appendChild(host);
      function done(v) { host.remove(); resolve(v); }
      host.addEventListener('click', function (e) { if (e.target === host) done(false); });
      host.querySelector('#nh_global_yes').addEventListener('click', function () { done(true); });
      host.querySelector('#nh_global_no').addEventListener('click', function () { done(false); });
    });
  }

  function patchStoreHub() {
    if (window.novaStoreHubInit && !window.novaStoreHubInit.__heroLevelPatched) {
      var origInit = window.novaStoreHubInit;
      window.novaStoreHubInit = async function () {
        await origInit.apply(this, arguments);
        ensureStoreLevelBar();
        setStoreLevelBarVisible(false);
      };
      window.novaStoreHubInit.__heroLevelPatched = true;
    }
  }

  function patchSinglePlayer() {
    if (typeof displayCurrentQuestion === 'function' && !displayCurrentQuestion.__heroLevelPatched) {
      var origDisp = displayCurrentQuestion;
      window.displayCurrentQuestion = function () {
        var r = origDisp.apply(this, arguments);
        setTimeout(bindSpRevealOnOptions, 30);
        refreshSpHeroFeatureBar();
        return r;
      };
      displayCurrentQuestion.__heroLevelPatched = true;
    }
    var startBtn = document.getElementById('start-game-button');
    if (startBtn && !startBtn.__heroLevelPatched) {
      startBtn.addEventListener('click', function () {
        resetSpRevealForGame();
        setTimeout(refreshSpHeroFeatureBar, 100);
      });
      startBtn.__heroLevelPatched = true;
    }
  }

  window.NOVA_HERO_LEVEL = {
    MAX_LEVEL: MAX_LEVEL,
    UPGRADE_COSTS: UPGRADE_COSTS,
    UPGRADE_CHANCE: UPGRADE_CHANCE,
    PERK_LINES: PERK_LINES,
    getHeroLevelFromData: getHeroLevelFromData,
    ownsHeroLevel: ownsHeroLevel,
    getEquippedHeroLevel: getEquippedHeroLevel,
    getHeroLevelFromData: getHeroLevelFromData,
    getActivePerks: getActivePerks,
    getPerksForLevel: getPerksForLevel,
    getPerkSummaryLines: getPerkSummaryLines,
    parseHeroOwnership: parseHeroOwnership,
    listOwnedHeroes: listOwnedHeroes,
    openLevelOverlay: openLevelOverlay,
    setStoreLevelBarVisible: setStoreLevelBarVisible,
    canUseDailyRetry: canUseDailyRetry,
    offerDailyHeroRetry: offerDailyHeroRetry,
    markDailyRetryUsed: markDailyRetryUsed,
    resetSpRevealForGame: resetSpRevealForGame,
    refreshSpHeroFeatureBar: refreshSpHeroFeatureBar,
    getDuelCupBonus: function (data) {
      var p = getActivePerks(data);
      return p ? p.duelCupBonus : 0;
    },
    getDuelCreditBonusOnWin: function (data) {
      var p = getActivePerks(data);
      return p ? p.duelCreditBonusOnWin : 0;
    },
    getQuestBonusDiamonds: function (data) {
      var p = getActivePerks(data);
      return p ? p.questBonusDiamonds : 0;
    },
    getDailyDiamondMultiplier: function (data) {
      var p = getActivePerks(data);
      return p ? p.dailyDiamondMultiplier : 1;
    }
  };

  window.novaHeroLevelOpen = openLevelOverlay;
  window.novaHeroGetActivePerks = getActivePerks;
  window.novaHeroGetEquippedLevel = getEquippedHeroLevel;
  window.novaHeroOfferDailyRetry = offerDailyHeroRetry;
  window.novaHeroGetDailyDiamondMultiplier = function (d) {
    return window.NOVA_HERO_LEVEL.getDailyDiamondMultiplier(d);
  };

  if (!document.__novaSpRevealDelegated) {
    document.__novaSpRevealDelegated = true;
    document.addEventListener('click', function (e) {
      var hit = e.target && e.target.closest ? e.target.closest('#nova_sp_hero_reveal_btn, .nova-sp-hero-reveal-btn') : null;
      if (!hit || hit.disabled) return;
      e.preventDefault();
      e.stopPropagation();
      revealOneWrongOption();
    }, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensureStoreLevelBar();
    ensureLevelUi();
    patchStoreHub();
    patchSinglePlayer();
    setTimeout(patchSinglePlayer, 400);
    setTimeout(patchSinglePlayer, 1200);
  });
})();
