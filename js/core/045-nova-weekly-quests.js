(function(){
  const QUESTS = [
    { id:'single5', title:'Tek kişilikte 5 oyun oyna', target:5, reward:120, icon:'🎮', event:'single_played', onlyPureSingle:true },
    { id:'single8x10', title:'10 kez tek kişilikte 8+ doğru yap', target:10, reward:450, icon:'🧠', event:'single_8plus', onlyPureSingle:true },
    { id:'duelWin5', title:'5 düello kazan', target:5, reward:700, icon:'⚔️', event:'duel_win' },
    { id:'hw5', title:'5 ödev tamamla', target:5, reward:500, icon:'📚', event:'homework_completed' },
    { id:'deneme1', title:'Haftalık denemeyi tamamla', target:1, reward:1000, icon:'🏆', event:'deneme_completed' }
  ];

  const stateCache = { key:'', ts:0, val:null };
  function db(){ try{ return firebase.database(); }catch(_){ return null; } }
  function sel(){
    try{
      if (window.selectedStudent && selectedStudent.studentId) return selectedStudent;
      const raw = localStorage.getItem('selectedStudent');
      return raw ? (JSON.parse(raw)||null) : null;
    }catch(_){ return null; }
  }
  function weekStartDate(nowTs){
    const d = new Date(nowTs || Date.now());
    const day = (d.getDay() + 6) % 7;
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - day);
    return d;
  }
  function weekId(){
    const s = weekStartDate();
    const y = s.getFullYear();
    const m = String(s.getMonth()+1).padStart(2,'0');
    const d = String(s.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + d;
  }
  function weekLabel(id){
    const parts = String(id||'').split('-');
    if(parts.length !== 3) return '';
    const s = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    const e = new Date(s.getTime()); e.setDate(e.getDate()+6);
    return s.toLocaleDateString('tr-TR') + ' - ' + e.toLocaleDateString('tr-TR');
  }
  function defaultState(wid){
    const progress = {}; QUESTS.forEach(q=>progress[q.id]=0);
    return { weekId: wid, progress: progress, claimed: {}, updatedAt: Date.now() };
  }
  async function ensureWeeklyState(force){
    const d = db(); const s = sel();
    if(!d || !s || !s.studentId) return null;
    const wid = weekId();
    const key = s.studentId + '|' + wid;
    if(!force && stateCache.key===key && (Date.now()-stateCache.ts)<15000 && stateCache.val) return stateCache.val;
    const ref = d.ref('weeklyMissions/'+s.studentId);
    const tx = await ref.transaction((cur)=>{
      if(!cur || cur.weekId !== wid){ return defaultState(wid); }
      return cur;
    });
    const next = tx && tx.snapshot && tx.snapshot.val ? (tx.snapshot.val() || defaultState(wid)) : defaultState(wid);
    stateCache.key = key; stateCache.ts = Date.now(); stateCache.val = next;
    return next;
  }
  function ensureQuestUi(){
    if(document.getElementById('weekly-quest-screen')) return;
    const st = document.createElement('style');
    st.id = 'weekly-quest-style';
    st.textContent = `
      .quest-fab-wrap{display:inline-flex;position:relative;z-index:60;pointer-events:auto;overflow:visible}
      .quest-fab{
        position:relative; z-index:10000; overflow:visible; border:none; cursor:pointer; color:#f8fbff;
        border-radius:16px; padding:10px 14px; min-height:44px; min-width:min-content; max-width:none; font-weight:900; letter-spacing:.3px;
        box-sizing:border-box;
        background:linear-gradient(135deg,#22d3ee,#22c55e 45%,#84cc16);
        box-shadow:0 0 0 2px rgba(255,255,255,.28) inset, 0 12px 26px rgba(0,0,0,.30), 0 0 22px rgba(34,211,238,.58);
        display:inline-flex; align-items:center; justify-content:center; gap:6px; transition: filter .18s ease, box-shadow .2s ease;
        animation: questFabPulse 1.5s ease-in-out infinite;
        text-align:center; white-space:nowrap;
      }
      .quest-fab:hover{ filter:brightness(1.12); box-shadow:0 0 0 2px rgba(255,255,255,.34) inset, 0 14px 28px rgba(0,0,0,.34), 0 0 30px rgba(52,211,153,.72); }
      .quest-fab .q-badge{
        position:absolute; top:0; right:0; left:auto; bottom:auto; margin:0;
        transform:translate(30%, -38%); transform-origin:center center;
        min-width:22px; min-height:22px; height:22px; border-radius:999px; background:linear-gradient(180deg,#fb7185,#e11d48); color:#fff;
        font-size:11px; line-height:0; font-weight:900; font-variant-numeric:tabular-nums;
        display:grid; place-items:center; padding:0 6px;
        box-sizing:border-box;
        box-shadow:0 2px 8px rgba(0,0,0,.35), 0 0 0 2px rgba(17,24,39,.6);
        pointer-events:none; z-index:3;
      }
      @keyframes questFabPulse{
        0%,100%{ filter:brightness(1); box-shadow:0 0 0 2px rgba(255,255,255,.28) inset, 0 12px 26px rgba(0,0,0,.30), 0 0 22px rgba(34,211,238,.58); }
        50%{ filter:brightness(1.1); box-shadow:0 0 0 2px rgba(255,255,255,.34) inset, 0 14px 30px rgba(0,0,0,.34), 0 0 32px rgba(52,211,153,.65); }
      }
      #weekly-quest-screen{ display:none; position:fixed; inset:0; z-index:12000; background:radial-gradient(1400px 700px at 80% -10%, rgba(34,197,94,.20), transparent 60%), #0b1220; color:#e6eefb; }
      .wq-wrap{ max-width:980px; margin:0 auto; height:100%; display:flex; flex-direction:column; padding:16px; gap:12px; }
      .wq-top{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-radius:16px; background:rgba(12,18,31,.72); border:1px solid rgba(255,255,255,.08); }
      .wq-title{ font-weight:900; font-size:20px; }
      .wq-sub{ font-size:13px; opacity:.86; margin-top:2px; }
      .wq-close{ border:none; border-radius:12px; padding:10px 12px; background:#1f2937; color:#cfe5ff; font-weight:800; cursor:pointer; }
      .wq-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; overflow:auto; padding-bottom:6px; }
      .wq-card{ background:linear-gradient(165deg,rgba(17,24,39,.9),rgba(8,15,27,.95)); border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:14px; }
      .wq-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .wq-task{ font-size:15px; font-weight:800; line-height:1.35; }
      .wq-reward{ font-size:13px; color:#c7f9d5; font-weight:800; white-space:nowrap; }
      .wq-progress{ margin-top:10px; height:9px; border-radius:999px; background:#0f172a; overflow:hidden; border:1px solid rgba(255,255,255,.08);}
      .wq-progress > i{ display:block; height:100%; background:linear-gradient(90deg,#22c55e,#84cc16); width:0%; transition:width .25s ease; }
      .wq-meta{ margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#9fb4d8; }
      .wq-claim{ margin-top:10px; width:100%; border:none; border-radius:12px; padding:10px; font-weight:900; cursor:pointer; }
      .wq-claim.ready{ background:linear-gradient(135deg,#fde047,#f59e0b); color:#111827; }
      .wq-claim.locked{ background:#1f2937; color:#9ca3af; cursor:not-allowed; }
      .wq-claim.done{ background:#065f46; color:#d1fae5; cursor:default; }
      .wq-hero-bonus-hint{ margin-top:6px; font-size:11px; font-weight:800; color:#c4b5fd; line-height:1.35; }
      #wq-toast{ position:fixed; left:50%; top:50%; transform:translate(-50%,-50%) scale(.95); opacity:0; pointer-events:none; z-index:12100; }
      #wq-toast.show{ animation:wqPop .9s ease forwards; }
      @keyframes wqPop{
        0%{opacity:0; transform:translate(-50%,-44%) scale(.85)}
        25%{opacity:1; transform:translate(-50%,-50%) scale(1.03)}
        75%{opacity:1; transform:translate(-50%,-50%) scale(1)}
        100%{opacity:0; transform:translate(-50%,-58%) scale(.97)}
      }
      .wq-toast-card{ padding:16px 18px; border-radius:14px; border:1px solid rgba(255,255,255,.12); background:rgba(8,15,27,.95); box-shadow:0 18px 36px rgba(0,0,0,.42); font-weight:900; color:#eafff1; }
      #wq-reward-overlay{ position:fixed; inset:0; z-index:12120; display:none; align-items:center; justify-content:center; background:rgba(3,8,20,.62); backdrop-filter:blur(4px); }
      #wq-reward-overlay.open{ display:flex; }
      #wq-reward-overlay .wq-reward-card{
        position:relative; overflow:hidden; width:min(580px,92vw);
        border-radius:20px; padding:20px 18px 16px;
        background:linear-gradient(170deg,#1e293b,#0b1220 58%, #0f172a);
        border:1px solid rgba(148,163,184,.45);
        box-shadow:0 22px 54px rgba(0,0,0,.56), inset 0 1px 0 rgba(255,255,255,.16);
      }
      #wq-reward-overlay .wq-reward-card::before{ content:''; position:absolute; inset:-24% auto auto -18%; width:240px; height:240px; border-radius:999px; background:radial-gradient(circle, rgba(34,211,238,.24), transparent 72%); pointer-events:none; }
      #wq-reward-overlay .wq-reward-card::after{ content:''; position:absolute; inset:auto -16% -30% auto; width:260px; height:260px; border-radius:999px; background:radial-gradient(circle, rgba(59,130,246,.22), transparent 72%); pointer-events:none; }
      #wq-reward-overlay .wq-reward-head{ font-size:12px; font-weight:900; letter-spacing:.08em; color:#c7d2fe; text-transform:uppercase; }
      #wq-reward-overlay .wq-reward-amount{ margin-top:8px; font-size:clamp(34px,8.2vw,64px); font-weight:900; color:#7dd3fc; text-shadow:0 0 18px rgba(34,211,238,.36); }
      #wq-reward-overlay .wq-reward-sub{ margin-top:6px; color:#dbeafe; font-weight:700; }
      #wq-reward-overlay .wq-reward-meta{ margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; }
      #wq-reward-overlay .wq-chip{ padding:7px 10px; border-radius:999px; background:rgba(15,23,42,.72); border:1px solid rgba(148,163,184,.4); color:#e2e8f0; font-weight:800; font-size:12px; }
      #wq-reward-overlay .wq-chip.bonus{ display:none; border-color:rgba(253,224,71,.86); color:#fef3c7; background:linear-gradient(90deg,rgba(120,53,15,.72),rgba(245,158,11,.52)); box-shadow:0 0 14px rgba(250,204,21,.32); }
      #wq-reward-overlay.champion .wq-reward-card{
        background:linear-gradient(170deg,#1e293b,#0f172a 48%, #422006);
        border-color:rgba(253,224,71,.72);
        box-shadow:0 22px 54px rgba(0,0,0,.56), inset 0 1px 0 rgba(255,255,255,.16), 0 0 72px rgba(250,204,21,.28);
      }
      #wq-reward-overlay.champion .wq-reward-amount{ color:#fde68a; text-shadow:0 0 22px rgba(250,204,21,.52); }
      #wq-reward-overlay.champion .wq-chip.bonus{ display:inline-flex; }
      #wq-reward-overlay .wq-reward-ok{ margin-top:14px; border:none; border-radius:12px; padding:10px 14px; background:linear-gradient(180deg,#22c55e,#16a34a); color:#fff; font-weight:900; cursor:pointer; }
      @media (max-width: 760px){ .wq-grid{ grid-template-columns:1fr; } .wq-title{ font-size:18px; } }
    `;
    document.head.appendChild(st);
    const pane = document.createElement('div');
    pane.id = 'weekly-quest-screen';
    pane.innerHTML = '<div class="wq-wrap"><div class="wq-top"><div><div class="wq-title">🎁 Haftalık Hediye Görevleri</div><div class="wq-sub" id="wq_week_label">-</div></div><button class="wq-close" id="wq_close_btn">Kapat ✕</button></div><div class="wq-grid" id="wq_grid"></div></div>';
    document.body.appendChild(pane);
    const toast = document.createElement('div');
    toast.id = 'wq-toast';
    toast.innerHTML = '<div class="wq-toast-card" id="wq_toast_text"></div>';
    document.body.appendChild(toast);
    const reward = document.createElement('div');
    reward.id = 'wq-reward-overlay';
    reward.innerHTML = '<div class="wq-reward-card"><div class="wq-reward-head">Görev Ödülü Toplandı</div><div class="wq-reward-amount"><span id="wq_reward_num">+0</span> 💎</div><div class="wq-reward-sub" id="wq_reward_sub">Ödül hesabına eklendi.</div><div class="wq-reward-meta"><div class="wq-chip" id="wq_reward_task">Görev</div><div class="wq-chip bonus" id="wq_reward_bonus">👑 Rozet x2 bonus aktif</div><div class="wq-chip bonus" id="wq_reward_hero_bonus" style="display:none">🦸 Kahraman bonusu</div></div><button class="wq-reward-ok" id="wq_reward_ok" type="button">Harika!</button></div>';
    document.body.appendChild(reward);
    const okBtn = document.getElementById('wq_reward_ok');
    if(okBtn) okBtn.addEventListener('click', function(){ reward.classList.remove('open', 'champion'); });
    document.getElementById('wq_close_btn').addEventListener('click', closeQuestScreen);
  }
  function ensureQuestFab(){
    const ms = document.getElementById('main-screen');
    if(!ms || document.getElementById('quest_fab_wrap')) return;
    const wrap = document.createElement('span');
    wrap.id = 'quest_fab_wrap';
    wrap.className = 'quest-fab-wrap';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'quest_fab';
    btn.className = 'quest-fab';
    btn.innerHTML = '🎁 GÖREV <span class="q-badge" id="quest_badge" hidden>0</span>';
    btn.addEventListener('click', openQuestScreen);
    wrap.appendChild(btn);
    var questSlot = document.getElementById('main-screen-quest-slot');
    var hudL = document.getElementById('main-screen-hud-left');
    (questSlot || hudL || ms).appendChild(wrap);
  }
  function toast(msg){
    const el = document.getElementById('wq-toast');
    const txt = document.getElementById('wq_toast_text');
    if(!el || !txt) return;
    txt.textContent = msg;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  function showQuestRewardOverlay(total, multiplier, quest){
    const ov = document.getElementById('wq-reward-overlay');
    if(!ov) return;
    const numEl = document.getElementById('wq_reward_num');
    const subEl = document.getElementById('wq_reward_sub');
    const taskEl = document.getElementById('wq_reward_task');
    const base = Math.max(0, Number((quest && quest.reward) || 0));
    const mul = Math.max(1, Number(multiplier || 1));
    const gain = Math.max(0, Number(total || 0));
    if(taskEl) taskEl.textContent = (quest && quest.icon ? quest.icon + ' ' : '') + (quest && quest.title ? quest.title : 'Görev');
    if(subEl) subEl.textContent = mul > 1 ? ('Şampiyonluk Rozeti ile ' + base + ' → ' + gain + ' 💎') : 'Ödül hesabına eklendi.';
    var heroChip = document.getElementById('wq_reward_hero_bonus');
    if(heroChip){
      var hb = Number(window.__novaLastQuestHeroBonus || 0);
      heroChip.style.display = hb > 0 ? 'inline-flex' : 'none';
      heroChip.textContent = '🦸 Kahraman görev bonusu: +' + hb + ' 💎';
    }
    if(numEl){
      const t0 = performance.now();
      const dur = 920;
      const run = (now)=>{
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        numEl.textContent = '+' + Math.round(gain * eased);
        if(p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }
    ov.classList.toggle('champion', mul > 1);
    ov.classList.add('open');
    try{
      if (typeof window.novaPlayDiamondRewardSfx === 'function') window.novaPlayDiamondRewardSfx();
    }catch(_){}
  }
  async function claimQuestReward(qid){
    const d = db(); const s = sel();
    if(!d || !s || !s.studentId || !s.classId) return;
    const quest = QUESTS.find(x=>x.id===qid); if(!quest) return;
    const st = await ensureWeeklyState(false); if(!st) return;
    const p = Number((st.progress||{})[qid] || 0);
    if(p < quest.target) return;
    if(st.claimed && st.claimed[qid]) return;
    let committed = false;
    await d.ref('weeklyMissions/'+s.studentId+'/claimed/'+qid).transaction((cur)=>{
      if(cur) return cur;
      return Date.now();
    }, function(_, ok){ committed = !!ok; });
    if(!committed) return;
    var questMul = 1;
    var questTotal = Number(quest.reward || 0);
    var heroQuestBonus = 0;
    await d.ref('classes/'+s.classId+'/students/'+s.studentId).transaction((u)=>{
      u = u || {};
      var gain = computeChampionDiamondGain(Number(quest.reward||0), u);
      questMul = Number(gain.multiplier || 1);
      questTotal = Number(gain.total || Number(quest.reward||0));
      heroQuestBonus = (typeof window.NOVA_HERO_LEVEL !== 'undefined' && window.NOVA_HERO_LEVEL.getQuestBonusDiamonds)
        ? window.NOVA_HERO_LEVEL.getQuestBonusDiamonds(u) : 0;
      u.diamond = Math.min(25000, Number(u.diamond||0) + Number(questTotal || 0) + heroQuestBonus);
      u.lastDiamondUpdate = Date.now();
      return u;
    });
    stateCache.ts = 0;
    window.__novaLastQuestHeroBonus = heroQuestBonus;
    var toastTotal = questTotal + heroQuestBonus;
    toast('+' + toastTotal + ' 💎 toplandı!' + (questMul > 1 ? ' (Rozet x2)' : '') + (heroQuestBonus > 0 ? (' · Kahraman +' + heroQuestBonus) : ''));
    showQuestRewardOverlay(toastTotal, questMul, quest);
    try{ if(typeof updateDiamondCount === 'function') updateDiamondCount(); }catch(_){}
    await renderQuestPanel();
  }
  async function renderQuestPanel(){
    ensureQuestUi();
    const label = document.getElementById('wq_week_label');
    const grid = document.getElementById('wq_grid');
    if(!label || !grid) return;
    const st = await ensureWeeklyState(false);
    if(!st){ grid.innerHTML = '<div class="wq-card">Öğrenci bilgisi bulunamadı.</div>'; return; }
    label.textContent = 'Hafta: ' + weekLabel(st.weekId);
    const progress = st.progress || {};
    const claimed = st.claimed || {};
    grid.innerHTML = '';
    QUESTS.forEach((q)=>{
      const val = Number(progress[q.id] || 0);
      const pct = Math.max(0, Math.min(100, Math.round((val / q.target) * 100)));
      const done = val >= q.target;
      const isClaimed = !!claimed[q.id];
      const card = document.createElement('div');
      card.className = 'wq-card';
      var heroBonusHint = '';
      try{
        var s = sel();
        if(s && typeof window.NOVA_HERO_LEVEL !== 'undefined'){
          var hb = window.NOVA_HERO_LEVEL.getQuestBonusDiamonds(s);
          if(hb > 0) heroBonusHint = '<div class="wq-hero-bonus-hint">🦸 Kahraman bonusu: toplandığında +' + hb + ' 💎 ek</div>';
        }
      }catch(_){}
      card.innerHTML = '<div class="wq-row"><div class="wq-task">'+q.icon+' '+q.title+'</div><div class="wq-reward">+'+q.reward+' 💎</div></div>' + heroBonusHint +
        '<div class="wq-progress"><i style="width:'+pct+'%"></i></div>' +
        '<div class="wq-meta"><span>İlerleme</span><span>'+val+' / '+q.target+'</span></div>';
      const btn = document.createElement('button');
      btn.className = 'wq-claim ' + (isClaimed ? 'done' : (done ? 'ready' : 'locked'));
      btn.textContent = isClaimed ? 'Toplandı ✅' : (done ? 'Ödülü Topla' : 'Devam Et');
      if(!isClaimed && done){
        btn.addEventListener('click', ()=> claimQuestReward(q.id));
      } else {
        btn.disabled = true;
      }
      card.appendChild(btn);
      grid.appendChild(card);
    });
    refreshQuestBadge();
  }
  async function refreshQuestBadge(){
    const badge = document.getElementById('quest_badge');
    if(!badge) return;
    const st = await ensureWeeklyState(false);
    if(!st){ badge.hidden = true; return; }
    const progress = st.progress || {};
    const claimed = st.claimed || {};
    let ready = 0;
    QUESTS.forEach((q)=>{
      if(Number(progress[q.id]||0) >= q.target && !claimed[q.id]) ready++;
    });
    badge.hidden = ready <= 0;
    badge.textContent = ready > 9 ? '9+' : String(ready);
  }
  async function recordQuest(eventType, payload){
    try{
      const d = db(); const s = sel();
      if(!d || !s || !s.studentId) return;
      payload = payload || {};
      const targets = QUESTS.filter(q => q.event === eventType);
      if(!targets.length) return;
      await ensureWeeklyState(false);
      const updates = [];
      targets.forEach((q)=>{
        if(q.onlyPureSingle && payload.isHomework) return;
        updates.push(
          d.ref('weeklyMissions/'+s.studentId+'/progress/'+q.id).transaction((cur)=>{
            const v = Number(cur||0) + 1;
            return v > q.target ? q.target : v;
          })
        );
      });
      if(!updates.length) return;
      await Promise.all(updates);
      d.ref('weeklyMissions/'+s.studentId+'/updatedAt').set(Date.now());
      stateCache.ts = 0;
      refreshQuestBadge();
    }catch(e){ console.warn('novaQuestRecord', e); }
  }
  function openQuestScreen(){
    ensureQuestUi();
    const pane = document.getElementById('weekly-quest-screen');
    if(!pane) return;
    pane.style.display = 'block';
    document.body.style.overflow = 'hidden';
    renderQuestPanel();
  }
  function closeQuestScreen(){
    const pane = document.getElementById('weekly-quest-screen');
    if(pane) pane.style.display = 'none';
    document.body.style.overflow = '';
  }
  window.novaQuestRecord = recordQuest;
  document.addEventListener('DOMContentLoaded', function(){
    ensureQuestUi();
    ensureQuestFab();
    setTimeout(refreshQuestBadge, 1200);
  });
})();
