/* Ana ekran kahraman — seviye rozeti + detay sayfası */
(function () {
  var MAX_STARS = 4;

  function getStudent() {
    try {
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) return selectedStudent;
      return JSON.parse(localStorage.getItem('selectedStudent') || 'null');
    } catch (_) {
      return null;
    }
  }

  function getHeroLevel() {
    var s = getStudent();
    if (!s || !s.battleHero) return 0;
    var heroId = String(s.battleHero).trim();
    if (window.NOVA_HERO_LEVEL) {
      if (typeof window.NOVA_HERO_LEVEL.getHeroLevelFromData === 'function') {
        var fromPb = window.NOVA_HERO_LEVEL.getHeroLevelFromData(s, heroId);
        if (fromPb > 0) return fromPb;
      }
      if (typeof window.NOVA_HERO_LEVEL.getEquippedHeroLevel === 'function') {
        return window.NOVA_HERO_LEVEL.getEquippedHeroLevel(s) || 0;
      }
    }
    return 0;
  }

  function getLevelLabel(lvl) {
    var labels = { 1: 'Giriş', 2: 'Usta', 3: 'Efsane', 4: 'Kozmik' };
    return labels[lvl] || ('Seviye ' + lvl);
  }

  function getPerkSummaryLines(lvl) {
    if (window.NOVA_HERO_LEVEL && typeof window.NOVA_HERO_LEVEL.getPerkSummaryLines === 'function') {
      return window.NOVA_HERO_LEVEL.getPerkSummaryLines(lvl);
    }
    return [];
  }

  function ensureHeroFloatWrap() {
    var zone = document.getElementById('nova-main-hero-zone');
    var slot = document.getElementById('nova-main-hero-slot');
    if (!zone || !slot) return null;
    var float = document.getElementById('nova-main-hero-float');
    if (!float) {
      float = document.createElement('div');
      float.id = 'nova-main-hero-float';
      float.className = 'nova-main-hero-float';
      zone.appendChild(float);
      float.appendChild(slot);
    }
    return float;
  }

  function ensureStarsEl() {
    ensureHeroFloatWrap();
    var float = document.getElementById('nova-main-hero-float');
    if (!float) return null;
    var stars = document.getElementById('nova-main-hero-stars');
    if (!stars) {
      stars = document.createElement('div');
      stars.id = 'nova-main-hero-stars';
      stars.className = 'nova-main-hero-stars';
      float.insertBefore(stars, float.firstChild);
    }
    return stars;
  }

  function refreshMainHeroStars() {
    var zone = document.getElementById('nova-main-hero-zone');
    var stars = ensureStarsEl();
    if (!zone || !stars) return;
    var visible = zone.classList.contains('is-visible');
    var lvl = visible ? getHeroLevel() : 0;
    if (!visible) {
      stars.hidden = true;
      stars.innerHTML = '';
      if (typeof window.novaEpicDragonRefreshMainBadge === 'function') {
        window.novaEpicDragonRefreshMainBadge('', false);
      }
      return;
    }
    if (lvl < 1) {
      lvl = 0;
      try {
        if (!window.__novaMainHeroLevelFetchInFlight && typeof database !== 'undefined') {
          var s = getStudent();
          var heroId = s && s.battleHero ? String(s.battleHero).trim() : '';
          if (s && s.classId && s.studentId && heroId) {
            window.__novaMainHeroLevelFetchInFlight = true;
            database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value')
              .then(function (snap) {
                var data = snap.val() || {};
                var l2 = 0;
                try {
                  if (window.NOVA_HERO_LEVEL) {
                    if (typeof window.NOVA_HERO_LEVEL.getHeroLevelFromData === 'function') {
                      l2 = window.NOVA_HERO_LEVEL.getHeroLevelFromData(data, heroId) || 0;
                    }
                    if (l2 < 1 && typeof window.NOVA_HERO_LEVEL.getEquippedHeroLevel === 'function') {
                      l2 = window.NOVA_HERO_LEVEL.getEquippedHeroLevel(data) || 0;
                    }
                  }
                  if (data.purchasedBattleHeroes) {
                    var loc = getStudent();
                    if (loc) {
                      loc.purchasedBattleHeroes = data.purchasedBattleHeroes;
                      window.selectedStudent = loc;
                      localStorage.setItem('selectedStudent', JSON.stringify(loc));
                    }
                  }
                } catch (_) {}
                window.__novaMainHeroLevelFetched = l2;
                if (typeof window.novaRefreshMainHeroStars === 'function') window.novaRefreshMainHeroStars();
              })
              .catch(function () {})
              .finally(function () { window.__novaMainHeroLevelFetchInFlight = false; });
          }
        }
      } catch (_) {}
    }
    // Prefer fetched level if available
    try {
      if (typeof window.__novaMainHeroLevelFetched === 'number' && window.__novaMainHeroLevelFetched > 0) {
        lvl = window.__novaMainHeroLevelFetched;
      }
    } catch (_) {}
    var s = getStudent();
    var heroId = s && s.battleHero ? String(s.battleHero).trim() : '';
    var isEpic = typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId);
    if (isEpic) {
      stars.hidden = true;
      stars.innerHTML = '';
      stars.removeAttribute('aria-label');
    } else {
      stars.hidden = false;
      var html = '';
      for (var i = 1; i <= MAX_STARS; i++) {
        html += '<span class="nova-main-hero-star ' + (i <= lvl ? 'is-on' : 'is-off') + '" aria-hidden="true">★</span>';
      }
      stars.innerHTML = html;
      stars.setAttribute('aria-label', 'Kahraman seviyesi ' + lvl + ' / ' + MAX_STARS);
    }
    if (typeof window.novaEpicDragonRefreshMainBadge === 'function') {
      window.novaEpicDragonRefreshMainBadge(heroId, visible);
    }
  }

  function buildHeroSvgHtml(heroId) {
    var def = window.NOVA_HERO_REGISTRY && window.NOVA_HERO_REGISTRY[heroId];
    if (!def || !window[def.templateKey]) return '';
    var raw = window[def.templateKey];
    var uid = 'hs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return String(raw).split('__UID__').join(uid).replace('<svg ', '<svg class="nova-hero-svg nova-hero-svg--' + (def.theme || 'blaze') + '" ');
  }

  function mountHeroSvg(host, heroId) {
    if (!host || !heroId) return;
    if (typeof window.novaMountHeroInto === 'function') {
      window.novaMountHeroInto(host, heroId);
      if (host.querySelector('svg')) return;
    }
    host.innerHTML = buildHeroSvgHtml(heroId);
  }

  function buildSheetStarsHtml(lvl) {
    var html = '';
    for (var i = 1; i <= MAX_STARS; i++) {
      html += '<span class="nh-hero-sheet__star' + (i <= lvl ? ' is-on' : '') + '" aria-hidden="true">★</span>';
    }
    return html;
  }

  function ensureSheetUi() {
    if (document.getElementById('nh-hero-sheet-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'nh-hero-sheet-overlay';
    ov.className = 'nh-hero-sheet-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
      '<div class="nh-hero-sheet" role="dialog" aria-labelledby="nh_hero_sheet_title">'
      + '<header class="nh-hero-sheet__head">'
      + '<div><h2 class="nh-hero-sheet__title" id="nh_hero_sheet_title"></h2>'
      + '<p class="nh-hero-sheet__level" id="nh_hero_sheet_level"></p></div>'
      + '<button type="button" class="nh-hero-sheet__close" id="nh_hero_sheet_close" aria-label="Kapat">✕</button>'
      + '</header>'
      + '<div class="nh-hero-sheet__arena" id="nh_hero_sheet_arena">'
      + '<div class="nh-hero-sheet__stars" id="nh_hero_sheet_stars"></div>'
      + '<div class="nh-hero-sheet__hero-host" id="nh_hero_sheet_hero_host"></div>'
      + '</div>'
      + '<div class="nh-hero-sheet__body">'
      + '<p class="nh-hero-sheet__desc" id="nh_hero_sheet_desc"></p>'
      + '<p class="nh-hero-sheet__perks-title">Aktif özellikler</p>'
      + '<ul class="nh-hero-sheet__perks" id="nh_hero_sheet_perks"></ul>'
      + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeHeroSheet();
    });
    document.getElementById('nh_hero_sheet_close').addEventListener('click', closeHeroSheet);
  }

  function closeHeroSheet() {
    var ov = document.getElementById('nh-hero-sheet-overlay');
    if (!ov) return;
    var heroHost = document.getElementById('nh_hero_sheet_hero_host');
    if (heroHost) {
      var mountHost = heroHost.querySelector('.nova-hero-svg-host');
      var s2 = getStudent();
      var hid = s2 && s2.battleHero ? String(s2.battleHero).trim() : '';
      if (mountHost && hid === 'firtina_okcu' && typeof window.novaFirtinaOkcuUnmountSprite === 'function') {
        window.novaFirtinaOkcuUnmountSprite(mountHost);
      } else if (mountHost && hid === 'star_fairy' && typeof window.novaYildizPerisiUnmountSprite === 'function') {
        window.novaYildizPerisiUnmountSprite(mountHost);
      } else if (mountHost && hid === 'tas_muhafiz' && typeof window.novaTasMuhafizUnmountSprite === 'function') {
        window.novaTasMuhafizUnmountSprite(mountHost);
      } else if (mountHost && hid === 'golge_parsi' && typeof window.novaGolgeParsiUnmountSprite === 'function') {
        window.novaGolgeParsiUnmountSprite(mountHost);
      } else if (mountHost && typeof window.novaEpicDragonUnmountSprite === 'function') {
        window.novaEpicDragonUnmountSprite(mountHost, hid);
      }
    }
    var sheetStars = document.getElementById('nh_hero_sheet_stars');
    if (sheetStars && typeof window.novaEpicDragonUnmountBadge === 'function') {
      window.novaEpicDragonUnmountBadge(sheetStars);
    }
    ov.classList.remove('is-open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async function openHeroSheet() {
    var zone = document.getElementById('nova-main-hero-zone');
    if (!zone || !zone.classList.contains('is-visible')) return;
    var s = getStudent();
    var heroId = s && s.battleHero ? String(s.battleHero).trim() : '';
    var def = heroId && window.NOVA_HERO_REGISTRY ? window.NOVA_HERO_REGISTRY[heroId] : null;
    if (!def) return;

    var lvl = getHeroLevel();
    if (lvl < 1 && s && s.classId && s.studentId && typeof database !== 'undefined') {
      try {
        var snap = await database.ref('classes/' + s.classId + '/students/' + s.studentId).once('value');
        var data = snap.val() || {};
        if (window.NOVA_HERO_LEVEL) lvl = window.NOVA_HERO_LEVEL.getEquippedHeroLevel(data);
      } catch (_) { /* ignore */ }
    }
    if (lvl < 1) lvl = 1;

    ensureSheetUi();
    var ov = document.getElementById('nh-hero-sheet-overlay');
    var title = document.getElementById('nh_hero_sheet_title');
    var levelEl = document.getElementById('nh_hero_sheet_level');
    var desc = document.getElementById('nh_hero_sheet_desc');
    var perks = document.getElementById('nh_hero_sheet_perks');
    var arena = document.getElementById('nh_hero_sheet_arena');
    var sheetStars = document.getElementById('nh_hero_sheet_stars');
    var heroHost = document.getElementById('nh_hero_sheet_hero_host');

    if (title) title.textContent = def.name;
    var isEpicDragon = typeof window.novaIsEpicDragonHero === 'function' && window.novaIsEpicDragonHero(heroId);
    if (levelEl) {
      levelEl.textContent = isEpicDragon ? '' : ('Seviye ' + lvl + ' · ' + getLevelLabel(lvl));
      levelEl.hidden = !!isEpicDragon;
    }
    if (desc) desc.textContent = def.desc || '';
    if (sheetStars) {
      if (isEpicDragon) {
        sheetStars.innerHTML = '';
        sheetStars.classList.add('nh-hero-sheet__stars--epic');
        if (typeof window.novaEpicDragonMountBadge === 'function') {
          window.novaEpicDragonMountBadge(sheetStars, heroId, 'sheet');
        }
      } else {
        sheetStars.classList.remove('nh-hero-sheet__stars--epic');
        if (typeof window.novaEpicDragonUnmountBadge === 'function') {
          window.novaEpicDragonUnmountBadge(sheetStars);
        }
        sheetStars.innerHTML = buildSheetStarsHtml(lvl);
      }
    }
    if (arena) {
      arena.className = 'nh-hero-sheet__arena nh-hero-sheet__arena--' + (def.theme || 'blaze');
      arena.classList.remove(
        'nh-hero-sheet__arena--buz-sprite',
        'nh-hero-sheet__arena--alev-sprite',
        'nh-hero-sheet__arena--gece-sprite',
        'nh-hero-sheet__arena--firtina-sprite',
        'nh-hero-sheet__arena--star-sprite',
        'nh-hero-sheet__arena--tas-sprite',
        'nh-hero-sheet__arena--golge-sprite'
      );
      if (isEpicDragon) arena.classList.add('nh-hero-sheet__arena--' + (def.theme || 'buz') + '-sprite');
      if (heroId === 'firtina_okcu') arena.classList.add('nh-hero-sheet__arena--firtina-sprite');
      if (heroId === 'star_fairy') arena.classList.add('nh-hero-sheet__arena--star-sprite');
      if (heroId === 'tas_muhafiz') arena.classList.add('nh-hero-sheet__arena--tas-sprite');
      if (heroId === 'golge_parsi') arena.classList.add('nh-hero-sheet__arena--golge-sprite');
    }
    if (heroHost) {
      heroHost.innerHTML = '';
      var host = document.createElement('div');
      host.className = 'nova-hero-svg-host nova-hero-mount--' + heroId.replace(/_/g, '-');
      heroHost.appendChild(host);
      if (heroId === 'firtina_okcu' && typeof window.novaFirtinaOkcuMountSprite === 'function') {
        window.novaFirtinaOkcuMountSprite(host, { profile: 'main' });
      } else if (heroId === 'star_fairy' && typeof window.novaYildizPerisiMountSprite === 'function') {
        window.novaYildizPerisiMountSprite(host, { profile: 'main' });
      } else if (heroId === 'tas_muhafiz' && typeof window.novaTasMuhafizMountSprite === 'function') {
        window.novaTasMuhafizMountSprite(host, { profile: 'main' });
      } else if (heroId === 'golge_parsi' && typeof window.novaGolgeParsiMountSprite === 'function') {
        window.novaGolgeParsiMountSprite(host, { profile: 'main' });
      } else if (isEpicDragon && typeof window.novaEpicDragonMountSprite === 'function') {
        window.novaEpicDragonMountSprite(host, heroId, { profile: 'main' });
      } else {
        mountHeroSvg(host, heroId);
      }
    }
    if (perks) {
      var lines = getPerkSummaryLines(lvl);
      if (!lines.length) lines = ['Bu seviyede aktif özellik bulunmuyor.'];
      perks.innerHTML = lines.map(function (line) {
        return '<li>' + String(line).replace(/</g, '&lt;') + '</li>';
      }).join('');
    }

    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function bindMainHeroTap() {
    var zone = document.getElementById('nova-main-hero-zone');
    if (!zone || zone.dataset.nhSheetBound === '1') return;
    zone.dataset.nhSheetBound = '1';
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('aria-label', 'Kahraman detaylarını aç');
    function onHeroActivate(e) {
      if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e && e.type === 'keydown') e.preventDefault();
      if (!zone.classList.contains('is-visible')) return;
      openHeroSheet();
    }
    zone.addEventListener('click', onHeroActivate);
    zone.addEventListener('keydown', onHeroActivate);
    var slot = document.getElementById('nova-main-hero-slot');
    if (slot && slot.dataset.nhSheetBound !== '1') {
      slot.dataset.nhSheetBound = '1';
      slot.addEventListener('click', onHeroActivate);
    }
  }

  function patchRefreshMainHero() {
    if (typeof window.refreshMainScreenHero !== 'function') return;
    if (window.refreshMainScreenHero.__nhSheetPatched) return;
    var orig = window.refreshMainScreenHero;
    window.refreshMainScreenHero = async function () {
      await orig.apply(this, arguments);
      ensureHeroFloatWrap();
      refreshMainHeroStars();
    };
    window.refreshMainScreenHero.__nhSheetPatched = true;
  }

  window.novaRefreshMainHeroStars = refreshMainHeroStars;
  window.novaOpenHeroDetailSheet = openHeroSheet;

  document.addEventListener('DOMContentLoaded', function () {
    ensureHeroFloatWrap();
    ensureStarsEl();
    bindMainHeroTap();
    ensureSheetUi();
    patchRefreshMainHero();
    setTimeout(refreshMainHeroStars, 1200);
    setInterval(function () {
      var main = document.getElementById('main-screen');
      if (main && main.style.display === 'none') return;
      refreshMainHeroStars();
    }, 6500);
  });
})();
