(function(){
  const QUESTS = [
    { id:'single5', title:'Tek kişilikte 5 oyun oyna', target:5, reward:120, icon:'🎮', event:'single_played', onlyPureSingle:true },
    { id:'single8x10', title:'10 kez tek kişilikte 8+ doğru yap', target:10, reward:450, icon:'🧠', event:'single_8plus', onlyPureSingle:true },
    { id:'duelWin5', title:'5 düello kazan', target:5, reward:700, icon:'⚔️', event:'duel_win' },
    { id:'hw5', title:'5 ödev tamamla', target:5, reward:500, icon:'📚', event:'homework_completed' },
    { id:'deneme1', title:'Haftalık denemeyi tamamla', target:1, reward:1000, icon:'🏆', event:'deneme_completed' }
  ];

  const stateCache = { key:'', ts:0, val:null };

  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

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
    return s.toLocaleDateString('tr-TR') + ' – ' + e.toLocaleDateString('tr-TR');
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
    var legacy = document.getElementById('weekly-quest-screen');
    if (legacy && !legacy.classList.contains('wq-studio')) {
      legacy.remove();
      var oldStyle = document.getElementById('weekly-quest-style');
      if (oldStyle) oldStyle.remove();
    }
    if(document.getElementById('weekly-quest-screen')) return;
    const pane = document.createElement('div');
    pane.id = 'weekly-quest-screen';
    pane.className = 'wq-studio';
    pane.setAttribute('role', 'dialog');
    pane.setAttribute('aria-modal', 'true');
    pane.setAttribute('aria-labelledby', 'wq_screen_title');
    pane.innerHTML =
      '<div class="wq-studio__backdrop" aria-hidden="true"></div>' +
      '<div class="wq-studio__shell">' +
        '<header class="wq-studio__header">' +
          '<div class="wq-studio__brand">' +
            '<span class="wq-studio__brand-icon" aria-hidden="true">🎁</span>' +
            '<div class="wq-studio__brand-text">' +
              '<h1 class="wq-studio__title" id="wq_screen_title">Haftalık Görevler</h1>' +
              '<p class="wq-studio__subtitle" id="wq_week_label">Bu haftanın maceraları</p>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="wq-studio__close" id="wq_close_btn" aria-label="Kapat">✕</button>' +
        '</header>' +
        '<div class="wq-studio__stats" id="wq_stats"></div>' +
        '<div class="wq-studio__body">' +
          '<div class="wq-studio__grid" id="wq_grid"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pane);
    const toast = document.createElement('div');
    toast.id = 'wq-toast';
    toast.innerHTML = '<div class="wq-toast-card" id="wq_toast_text"></div>';
    document.body.appendChild(toast);
    const reward = document.createElement('div');
    reward.id = 'wq-reward-overlay';
    reward.innerHTML =
      '<div class="wq-reward-card">' +
        '<div class="wq-reward-head">Görev Ödülü Toplandı</div>' +
        '<div class="wq-reward-amount"><span id="wq_reward_num">+0</span> 💎</div>' +
        '<div class="wq-reward-sub" id="wq_reward_sub">Ödül hesabına eklendi.</div>' +
        '<div class="wq-reward-meta">' +
          '<div class="wq-chip" id="wq_reward_task">Görev</div>' +
          '<div class="wq-chip bonus" id="wq_reward_bonus">👑 Rozet x2 bonus aktif</div>' +
          '<div class="wq-chip bonus" id="wq_reward_hero_bonus" style="display:none">🦸 Kahraman bonusu</div>' +
        '</div>' +
        '<button class="wq-reward-ok" id="wq_reward_ok" type="button">Harika!</button>' +
      '</div>';
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

  function renderQuestStats(st){
    const statsEl = document.getElementById('wq_stats');
    if(!statsEl || !st) return;
    const progress = st.progress || {};
    const claimed = st.claimed || {};
    var ready = 0;
    var done = 0;
    var gemsLeft = 0;
    QUESTS.forEach(function(q){
      var val = Number(progress[q.id] || 0);
      var isClaimed = !!claimed[q.id];
      if(isClaimed) done++;
      else if(val >= q.target) ready++;
      else gemsLeft += Number(q.reward || 0);
    });
    statsEl.innerHTML =
      '<div class="wq-studio__stat wq-studio__stat--ready"><strong>' + ready + '</strong><span>Toplanabilir</span></div>' +
      '<div class="wq-studio__stat wq-studio__stat--done"><strong>' + done + '</strong><span>Tamamlandı</span></div>' +
      '<div class="wq-studio__stat wq-studio__stat--gems"><strong>' + gemsLeft + '</strong><span>Kalan ödül 💎</span></div>';
  }

  async function renderQuestPanel(){
    ensureQuestUi();
    const label = document.getElementById('wq_week_label');
    const grid = document.getElementById('wq_grid');
    if(!label || !grid) return;
    const st = await ensureWeeklyState(false);
    if(!st){
      grid.innerHTML = '<div class="wq-studio__empty">Öğrenci bilgisi bulunamadı.</div>';
      return;
    }
    label.textContent = 'Hafta: ' + weekLabel(st.weekId);
    renderQuestStats(st);
    const progress = st.progress || {};
    const claimed = st.claimed || {};
    grid.innerHTML = '';
    QUESTS.forEach(function(q){
      const val = Number(progress[q.id] || 0);
      const pct = Math.max(0, Math.min(100, Math.round((val / q.target) * 100)));
      const done = val >= q.target;
      const isClaimed = !!claimed[q.id];
      const cardState = isClaimed ? 'done' : (done ? 'ready' : 'locked');
      const statusText = isClaimed ? 'Bitti ✓' : (done ? 'Hazır!' : 'Devam');
      var heroBonusHint = '';
      try{
        var s = sel();
        if(s && typeof window.NOVA_HERO_LEVEL !== 'undefined'){
          var hb = window.NOVA_HERO_LEVEL.getQuestBonusDiamonds(s);
          if(hb > 0) heroBonusHint = '<p class="wq-card__hero-hint">🦸 Kahraman bonusu: toplandığında +' + hb + ' 💎 ek</p>';
        }
      }catch(_){}
      const card = document.createElement('article');
      card.className = 'wq-card wq-card--' + cardState;
      card.innerHTML =
        '<div class="wq-card__top">' +
          '<span class="wq-card__icon" aria-hidden="true">' + esc(q.icon) + '</span>' +
          '<div class="wq-card__body">' +
            '<h3 class="wq-card__title">' + esc(q.title) + '</h3>' +
            '<span class="wq-card__reward">+' + q.reward + ' 💎</span>' +
          '</div>' +
          '<span class="wq-card__status">' + statusText + '</span>' +
        '</div>' +
        heroBonusHint +
        '<div class="wq-card__progress-wrap">' +
          '<div class="wq-card__progress-meta">' +
            '<span>İlerleme</span>' +
            '<strong>' + val + ' / ' + q.target + '</strong>' +
          '</div>' +
          '<div class="wq-card__bar"><i style="width:' + pct + '%"></i></div>' +
        '</div>';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wq-card__claim wq-card__claim--' + (isClaimed ? 'done' : (done ? 'ready' : 'locked'));
      btn.textContent = isClaimed ? 'Toplandı ✅' : (done ? 'Ödülü Topla 🎉' : 'Devam Et');
      if(!isClaimed && done){
        btn.addEventListener('click', function(){ claimQuestReward(q.id); });
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
    QUESTS.forEach(function(q){
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
      targets.forEach(function(q){
        if(q.onlyPureSingle && payload.isHomework) return;
        updates.push(
          d.ref('weeklyMissions/'+s.studentId+'/progress/'+q.id).transaction(function(cur){
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
    try{
      if (typeof window.novaReturnToMainScreen === 'function') {
        window.novaReturnToMainScreen({ light: true, skipPerf: true });
      } else if (typeof window.novaEnsureLoggedInUi === 'function') {
        window.novaEnsureLoggedInUi({ light: true });
      }
      if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
    }catch(_){}
  }

  window.novaQuestRecord = recordQuest;
  document.addEventListener('DOMContentLoaded', function(){
    ensureQuestUi();
    ensureQuestFab();
    setTimeout(refreshQuestBadge, 1200);
  });
})();
