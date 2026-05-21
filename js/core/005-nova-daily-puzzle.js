(function(){
  function db(){ try { return (typeof firebase !== 'undefined' && firebase.database) ? firebase.database() : (window.database || null); } catch(_) { return null; } }
  async function dbGet(refObj){
    if (!refObj) return null;
    if (typeof refObj.get === 'function') return await refObj.get();
    if (typeof refObj.once === 'function') return await refObj.once('value');
    throw new Error('dbGet unsupported ref');
  }
  function sel(){ try { return window.selectedStudent || JSON.parse(localStorage.getItem('selectedStudent')||'null'); } catch(_) { return null; } }
  function gradeFromStudent(stu){
    const txt = String((stu && (stu.className || stu.classId)) || '').toLocaleLowerCase('tr-TR');
    const m = txt.match(/([1-4])\s*\.?\s*s[ıi]n[ıi]f/);
    if (m && m[1]) return Number(m[1]);
    const d = txt.match(/\b([1-4])\b/);
    return d && d[1] ? Number(d[1]) : null;
  }
  function dailyRootForStudent(stu){
    const g = gradeFromStudent(stu);
    if (g === 3) return 'dailyPuzzles'; // mevcut 3. sınıf verisi
    if (g >= 1 && g <= 4) return 'classContent/sinif' + g + '/dailyPuzzles';
    const cid = String((stu && stu.classId) || '').trim();
    return cid ? ('classContent/class_' + cid.replace(/[^\w-]/g,'_') + '/dailyPuzzles') : 'dailyPuzzles';
  }
  function dailyAttemptRootForStudent(stu){
    const g = gradeFromStudent(stu);
    if (g === 3) return 'dailyPuzzle'; // mevcut deneme kayıt yolu
    if (g >= 1 && g <= 4) return 'classContent/sinif' + g + '/dailyPuzzle';
    const cid = String((stu && stu.classId) || '').trim();
    return cid ? ('classContent/class_' + cid.replace(/[^\w-]/g,'_') + '/dailyPuzzle') : 'dailyPuzzle';
  }
  function dayKey(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }
  function norm(s){ return String(s||'').trim().toLocaleLowerCase('tr-TR'); }
  function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h); }
  const DAILY_CACHE_TTL_MS = 30 * 60 * 1000;
  const DAILY_CACHE_MEM = {};

  async function readPathCached(rdb, path, ttlMs){
    const ttl = Number(ttlMs || 0) > 0 ? Number(ttlMs) : DAILY_CACHE_TTL_MS;
    const now = Date.now();
    const m = DAILY_CACHE_MEM[path];
    if (m && (now - m.ts) < ttl) return m.val;
    try {
      if (typeof window.novaReadValCached === 'function') {
        const v = await window.novaReadValCached(path, ttl);
        DAILY_CACHE_MEM[path] = { ts: now, val: v };
        return v;
      }
    } catch (_) {}
    const snap = await dbGet(rdb.ref(path));
    const val = (snap && snap.exists && snap.exists()) ? (snap.val() || null) : null;
    DAILY_CACHE_MEM[path] = { ts: now, val: val };
    return val;
  }

  const WORD_BANK = [
    { w: 'OKUL', h: 'Ders çalıştığımız yer.' },
    { w: 'MASA', h: 'Üzerinde yazı yazarız.' },
    { w: 'KALEM', h: 'Kağıda yazmaya yarar.' },
    { w: 'KİTAP', h: 'Okumak için sayfaları çeviririz.' },
    { w: 'SINIF', h: 'Öğretmenle buluştuğumuz oda.' },
    { w: 'ÖĞRETMEN', h: 'Bize yeni şeyler öğretir.' },
    { w: 'TAHTA', h: 'Öğretmenin yazdığı yer.' },
    { w: 'DEFTER', h: 'Notlarımızı yazdığımız çizgili şey.' },
    { w: 'ARKADAŞ', h: 'Birlikte oynadığımız kişi.' },
    { w: 'OYUN', h: 'Eğlenmek için oynarız.' },
    { w: 'BİLGİ', h: 'Öğrendiklerimizin adı.' },
    { w: 'TATİL', h: 'Okula gitmediğimiz günler.' },
    { w: 'SPOR', h: 'Sağlık için hareket ederiz.' },
    { w: 'MÜZİK', h: 'Şarkılar dinleriz.' },
    { w: 'RESİM', h: 'Kalemlerle renkli çizeriz.' },
    { w: 'SAYI', h: 'Matematikte kullanırız.' },
    { w: 'HARF', h: 'Kelime kurmak için sıralarız.' },
    { w: 'YILDIZ', h: 'Gece gökyüzünde parlar.' },
    { w: 'GÜNEŞ', h: 'Gündüz gökyüzünü aydınlatır.' },
    { w: 'BULUT', h: 'Gökyüzünde beyaz yumuşak şey.' },
    { w: 'AĞAÇ', h: 'Gölge veren ve yeşil.' },
    { w: 'ÇİÇEK', h: 'Bahçede renkli kokar.' },
    { w: 'SU', h: 'İçince susuzluğumuz gider.' },
    { w: 'EKMEK', h: 'Kahvaltıda yediğimiz.' },
    { w: 'SÜT', h: 'Beyaz ve sağlıklı içecek.' },
    { w: 'ELMA', h: 'Kırmızı veya yeşil meyve.' },
    { w: 'ÖDEV', h: 'Eve götürdüğümüz çalışma.' },
    { w: 'SIRA', h: 'Sınıfta oturduğumuz yer.' },
    { w: 'KAPI', h: 'İçeri girmek için açarız.' }
  ];

  async function pickDailyPuzzleId(rdb, dKey, rootPath){
    const idxVal = await readPathCached(rdb, rootPath + '/questionIds', DAILY_CACHE_TTL_MS);
    let ids = [];
    if (idxVal && typeof idxVal === 'object'){
      ids = Object.keys(idxVal || {});
    }
    if (!ids.length){
      let keys = null;
      try {
        if (typeof window.novaRtdbShallowKeys === 'function') {
          keys = await window.novaRtdbShallowKeys(rootPath + '/questions');
        }
      } catch (_) {}
      if (keys && keys.length) {
        ids = keys;
        const idMap = {};
        ids.forEach(function(id){ idMap[id] = true; });
        rdb.ref(rootPath + '/questionIds').set(idMap).catch(function(){});
      } else if (keys === null) {
        const v = await readPathCached(rdb, rootPath + '/questions', DAILY_CACHE_TTL_MS);
        if (v && typeof v === 'object'){
          ids = Object.keys(v);
          const idMap = {};
          ids.forEach(function(id){ idMap[id] = true; });
          rdb.ref(rootPath + '/questionIds').set(idMap).catch(function(){});
        }
      }
    }
    if (!ids.length) return null;
    ids.sort();
    const idx = hashStr('dailypuzzle:' + dKey) % ids.length;
    return ids[idx];
  }

  async function loadDailyWord(rdb, dKey, rootPath){
    const qid = await pickDailyPuzzleId(rdb, dKey, rootPath);
    if (qid){
      const q = await readPathCached(rdb, rootPath + '/questions/' + qid, DAILY_CACHE_TTL_MS);
      if (q && typeof q === 'object'){
        const raw = String(q.word || '').trim().replace(/\s{2,}/g, ' ');
        if (raw.length >= 2){
          return {
            word: raw.toLocaleUpperCase('tr-TR'),
            hint: String(q.hint || 'İpucunu düşün!')
          };
        }
      }
    }
    return null;
  }

  function shuffle(a){
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  var dailyState = null;

  function renderDp(){
    const st = dailyState;
    if (!st) return;
    const slotsEl = document.getElementById('dp_slots');
    const poolEl = document.getElementById('dp_pool');
    const msgEl = document.getElementById('dp_msg');
    if (!slotsEl || !poolEl) return;
    const n = st.solution.length;
    const nonSpaceCount = Array.from(st.solution).filter(function(ch){ return ch !== ' '; }).length;
    slotsEl.innerHTML = '';
    let fillIdx = 0;
    for (let i = 0; i < n; i++){
      const box = document.createElement('div');
      const ch = st.solution[i];
      if (ch === ' '){
        box.className = 'dp-slot dp-slot-space';
        box.textContent = '';
      } else {
        box.className = 'dp-slot';
        const cell = st.placed[fillIdx++];
        box.textContent = cell ? cell.char : '';
      }
      slotsEl.appendChild(box);
    }
    poolEl.innerHTML = '';
    st.pool.forEach(function(tile){
      const used = st.placed.some(function(p){ return p.id === tile.id; });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-chip';
      btn.textContent = tile.char;
      if (used) btn.disabled = true;
      btn.addEventListener('click', function(){
        if (st.placed.length >= nonSpaceCount) return;
        if (st.placed.some(function(p){ return p.id === tile.id; })) return;
        st.placed.push({ id: tile.id, char: tile.char });
        if (msgEl) msgEl.textContent = '';
        renderDp();
      });
      poolEl.appendChild(btn);
    });
  }

  function dpBack(){
    if (!dailyState || !dailyState.placed.length) return;
    dailyState.placed.pop();
    const msgEl = document.getElementById('dp_msg');
    if (msgEl) msgEl.textContent = '';
    renderDp();
  }

  function applyDailyFabLock(locked){
    var fab = document.getElementById('puzzle_fab');
    var wrap = document.getElementById('puzzle_fab_wrap');
    if (!fab) return;
    fab.disabled = !!locked;
    fab.classList.toggle('nova-daily-locked', !!locked);
    fab.setAttribute('aria-disabled', locked ? 'true' : 'false');
    if (wrap) wrap.classList.toggle('nova-daily-locked-wrap', !!locked);
    if (locked) fab.title = 'Bugünkü hakkını kullandın. Yarın tekrar açılır.';
    else fab.title = 'Doğru çözümde +100 elmas';
  }

  async function refreshDailyFabState(){
    try{
      var rdb = db();
      var s = sel();
      if (!rdb || !s || !s.studentId || !s.classId){
        applyDailyFabLock(false);
        return;
      }
      var dKey = dayKey();
      var attemptRef = rdb.ref(dailyAttemptRootForStudent(s) + '/attempts/' + s.studentId + '/' + dKey);
      var snap = await dbGet(attemptRef);
      applyDailyFabLock(!!(snap && snap.exists && snap.exists()));
    }catch(_e){
      applyDailyFabLock(false);
    }
  }

  async function openDailyPuzzle(){
    const rdb = db();
    const s = sel();
    if (!rdb || !s || !s.studentId || !s.classId){
      if (typeof showAlert === 'function') showAlert('Önce giriş yapmalısın.');
      return;
    }
    const dKey = dayKey();
    const rootPath = dailyRootForStudent(s);
    const attemptRef = rdb.ref(dailyAttemptRootForStudent(s) + '/attempts/' + s.studentId + '/' + dKey);
    const attemptSnap = await dbGet(attemptRef);
    const screen = document.getElementById('daily-puzzle-screen');
    const play = document.getElementById('dp_play_area');
    const done = document.getElementById('dp_done_area');
    const dateLabel = document.getElementById('dp_date_label');
    if (!screen || !play || !done) return;

    if (dateLabel) dateLabel.textContent = dKey.split('-').reverse().join('.');
    if (attemptSnap && attemptSnap.exists()){
      if (typeof showAlert === 'function') showAlert('ℹ️ Bilgilendirme\nBugünkü günlük etkinlik hakkını zaten kullandın. Yarın yeni etkinlikte tekrar devam edebilirsin.');
      dailyState = null;
      refreshDailyFabState();
      return;
    }

    screen.classList.add('open');
    screen.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const picked = await loadDailyWord(rdb, dKey, rootPath);
    const word = picked && picked.word ? picked.word : '';
    const hint = picked && picked.hint ? picked.hint : '';
    if (!word || word.length < 2){
      if (typeof showAlert === 'function') showAlert('Bu sınıf için günlük bulmaca henüz tanımlanmadı.');
      screen.classList.remove('open');
      screen.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      return;
    }

    const tiles = [];
    var pid = 0;
    Array.from(word).forEach(function(ch){
      tiles.push({ id: pid++, char: ch });
    });
    const pool = shuffle(tiles);

    play.style.display = 'block';
    done.style.display = 'none';
    done.innerHTML = '';
    var hintEl = document.getElementById('dp_hint');
    if (hintEl) hintEl.textContent = '🗝️ ' + hint;
    var msgEl = document.getElementById('dp_msg');
    if (msgEl){ msgEl.textContent = ''; msgEl.style.color = ''; }
    var checkBtn0 = document.getElementById('dp_check_btn');
    if (checkBtn0) checkBtn0.disabled = false;

    dailyState = {
      solution: word,
      placed: [],
      pool: pool,
      attemptRef: attemptRef,
      classId: s.classId,
      studentId: s.studentId
    };
    renderDp();
  }

  function closeDailyPuzzle(){
    var screen = document.getElementById('daily-puzzle-screen');
    if (screen){
      screen.classList.remove('open');
      screen.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    dailyState = null;
  }

  function runDpWinFx(totalReward, rewardMul){
    var card = document.getElementById('daily_puzzle_card');
    if (!card) return;
    card.classList.add('dp-win-glow');
    var oldFx = card.querySelector('.dp-win-fx');
    if (oldFx) oldFx.remove();
    var fx = document.createElement('div');
    fx.className = 'dp-win-fx';
    var totalTxt = Math.max(0, Number(totalReward || 100));
    var mulTxt = Math.max(1, Number(rewardMul || 1));
    fx.innerHTML = '<div class="dp-win-core"><div class="dp-win-title">SÜPER</div><div class="dp-win-amount" data-dp-win-amt>+0 💎</div><div class="dp-win-sub">'+(mulTxt>1?('Şampiyonluk Rozeti x'+mulTxt+' bonusu!<br/>'):'')+totalTxt+' elmas hesabına eklendi</div></div>';
    card.style.position = 'relative';
    card.appendChild(fx);
    var amountEl = fx.querySelector('[data-dp-win-amt]');
    var total = totalTxt;
    var t0 = performance.now();
    var dur = 900;
    function tick(now){
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var cur = Math.round(total * eased);
      if (amountEl) amountEl.textContent = '+' + cur + ' 💎';
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    var colors = ['#fde047','#34d399','#60a5fa','#f472b6','#a78bfa','#fb923c'];
    for (var i = 0; i < 30; i++){
      var c = document.createElement('span');
      c.className = 'dp-confetti';
      c.style.background = colors[i % colors.length];
      var ang = (Math.PI * 2 * i) / 30;
      var dist = 110 + Math.random() * 120;
      c.style.setProperty('--x', Math.cos(ang) * dist + 'px');
      c.style.setProperty('--y', Math.sin(ang) * dist + 'px');
      c.style.setProperty('--r', (Math.random() * 520 - 260).toFixed(0) + 'deg');
      c.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      fx.appendChild(c);
    }
    var d1 = document.getElementById('diamond-value');
    var d2 = document.getElementById('currentDiamonds');
    [d1, d2].forEach(function(el){
      if (!el) return;
      var base = Number(String(el.textContent||'').replace(/[^\d]/g,'')) || 0;
      el.textContent = String(base + totalTxt);
      el.style.transition = 'transform .2s ease, text-shadow .2s ease';
      el.style.transform = 'scale(1.16)';
      el.style.textShadow = '0 0 14px rgba(250,204,21,.7)';
      setTimeout(function(){ el.style.transform = ''; el.style.textShadow = ''; }, 480);
    });
    setTimeout(function(){
      fx.remove();
      card.classList.remove('dp-win-glow');
    }, 2200);
  }

  async function dpCheck(){
    var st = dailyState;
    if (!st) return;
    var msg = document.getElementById('dp_msg');
    var checkBtn = document.getElementById('dp_check_btn');
    var required = Array.from(st.solution || '').filter(function(ch){ return ch !== ' '; }).length;
    if (st.placed.length !== required){
      if (msg) msg.textContent = 'Önce tüm harfleri yerleştir.';
      return;
    }
    var pIdx = 0;
    var guess = Array.from(st.solution || '').map(function(ch){
      if (ch === ' ') return ' ';
      var pick = st.placed[pIdx++];
      return pick ? pick.char : '';
    }).join('');
    var isCorrect = norm(guess) === norm(st.solution);
    var payload = { guess: guess, correct: !!isCorrect, at: Date.now() };
    var committed = false;
    await st.attemptRef.transaction(function(curr){ return curr ? curr : payload; }, function(err, c){
      committed = !!c;
    });
    if (!committed){
      if (msg) msg.textContent = 'Bugünkü hakkın zaten kullanıldı.';
      if (checkBtn) checkBtn.disabled = true;
      refreshDailyFabState();
      return;
    }
    if (checkBtn) checkBtn.disabled = true;
    refreshDailyFabState();
    var rdb = db();
    if (isCorrect && rdb){
      var stuRef = rdb.ref('classes/' + st.classId + '/students/' + st.studentId);
      var dpRewardBase = 100;
      var dpRewardMul = 1;
      var dpRewardTotal = 100;
      await stuRef.transaction(function(stu){
        stu = stu || {};
        var gain = computeChampionDiamondGain(dpRewardBase, stu);
        dpRewardMul = Number(gain.multiplier || 1);
        dpRewardTotal = Number(gain.total || dpRewardBase);
        stu.diamond = Math.min(25000, Number(stu.diamond||0) + dpRewardTotal);
        stu.lastDiamondUpdate = Date.now();
        return stu;
      });
      if (typeof window.novaPlayDiamondRewardSfx === 'function'){
        window.novaPlayDiamondRewardSfx();
      }
      runDpWinFx(dpRewardTotal, dpRewardMul);
      if (msg){
        msg.textContent = 'Doğru! +' + dpRewardTotal + ' 💎' + (dpRewardMul > 1 ? (' (Rozet x'+dpRewardMul+')') : '');
        msg.style.color = '#059669';
      }
    } else {
      if (msg){
        msg.textContent = 'Yanlış! Günlük hakkın bitti — yarın tekrar!';
        msg.style.color = '#b45309';
      }
    }
    var delay = isCorrect ? 2400 : 1200;
    setTimeout(function(){
      var play = document.getElementById('dp_play_area');
      var done = document.getElementById('dp_done_area');
      if (play) play.style.display = 'none';
      if (done){
        done.style.display = 'block';
        done.className = isCorrect ? 'dp-done' : 'dp-done dp-fail';
        done.innerHTML = isCorrect
          ? '🎉 Tebrikler! Bugünkü bulmacayı tamamladın.'
          : 'Yarın yeni bir kelime ile tekrar dene!';
      }
      dailyState = null;
    }, delay);
  }

  function bindDailyPuzzle(){
    var fab = document.getElementById('puzzle_fab');
    var closeBtn = document.getElementById('dp_close_btn');
    var backBtn = document.getElementById('dp_back_btn');
    var checkBtn = document.getElementById('dp_check_btn');
    if (fab && !fab.dataset.dpBound){
      fab.dataset.dpBound = '1';
      fab.addEventListener('click', function(){
        openDailyPuzzle().catch(function(e){
          console.warn(e);
          if (typeof showAlert === 'function') showAlert('Bulmaca açılamadı.');
        });
      });
    }
    if (closeBtn && !closeBtn.dataset.dpBound){
      closeBtn.dataset.dpBound = '1';
      closeBtn.addEventListener('click', closeDailyPuzzle);
    }
    if (backBtn && !backBtn.dataset.dpBound){
      backBtn.dataset.dpBound = '1';
      backBtn.addEventListener('click', dpBack);
    }
    if (checkBtn && !checkBtn.dataset.dpBound){
      checkBtn.dataset.dpBound = '1';
      checkBtn.addEventListener('click', function(){ dpCheck().catch(function(e){ console.warn(e); }); });
    }
    refreshDailyFabState();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindDailyPuzzle, { once: true });
  } else {
    bindDailyPuzzle();
  }
  window.addEventListener('load', bindDailyPuzzle, { once: true });
  window.addEventListener('pageshow', function(){ refreshDailyFabState(); });
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) refreshDailyFabState(); });
  document.addEventListener('nova:main-screen-visible', function(){ refreshDailyFabState(); });
})();
