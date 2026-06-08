/* Ejderha Yumurtası — envanter, kırma animasyonu, ödül */
(function () {
  'use strict';

  var EGG_TYPES = ['fire', 'ice', 'night'];
  var EGG_PNG = {
    fire: 'egg_open/fire_dragon_egg.png',
    ice: 'egg_open/ice_dragon_egg.png',
    night: 'egg_open/night_dragon_egg.png'
  };
  var EGG_LABEL = { fire: 'Alev', ice: 'Buz', night: 'Gece' };
  var DRAGON_BY_EGG = { fire: 'alev_ejder', ice: 'buz_ejder', night: 'gece_ejder' };
  var DRAGON_HERO_IDS = { alev_ejder: true, buz_ejder: true, gece_ejder: true };
  var EGG_AVATAR_NAMES = {
    fire: ['Fatih Sultan Mehmet', 'İbn Sina', 'Piri Reis', 'Ertuğrul Gazi'],
    ice: ['Tuğrul Bey', 'Mustafa Kemal', 'Orhan Gazi', 'Albert Einstein'],
    night: ['Yıldırım Bayezid', '2. Abdülhamid', 'El Harezmi', 'Kürşad']
  };
  var eggRewardPoolCache = {};
  var MS_DAY = 86400000;

  var sheetCache = {};
  var hubEngine = null;
  var selectedType = 'fire';
  var uiBound = false;
  var screenBound = false;
  var cracking = false;
  var eggScreenOpen = false;
  var eggHistoryPushed = false;
  var eggPreloadPromise = null;
  var eggScreenOpening = false;

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

  function getDb() {
    try {
      if (window.database && typeof window.database.ref === 'function') return window.database;
      if (typeof firebase !== 'undefined' && firebase.database) return firebase.database();
    } catch (_) {}
    return null;
  }

  function studentRef() {
    var s = getStudent();
    var db = getDb();
    if (!s || !s.classId || !s.studentId || !db) return null;
    return db.ref('classes/' + s.classId + '/students/' + s.studentId);
  }

  function normalizeEggBag(raw) {
    var bag = raw && typeof raw === 'object' ? raw : {};
    var out = { fire: 0, ice: 0, night: 0 };
    EGG_TYPES.forEach(function (t) {
      out[t] = Math.max(0, Number(bag[t]) || 0);
    });
    return out;
  }

  async function readEggBag(ref) {
    var snap = await ref.child('dragonEggs').once('value');
    return normalizeEggBag(snap.val());
  }

  async function writeEggBag(ref, bag) {
    await ref.child('dragonEggs').set(normalizeEggBag(bag));
  }

  async function refreshEggsFromServer() {
    var ref = studentRef();
    if (!ref) return { fire: 0, ice: 0, night: 0 };
    try {
      var bag = await readEggBag(ref);
      var metaSnap = await ref.child('dragonEggMeta').once('value');
      var meta = metaSnap.val() || { cracksSinceDragonTrial: 0 };
      if (metaSnap.val() == null) {
        await ref.child('dragonEggMeta/cracksSinceDragonTrial').set(0);
        meta = { cracksSinceDragonTrial: 0 };
      }
      syncStudentPatch({ dragonEggs: bag, dragonEggMeta: meta });
      return bag;
    } catch (e) {
      console.warn('refreshEggsFromServer', e);
      var empty = { fire: 0, ice: 0, night: 0 };
      syncStudentPatch({ dragonEggs: empty });
      return empty;
    }
  }

  function isDragonHero(heroId) {
    return !!DRAGON_HERO_IDS[String(heroId || '').trim()];
  }

  function pendingKeyForHero(heroId) {
    return isDragonHero(heroId) ? 'dragonTrialPending' : 'heroTrialPending';
  }

  function activeTrialKeyForHero(heroId) {
    return isDragonHero(heroId) ? 'dragonTrials' : 'heroTrials';
  }

  function addPendingTrialDays(stu, reward) {
    if (!reward || !reward.heroId) return 0;
    var days = Math.max(1, Number(reward.days) || 3);
    var hid = reward.heroId;
    var key = pendingKeyForHero(hid);
    stu[key] = stu[key] || {};
    stu[key][hid] = (Number(stu[key][hid]) || 0) + days;
    return stu[key][hid];
  }

  function buildRewardUpdates(stu, reward) {
    var updates = {};
    if (!reward) return updates;
    if (reward.kind === 'diamond') {
      updates.diamond = Math.min(25000, (Number(stu.diamond) || 0) + (Number(reward.amount) || 0));
      updates.lastDiamondUpdate = Date.now();
      return updates;
    }
    if (reward.kind === 'avatar') {
      try {
        var enc = btoa(reward.photoUrl);
        updates['purchasedPhotos/' + enc] = true;
      } catch (_) {}
      return updates;
    }
    var hid = reward.heroId;
    var key = pendingKeyForHero(hid);
    var total = Number(stu[key] && stu[key][hid]) || 0;
    updates[key + '/' + hid] = total;
    return updates;
  }

  function syncStudentPatch(patch) {
    var s = getStudent();
    if (!s || !patch) return;
    Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    try {
      window.selectedStudent = s;
      localStorage.setItem('selectedStudent', JSON.stringify(s));
    } catch (_) {}
    if (typeof window.novaInvalidateStoreStudentCache === 'function') {
      window.novaInvalidateStoreStudentCache();
    }
  }

  function manifestFor(key) {
    var root = window.NOVA_DRAGON_EGG_MANIFEST;
    return root && root.eggs && root.eggs[key] ? root.eggs[key] : null;
  }

  function resolveUrl(base, file) {
    var b = base || 'assets/dragon-eggs/';
    if (b.charAt(b.length - 1) !== '/') b += '/';
    var path = b + file;
    if (typeof window.novaResolveAssetUrl === 'function') return window.novaResolveAssetUrl(path);
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function eggPngUrl(type) {
    var path = EGG_PNG[type] || '';
    if (!path) return '';
    if (typeof window.novaResolveAssetUrl === 'function') return window.novaResolveAssetUrl(path);
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function syncEggChipImages() {
    EGG_TYPES.forEach(function (t) {
      var chip = document.querySelector('#nova-dragon-egg-screen .nova-dragon-egg-chip[data-egg="' + t + '"]');
      if (!chip) return;
      var img = chip.querySelector('.nova-dragon-egg-chip__img');
      if (!img) return;
      var url = eggPngUrl(t);
      if (url && img.getAttribute('src') !== url) img.src = url;
    });
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      try {
        img.fetchPriority = 'high';
      } catch (_) {}
      img.onload = function () {
        var done = function () { resolve(img); };
        if (img.decode) img.decode().then(done).catch(done);
        else done();
      };
      img.onerror = function () { reject(new Error('img:' + url)); };
      img.src = url;
    });
  }

  function verifyEggAssetsReady() {
    var sheetKeys = ['fire', 'ice', 'night', 'hub'];
    for (var i = 0; i < sheetKeys.length; i++) {
      var k = sheetKeys[i];
      var pack = sheetCache[k];
      if (!pack || !pack.img || !pack.img.naturalWidth) return false;
    }
    for (var j = 0; j < EGG_TYPES.length; j++) {
      var t = EGG_TYPES[j];
      var img = sheetCache['_png_' + t];
      if (!img || !img.naturalWidth) return false;
    }
    return true;
  }

  function preloadAllEggAssets(force) {
    if (eggPreloadPromise && !force) return eggPreloadPromise;
    if (force) eggPreloadPromise = null;
    var sheetKeys = ['fire', 'ice', 'night', 'hub'];
    var tasks = sheetKeys.map(function (k) {
      return loadSheet(k);
    });
    EGG_TYPES.forEach(function (t) {
      tasks.push(
        loadImage(eggPngUrl(t)).then(function (img) {
          sheetCache['_png_' + t] = img;
          return img;
        })
      );
    });
    eggPreloadPromise = Promise.all(tasks).then(function () {
      if (!verifyEggAssetsReady()) throw new Error('egg-assets-incomplete');
      window.__novaEggAssetsReady = true;
      return true;
    });
    return eggPreloadPromise;
  }

  window.novaPreloadDragonEggAssets = function (force) {
    return preloadAllEggAssets(!!force).catch(function () {
      return preloadAllEggAssets(true);
    });
  };

  function loadSheet(key) {
    if (sheetCache[key] && sheetCache[key].img) return Promise.resolve(sheetCache[key]);
    var m = manifestFor(key);
    if (!m) return Promise.reject(new Error('manifest:' + key));
    var url = resolveUrl(m.base, m.sheet);
    return loadImage(url).then(function (img) {
      sheetCache[key] = { manifest: m, img: img };
      return sheetCache[key];
    });
  }

  function frameRect(m, index) {
    var col = index % m.cols;
    var row = (index / m.cols) | 0;
    return {
      sx: col * m.frameWidth,
      sy: row * m.frameHeight,
      sw: m.frameWidth,
      sh: m.frameHeight
    };
  }

  function playSpriteOnce(host, key, onDone) {
    if (!host) return;
    host.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'nova-degg-sprite-wrap';
    wrap.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    var canvas = document.createElement('canvas');
    canvas.className = 'nova-degg-sprite-canvas';
    wrap.appendChild(canvas);
    host.appendChild(wrap);

    loadSheet(key).then(function (pack) {
      var m = pack.manifest;
      var img = pack.img;
      var ctx = canvas.getContext('2d', { alpha: true });
      var frames = m.loopEnd || m.frameCount || 96;
      var fps = m.fps || 24;
      var frameMs = 1000 / fps;
      var fi = 0;
      var accum = 0;
      var last = 0;
      var running = true;

      function resize() {
        var rect = wrap.getBoundingClientRect();
        var w = Math.max(80, Math.round(rect.width || 300));
        var h = Math.max(80, Math.round(rect.height || 280));
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        return { w: canvas.width, h: canvas.height, dpr: dpr };
      }

      function draw(now) {
        if (!running) return;
        if (!last) last = now;
        var delta = now - last;
        last = now;
        if (delta > frameMs * 4) delta = frameMs;
        accum += delta;
        while (accum >= frameMs) {
          accum -= frameMs;
          fi += 1;
          if (fi >= frames) {
            running = false;
            if (typeof onDone === 'function') onDone();
            return;
          }
        }
        var dim = resize();
        var r = frameRect(m, fi);
        var cw = dim.w;
        var ch = dim.h;
        var fit = Math.min(cw / m.frameWidth, ch / m.frameHeight) * 0.96;
        var dw = Math.round(m.frameWidth * fit);
        var dh = Math.round(m.frameHeight * fit);
        var dx = Math.round((cw - dw) * 0.5);
        var dy = Math.round((ch - dh) * 0.5);
        ctx.clearRect(0, 0, cw, ch);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
        if (running) requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    }).catch(function () {
      if (typeof onDone === 'function') onDone();
    });
  }

  function playHubLoop(host) {
    if (!host) return;
    host.innerHTML = '';
    var canvas = document.createElement('canvas');
    canvas.className = 'nova-dragon-egg-hub__canvas';
    host.appendChild(canvas);
    loadSheet('hub').then(function (pack) {
      var m = pack.manifest;
      var img = pack.img;
      var ctx = canvas.getContext('2d', { alpha: true });
      var loopEnd = m.loopEnd || 48;
      var fi = 0;
      var accum = 0;
      var last = 0;
      var fps = m.fps || 12;
      var frameMs = 1000 / fps;

      function tick(now) {
        if (!document.body.contains(host)) return;
        if (!last) last = now;
        var delta = now - last;
        last = now;
        accum += delta;
        while (accum >= frameMs) {
          accum -= frameMs;
          fi = (fi + 1) % loopEnd;
        }
        var rect = host.getBoundingClientRect();
        var w = Math.max(60, Math.round(rect.width || 120));
        var h = Math.max(50, Math.round(rect.height || 80));
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var r = frameRect(m, fi);
        var cw = canvas.width;
        var ch = canvas.height;
        var fit = Math.min(cw / m.frameWidth, ch / m.frameHeight) * 0.92;
        var dw = Math.round(m.frameWidth * fit);
        var dh = Math.round(m.frameHeight * fit);
        var dx = Math.round((cw - dw) * 0.5);
        var dy = Math.round((ch - dh) * 0.5);
        ctx.clearRect(0, 0, cw, ch);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, dx, dy, dw, dh);
        hubEngine = requestAnimationFrame(tick);
      }
      if (hubEngine) cancelAnimationFrame(hubEngine);
      hubEngine = requestAnimationFrame(tick);
    }).catch(function () {});
  }

  function parseOwn(val) {
    if (!val) return false;
    if (val === true) return true;
    if (typeof val === 'object' && val.level) return true;
    return !!val;
  }

  function ownsHeroPermanent(stu, heroId) {
    if (!stu || !heroId) return false;
    return parseOwn(stu.purchasedBattleHeroes && stu.purchasedBattleHeroes[heroId]);
  }

  function trialUntil(stu, mapKey, heroId) {
    if (!stu || !heroId) return 0;
    var map = stu[mapKey];
    var t = map && map[heroId];
    return t && Number(t) > Date.now() ? Number(t) : 0;
  }

  function formatRemaining(ms) {
    if (ms <= 0) return '';
    var h = Math.ceil(ms / 3600000);
    if (h >= 48) return Math.ceil(h / 24) + ' gün kaldı';
    if (h >= 2) return h + ' saat kaldı';
    return '1 saatten az';
  }

  window.novaGetHeroTrialUntil = function (data, heroId) {
    var t1 = trialUntil(data, 'heroTrials', heroId);
    var t2 = trialUntil(data, 'dragonTrials', heroId);
    return Math.max(t1, t2);
  };

  window.novaFormatHeroTrialRemaining = function (data, heroId) {
    var until = window.novaGetHeroTrialUntil(data, heroId);
    if (!until) return '';
    return formatRemaining(until - Date.now());
  };

  window.novaGetHeroTrialPendingDays = function (data, heroId) {
    if (!data || !heroId) return 0;
    var h = Number(data.heroTrialPending && data.heroTrialPending[heroId]) || 0;
    var d = Number(data.dragonTrialPending && data.dragonTrialPending[heroId]) || 0;
    return Math.max(0, Math.round(h + d));
  };

  window.novaStartHeroTrial = async function (heroId) {
    heroId = String(heroId || '').trim();
    if (!heroId) return false;
    var ref = studentRef();
    if (!ref) return false;
    var pendingKey = pendingKeyForHero(heroId);
    var activeKey = activeTrialKeyForHero(heroId);
    try {
      var snap = await ref.once('value');
      var stu = snap.val() || {};
      var pending = Number(stu[pendingKey] && stu[pendingKey][heroId]) || 0;
      if (pending < 1) {
        if (typeof showAlert === 'function') await showAlert('Bu kahraman için bekleyen deneme yok.');
        return false;
      }
      var now = Date.now();
      var curUntil = Number(stu[activeKey] && stu[activeKey][heroId]) || 0;
      var base = curUntil > now ? curUntil : now;
      var newUntil = base + pending * MS_DAY;
      var updates = {};
      updates[activeKey + '/' + heroId] = newUntil;
      updates[pendingKey + '/' + heroId] = 0;
      await ref.update(updates);
      stu[activeKey] = stu[activeKey] || {};
      stu[activeKey][heroId] = newUntil;
      stu[pendingKey] = stu[pendingKey] || {};
      stu[pendingKey][heroId] = 0;
      syncStudentPatch({
        heroTrials: stu.heroTrials || {},
        dragonTrials: stu.dragonTrials || {},
        heroTrialPending: stu.heroTrialPending || {},
        dragonTrialPending: stu.dragonTrialPending || {}
      });
      return true;
    } catch (e) {
      console.error('novaStartHeroTrial', e);
      if (typeof showAlert === 'function') await showAlert('Deneme başlatılamadı.');
      return false;
    }
  };

  function normalizeRewardName(s) {
    var t = String(s || '').trim().toLowerCase();
    t = t.split('ı').join('i').split('İ').join('i').split('ğ').join('g').split('ü').join('u')
      .split('ş').join('s').split('ö').join('o').split('ç').join('c');
    return t.replace(/[^a-z0-9]/g, '');
  }

  async function ensureStoreManifestForEggs() {
    try {
      if (typeof window.novaCdnFetchStoreManifest === 'function' && !window.__novaStoreCdnPhotos) {
        await window.novaCdnFetchStoreManifest();
      }
    } catch (_) {}
    try {
      if (typeof fetchStoreCategoriesFromDB === 'function') {
        await fetchStoreCategoriesFromDB();
      }
    } catch (_) {}
  }

  function collectAllStorePhotos() {
    var out = [];
    var seen = {};
    var cdn = window.__novaStoreCdnPhotos || {};
    Object.keys(cdn).forEach(function (cat) {
      var o = cdn[cat];
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach(function (id) {
        if (id === '_meta') return;
        var p = o[id];
        if (!p || !p.url) return;
        var key = p.url;
        if (seen[key]) return;
        seen[key] = true;
        out.push({ id: id, url: p.url, name: p.name || id, category: cat });
      });
    });
    return out;
  }

  function findAvatarPhotoByName(name) {
    var want = normalizeRewardName(name);
    if (!want) return null;
    var photos = collectAllStorePhotos();
    var i;
    for (i = 0; i < photos.length; i++) {
      if (normalizeRewardName(photos[i].name) === want) return photos[i];
    }
    for (i = 0; i < photos.length; i++) {
      var n = normalizeRewardName(photos[i].name);
      if (n.indexOf(want) >= 0 || want.indexOf(n) >= 0) return photos[i];
    }
    return null;
  }

  function ownsAvatar(stu, photoUrl) {
    if (!photoUrl || !stu) return false;
    try {
      return !!(stu.purchasedPhotos && stu.purchasedPhotos[btoa(photoUrl)]);
    } catch (_) {
      return false;
    }
  }

  function pushPoolEntries(pool, entry, count) {
    var n = Math.max(0, Number(count) || 0);
    var i;
    for (i = 0; i < n; i++) pool.push(entry);
  }

  function buildEggRewardPool(eggType) {
    if (eggRewardPoolCache[eggType]) return eggRewardPoolCache[eggType].slice();
    var pool = [];
    (EGG_AVATAR_NAMES[eggType] || []).forEach(function (avatarName) {
      pool.push({ kind: 'avatar', avatarName: avatarName });
    });
    pushPoolEntries(pool, { kind: 'diamond', amount: 20 }, 40);
    pushPoolEntries(pool, { kind: 'diamond', amount: 50 }, 28);
    pushPoolEntries(pool, { kind: 'diamond', amount: 100 }, 14);
    pushPoolEntries(pool, { kind: 'diamond', amount: 250 }, 2);
    pushPoolEntries(pool, { kind: 'diamond', amount: 500 }, 3);
    pushPoolEntries(pool, { kind: 'dragon_trial', days: 1 }, 4);
    pushPoolEntries(pool, { kind: 'dragon_trial', days: 2 }, 2);
    pushPoolEntries(pool, { kind: 'dragon_trial', days: 3 }, 2);
    pushPoolEntries(pool, { kind: 'dragon_trial', days: 5 }, 1);
    eggRewardPoolCache[eggType] = pool.slice();
    return pool;
  }

  function materializePoolEntry(entry, eggType) {
    var reward = { kind: entry.kind };
    if (entry.kind === 'diamond') {
      reward.amount = entry.amount;
      return reward;
    }
    if (entry.kind === 'avatar') {
      reward.avatarName = entry.avatarName;
      var photo = findAvatarPhotoByName(entry.avatarName);
      if (!photo) return null;
      reward.photoUrl = photo.url;
      reward.photoName = photo.name;
      return reward;
    }
    if (entry.kind === 'dragon_trial') {
      reward.kind = 'dragon_trial';
      reward.heroId = DRAGON_BY_EGG[eggType];
      reward.days = entry.days;
      return reward;
    }
    return null;
  }

  function isRewardBlocked(stu, reward) {
    if (!reward) return true;
    if (reward.kind === 'avatar') return ownsAvatar(stu, reward.photoUrl);
    if (reward.kind === 'dragon_trial') return ownsHeroPermanent(stu, reward.heroId);
    return false;
  }

  async function rollReward(stu, eggType) {
    await ensureStoreManifestForEggs();
    var pool = buildEggRewardPool(eggType);
    var tries = Math.max(40, pool.length * 2);
    var i;
    for (i = 0; i < tries; i++) {
      var entry = pool[Math.floor(Math.random() * pool.length)];
      var reward = materializePoolEntry(entry, eggType);
      if (!reward) continue;
      if (isRewardBlocked(stu, reward)) continue;
      return reward;
    }
    return { kind: 'diamond', amount: 50 };
  }

  function applyReward(stu, reward) {
    if (!reward) return;
    if (reward.kind === 'diamond') {
      stu.diamond = Math.min(25000, (Number(stu.diamond) || 0) + (Number(reward.amount) || 0));
      stu.lastDiamondUpdate = Date.now();
      return;
    }
    if (reward.kind === 'avatar') {
      stu.purchasedPhotos = stu.purchasedPhotos || {};
      try {
        stu.purchasedPhotos[btoa(reward.photoUrl)] = true;
      } catch (_) {}
      return;
    }
    addPendingTrialDays(stu, reward);
  }

  function rewardTitle(reward) {
    if (!reward) return 'Ödül';
    if (reward.kind === 'diamond') return '+' + reward.amount + ' ELMAS';
    if (reward.kind === 'avatar') return (reward.photoName || reward.avatarName || 'Avatar') + ' — AVATAR';
    var reg = window.NOVA_HERO_REGISTRY || window.NOVA_BATTLE_HERO_REGISTRY || {};
    var def = reg[reward.heroId];
    var name = def ? def.name : reward.heroId;
    var days = Math.max(1, Number(reward.days) || 3);
    return name + ' — ' + days + ' Gün Deneme';
  }

  function rewardSub(reward) {
    if (reward.kind === 'diamond') {
      return 'Elmaslar hesabına eklendi. Mağazadan harcayabilirsin!';
    }
    if (reward.kind === 'avatar') {
      return 'Avatar sandığına eklendi. Karakter menüsünden kullanabilirsin!';
    }
    var days = Math.max(1, Number(reward.days) || 3);
    return days + ' gün deneme kazandın. Mağazada «Denemeyi Başlat» ile başlat.';
  }

  function playRewardRevealFx(eggType) {
    var visual = document.getElementById('nova_degg_screen_reward_visual');
    if (!visual) return;
    var oldFx = visual.querySelector('.nova-degg-reward-fx');
    if (oldFx) oldFx.remove();
    var fx = document.createElement('div');
    fx.className = 'nova-degg-reward-fx nova-degg-reward-fx--' + (eggType || 'fire');
    fx.innerHTML =
      '<div class="nova-degg-reward-fx__flash" aria-hidden="true"></div>' +
      '<div class="nova-degg-reward-fx__ring" aria-hidden="true"></div>' +
      '<div class="nova-degg-reward-fx__ring nova-degg-reward-fx__ring--2" aria-hidden="true"></div>' +
      '<div class="nova-degg-reward-fx__spark nova-degg-reward-fx__spark--1" aria-hidden="true"></div>' +
      '<div class="nova-degg-reward-fx__spark nova-degg-reward-fx__spark--2" aria-hidden="true"></div>' +
      '<div class="nova-degg-reward-fx__spark nova-degg-reward-fx__spark--3" aria-hidden="true"></div>';
    visual.insertBefore(fx, visual.firstChild);
    setTimeout(function () {
      if (fx.parentNode) fx.parentNode.removeChild(fx);
    }, 2800);
    try {
      if (typeof window.novaBonusEggWinFx === 'function') {
        window.novaBonusEggWinFx(document.getElementById('nova_degg_screen_body') || visual);
      }
    } catch (_) {}
  }

  function renderAvatarRewardCard(container, reward) {
    if (!container || !reward || !reward.photoUrl) return;
    var wrap = document.createElement('div');
    wrap.className = 'nova-degg-reward-avatar-card';
    var frame = document.createElement('div');
    frame.className = 'nova-degg-reward-avatar-card__frame';
    var img = document.createElement('img');
    img.className = 'nova-degg-reward-avatar-card__img';
    img.alt = reward.photoName || reward.avatarName || 'Avatar';
    img.decoding = 'async';
    var imgUrl = reward.photoUrl;
    if (typeof window.novaResolveAssetUrl === 'function') {
      imgUrl = window.novaResolveAssetUrl(reward.photoUrl);
    }
    img.src = imgUrl;
    frame.appendChild(img);
    var name = document.createElement('div');
    name.className = 'nova-degg-reward-avatar-card__name';
    name.textContent = reward.photoName || reward.avatarName || 'Avatar';
    var badge = document.createElement('span');
    badge.className = 'nova-degg-reward-avatar-card__badge';
    badge.textContent = 'Yeni Avatar';
    wrap.appendChild(frame);
    wrap.appendChild(name);
    wrap.appendChild(badge);
    container.appendChild(wrap);
  }

  function eggScreenEl() {
    return document.getElementById('nova-dragon-egg-screen');
  }

  function setScreenPhase(phase) {
    phase = phase || 'pick';
    var body = document.getElementById('nova_degg_screen_body');
    var screen = eggScreenEl();
    var okBtn = document.getElementById('nova_degg_screen_reward_ok');
    var sub = document.getElementById('nova_degg_screen_sub');
    var crackBtn = document.getElementById('nova_dragon_egg_crack_btn');
    if (body) body.setAttribute('data-phase', phase);
    if (screen) {
      screen.classList.toggle('is-reward-phase', phase === 'reward');
      screen.classList.toggle('is-loading-phase', phase === 'loading');
    }
    if (okBtn) okBtn.hidden = phase !== 'reward';
    if (sub) {
      sub.textContent =
        phase === 'loading'
          ? 'Yumurtalar hazırlanıyor…'
          : phase === 'reward'
            ? 'Ödülün hazır!'
            : phase === 'crack'
              ? 'Yumurta kırılıyor…'
              : 'Kırmak istediğin yumurtayı seç';
    }
    document.querySelectorAll('#nova-dragon-egg-screen .nova-dragon-egg-chip').forEach(function (chip) {
      chip.disabled = phase === 'loading' || phase === 'crack';
    });
    if (crackBtn && phase === 'loading') crackBtn.disabled = true;
  }

  function setEggScreenBusy(busy) {
    var closeBtn = document.getElementById('nova_degg_screen_close');
    if (closeBtn) closeBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function resetScreenPickPhase() {
    var crackHost = document.getElementById('nova_degg_screen_crack_host');
    var card = document.getElementById('nova_degg_screen_reward_card');
    var title = document.getElementById('nova_degg_screen_reward_title');
    var sub = document.getElementById('nova_degg_screen_reward_sub');
    var dia = document.getElementById('nova_degg_screen_reward_diamond');
    if (crackHost) crackHost.innerHTML = '';
    if (card) card.innerHTML = '';
    if (title) title.textContent = '';
    if (sub) sub.textContent = '';
    if (dia) { dia.hidden = true; dia.textContent = ''; }
    setScreenPhase('pick');
    updateScreenPreview();
  }

  function closeRewardPhase() {
    resetScreenPickPhase();
    renderScreenInventory(getStudent());
    renderMainHubSummary(getStudent());
  }

  function pushEggHistory() {
    if (eggHistoryPushed) return;
    try {
      history.pushState({ novaEggScreen: true }, '', location.href);
      eggHistoryPushed = true;
    } catch (_) {}
  }

  function showEggPrepOverlay(msg) {
    var el = document.getElementById('nova_egg_prep_overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nova_egg_prep_overlay';
      el.className = 'nova-egg-prep-overlay';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.innerHTML =
        '<div class="nova-egg-prep-overlay__card">' +
        '<p class="nova-egg-prep-overlay__text"></p>' +
        '</div>';
      document.body.appendChild(el);
    }
    var txt = el.querySelector('.nova-egg-prep-overlay__text');
    if (txt) txt.textContent = msg || 'Yumurtalar hazırlanıyor…';
    el.hidden = false;
    el.removeAttribute('hidden');
    document.body.classList.add('nova-egg-prep-active');
  }

  function hideEggPrepOverlay() {
    var el = document.getElementById('nova_egg_prep_overlay');
    if (el) {
      el.hidden = true;
      el.setAttribute('hidden', '');
    }
    document.body.classList.remove('nova-egg-prep-active');
  }

  async function openEggScreen() {
    if (eggScreenOpen || eggScreenOpening) return;
    var screen = eggScreenEl();
    if (!screen) return;

    eggScreenOpening = true;
    showEggPrepOverlay('Yumurtalar hazırlanıyor…');
    setEggScreenBusy(true);
    try {
      await Promise.race([
        preloadAllEggAssets(true),
        new Promise(function (_, reject) {
          setTimeout(function () {
            reject(new Error('egg-preload-timeout'));
          }, 12000);
        })
      ]).catch(function (err) {
        console.warn('openEggScreen preload', err);
        return preloadAllEggAssets(true).catch(function () {});
      });
      eggScreenOpen = true;
      pushEggHistory();
      screen.hidden = false;
      screen.removeAttribute('hidden');
      screen.setAttribute('aria-hidden', 'false');
      screen.classList.add('is-open');
      document.body.classList.add('nova-degg-screen-open');
      resetScreenPickPhase();
      var bag = await refreshEggsFromServer();
      var first = EGG_TYPES.find(function (t) {
        return (Number(bag && bag[t]) || 0) > 0;
      });
      if (first) selectedType = first;
      renderScreenInventory(getStudent());
      syncEggChipImages();
      document.querySelectorAll('#nova-dragon-egg-screen .nova-dragon-egg-chip').forEach(function (c) {
        c.classList.toggle('is-selected', c.getAttribute('data-egg') === selectedType);
      });
      updateScreenPreview();
      updateCrackButton();
    } catch (e) {
      console.warn('openEggScreen', e);
      eggScreenOpen = false;
      if (typeof showAlert === 'function') {
        showAlert('Yumurta animasyonları yüklenemedi. Lütfen tekrar dene.');
      }
    } finally {
      hideEggPrepOverlay();
      setEggScreenBusy(false);
      eggScreenOpening = false;
    }
  }

  function closeEggScreen(fromPopstate) {
    var screen = eggScreenEl();
    if (!screen || !eggScreenOpen) return;
    eggScreenOpen = false;
    screen.classList.remove('is-open');
    screen.hidden = true;
    screen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nova-degg-screen-open');
    resetScreenPickPhase();
    renderMainHubSummary(getStudent());
    var hub = document.getElementById('nova_dragon_egg_hub');
    if (hub && !hub.querySelector('canvas')) playHubLoop(hub);
    if (!fromPopstate && eggHistoryPushed) {
      eggHistoryPushed = false;
      try {
        history.back();
      } catch (_) {}
      return;
    }
    eggHistoryPushed = false;
  }

  window.novaOpenDragonEggScreen = openEggScreen;
  window.novaCloseDragonEggScreen = closeEggScreen;

  function updateScreenPreview() {
    var preview = document.getElementById('nova_degg_screen_preview');
    if (!preview) return;
    preview.innerHTML = '';
    var img = document.createElement('img');
    img.className = 'nova-degg-screen__preview-img';
    img.alt = EGG_LABEL[selectedType] || 'Yumurta';
    img.decoding = 'async';
    img.src = eggPngUrl(selectedType);
    preview.appendChild(img);
  }

  function showRewardUi(reward, stu) {
    setScreenPhase('reward');
    var rewardRoot = document.getElementById('nova_degg_screen_reward');
    var cardSlot = document.getElementById('nova_degg_screen_reward_card');
    var dia = document.getElementById('nova_degg_screen_reward_diamond');
    var titleEl = document.getElementById('nova_degg_screen_reward_title');
    var subEl = document.getElementById('nova_degg_screen_reward_sub');
    var screen = eggScreenEl();
    if (screen) {
      screen.classList.remove('is-reward-diamond', 'is-reward-hero', 'is-reward-avatar');
      if (reward.kind === 'diamond') screen.classList.add('is-reward-diamond');
      else if (reward.kind === 'avatar') screen.classList.add('is-reward-avatar');
      else screen.classList.add('is-reward-hero');
    }
    if (rewardRoot) {
      rewardRoot.classList.toggle('is-diamond', reward.kind === 'diamond');
      rewardRoot.classList.toggle('is-hero', reward.kind === 'dragon_trial');
      rewardRoot.classList.toggle('is-avatar', reward.kind === 'avatar');
    }
    if (titleEl) titleEl.textContent = rewardTitle(reward);
    if (subEl) subEl.textContent = rewardSub(reward);
    if (cardSlot) cardSlot.innerHTML = '';
    if (dia) dia.hidden = true;
    playRewardRevealFx(selectedType);
    if (reward.kind === 'diamond') {
      if (dia) {
        dia.hidden = false;
        dia.innerHTML =
          '<span class="nova-degg-diamond-reward__icon" aria-hidden="true">💎</span>' +
          '<span class="nova-degg-diamond-reward__amount">+' + reward.amount + '</span>' +
          '<span class="nova-degg-diamond-reward__label">ELMAS</span>';
      }
      if (typeof window.novaPlayDiamondRewardSfx === 'function') {
        window.novaPlayDiamondRewardSfx();
      }
      var d1 = document.getElementById('diamond-value');
      var d2 = document.getElementById('currentDiamonds');
      [d1, d2].forEach(function (el) {
        if (!el) return;
        el.textContent = String(Number(stu.diamond) || 0);
      });
    } else if (reward.kind === 'avatar') {
      renderAvatarRewardCard(cardSlot, reward);
    } else {
      var reg = window.NOVA_HERO_REGISTRY || {};
      var hero = {
        id: reward.heroId,
        name: (reg[reward.heroId] && reg[reward.heroId].name) || reward.heroId,
        price: 1,
        theme: (reg[reward.heroId] && reg[reward.heroId].theme) || 'star'
      };
      if (typeof window.novaRenderHeroStoreCardClone === 'function') {
        window.novaRenderHeroStoreCardClone(hero, stu, cardSlot, {
          rewardMode: true,
          rewardDays: Math.max(1, Number(reward.days) || 3)
        });
      } else {
        cardSlot.innerHTML = '<div class="nova-degg-screen__diamond-burst">🦸 ' + hero.name + '</div>';
      }
    }
  }

  async function crackSelectedEgg() {
    if (cracking) return;
    var s = getStudent();
    if (!s) return;
    var ref = studentRef();
    if (!ref) return;

    cracking = true;
    var crackBtn = document.getElementById('nova_dragon_egg_crack_btn');
    if (crackBtn) crackBtn.disabled = true;

    if (!eggScreenOpen) openEggScreen();
    setScreenPhase('crack');
    var crackHostEarly = document.getElementById('nova_degg_screen_crack_host');
    if (crackHostEarly) crackHostEarly.innerHTML = '';

    var committedReward = null;
    var committedStu = null;

    try {
      var bag = await refreshEggsFromServer();
      if ((Number(bag && bag[selectedType]) || 0) < 1) {
        resetScreenPickPhase();
        if (typeof showAlert === 'function') {
          await showAlert('Bu yumurtadan kalmadı. Bonus etkinliklerden kazanabilirsin!');
        }
        return;
      }

      var bagNow = await readEggBag(ref);
      if ((Number(bagNow[selectedType]) || 0) < 1) {
        await refreshEggsFromServer();
        resetScreenPickPhase();
        if (typeof showAlert === 'function') {
          await showAlert('Yumurta sunucuda yok. Önce bonus etkinlikten kazan (Bulmaca / Boşluk / Eşleştir).');
        }
        return;
      }
      bagNow[selectedType] = bagNow[selectedType] - 1;
      await writeEggBag(ref, bagNow);

      var stuSnap = await ref.once('value');
      var stu = stuSnap.val() || {};
      stu.dragonEggs = await readEggBag(ref);

      var reward = await rollReward(stu, selectedType);

      applyReward(stu, reward);
      var updates = buildRewardUpdates(stu, reward);

      await ref.update(updates);
      committedReward = reward;
      committedStu = {
        diamond: stu.diamond,
        dragonEggs: stu.dragonEggs,
        purchasedPhotos: stu.purchasedPhotos || {},
        heroTrials: stu.heroTrials || {},
        dragonTrials: stu.dragonTrials || {},
        heroTrialPending: stu.heroTrialPending || {},
        dragonTrialPending: stu.dragonTrialPending || {},
        battleHero: stu.battleHero,
        purchasedBattleHeroes: stu.purchasedBattleHeroes
      };

      syncStudentPatch(committedStu);
      renderScreenInventory(committedStu);
      renderMainHubSummary(committedStu);

      var host = document.getElementById('nova_degg_screen_crack_host');
      await loadSheet(selectedType);
      playSpriteOnce(host, selectedType, function () {
        showRewardUi(committedReward, committedStu);
        try {
          if (typeof window.novaRefreshMainScreenHero === 'function') {
            window.novaRefreshMainScreenHero();
          }
        } catch (_) {}
        try {
          if (typeof window.novaRefreshBattleHeroStoreInPlace === 'function') {
            window.novaRefreshBattleHeroStoreInPlace();
          }
        } catch (_) {}
      });
    } catch (e) {
      console.error('crackEgg', e);
      resetScreenPickPhase();
      var msg = 'Yumurta kırılırken hata oluştu.';
      if (e && (e.code === 'PERMISSION_DENIED' || e.message && e.message.indexOf('permission') !== -1)) {
        msg = 'Firebase izin hatası: database.rules.json dosyasındaki ejderha yumurtası kurallarını sunucuya yüklemen gerekiyor.';
      }
      if (typeof showAlert === 'function') await showAlert(msg);
    } finally {
      cracking = false;
      if (crackBtn) crackBtn.disabled = false;
      updateCrackButton();
    }
  }

  function updateCrackButton() {
    var btn = document.getElementById('nova_dragon_egg_crack_btn');
    var s = getStudent();
    if (!btn || !s) return;
    var n = Number((s.dragonEggs || {})[selectedType]) || 0;
    btn.disabled = n < 1 || cracking;
    btn.textContent = n < 1 ? 'Yumurta yok' : 'Yumurtayı Kır';
  }

  function totalEggCount(eggs) {
    eggs = eggs || {};
    return EGG_TYPES.reduce(function (sum, t) {
      return sum + (Number(eggs[t]) || 0);
    }, 0);
  }

  function renderMainHubSummary(stu) {
    stu = stu || getStudent() || {};
    var total = totalEggCount(stu.dragonEggs);
    var el = document.getElementById('nova_dragon_egg_total');
    if (el) {
      el.textContent = total === 1 ? '1 yumurta' : (total + ' yumurta');
    }
    var entry = document.getElementById('nova_dragon_egg_open');
    if (entry) entry.classList.toggle('has-eggs', total > 0);
  }

  function renderScreenInventory(stu) {
    stu = stu || getStudent() || {};
    var eggs = stu.dragonEggs || {};
    var pityEl = document.getElementById('nova_dragon_egg_pity');
    if (pityEl) {
      pityEl.hidden = true;
      pityEl.textContent = '';
    }
    EGG_TYPES.forEach(function (t) {
      var chip = document.querySelector('#nova-dragon-egg-screen .nova-dragon-egg-chip[data-egg="' + t + '"]');
      if (!chip) return;
      var cnt = Number(eggs[t]) || 0;
      var countEl = chip.querySelector('.nova-dragon-egg-chip__count');
      if (countEl) countEl.textContent = 'x' + cnt;
      chip.classList.toggle('is-empty', cnt < 1);
      chip.classList.toggle('is-selected', t === selectedType);
    });
    updateCrackButton();
    if (eggScreenOpen) updateScreenPreview();
  }

  function renderHubInventory(stu) {
    renderMainHubSummary(stu);
    renderScreenInventory(stu);
  }

  function bindOpenButtonIfNeeded() {
    var openBtn = document.getElementById('nova_dragon_egg_open');
    if (!openBtn || openBtn.__novaEggOpenBound) return;
    openBtn.__novaEggOpenBound = true;
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openEggScreen();
    });
  }

  function bindMainEntry() {
    if (!window.__novaEggEntryDelegated) {
      window.__novaEggEntryDelegated = true;
      document.addEventListener(
        'click',
        function (e) {
          var t = e.target;
          if (!t || !t.closest) return;
          var btn = t.closest('#nova_dragon_egg_open, .nova-dragon-egg-entry');
          if (!btn) return;
          var main = document.getElementById('main-screen');
          if (!main || !main.contains(btn)) return;
          e.preventDefault();
          openEggScreen();
        },
        true
      );
    }
    if (uiBound) {
      bindOpenButtonIfNeeded();
      return;
    }
    uiBound = true;
    bindOpenButtonIfNeeded();
    if (typeof window.novaPreloadDragonEggAssets === 'function') {
      window.novaPreloadDragonEggAssets().catch(function () {});
    }
  }

  function bindScreenUi() {
    if (screenBound) return;
    screenBound = true;
    syncEggChipImages();
    if (!window.__novaEggCdnImgBound) {
      window.__novaEggCdnImgBound = true;
      window.addEventListener('nova-cdn-ready', syncEggChipImages);
    }
    var closeBtn = document.getElementById('nova_degg_screen_close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeEggScreen(false);
      });
    }
    if (!window.__novaEggPopstateBound) {
      window.__novaEggPopstateBound = true;
      window.addEventListener('popstate', function () {
        if (eggScreenOpen) closeEggScreen(true);
      });
    }
    var okBtn = document.getElementById('nova_degg_screen_reward_ok');
    if (okBtn) okBtn.addEventListener('click', closeRewardPhase);
    EGG_TYPES.forEach(function (t) {
      var chip = document.querySelector('#nova-dragon-egg-screen .nova-dragon-egg-chip[data-egg="' + t + '"]');
      if (!chip) return;
      chip.addEventListener('click', function () {
        var s = getStudent();
        var cnt = Number((s && s.dragonEggs || {})[t]) || 0;
        selectedType = t;
        document.querySelectorAll('#nova-dragon-egg-screen .nova-dragon-egg-chip').forEach(function (c) {
          c.classList.toggle('is-selected', c.getAttribute('data-egg') === t);
        });
        updateScreenPreview();
        updateCrackButton();
        if (cnt < 1 && typeof showAlert === 'function') {
          showAlert(EGG_LABEL[t] + ' yumurtası yok. Bonus etkinliklerden kazan!');
        }
      });
    });
    var btn = document.getElementById('nova_dragon_egg_crack_btn');
    if (btn) btn.addEventListener('click', function () { crackSelectedEgg(); });
  }

  function ensureHubMarkup() {
    var wrap = document.getElementById('nova-dragon-egg-wrap');
    if (wrap && wrap.querySelector('.nova-dragon-egg-stock')) {
      wrap.remove();
      wrap = null;
    }
    if (wrap) {
      var oldHint = wrap.querySelector('.nova-dragon-egg-entry__hint');
      if (oldHint) oldHint.remove();
      bindOpenButtonIfNeeded();
      return wrap;
    }
    var anchor = document.querySelector('#main-screen-hud-left .nova-main-hero-showcase-wrap');
    if (!anchor) return null;
    wrap = document.createElement('div');
    wrap.id = 'nova-dragon-egg-wrap';
    wrap.className = 'nova-dragon-egg-wrap';
    wrap.innerHTML =
      '<div class="nova-dragon-egg-panel">' +
      '<div class="nova-dragon-egg-panel__title">Ejderha Yumurtası</div>' +
      '<button type="button" class="nova-dragon-egg-entry" id="nova_dragon_egg_open" aria-label="Ejderha yumurtası ekranını aç">' +
      '<div class="nova-dragon-egg-hub" id="nova_dragon_egg_hub"></div>' +
      '<span class="nova-dragon-egg-entry__total" id="nova_dragon_egg_total">0 yumurta</span>' +
      '</button></div>';
    anchor.insertAdjacentElement('afterend', wrap);
    bindOpenButtonIfNeeded();
    return wrap;
  }

  function showEarnToast(type, count) {
    var old = document.getElementById('nova-degg-earn-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.id = 'nova-degg-earn-toast';
    toast.className = 'nova-degg-earn-toast';
    toast.innerHTML =
      '<img class="nova-degg-earn-toast__img" src="' + eggPngUrl(type) + '" alt=""/>' +
      '<div class="nova-degg-earn-toast__txt"><strong>' + EGG_LABEL[type] + ' Ejderha Yumurtası!</strong>' +
      '<span>+' + count + ' — Ejderha bölümünden kırabilirsin</span></div>';
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });
    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.remove(); }, 450);
    }, 3200);
  }

  window.novaGrantDragonEgg = async function (type, count, opts) {
    type = String(type || 'fire').trim();
    if (EGG_TYPES.indexOf(type) < 0) type = 'fire';
    count = Math.max(1, Math.min(20, Number(count) || 1));
    opts = opts || {};
    var ref = studentRef();
    if (!ref) return false;
    try {
      var bag = await readEggBag(ref);
      bag[type] = (Number(bag[type]) || 0) + count;
      await writeEggBag(ref, bag);
      var verify = await readEggBag(ref);
      if ((Number(verify[type]) || 0) < (Number(bag[type]) || 0)) {
        console.error('novaGrantDragonEgg verify failed', type, verify);
        return false;
      }
      var metaSnap = await ref.child('dragonEggMeta/cracksSinceDragonTrial').once('value');
      if (metaSnap.val() == null) {
        await ref.child('dragonEggMeta/cracksSinceDragonTrial').set(0);
      }
      syncStudentPatch({ dragonEggs: verify });
      renderHubInventory(getStudent());
      if (!opts.suppressToast) showEarnToast(type, count);
      return true;
    } catch (e) {
      console.error('novaGrantDragonEgg', e);
      return false;
    }
  };

  /** Bonus etkinlik — doğru cevapta garanti rastgele yumurta */
  window.novaBonusAwardDragonEgg = async function () {
    var type = EGG_TYPES[Math.floor(Math.random() * EGG_TYPES.length)];
    var ok = await window.novaGrantDragonEgg(type, 1, { suppressToast: true });
    if (!ok) return null;
    return { type: type, label: EGG_LABEL[type], png: eggPngUrl(type) };
  };

  window.novaBonusTryAwardDragonEgg = window.novaBonusAwardDragonEgg;

  window.novaBonusEggWinFx = function (hostEl, reward, options) {
    if (!hostEl || !reward) return;
    options = options || {};
    var title = options.title || 'SÜPER';
    hostEl.classList.add('fb-win-glow');
    var oldFx = hostEl.querySelector('.fb-win-fx');
    if (oldFx) oldFx.remove();
    var fx = document.createElement('div');
    fx.className = 'fb-win-fx';
    fx.innerHTML =
      '<div class="fb-win-core nova-degg-bonus-win">' +
      '<div class="fb-win-title">' + title + '</div>' +
      '<img class="nova-degg-bonus-win__egg" src="' + reward.png + '" alt="' + reward.label + ' yumurta"/>' +
      '<div class="fb-win-amount">' + reward.label + ' Ejderha Yumurtası</div>' +
      '<div class="fb-win-sub">+1 yumurta — Ejderha bölümünden kırabilirsin</div>' +
      '</div>';
    if (getComputedStyle(hostEl).position === 'static') hostEl.style.position = 'relative';
    hostEl.appendChild(fx);
    var colors = ['#fde047', '#34d399', '#60a5fa', '#f472b6', '#f97316', '#a78bfa'];
    for (var i = 0; i < 30; i++) {
      var c = document.createElement('span');
      c.className = 'fb-confetti';
      c.style.background = colors[i % colors.length];
      var ang = (Math.PI * 2 * i) / 30;
      var dist = 110 + Math.random() * 120;
      c.style.setProperty('--x', Math.cos(ang) * dist + 'px');
      c.style.setProperty('--y', Math.sin(ang) * dist + 'px');
      c.style.setProperty('--r', (Math.random() * 520 - 260).toFixed(0) + 'deg');
      c.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      fx.appendChild(c);
    }
    setTimeout(function () {
      fx.remove();
      hostEl.classList.remove('fb-win-glow');
    }, 2300);
  };

  function mountEggRewardHeroPreview(host, heroId) {
    if (!host || !heroId) return;
    function tryMount(attempt) {
      if (!host.isConnected) return;
      var rect = host.getBoundingClientRect();
      if ((!rect.width || !rect.height) && attempt < 18) {
        requestAnimationFrame(function () { tryMount(attempt + 1); });
        return;
      }
      if (typeof window.novaIsEpicDragonHero === 'function' &&
          window.novaIsEpicDragonHero(heroId) &&
          typeof window.novaEpicDragonMountSprite === 'function') {
        window.novaEpicDragonMountSprite(host, heroId, { profile: 'store', scale: 1.68 });
        return;
      }
      if (typeof window.mountHeroStorePreview === 'function') {
        window.mountHeroStorePreview(host, heroId, { profile: 'detail', scale: 1.55 });
      }
    }
    requestAnimationFrame(function () { tryMount(0); });
  }

  window.novaRenderHeroStoreCardClone = function (hero, userData, container, opts) {
    if (!container || !hero) return;
    opts = opts || {};
    var card = document.createElement('div');
    container.appendChild(card);
    try {
      var reg = window.NOVA_HERO_REGISTRY || window.NOVA_BATTLE_HERO_REGISTRY || {};
      var def = reg[hero.id];
      if (!def) return;
      var rewardMode = !!opts.rewardMode;
      var pendingDays = window.novaGetHeroTrialPendingDays
        ? window.novaGetHeroTrialPendingDays(userData, hero.id) : 0;
      var showDays = rewardMode
        ? Math.max(1, Number(opts.rewardDays) || pendingDays || 3)
        : pendingDays;
      card.className = 'profile-photo-item nova-store-card nova-hero-store-card nova-hero-store-card--' + def.theme
        + (rewardMode ? ' nova-degg-reward-hero-card' : '');
      if (typeof window.novaIsEpicStoreHero === 'function' && window.novaIsEpicStoreHero(hero.id)) {
        card.classList.add('nova-hero-store-card--epic-tier');
        if (hero.id === 'alev_ejder') card.classList.add('nova-hero-store-card--alev');
        if (hero.id === 'buz_ejder') card.classList.add('nova-hero-store-card--buz');
        if (hero.id === 'gece_ejder') card.classList.add('nova-hero-store-card--gece');
      }
      var preview = '';
      if (typeof window.novaHeroPreviewHtml === 'function') {
        preview = window.novaHeroPreviewHtml(hero.id, def.theme);
      }
      if (!preview && typeof window.heroPreviewHtml === 'function') {
        preview = window.heroPreviewHtml(hero.id, def.theme);
      }
      if (rewardMode) {
        card.innerHTML =
          preview +
          '<div class="nova-hero-store-vitrine-name">' + (hero.name || def.name) + '</div>' +
          '<span class="nova-hero-trial-badge nova-hero-trial-badge--egg-reward">' + showDays + ' gün deneme</span>';
      } else {
        card.innerHTML =
          preview +
          '<div class="nova-hero-store-vitrine-name">' + (hero.name || def.name) + '</div>' +
          '<span class="nova-hero-trial-badge">' + showDays + ' Gün Deneme Kazandın</span>' +
          '<span class="nova-hero-trial-remaining">Mağazada «Denemeyi Başlat»</span>' +
          '<div class="profile-photo-price"></div>' +
          '<button type="button" class="profile-photo-button use-button">Denemeyi Başlat</button>';
      }
      var host = card.querySelector('[data-nova-hero-host]');
      if (host) mountEggRewardHeroPreview(host, hero.id);
    } catch (e) {
      console.warn('storeCardClone', e);
    }
  };

  async function loadStudentEggFields() {
    var ref = studentRef();
    if (!ref) return;
    try {
      await refreshEggsFromServer();
      var stuSnap = await ref.once('value');
      var stu = stuSnap.val() || {};
      syncStudentPatch({
        heroTrials: stu.heroTrials || {},
        dragonTrials: stu.dragonTrials || {},
        heroTrialPending: stu.heroTrialPending || {},
        dragonTrialPending: stu.dragonTrialPending || {}
      });
    } catch (e) {
      console.warn('loadStudentEggFields', e);
    }
  }

  function ensureHubRunning() {
    ensureHubMarkup();
    var hub = document.getElementById('nova_dragon_egg_hub');
    if (hub && !hub.querySelector('canvas')) playHubLoop(hub);
    return hub;
  }

  window.novaDragonEggEnsureHub = function () {
    if (!document.getElementById('main-screen')) return Promise.resolve();
    bindMainEntry();
    bindScreenUi();
    var preload =
      window.__novaEggAssetsReady || eggPreloadPromise
        ? Promise.resolve()
        : preloadAllEggAssets().catch(function () {
            return preloadAllEggAssets(true);
          });
    return preload.then(function () {
      ensureHubRunning();
      return loadStudentEggFields().then(function () {
        renderHubInventory(getStudent());
      });
    });
  };

  function boot() {
    if (!document.getElementById('main-screen')) return;
    bindMainEntry();
    bindScreenUi();
    if (!document.__novaDragonEggVisibleBound) {
      document.__novaDragonEggVisibleBound = true;
      document.addEventListener('nova:main-screen-visible', function () {
        if (!eggScreenOpen) {
          renderHubInventory(getStudent());
          var h = document.getElementById('nova_dragon_egg_hub');
          if (h && !h.querySelector('canvas')) playHubLoop(h);
        }
      });
    }
    try {
      if (typeof window.novaPreloadDragonEggAssets === 'function') {
        window.novaPreloadDragonEggAssets().catch(function () {});
      }
    } catch (_) {}
    if (window.__novaBootMainPrep || window.__novaSpriteBootActive) {
      window.novaDragonEggEnsureHub().catch(function () {});
      return;
    }
    ensureHubRunning();
    loadStudentEggFields().then(function () {
      renderHubInventory(getStudent());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
