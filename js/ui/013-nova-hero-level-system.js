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
    if (data) return getHeroLevelFromData(data, heroId);
    var s = getStudent();
    if (s && s.purchasedBattleHeroes) return getHeroLevelFromData(s, heroId);
    return 0;
  }

  function getPerksForLevel(level) {
    level = Math.min(MAX_LEVEL, Math.max(0, Number(level) || 0));
    return CUMULATIVE[level] || CUMULATIVE[1];
  }

  function getActivePerks(data) {
    var lvl = getEquippedHeroLevel(data);
    if (lvl < 1) return null;
    return getPerksForLevel(lvl);
  }

  function listOwnedHeroes(data) {
    var out = [];
    var pb = (data && data.purchasedBattleHeroes) || {};
    Object.keys(pb).forEach(function (id) {
      var o = parseHeroOwnership(pb[id]);
      if (o.owned) out.push({ id: id, level: o.level });
    });
    return out;
  }

  function heroName(heroId) {
    try {
      if (window.NOVA_HERO_REGISTRY && window.NOVA_HERO_REGISTRY[heroId]) return window.NOVA_HERO_REGISTRY[heroId].name;
    } catch (_) {}
    if (heroId === 'blaze_robot') return 'Alev Bot';
    if (heroId === 'star_fairy') return 'Yıldız Perisi';
    return heroId;
  }

  function heroTheme(heroId) {
    try {
      if (window.NOVA_HERO_REGISTRY && window.NOVA_HERO_REGISTRY[heroId]) return window.NOVA_HERO_REGISTRY[heroId].theme || 'blaze';
    } catch (_) {}
    return heroId === 'star_fairy' ? 'star' : 'blaze';
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
      + '<div><h2 id="nh_level_title">⚔️ Kahraman Seviye Artışı</h2>'
      + '<p class="nh-level-sub">Kahramanına dokun · şansını dene</p></div>'
      + '<button type="button" class="nh-level-close" id="nh_level_close" aria-label="Kapat">✕</button>'
      + '</header>'
      + '<p class="nh-level-pick-label">Kahramanını seç</p>'
      + '<div class="nh-level-hero-pick" id="nh_level_hero_pick"></div>'
      + '<div class="nh-level-body">'
      + '<div class="nh-level-stage" id="nh_level_stage">'
      + '<div class="nh-level-hero-preview" id="nh_level_hero_preview"></div>'
      + '<div class="nh-level-orb" id="nh_level_orb" hidden><span class="nh-level-orb__inner" id="nh_level_orb_txt">?</span></div>'
      + '</div>'
      + '<div class="nh-level-info">'
      + '<div class="nh-level-stars" id="nh_level_stars"></div>'
      + '<div class="nh-level-cost" id="nh_level_cost"></div>'
      + '<div class="nh-level-chance" id="nh_level_chance"></div>'
      + '<ul class="nh-level-perks" id="nh_level_perks_now"></ul>'
      + '<div class="nh-level-next" id="nh_level_next_wrap">'
      + '<div class="nh-level-next-title">Sonraki seviye özellikleri</div>'
      + '<ul class="nh-level-perks nh-level-perks--next" id="nh_level_perks_next"></ul>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="nh-level-actions">'
      + '<button type="button" class="nh-level-btn nh-level-btn--roll" id="nh_level_roll" disabled>🎲 Seviye Yükselt</button>'
      + '<button type="button" class="nh-level-btn nh-level-btn--ghost" id="nh_level_done">Kapat</button>'
      + '</div>'
      + '<div class="nh-level-result" id="nh_level_result" hidden></div>'
      + '<div class="nh-level-victory" id="nh_level_victory" hidden aria-hidden="true"></div>'
      + '</div>';
    document.body.appendChild(ov);
    document.getElementById('nh_level_close').addEventListener('click', closeLevelOverlay);
    document.getElementById('nh_level_done').addEventListener('click', closeLevelOverlay);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeLevelOverlay();
    });
    document.getElementById('nh_level_roll').addEventListener('click', onRollUpgrade);
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
      + '<span class="nova-store-hero-level-btn__sub">Şansını dene · 4 seviyeye kadar</span>'
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

  function renderPerkList(el, level) {
    if (!el) return;
    var lines = PERK_LINES[level] || [];
    el.innerHTML = lines.map(function (l) {
      return '<li>' + l + '</li>';
    }).join('');
  }

  function mountHeroPreview(heroId) {
    var box = document.getElementById('nh_level_hero_preview');
    if (!box) return;
    box.innerHTML = '';
    box.className = 'nh-level-hero-preview nh-level-hero-preview--' + heroTheme(heroId);
    var host = document.createElement('div');
    host.className = 'nh-level-hero-preview__host nova-hero-mount--' + heroId.replace(/_/g, '-');
    box.appendChild(host);
    if (typeof window.novaMountHeroInto === 'function') {
      window.novaMountHeroInto(host, heroId);
    }
  }

  async function refreshLevelPanel() {
    var data = uiState.data;
    if (!data && typeof getStoreStudentData === 'function') {
      data = await getStoreStudentData(true);
      uiState.data = data;
    }
    var heroId = uiState.heroId;
    if (!heroId) {
      var owned = listOwnedHeroes(data);
      heroId = owned.length ? owned[0].id : '';
      uiState.heroId = heroId;
    }
    var lvl = getHeroLevelFromData(data, heroId);
    var next = Math.min(MAX_LEVEL, lvl + 1);
    var stars = document.getElementById('nh_level_stars');
    var costEl = document.getElementById('nh_level_cost');
    var chanceEl = document.getElementById('nh_level_chance');
    var rollBtn = document.getElementById('nh_level_roll');
    var nextWrap = document.getElementById('nh_level_next_wrap');
    var resultEl = document.getElementById('nh_level_result');

    mountHeroPreview(heroId);
    renderHeroPick(data);

    if (stars) {
      stars.innerHTML = '<span class="nh-level-stars-label">Seviye ' + lvl + ' · ' + (LEVEL_LABELS[lvl] || '') + '</span>' + renderStars(lvl);
    }
    renderPerkList(document.getElementById('nh_level_perks_now'), lvl);

    if (lvl >= MAX_LEVEL) {
      if (costEl) costEl.innerHTML = '<span class="nh-level-maxed">🏆 Maksimum seviye — Kozmik güç aktif!</span>';
      if (chanceEl) chanceEl.textContent = '';
      if (nextWrap) nextWrap.hidden = true;
      if (rollBtn) {
        rollBtn.disabled = true;
        rollBtn.textContent = 'Maksimum Seviye';
      }
    } else {
      var cost = getUpgradeCost(next);
      var pct = Math.round(getUpgradeChance(next) * 100);
      if (costEl) {
        costEl.innerHTML = 'Maliyet: <strong>💎 ' + cost.diamonds + '</strong>'
          + (cost.duelCredits ? ' + <strong>🎫 ' + cost.duelCredits + ' düello kredisi</strong>' : '')
          + ' <span class="nh-level-burn">(başarısız olsa da harcanır)</span>';
      }
      if (chanceEl) chanceEl.textContent = 'Seviye ' + next + ' şansı: %' + pct;
      if (nextWrap) {
        nextWrap.hidden = false;
        renderPerkList(document.getElementById('nh_level_perks_next'), next);
      }
      var diamonds = Number(data && data.diamond) || 0;
      var credits = Number(data && data.duelCredits) || 0;
      var canPay = diamonds >= cost.diamonds && credits >= cost.duelCredits;
      if (rollBtn) {
        rollBtn.disabled = !canPay || !heroId;
        rollBtn.textContent = canPay ? '🎲 Seviye Yükselt (Şans %' + pct + ')' : 'Kaynak yetersiz';
      }
    }
    if (resultEl) resultEl.hidden = true;
  }

  function renderHeroPick(data) {
    var pick = document.getElementById('nh_level_hero_pick');
    if (!pick) return;
    var owned = listOwnedHeroes(data);
    pick.innerHTML = '';
    owned.forEach(function (h) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'nh-level-hero-card nh-level-hero-card--' + heroTheme(h.id)
        + (h.id === uiState.heroId ? ' is-active' : '');
      card.setAttribute('aria-label', heroName(h.id) + ' seviye ' + h.level);
      card.innerHTML =
        '<span class="nh-level-hero-card__frame">'
        + '<span class="nh-level-hero-card__host" data-hero-pick="' + h.id + '"></span>'
        + '</span>'
        + '<span class="nh-level-hero-card__badge">★' + h.level + '</span>';
      card.addEventListener('click', function () {
        uiState.heroId = h.id;
        refreshLevelPanel();
      });
      pick.appendChild(card);
      var host = card.querySelector('[data-hero-pick]');
      if (host && typeof window.novaMountHeroInto === 'function') {
        window.novaMountHeroInto(host, h.id);
      }
    });
  }

  async function openLevelOverlay() {
    ensureLevelUi();
    var ov = document.getElementById('nova-hero-level-overlay');
    if (!ov) return;
    document.body.appendChild(ov);
    ov.style.zIndex = String(Z_OVERLAY);
    uiState.data = null;
    if (typeof getStoreStudentData === 'function') {
      uiState.data = await getStoreStudentData(true);
    }
    var owned = listOwnedHeroes(uiState.data);
    if (!owned.length) {
      if (typeof showAlert === 'function') await showAlert('Önce mağazadan bir kahraman satın almalısın.');
      return;
    }
    uiState.heroId = (uiState.data && uiState.data.battleHero && ownsHeroLevel(uiState.data, uiState.data.battleHero))
      ? uiState.data.battleHero
      : owned[0].id;
    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nova-hero-level-open');
    document.body.style.overflow = 'hidden';
    await refreshLevelPanel();
  }

  function closeLevelOverlay() {
    var ov = document.getElementById('nova-hero-level-overlay');
    if (!ov) return;
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
    var heroId = uiState.heroId;
    if (!heroId) return;

    var ref = database.ref('classes/' + s.classId + '/students/' + s.studentId);
    var snap = await ref.once('value');
    var user = snap.val() || {};
    var lvl = getHeroLevelFromData(user, heroId);
    if (lvl >= MAX_LEVEL) return;
    var target = lvl + 1;
    var cost = getUpgradeCost(target);
    var chance = getUpgradeChance(target);
    if (!cost) return;

    var diamonds = Number(user.diamond) || 0;
    var credits = Number(user.duelCredits) || 0;
    if (diamonds < cost.diamonds || credits < cost.duelCredits) {
      var resultEl0 = document.getElementById('nh_level_result');
      if (resultEl0) {
        resultEl0.hidden = false;
        resultEl0.className = 'nh-level-result is-loss';
        resultEl0.textContent = 'Yeterli elmas veya düello kredin yok.';
      }
      return;
    }

    var msg = cost.duelCredits
      ? (cost.diamonds + ' 💎 ve ' + cost.duelCredits + ' 🎫 harcanacak. Başarı şansı %' + Math.round(chance * 100) + '. Devam?')
      : (cost.diamonds + ' 💎 harcanacak. Başarı şansı %' + Math.round(chance * 100) + '. Devam?');
    var ok = await nhDialogConfirm(msg);
    if (!ok) return;

    var rollBtn = document.getElementById('nh_level_roll');
    var orb = document.getElementById('nh_level_orb');
    var orbTxt = document.getElementById('nh_level_orb_txt');
    var resultEl = document.getElementById('nh_level_result');
    var panel = document.querySelector('.nh-level-panel');
    if (rollBtn) rollBtn.disabled = true;
    if (panel) panel.classList.add('is-rolling');

    if (orb) {
      orb.hidden = false;
      orb.classList.add('is-rolling');
    }
    if (orbTxt) orbTxt.textContent = '…';
    await waitMs(1500);

    var success = Math.random() < chance;
    var entry = user.purchasedBattleHeroes && user.purchasedBattleHeroes[heroId];
    var base = parseHeroOwnership(entry);
    if (!base.owned) {
      if (resultEl) {
        resultEl.hidden = false;
        resultEl.className = 'nh-level-result is-loss';
        resultEl.textContent = 'Bu kahraman sende kayıtlı değil.';
      }
      if (rollBtn) rollBtn.disabled = false;
      if (panel) panel.classList.remove('is-rolling');
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
      if (orb) orb.classList.remove('is-rolling');
      if (panel) panel.classList.remove('is-rolling');
      if (resultEl) {
        resultEl.hidden = false;
        resultEl.className = 'nh-level-result is-loss';
        resultEl.innerHTML = '<strong>Bağlantı hatası.</strong> İnternetini kontrol edip tekrar dene.';
      }
      if (rollBtn) rollBtn.disabled = false;
      return;
    }

    if (orb) {
      orb.classList.remove('is-rolling');
      orb.classList.add(success ? 'is-success' : 'is-fail');
    }
    if (orbTxt) orbTxt.textContent = success ? '★' : '×';
    await waitMs(500);
    if (orb) {
      orb.classList.remove('is-success', 'is-fail');
      orb.hidden = true;
    }
    if (panel) panel.classList.remove('is-rolling');

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

    if (success) {
      playVictoryFx(heroId, newLevel);
      if (resultEl) {
        resultEl.hidden = false;
        resultEl.className = 'nh-level-result is-win';
        resultEl.innerHTML = '<strong>🎉 Seviye ' + newLevel + '!</strong> ' + heroName(heroId) + ' yeni güçler kazandı.';
      }
    } else {
      if (resultEl) {
        resultEl.hidden = false;
        resultEl.className = 'nh-level-result is-loss';
        resultEl.innerHTML = '<strong>💨 Bu sefer olmadı.</strong> Kaynaklar harcandı — şansını tekrar dene!';
      }
    }

    await refreshLevelPanel();
    try {
      if (typeof novaRenderBattleHeroStore === 'function') await novaRenderBattleHeroStore();
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

  async function offerDailyHeroRetry(activityLabel) {
    if (!canUseDailyRetry(activityLabel)) return false;
    var ok = false;
    if (typeof showConfirmation === 'function') {
      ok = await showConfirmation('🦸 Kahraman gücü: yanlış cevapta 1 ek deneme hakkın var. Tekrar dene?');
    }
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
    if (!hud || document.getElementById('nova-sp-hero-feature-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'nova-sp-hero-feature-bar';
    bar.className = 'nova-sp-hero-feature-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<span class="nova-sp-hero-feature-bar__icon" id="nova_sp_hero_feat_icon">🦸</span>'
      + '<span class="nova-sp-hero-feature-bar__text" id="nova_sp_hero_feat_text">Kahraman özelliği</span>'
      + '<span class="nova-sp-hero-feature-bar__count" id="nova_sp_hero_feat_count"></span>';
    hud.appendChild(bar);
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
  }

  function bindSpRevealOnOptions() {
    var perks = getActivePerks();
    if (!perks || !perks.spWrongRevealPerGame) return;
    var qIdx = typeof currentQuestionIndex !== 'undefined' ? currentQuestionIndex : -1;
    if (spRevealState.questionIndex !== qIdx) spRevealState.questionIndex = qIdx;
    var buttons = document.querySelectorAll('#options-container .option-button');
    buttons.forEach(function (btn) {
      if (btn.dataset.novaRevealBound === '1') return;
      btn.dataset.novaRevealBound = '1';
      btn.addEventListener('click', function heroRevealClick(ev) {
        if (btn.disabled || btn.classList.contains('option-chosen')) return;
        if (spRevealState.used >= spRevealState.max) return;
        if (btn.dataset.correct === 'true') return;
        if (btn.classList.contains('nova-hero-revealed-wrong')) return;
        ev.stopPropagation();
        ev.preventDefault();
        btn.classList.add('nova-hero-revealed-wrong');
        spRevealState.used++;
        refreshSpHeroFeatureBar();
      }, true);
    });
    refreshSpHeroFeatureBar();
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
    getActivePerks: getActivePerks,
    getPerksForLevel: getPerksForLevel,
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

  document.addEventListener('DOMContentLoaded', function () {
    ensureStoreLevelBar();
    ensureLevelUi();
    patchStoreHub();
    setTimeout(patchSinglePlayer, 800);
  });
})();
