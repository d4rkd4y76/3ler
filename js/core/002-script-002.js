// === NOVA: Fill In The Blank Daily Mode ===
(function(){
  const FILLBLANK_TEST_UNLIMITED = false;
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
  function norm(s){ return String(s||'').trim().toLocaleLowerCase('tr-TR'); }
  function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h); }
  const FILLBLANK_CACHE_TTL_MS = 30 * 60 * 1000;
  const FILLBLANK_CACHE_MEM = {};

  async function readPathCached(rdb, path, ttlMs){
    const ttl = Number(ttlMs || 0) > 0 ? Number(ttlMs) : FILLBLANK_CACHE_TTL_MS;
    const now = Date.now();
    const m = FILLBLANK_CACHE_MEM[path];
    if (m && (now - m.ts) < ttl) return m.val;
    try {
      if (typeof window.novaReadValCached === 'function') {
        const v = await window.novaReadValCached(path, ttl);
        FILLBLANK_CACHE_MEM[path] = { ts: now, val: v };
        return v;
      }
    } catch (_) {}
    const snap = await dbGet(rdb.ref(path));
    const val = (snap && snap.exists && snap.exists()) ? (snap.val() || null) : null;
    FILLBLANK_CACHE_MEM[path] = { ts: now, val: val };
    return val;
  }

  async function pickDailyQuestionId(rdb, dKey){
    const idxVal = await readPathCached(rdb, 'fillBlanks/questionIds', FILLBLANK_CACHE_TTL_MS);
    let ids = [];
    if (idxVal && typeof idxVal === 'object'){
      const v = idxVal || {};
      ids = Object.keys(v);
    }
    if (!ids.length){
      let keys = null;
      try {
        if (typeof window.novaRtdbShallowKeys === 'function') {
          keys = await window.novaRtdbShallowKeys('fillBlanks/questions');
        }
      } catch (_) {}
      if (keys && keys.length) {
        ids = keys;
        const idMap = {};
        ids.forEach(id => idMap[id]=true);
        rdb.ref('fillBlanks/questionIds').set(idMap).catch(()=>{});
      } else if (keys === null) {
        const v = await readPathCached(rdb, 'fillBlanks/questions', FILLBLANK_CACHE_TTL_MS);
        if (!v || typeof v !== 'object') return null;
        ids = Object.keys(v);
        const idMap = {};
        ids.forEach(id => idMap[id]=true);
        rdb.ref('fillBlanks/questionIds').set(idMap).catch(()=>{});
      }
    }
    if (!ids.length) return null;
    ids.sort();
    const idx = hashStr('fillblank:'+dKey) % ids.length;
    return ids[idx];
  }

  async function openFillBlankScreen(){
    const rdb = db();
    const s = sel();
    if (!rdb || !s || !s.studentId || !s.classId){
      if (typeof showAlert === 'function') showAlert('Önce giriş yapmalısın.');
      return;
    }

    const dKey = dayKey();
    const attemptRef = rdb.ref(`fillBlanks/attempts/${s.studentId}/${dKey}`);
    const attemptSnap = await dbGet(attemptRef);
    if (attemptSnap.exists()){
      if (typeof showAlert === 'function') showAlert('Bugünkü Boşluğu Doldur hakkını zaten kullandın. Yeni soru gelene kadar beklemelisin.');
      return;
    }

    const qid = await pickDailyQuestionId(rdb, dKey);
    if (!qid){
      if (typeof showAlert === 'function') showAlert('Bugün için soru bulunamadı.');
      return;
    }
    const q = await readPathCached(rdb, `fillBlanks/questions/${qid}`, FILLBLANK_CACHE_TTL_MS);
    if (!q || typeof q !== 'object'){
      if (typeof showAlert === 'function') showAlert('Soru yüklenemedi.');
      return;
    }
    const answerLen = Number(q.answerLength || String(q.answer||'').trim().length || 1);
    const rawText = String(q.text || '');
    const holeMatch = rawText.match(/_+/); // Adminin yazdigi ilk _ grubunu koru.
    const holeToken = holeMatch ? holeMatch[0] : '_'.repeat(Math.max(1, answerLen));
    const text = holeMatch ? rawText : (rawText + ' ' + holeToken);

    const screen = document.getElementById('fillblank-screen');
    const questionEl = document.getElementById('fillblank-question');
    const hintEl = document.getElementById('fillblank-hint');
    const inputEl = document.getElementById('fillblank-input');
    const resultEl = document.getElementById('fillblank-result');
    const chipsEl = document.getElementById('fillblank-chips');
    if (!screen || !questionEl || !inputEl || !resultEl) return;

    // Bosluk uzunlugunu adminin yazdigi "_" adedine gore goster.
    questionEl.innerHTML = text.replace(holeToken, `<span class="fb-hole">${'_'.repeat(holeToken.length)}</span>`);
    hintEl.textContent = q.hint ? ('İpucu: '+q.hint) : 'İpucu: Yok';
    inputEl.value = '';
    inputEl.maxLength = answerLen;
    inputEl.placeholder = `${answerLen} karakter`;
    resultEl.textContent = '';
    resultEl.className = 'fb-result';
    chipsEl.innerHTML = '';
    for (let i=0;i<answerLen;i++){
      const c = document.createElement('span');
      c.className = 'fb-chip';
      c.textContent = i+1;
      chipsEl.appendChild(c);
    }
    screen.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('fillblank-close');
    const checkBtn = document.getElementById('fillblank-check');
    closeBtn.onclick = () => { screen.style.display='none'; document.body.style.overflow=''; };

    let answeredOnce = false;
    checkBtn.onclick = async () => {
      if (answeredOnce){
        resultEl.textContent = 'Bugün için kontrol hakkını kullandın.';
        resultEl.className = 'fb-result fail';
        return;
      }
      const userAns = inputEl.value.trim();
      if (!userAns){ resultEl.textContent = 'Cevap yazmalısın.'; return; }
      answeredOnce = true;
      checkBtn.disabled = true;
      const isCorrect = norm(userAns) === norm(q.answerNorm || q.answer || '');
      const payload = {
        questionId: qid,
        answer: userAns,
        correct: !!isCorrect,
        at: Date.now()
      };

      let committed = false;
      await attemptRef.transaction(curr => curr ? curr : payload, (err, c)=>{ committed = !!c; });
      if (!committed){
        resultEl.textContent = 'Bugünkü hakkını zaten kullandın.';
        resultEl.className = 'fb-result fail';
        return;
      }

      if (isCorrect){
        const stuRef = rdb.ref(`classes/${s.classId}/students/${s.studentId}`);
        var fbRewardBase = 100;
        var fbRewardMul = 1;
        var fbRewardTotal = 100;
        await stuRef.transaction(stu => {
          stu = stu || {};
          var gain = computeChampionDiamondGain(fbRewardBase, stu);
          fbRewardMul = Number(gain.multiplier || 1);
          fbRewardTotal = Number(gain.total || fbRewardBase);
          stu.diamond = Math.min(25000, Number(stu.diamond||0) + fbRewardTotal);
          stu.lastDiamondUpdate = Date.now();
          return stu;
        });
        const runWinFx = () => {
          const card = screen.querySelector('.fb-card');
          if (!card) return;
          card.classList.add('fb-win-glow');
          const oldFx = card.querySelector('.fb-win-fx');
          if (oldFx) oldFx.remove();
          const fx = document.createElement('div');
          fx.className = 'fb-win-fx';
          fx.innerHTML = `
            <div class="fb-win-core">
              <div class="fb-win-title">MUKEMMEL HAMLE</div>
              <div class="fb-win-amount" data-win-amount>+0 💎</div>
              <div class="fb-win-sub">${fbRewardMul > 1 ? ('Şampiyonluk Rozeti x'+fbRewardMul+' bonusu aktif!') : ''}${fbRewardMul > 1 ? '<br/>' : ''}${fbRewardTotal} elmas hesabına eklendi</div>
            </div>
          `;
          card.appendChild(fx);
          const amountEl = fx.querySelector('[data-win-amount]');
          const total = fbRewardTotal;
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
          const d1 = document.getElementById('diamond-value');
          const d2 = document.getElementById('currentDiamonds');
          [d1, d2].forEach(el=>{
            if(!el) return;
            const base = Number(String(el.textContent||'').replace(/[^\d]/g,'')) || 0;
            el.textContent = String(base + fbRewardTotal);
            el.style.transition = 'transform .2s ease, text-shadow .2s ease';
            el.style.transform = 'scale(1.18)';
            el.style.textShadow = '0 0 16px rgba(250,204,21,.75)';
            setTimeout(()=>{ el.style.transform=''; el.style.textShadow=''; }, 520);
          });
          setTimeout(()=>{
            fx.remove();
            card.classList.remove('fb-win-glow');
          }, 2300);
        };
        if (typeof window.novaPlayDiamondRewardSfx === 'function'){
          window.novaPlayDiamondRewardSfx();
        }
        runWinFx();
        resultEl.textContent = 'Doğru! +' + fbRewardTotal + ' 💎' + (fbRewardMul > 1 ? (' (Rozet x'+fbRewardMul+')') : '');
        resultEl.className = 'fb-result ok';
        screen.classList.remove('fb-shake');
        screen.classList.add('fb-pop');
        setTimeout(()=>screen.classList.remove('fb-pop'), 700);
      } else {
        resultEl.textContent = 'Yanlış! Günlük hakkın bitti.';
        resultEl.className = 'fb-result fail';
        screen.classList.remove('fb-pop');
        screen.classList.add('fb-shake');
        setTimeout(()=>screen.classList.remove('fb-shake'), 700);
      }
      // Bilerek tekrar acmiyoruz: gunde tek kontrol tek odul.
    };
  }

  function ensureUI(){
    if (document.getElementById('fillblank-style')) return;
    const st = document.createElement('style');
    st.id = 'fillblank-style';
    st.textContent = `
      #fillblank_fab{
        position:relative;z-index:12;border:none;border-radius:14px;
        padding:0 4px;font-weight:900;color:#fff;cursor:pointer;
        background:linear-gradient(135deg,#fb7185,#f59e0b);box-shadow:0 10px 22px rgba(245,158,11,.28);
        display:flex;align-items:center;justify-content:center;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        line-height:1;font-size:11px;letter-spacing:0;
        width: clamp(64px, 15vw, 90px);
        height: clamp(30px, 7.5vw, 42px);
        min-width: 64px;
        min-height: 30px;
      }
      #fillblank_fab_wrap{display:inline-flex;position:relative;z-index:80;pointer-events:auto;margin-top:8px}
      #main-screen-hud-left{
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:flex-start !important;
        gap:8px !important;
        overflow:visible !important;
      }
      #main-screen-hud-left #puzzle_fab_wrap,
      #main-screen-hud-left #fillblank_fab_wrap{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        transform:none !important;
        margin:0 !important;
        align-self:center !important;
      }
      #main-screen-hud-left #puzzle_fab_wrap{order:1 !important}
      #main-screen-hud-left #fillblank_fab_wrap{order:2 !important;margin-top:0 !important}
      #main-screen-hud-left #match_fab_wrap{order:3 !important;margin-top:0 !important}
      #main-screen-hud-left #fillblank_fab{margin:0 !important}
      #main-screen-hud-left #match_fab{margin:0 !important}
      #main-screen-quest-slot{
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:flex-start !important;
        gap:8px !important;
        overflow:visible !important;
      }
      #main-screen-quest-slot #homework_fab,
      #main-screen-quest-slot #quest_fab_wrap{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        transform:none !important;
        margin:0 !important;
        align-self:center !important;
      }
      #main-screen-quest-slot .surprise-box{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        margin:0 !important;
        align-self:center !important;
      }
      #main-screen-quest-slot #homework_fab{order:1 !important}
      #main-screen-quest-slot #quest_fab_wrap{order:2 !important}
      #main-screen-quest-slot .surprise-box{order:3 !important}
      #main-screen-quest-slot .nova-tour-fab-wrap{order:4 !important}
      #fillblank_fab .fb-fab-label{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}
      #fillblank_fab:hover{transform:translateY(-1px);filter:brightness(1.04)}
      #fillblank-screen{display:none;position:fixed;inset:0;z-index:100001;background:
        radial-gradient(900px 500px at 20% -10%,rgba(56,189,248,.18),transparent 60%),
        radial-gradient(900px 500px at 90% 0%,rgba(251,113,133,.16),transparent 60%),
        #0b1020;color:#e7ecf7;align-items:center;justify-content:center}
      .fb-card{width:min(760px,92vw);background:linear-gradient(180deg,#1d2b5f,#141f43);border:1px solid rgba(147,197,253,.35);border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);position:relative;overflow:hidden}
      .fb-card::before{content:'';position:absolute;inset:-40% auto auto -20%;width:240px;height:240px;background:radial-gradient(circle,rgba(59,130,246,.24),transparent 70%);pointer-events:none;animation:fbAura 5s ease-in-out infinite}
      .fb-card::after{content:'';position:absolute;inset:auto -20% -45% auto;width:260px;height:260px;background:radial-gradient(circle,rgba(250,204,21,.18),transparent 70%);pointer-events:none}
      .fb-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
      .fb-title{font-size:26px;font-weight:900;letter-spacing:.2px;color:#fef3c7}
      .fb-close{background:transparent;border:1px solid rgba(148,163,184,.4);color:#fff;border-radius:10px;padding:8px 10px;cursor:pointer}
      .fb-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.18);border:1px solid rgba(16,185,129,.4);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;margin-bottom:10px}
      .fb-question{font-size:27px;font-weight:800;line-height:1.35;margin:10px 0;color:#ffffff}
      .fb-hole{display:inline-block;letter-spacing:3px;color:#fbbf24}
      .fb-hint{opacity:.92;margin-bottom:12px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);padding:8px 10px;border-radius:10px}
      .fb-row{display:flex;gap:10px;align-items:center}
      .fb-input{flex:1;background:#0d1430;border:1px solid rgba(148,163,184,.32);color:#fff;border-radius:12px;padding:12px 13px;font-size:18px;outline:none}
      .fb-input:focus{border-color:rgba(96,165,250,.8);box-shadow:0 0 0 3px rgba(96,165,250,.22)}
      .fb-check{border:none;background:linear-gradient(135deg,#34d399,#22c55e);color:#fff;border-radius:12px;padding:12px 14px;font-weight:800;cursor:pointer;box-shadow:0 10px 24px rgba(34,197,94,.35)}
      .fb-chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
      .fb-chip{background:rgba(148,163,184,.14);border:1px solid rgba(148,163,184,.25);border-radius:999px;padding:4px 8px;font-size:12px}
      .fb-result{margin-top:12px;font-weight:800;min-height:26px}
      .fb-result.ok{color:#34d399;text-shadow:0 0 12px rgba(52,211,153,.35)}
      .fb-result.fail{color:#fb7185;text-shadow:0 0 12px rgba(251,113,133,.35)}
      .fb-win-fx{
        position:absolute;inset:0;pointer-events:none;display:grid;place-items:center;z-index:4;
      }
      .fb-win-core{
        position:relative;min-width:280px;padding:14px 18px;border-radius:16px;
        border:1px solid rgba(250,204,21,.65);
        background:linear-gradient(160deg, rgba(120,53,15,.9), rgba(30,41,59,.95));
        box-shadow:0 18px 40px rgba(0,0,0,.45), 0 0 42px rgba(250,204,21,.24);
        text-align:center;animation:fbWinLift 1.6s ease forwards;
      }
      .fb-win-title{font-size:12px;font-weight:800;letter-spacing:.9px;color:#fde68a;text-transform:uppercase}
      .fb-win-amount{font-size:40px;font-weight:900;line-height:1;color:#fef08a;text-shadow:0 0 18px rgba(250,204,21,.45)}
      .fb-win-sub{font-size:13px;color:#dbeafe}
      .fb-confetti{
        position:absolute;left:50%;top:50%;width:10px;height:16px;border-radius:5px;opacity:0;
        transform:translate(-50%,-50%);animation:fbConfetti 1.25s ease-out forwards;
      }
      .fb-card.fb-win-glow{
        box-shadow:0 26px 66px rgba(0,0,0,.55), 0 0 0 2px rgba(250,204,21,.35), 0 0 60px rgba(250,204,21,.2), inset 0 1px 0 rgba(255,255,255,.1);
      }
      @keyframes fbShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-8px)}40%,60%{transform:translateX(8px)}}
      @keyframes fbPop{0%{transform:scale(.96)}100%{transform:scale(1)}}
      @keyframes fbAura{0%{transform:translateY(0)}50%{transform:translateY(12px)}100%{transform:translateY(0)}}
      @keyframes fbFloat{0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}
      @keyframes fbWinLift{0%{opacity:0;transform:translateY(14px) scale(.92)}20%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:1;transform:translateY(-3px) scale(1)}}
      @keyframes fbConfetti{
        0%{opacity:0;transform:translate(-50%,-50%) scale(.7) rotate(0deg)}
        8%{opacity:1}
        100%{opacity:0;transform:translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(var(--r))}
      }
      .fb-decor{position:absolute;inset:12px;pointer-events:none;overflow:hidden;border-radius:18px}
      .fb-star{position:absolute;opacity:.65;animation:fbFloat 2.4s ease-in-out infinite}
      .fb-star.s1{left:10px;top:6px;animation-delay:.1s}
      .fb-star.s2{right:14px;top:10px;animation-delay:.5s}
      .fb-star.s3{left:18px;bottom:10px;animation-delay:.9s}
      .fb-shake .fb-card{animation:fbShake .55s}
      .fb-pop .fb-card{animation:fbPop .55s}
      @media (max-width: 560px){
        .fb-card{width:min(94vw,560px);padding:14px}
        .fb-title{font-size:20px}
        .fb-question{font-size:22px}
        .fb-row{flex-direction:column;align-items:stretch}
        .fb-input{width:100%;font-size:16px}
        .fb-check{width:100%;padding:12px 10px}
      }
    `;
    document.head.appendChild(st);

    const wrapBtn = document.createElement('span');
    wrapBtn.id = 'fillblank_fab_wrap';
    const btn = document.createElement('button');
    btn.id = 'fillblank_fab';
    btn.innerHTML = '<span class="fb-fab-label">🧩 Boşluk</span>';
    btn.addEventListener('click', ()=>{ openFillBlankScreen().catch(e=>{ console.warn(e); if(typeof showAlert==='function') showAlert('Boşluğu Doldur açılamadı.'); }); });
    wrapBtn.appendChild(btn);
    var rewardTag = document.createElement('span');
    rewardTag.className = 'nova-fab-reward-tag';
    rewardTag.setAttribute('aria-hidden', 'true');
    rewardTag.textContent = '+100 💎';
    wrapBtn.appendChild(rewardTag);
    btn.setAttribute('title', 'Doğru cevapta +100 elmas');
    const questWrap = document.getElementById('quest_fab_wrap');
    const questSlot = document.getElementById('main-screen-quest-slot');
    const hudL = document.getElementById('main-screen-hud-left');
    const puzWrap = document.getElementById('puzzle_fab_wrap');
    const ms = document.getElementById('main-screen');
    const parent = hudL || (questWrap && questWrap.parentNode) || questSlot || ms || document.body;
    if (puzWrap && puzWrap.parentNode === parent && parent.contains(puzWrap)){
      if (wrapBtn.previousElementSibling !== puzWrap){ parent.insertBefore(wrapBtn, puzWrap.nextSibling); }
    } else if (questWrap && questWrap.parentNode === parent) {
      if (questWrap.nextSibling) parent.insertBefore(wrapBtn, questWrap.nextSibling);
      else parent.appendChild(wrapBtn);
    } else {
      parent.appendChild(wrapBtn);
    }
    const labelEl = btn.querySelector('.fb-fab-label');
    function fitFabText(){
      try{
        if (!labelEl) return;
        const labels = ['🧩 Boşluk'];
        for (const text of labels){
          labelEl.textContent = text;
          let fs = 13;
          labelEl.style.fontSize = fs + 'px';
          while (labelEl.scrollWidth > (btn.clientWidth - 6) && fs > 7){
            fs -= 1;
            labelEl.style.fontSize = fs + 'px';
          }
          if (labelEl.scrollWidth <= (btn.clientWidth - 6)) return;
        }
      }catch(_){}
    }
    function placeAndSizeLikeQuest(){
      try{
        const qbtn = document.getElementById('quest_fab');
        const hbtn = document.getElementById('homework_fab');
        const puzW = document.getElementById('puzzle_fab_wrap');
        const hudLeft = document.getElementById('main-screen-hud-left');
        if (hudLeft && wrapBtn.parentNode !== hudLeft){ hudLeft.appendChild(wrapBtn); }
        if (puzW && hudLeft && wrapBtn.parentNode === hudLeft && wrapBtn.previousElementSibling !== puzW){
          hudLeft.insertBefore(wrapBtn, puzW.nextSibling);
        }
        if (!qbtn) return;
        btn.style.width = Math.round(qbtn.offsetWidth) + 'px';
        btn.style.height = Math.round(qbtn.offsetHeight) + 'px';
        if (hbtn){
          hbtn.style.width = Math.round(qbtn.offsetWidth) + 'px';
          hbtn.style.height = Math.round(qbtn.offsetHeight) + 'px';
          hbtn.style.margin = '0';
        }
        wrapBtn.style.pointerEvents = 'auto';
        btn.style.pointerEvents = 'auto';
        fitFabText();
      }catch(_){}
    }
    function scheduleFabLayoutSync(){
      let left = 12;
      const tick = () => {
        placeAndSizeLikeQuest();
        left -= 1;
        if (left <= 0) return;
        setTimeout(tick, 220);
      };
      tick();
    }
    placeAndSizeLikeQuest();
    window.addEventListener('resize', placeAndSizeLikeQuest);
    setTimeout(placeAndSizeLikeQuest, 800);
    window.addEventListener('load', scheduleFabLayoutSync, { once: true });
    window.addEventListener('pageshow', scheduleFabLayoutSync);
    scheduleFabLayoutSync();

    const wrap = document.createElement('div');
    wrap.id = 'fillblank-screen';
    wrap.innerHTML = `
      <div class="fb-card">
        <div class="fb-decor">
          <span class="fb-star s1">✨</span>
          <span class="fb-star s2">🌟</span>
          <span class="fb-star s3">⭐</span>
        </div>
        <div class="fb-top">
          <div class="fb-title">Boşluğu Doldur</div>
          <button class="fb-close" id="fillblank-close">Kapat</button>
        </div>
        <div class="fb-badge">⭐ Günlük Meydan Okuma</div>
        <div class="fb-hint" id="fillblank-hint">İpucu:</div>
        <div class="fb-question" id="fillblank-question"></div>
        <div class="fb-chips" id="fillblank-chips"></div>
        <div class="fb-row">
          <input id="fillblank-input" class="fb-input" type="text" />
          <button id="fillblank-check" class="fb-check">Kontrol Et</button>
        </div>
        <div id="fillblank-result" class="fb-result"></div>
      </div>`;
    document.body.appendChild(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureUI, {once:true});
  else ensureUI();
})();
