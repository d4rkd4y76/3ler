(function(){
  function db(){ try { return (typeof firebase !== 'undefined' && firebase.database) ? firebase.database() : (window.database || null); } catch(_) { return null; } }
  async function dbGet(refObj){
    if (!refObj) return null;
    if (typeof refObj.get === 'function') return await refObj.get();
    if (typeof refObj.once === 'function') return await refObj.once('value');
    throw new Error('dbGet unsupported ref');
  }
  function sel(){ try { return window.selectedStudent || JSON.parse(localStorage.getItem('selectedStudent')||'null'); } catch(_) { return null; } }
  function dayKey(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }
  function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h); }
  const MATCH_CACHE_TTL_MS = 30 * 60 * 1000;
  const MATCH_CACHE_MEM = {};
  async function readPathCached(rdb, path, ttlMs){
    const ttl = Number(ttlMs || 0) > 0 ? Number(ttlMs) : MATCH_CACHE_TTL_MS;
    const now = Date.now();
    const m = MATCH_CACHE_MEM[path];
    if (m && (now - m.ts) < ttl) return m.val;
    try {
      if (typeof window.novaReadValCached === 'function') {
        const v = await window.novaReadValCached(path, ttl);
        MATCH_CACHE_MEM[path] = { ts: now, val: v };
        return v;
      }
    } catch (_) {}
    const snap = await dbGet(rdb.ref(path));
    const val = (snap && snap.exists && snap.exists()) ? (snap.val() || null) : null;
    MATCH_CACHE_MEM[path] = { ts: now, val: val };
    return val;
  }
  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  async function pickDailyMatchId(rdb, dKey){
    const idxVal = await readPathCached(rdb, 'matchingGame/questionIds', MATCH_CACHE_TTL_MS);
    let ids = [];
    if (idxVal && typeof idxVal === 'object') ids = Object.keys(idxVal || {});
    if (!ids.length){
      let keys = null;
      try {
        if (typeof window.novaRtdbShallowKeys === 'function') {
          keys = await window.novaRtdbShallowKeys('matchingGame/questions');
        }
      } catch (_) {}
      if (keys && keys.length) {
        ids = keys;
        const map = {};
        ids.forEach(id => map[id] = true);
        rdb.ref('matchingGame/questionIds').set(map).catch(function(){});
      } else if (keys === null) {
        const qVal = await readPathCached(rdb, 'matchingGame/questions', MATCH_CACHE_TTL_MS);
        if (qVal && typeof qVal === 'object'){
          ids = Object.keys(qVal || {});
          const map = {};
          ids.forEach(id => map[id] = true);
          rdb.ref('matchingGame/questionIds').set(map).catch(function(){});
        }
      }
    }
    if (!ids.length) return null;
    ids.sort();
    return ids[hashStr('matching:' + dKey) % ids.length];
  }

  let mState = null;
  const MATCH_LINE_COLORS = ['#f97316','#22c55e','#3b82f6','#ec4899','#a855f7','#14b8a6','#f43f5e','#0ea5e9'];

  function drawLines(){
    const svg = document.getElementById('match_svg');
    const leftCol = document.getElementById('match_left_col');
    const rightCol = document.getElementById('match_right_col');
    if (!svg || !leftCol || !rightCol || !mState) return;
    const host = document.getElementById('match_board');
    const hb = host.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, hb.width)} ${Math.max(1, hb.height)}`);
    svg.innerHTML = '';
    Object.keys(mState.picks || {}).forEach((lidx) => {
      const ridx = mState.picks[lidx];
      const lEl = leftCol.querySelector(`[data-lidx="${lidx}"]`);
      const rEl = rightCol.querySelector(`[data-ridx="${ridx}"]`);
      if (!lEl || !rEl) return;
      const lb = lEl.getBoundingClientRect();
      const rb = rEl.getBoundingClientRect();
      const x1 = lb.right - hb.left - 6;
      const y1 = lb.top - hb.top + (lb.height / 2);
      const x2 = rb.left - hb.left + 6;
      const y2 = rb.top - hb.top + (rb.height / 2);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`);
      const isCorrect = !!(mState.checked && Number(mState.pairMap[String(lidx)]) === Number(ridx));
      // Her sol kutu kendi sabit rengini kullanır: 5 eşleşme = 5 farklı çizgi rengi.
      const color = MATCH_LINE_COLORS[Number(lidx) % MATCH_LINE_COLORS.length];
      path.setAttribute('class', 'match-link ' + (mState.checked ? (isCorrect ? 'correct' : 'wrong') : 'pending'));
      path.style.setProperty('--line-color', color);
      svg.appendChild(path);
    });
  }

  function renderMatchBoard(){
    if (!mState) return;
    const leftCol = document.getElementById('match_left_col');
    const rightCol = document.getElementById('match_right_col');
    const msg = document.getElementById('match_msg');
    if (!leftCol || !rightCol) return;
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';
    if (msg && !mState.checked) msg.textContent = '';
    mState.left.forEach((txt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'match-box left';
      btn.dataset.lidx = String(i);
      btn.textContent = txt;
      if (String(i) === String(mState.activeLeft) && !mState.checked) btn.classList.add('active');
      if (mState.picks[i] != null) btn.classList.add('paired');
      if (mState.checked && mState.picks[i] != null) {
        const ok = Number(mState.picks[i]) === Number(mState.pairMap[String(i)]);
        btn.classList.add(ok ? 'ok' : 'fail');
      }
      btn.addEventListener('click', function(){
        if (mState.checked) return;
        mState.activeLeft = i;
        renderMatchBoard();
      });
      leftCol.appendChild(btn);
    });
    mState.right.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'match-box right';
      btn.dataset.ridx = String(item.ridx);
      btn.textContent = item.text;
      const linkedLeft = Object.keys(mState.picks).find(k => Number(mState.picks[k]) === Number(item.ridx));
      if (linkedLeft != null) btn.classList.add('paired');
      if (mState.checked && linkedLeft != null) {
        const ok = Number(mState.pairMap[String(linkedLeft)]) === Number(item.ridx);
        btn.classList.add(ok ? 'ok' : 'fail');
      }
      btn.addEventListener('click', function(){
        if (mState.checked) return;
        if (mState.activeLeft == null) return;
        const li = Number(mState.activeLeft);
        const target = Number(item.ridx);
        Object.keys(mState.picks).forEach(k => {
          if (Number(mState.picks[k]) === target) delete mState.picks[k];
        });
        mState.picks[li] = target;
        mState.activeLeft = null;
        renderMatchBoard();
      });
      rightCol.appendChild(btn);
    });
    requestAnimationFrame(drawLines);
  }

  async function openMatchScreen(){
    const rdb = db();
    const s = sel();
    if (!rdb || !s || !s.studentId || !s.classId){
      if (typeof showAlert === 'function') showAlert('Önce giriş yapmalısın.');
      return;
    }
    const dKey = dayKey();
    const attemptRef = rdb.ref(`matchingGame/attempts/${s.studentId}/${dKey}`);
    const attemptSnap = await dbGet(attemptRef);
    if (attemptSnap && attemptSnap.exists()){
      if (typeof showAlert === 'function') showAlert('Bugünkü Eşleştir hakkını zaten kullandın.');
      return;
    }
    const qid = await pickDailyMatchId(rdb, dKey);
    if (!qid){
      if (typeof showAlert === 'function') showAlert('Bugün için eşleştirme sorusu bulunamadı.');
      return;
    }
    const q = await readPathCached(rdb, `matchingGame/questions/${qid}`, MATCH_CACHE_TTL_MS);
    if (!q || typeof q !== 'object'){
      if (typeof showAlert === 'function') showAlert('Eşleştirme sorusu yüklenemedi.');
      return;
    }
    const left = Array.isArray(q.left) ? q.left.slice(0,5).map(v=>String(v||'').trim()).filter(Boolean) : [];
    const rightRaw = Array.isArray(q.right) ? q.right.slice(0,5).map(v=>String(v||'').trim()).filter(Boolean) : [];
    const pairMap = (q.pairs && typeof q.pairs === 'object') ? q.pairs : { "0":0, "1":1, "2":2, "3":3, "4":4 };
    if (left.length !== 5 || rightRaw.length !== 5){
      if (typeof showAlert === 'function') showAlert('Eşleştirme sorusu hatalı (5 sol + 5 sağ gerekli).');
      return;
    }
    const right = shuffle(rightRaw.map((t, i) => ({ ridx: i, text: t })));
    mState = { qid, left, right, pairMap, picks: {}, activeLeft: null, checked: false, attemptRef, student: s };
    const screen = document.getElementById('match-screen');
    const hint = document.getElementById('match_hint');
    const dateLabel = document.getElementById('match_date');
    if (!screen) return;
    if (hint) hint.textContent = q.hint ? ('İpucu: ' + q.hint) : 'İpucu: Uygun olanları eşleştir.';
    if (dateLabel) dateLabel.textContent = dKey + ' - Günlük Eşleştirme';
    const msg = document.getElementById('match_msg');
    if (msg) { msg.textContent = ''; msg.className = 'match-msg'; }
    renderMatchBoard();
    screen.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  async function checkMatching(){
    if (!mState || mState.checked) return;
    const msg = document.getElementById('match_msg');
    const needed = 5;
    if (Object.keys(mState.picks).length !== needed){
      if (msg){ msg.textContent = 'Lütfen önce 5 eşleşmenin tamamını yap.'; msg.className = 'match-msg warn'; }
      return;
    }
    const payload = { questionId: mState.qid, picks: mState.picks, at: Date.now() };
    let committed = false;
    await mState.attemptRef.transaction(curr => curr ? curr : payload, function(err, c){ committed = !!c; });
    if (!committed){
      if (msg){ msg.textContent = 'Bugünkü hakkın zaten kullanılmış.'; msg.className = 'match-msg fail'; }
      return;
    }
    mState.checked = true;
    const allCorrect = Object.keys(mState.picks).every(function(k){
      return Number(mState.picks[k]) === Number(mState.pairMap[k]);
    });
    renderMatchBoard();
    if (allCorrect){
      let matchRewardBase = 100;
      let matchRewardMul = 1;
      let matchRewardTotal = 100;
      const runMatchWinFx = () => {
        const card = document.querySelector('#match-screen .match-card');
        if (!card) return;
        card.classList.add('fb-win-glow');
        const oldFx = card.querySelector('.fb-win-fx');
        if (oldFx) oldFx.remove();
        const fx = document.createElement('div');
        fx.className = 'fb-win-fx';
        fx.innerHTML = `
          <div class="fb-win-core">
            <div class="fb-win-title">MÜKEMMEL EŞLEŞTİRME</div>
            <div class="fb-win-amount" data-win-amount>+0 💎</div>
            <div class="fb-win-sub">${matchRewardMul > 1 ? ('Şampiyonluk Rozeti x'+matchRewardMul+' bonusu!') : ''}${matchRewardMul > 1 ? '<br/>' : ''}${matchRewardTotal} elmas hesabına eklendi</div>
          </div>
        `;
        card.appendChild(fx);
        const amountEl = fx.querySelector('[data-win-amount]');
        const total = matchRewardTotal;
        const t0 = performance.now();
        const dur = 920;
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const cur = Math.round(total * eased);
          if (amountEl) amountEl.textContent = `+${cur} 💎`;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        const colors = ['#fde047','#34d399','#60a5fa','#f472b6','#f97316','#a78bfa'];
        for (let i = 0; i < 34; i++){
          const c = document.createElement('span');
          c.className = 'fb-confetti';
          c.style.background = colors[i % colors.length];
          const ang = (Math.PI * 2 * i) / 34;
          const dist = 120 + Math.random() * 130;
          c.style.setProperty('--x', `${Math.cos(ang) * dist}px`);
          c.style.setProperty('--y', `${Math.sin(ang) * dist}px`);
          c.style.setProperty('--r', `${(Math.random() * 520 - 260).toFixed(0)}deg`);
          c.style.animationDelay = `${(Math.random() * 0.15).toFixed(2)}s`;
          fx.appendChild(c);
        }
        setTimeout(()=>{
          fx.remove();
          card.classList.remove('fb-win-glow');
        }, 2300);
      };
      const stuRef = db().ref(`classes/${mState.student.classId}/students/${mState.student.studentId}`);
      await stuRef.transaction(stu => {
        stu = stu || {};
        const gain = computeChampionDiamondGain(matchRewardBase, stu);
        matchRewardMul = Number(gain.multiplier || 1);
        matchRewardTotal = Number(gain.total || matchRewardBase);
        stu.diamond = Math.min(25000, Number(stu.diamond||0) + matchRewardTotal);
        stu.lastDiamondUpdate = Date.now();
        return stu;
      });
      if (typeof window.novaPlayDiamondRewardSfx === 'function'){
        window.novaPlayDiamondRewardSfx();
      }
      runMatchWinFx();
      const d1 = document.getElementById('diamond-value');
      const d2 = document.getElementById('currentDiamonds');
      [d1, d2].forEach(function(el){
        if (!el) return;
        const base = Number(String(el.textContent||'').replace(/[^\d]/g,'')) || 0;
        el.textContent = String(base + matchRewardTotal);
      });
      if (msg){ msg.textContent = 'Harika! Tüm eşleşmeler doğru. +' + matchRewardTotal + ' 💎' + (matchRewardMul > 1 ? (' (Rozet x'+matchRewardMul+')') : ''); msg.className = 'match-msg ok'; }
    } else {
      if (msg){ msg.textContent = 'Bazı eşleşmeler yanlış. Günlük hakkın bitti.'; msg.className = 'match-msg fail'; }
    }
  }

  function ensureUI(){
    if (document.getElementById('match-style')) return;
    const st = document.createElement('style');
    st.id = 'match-style';
    st.textContent = `
      #match_fab_wrap{display:inline-flex;position:relative;z-index:80;pointer-events:auto;margin-top:8px}
      #match_fab{border:none;border-radius:14px;padding:0 4px;font-weight:900;color:#fff;cursor:pointer;
        background:linear-gradient(135deg,#22c55e,#0ea5e9);box-shadow:0 10px 22px rgba(14,165,233,.28);
        display:flex;align-items:center;justify-content:center;line-height:1;font-size:11px;white-space:nowrap;
        width: clamp(64px, 15vw, 90px);
        height: clamp(30px, 7.5vw, 42px);
        min-width: 64px;
        min-height: 30px}
      #match-screen{display:none;position:fixed;inset:0;z-index:100001;background:
        radial-gradient(900px 520px at 8% -8%,rgba(255,182,193,.36),transparent 60%),
        radial-gradient(900px 520px at 94% -10%,rgba(135,206,250,.34),transparent 58%),
        radial-gradient(760px 420px at 50% 108%,rgba(255,239,128,.34),transparent 60%),
        linear-gradient(180deg,#7c3aed 0%, #4f46e5 38%, #0ea5e9 100%);
        color:#e8efff;align-items:center;justify-content:center;overflow:hidden}
      #match-screen::before,#match-screen::after{content:'';position:absolute;border-radius:999px;pointer-events:none;filter:blur(2px);opacity:.55}
      #match-screen::before{width:180px;height:180px;left:4%;top:8%;background:radial-gradient(circle,rgba(255,255,255,.45),transparent 70%);animation:matchOrbFloatA 6s ease-in-out infinite}
      #match-screen::after{width:220px;height:220px;right:6%;bottom:10%;background:radial-gradient(circle,rgba(255,255,255,.3),transparent 72%);animation:matchOrbFloatB 7s ease-in-out infinite}
      .match-card{width:min(980px,95vw);background:linear-gradient(180deg,#ffffff,#f7fbff 48%,#f0f9ff 100%);border:1px solid rgba(255,255,255,.72);border-radius:24px;padding:18px;position:relative;box-shadow:0 26px 70px rgba(30,41,59,.32), inset 0 1px 0 rgba(255,255,255,.95);overflow:hidden}
      .match-card::before{content:'';position:absolute;inset:-30% auto auto -12%;width:280px;height:280px;background:radial-gradient(circle,rgba(192,132,252,.22),transparent 72%);pointer-events:none}
      .match-card::after{content:'';position:absolute;inset:auto -12% -38% auto;width:320px;height:320px;background:radial-gradient(circle,rgba(56,189,248,.2),transparent 72%);pointer-events:none}
      .match-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
      .match-title{font-size:32px;font-weight:900;color:#4c1d95;letter-spacing:.3px;text-shadow:0 6px 16px rgba(192,132,252,.25)}
      .match-sub{font-size:13px;color:#334155;font-weight:700}
      .match-close{background:linear-gradient(135deg,#f472b6,#fb7185);border:1px solid rgba(244,114,182,.6);color:#fff;border-radius:12px;padding:8px 12px;cursor:pointer;font-weight:800}
      .match-close:hover{filter:brightness(1.07);transform:translateY(-1px)}
      .match-hint{margin:12px 0;background:linear-gradient(135deg,#dbeafe,#cffafe);border:1px solid rgba(125,211,252,.6);border-radius:12px;padding:10px 12px;font-weight:800;color:#0f172a}
      .match-board{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;min-height:340px}
      .match-col{display:grid;gap:10px}
      .match-box{min-height:56px;border-radius:14px;border:1px solid rgba(147,197,253,.65);padding:10px 12px;font-weight:900;color:#0f172a;background:linear-gradient(180deg,#ffffff,#eef6ff);text-align:left;cursor:pointer;transition:transform .16s ease, box-shadow .2s ease, border-color .2s ease}
      .match-box.right{text-align:right}
      .match-box:hover{transform:translateY(-1px);border-color:#38bdf8;box-shadow:0 12px 20px rgba(56,189,248,.22)}
      .match-box.active{outline:2px solid rgba(250,204,21,.85);box-shadow:0 0 0 4px rgba(250,204,21,.22), 0 0 18px rgba(250,204,21,.26)}
      .match-box.paired{border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.14)}
      .match-box.ok{border-color:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.24), 0 0 18px rgba(52,211,153,.22)}
      .match-box.fail{border-color:#fb7185;box-shadow:0 0 0 3px rgba(251,113,133,.24), 0 0 18px rgba(251,113,133,.22)}
      #match_svg{position:absolute;inset:0;pointer-events:none}
      .match-link{fill:none;stroke:var(--line-color,#22d3ee);stroke-width:4;stroke-linecap:round;stroke-dasharray:6 6;animation:matchDash 1.1s linear infinite}
      .match-link.correct{stroke:var(--line-color,#22d3ee);stroke-dasharray:0;animation:none;filter:drop-shadow(0 0 8px rgba(52,211,153,.8))}
      .match-link.wrong{stroke:var(--line-color,#22d3ee);stroke-dasharray:4 7;animation:none;filter:drop-shadow(0 0 8px rgba(251,113,133,.8))}
      .match-link.pending{stroke:var(--line-color,#22d3ee)}
      @keyframes matchDash{to{stroke-dashoffset:-24}}
      @keyframes matchOrbFloatA{0%,100%{transform:translateY(0)}50%{transform:translateY(14px)}}
      @keyframes matchOrbFloatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      .match-actions{display:flex;justify-content:flex-end;margin-top:14px}
      .match-check{border:none;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;border-radius:14px;padding:12px 18px;font-weight:900;cursor:pointer;box-shadow:0 12px 28px rgba(249,115,22,.35)}
      .match-check:hover{transform:translateY(-1px);filter:brightness(1.05)}
      .match-msg{min-height:24px;margin-top:10px;font-weight:800}
      .match-msg.ok{color:#059669}
      .match-msg.fail{color:#e11d48}
      .match-msg.warn{color:#d97706}
      @media (max-width:760px){
        .match-card{width:min(98vw,980px);padding:12px}
        .match-board{grid-template-columns:1fr 1fr;gap:10px;min-height:300px}
        .match-col{gap:8px}
        .match-box{min-height:52px;padding:9px 8px;font-size:14px}
        .match-box.right{text-align:right}
      }
    `;
    document.head.appendChild(st);

    const wrap = document.createElement('span');
    wrap.id = 'match_fab_wrap';
    const btn = document.createElement('button');
    btn.id = 'match_fab';
    btn.innerHTML = '<span>🔗 Eşleştir</span>';
    btn.setAttribute('title', 'Günlük eşleştirme oyunu (+100 elmas)');
    btn.addEventListener('click', function(){ openMatchScreen().catch(function(e){ console.warn(e); }); });
    wrap.appendChild(btn);
    const rewardTag = document.createElement('span');
    rewardTag.className = 'nova-fab-reward-tag';
    rewardTag.setAttribute('aria-hidden', 'true');
    rewardTag.textContent = '+100 💎';
    wrap.appendChild(rewardTag);
    const hudLeft = document.getElementById('main-screen-hud-left') || document.getElementById('main-screen');
    const fbWrap = document.getElementById('fillblank_fab_wrap');
    if (hudLeft){
      if (fbWrap && fbWrap.parentNode === hudLeft) hudLeft.insertBefore(wrap, fbWrap.nextSibling);
      else hudLeft.appendChild(wrap);
    }
    function syncMatchFabSizeLikeBlank(){
      try{
        const fbBtn = document.getElementById('fillblank_fab');
        const mBtn = document.getElementById('match_fab');
        if (!fbBtn || !mBtn) return;
        const w = Math.round(fbBtn.offsetWidth || 0);
        const h = Math.round(fbBtn.offsetHeight || 0);
        if (w > 0) mBtn.style.width = w + 'px';
        if (h > 0) mBtn.style.height = h + 'px';
        mBtn.style.fontSize = getComputedStyle(fbBtn).fontSize || '11px';
        mBtn.style.borderRadius = getComputedStyle(fbBtn).borderRadius || '14px';
      }catch(_){}
    }
    function scheduleMatchLayoutSync(){
      let left = 12;
      const tick = () => {
        syncMatchFabSizeLikeBlank();
        left -= 1;
        if (left <= 0) return;
        setTimeout(tick, 220);
      };
      tick();
    }
    syncMatchFabSizeLikeBlank();
    window.addEventListener('resize', syncMatchFabSizeLikeBlank);
    setTimeout(syncMatchFabSizeLikeBlank, 800);
    window.addEventListener('load', scheduleMatchLayoutSync, { once: true });
    window.addEventListener('pageshow', scheduleMatchLayoutSync);
    scheduleMatchLayoutSync();

    const screen = document.createElement('div');
    screen.id = 'match-screen';
    screen.innerHTML = `
      <div class="match-card">
        <div class="match-head">
          <div>
            <div class="match-title">Eşleştir Oyunu</div>
            <div class="match-sub" id="match_date"></div>
          </div>
          <button class="match-close" id="match_close">Kapat</button>
        </div>
        <div class="match-hint" id="match_hint"></div>
        <div class="match-board" id="match_board">
          <svg id="match_svg"></svg>
          <div class="match-col" id="match_left_col"></div>
          <div class="match-col" id="match_right_col"></div>
        </div>
        <div class="match-actions"><button class="match-check" id="match_check_btn">Kontrol Et</button></div>
        <div class="match-msg" id="match_msg"></div>
      </div>
    `;
    document.body.appendChild(screen);

    document.getElementById('match_close').addEventListener('click', function(){
      const el = document.getElementById('match-screen');
      if (el) el.style.display = 'none';
      document.body.style.overflow = '';
    });
    document.getElementById('match_check_btn').addEventListener('click', function(){ checkMatching().catch(function(e){ console.warn(e); }); });
    window.addEventListener('resize', function(){ requestAnimationFrame(drawLines); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUI, { once: true });
  else ensureUI();
})();
