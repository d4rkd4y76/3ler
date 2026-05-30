(function(){
  let novaIntroShown = false;
  let novaTimer = null;

  function qs(s,root=document){ return root.querySelector(s); }
  function qsa(s,root=document){ return Array.from(root.querySelectorAll(s)); }
  function findStartButton(){ return qs('.duel-start-button'); }

  // --- UI updaters ---
  function setText(id, val){ const el = document.getElementById(id); if (el) el.textContent = val; }
  function setSrc(id, val){ const el = document.getElementById(id); if (el && val) el.src = val; }
  function showCup(idWrap, idVal, n){
    const wrap = document.getElementById(idWrap);
    const valEl = document.getElementById(idVal);
    if (!wrap || !valEl) return;
    if (typeof n === 'number' && !Number.isNaN(n)){
      wrap.setAttribute('data-empty','0');
      valEl.textContent = String(n);
    } else {
      wrap.setAttribute('data-empty','1');
      valEl.textContent = '0';
    }
  }

  // ---- DOM scrape (fallback) ----
  function collectBlock(el){
    if (!el) return null;
    const img = qs('img', el);
    const nameEl = qs('.duel-player-name, .student-name, .name, .player-name', el);
    const nameFrame = (nameEl && nameEl.dataset && nameEl.dataset.nameFrame) ? String(nameEl.dataset.nameFrame || 'default') : 'default';
    const avatarFrame = (img && img.dataset && img.dataset.avatarFrame) ? String(img.dataset.avatarFrame || 'default') : 'default';
    const rankEl = qs('.rank, .rutbe, .rütbe, .rank-badge, .level, .level-badge, .badge-rank', el);
    const cupsEl = qs('.cup, .cups, .trophy, .gameCup, [data-cup], [data-cups]', el);
    const cupsAttr = (cupsEl && (cupsEl.getAttribute('data-cup') || cupsEl.getAttribute('data-cups')));
    let cups = null;
    if (cupsEl){
      const t = (cupsEl.textContent||'').toLowerCase();
      const m = t.match(/(\d+)\s*(?:🏆|kupa|cups?|trophy)/);
      if (m) cups = parseInt(m[1],10);
    }
    if (cups == null && cupsAttr && /^\d+$/.test(cupsAttr)) cups = parseInt(cupsAttr,10);

    // try to expose data-* ids if present
    const studentId = el.dataset.studentId || el.dataset.uid || el.getAttribute('data-student-id') || el.getAttribute('data-uid') || null;
    const classId = el.dataset.classId || el.dataset.sinifId || el.getAttribute('data-class-id') || el.getAttribute('data-sinif-id') || null;
    // parse from a path
    const dp = el.getAttribute('data-path') || '';
    if ((!studentId || !classId) && dp && /classes\/([^/]+)\/students\/([^/]+)/.test(dp)){
      const m2 = dp.match(/classes\/([^/]+)\/students\/([^/]+)/);
      if (m2){ return { photo: img?img.src:'', name: nameEl?nameEl.textContent.trim():'', rank: rankEl?rankEl.textContent.trim():'', cups, studentId:m2[2], classId:m2[1] }; }
    }
    return {
      photo: img ? img.src : '',
      name: nameEl ? nameEl.textContent.trim() : '',
      nameFrame: nameFrame,
      avatarFrame: avatarFrame,
      rank: rankEl ? rankEl.textContent.trim() : '',
      cups,
      studentId,
      classId
    };
  }

  function collectPlayersFromDOM(){
    const infos = qsa('.duel-bottom-info .duel-player-info');
    if (infos.length >= 2){
      return { a: collectBlock(infos[0]), b: collectBlock(infos[1]) };
    }
    const scores = qsa('.players-info-row .duel-player-score');
    if (scores.length >= 2){
      return { a: collectBlock(scores[0]), b: collectBlock(scores[1]) };
    }
    return null;
  }

  // ---- Firebase helpers ----
  function getDB(){
    try{
      if (window.database && typeof window.database.ref === 'function') return window.database;
      if (window.firebase && firebase.database) return firebase.database();
    }catch(e){}
    return null;
  }
  // --- Robust student resolution by photo/name ---
  async function lookupStudentByPhotoOrName(photoUrl, displayName){
    const db = getDB(); if (!db) return null;
    try{
      let obj = null;
      try {
        obj = await getClassesTreeCached();
      } catch (_) {}
      if (!obj) return null;
      let hit = null;
      for (const classId of Object.keys(obj)){
        const students = obj[classId] && obj[classId].students;
        if (!students) continue;
        for (const sid of Object.keys(students)){
          const st = students[sid];
          if (!st) continue;
          const p = st.photo || st.photoUrl || st.avatarUrl || '';
          const n = st.name || st.displayName || st.fullName || '';
          const photoMatch = photoUrl && p && p === photoUrl;
          const nameMatch = displayName && n && n.toLowerCase() === displayName.toLowerCase();
          if (photoMatch || nameMatch){
            hit = { classId, studentId: sid, name: n, photo: p };
            // prefer exact photo match over name match
            if (photoMatch) return hit;
          }
        }
      }
      return hit;
    }catch(e){ console && console.warn && console.warn('NOVA: lookup by photo/name failed', e); return null; }
  }


  async function fetchStudent({classId, studentId}){
    const db = getDB();
    if (!db || !classId || !studentId) return null;
    try{
      const snap = await db.ref(`classes/${classId}/students/${studentId}`).once('value');
      const v = snap && snap.val ? snap.val() : null;
      if (!v) return null;
      // Try common field names
      const name = v.name || v.displayName || v.fullName || '';
      const nameFrame = v.nameFrame || 'default';
      const rankName = v.rankName || v.rank || v.levelName || v.rutbe || v.rütbe || '';
      const cups = (v.gameCup != null) ? v.gameCup : (v.cups != null ? v.cups : null);
      const photo = v.photoUrl || v.profilePhoto || v.avatarUrl || v.photo || '';
      const avatarFrame = (v.avatarFrame || 'default');
      return { name, nameFrame, avatarFrame, rank: rankName, cups, photo, duelCredits: (v.duelCredits || 0) };
    }catch(e){
      console && console.warn && console.warn('NOVA: Firebase read error', e);
      return null;
    }
  }

  function updateSide(side, data){
    if (!data) return;
    if (side === 'a'){
      if (data.photo) setSrc('nova-pA-photo', data.photo);
      try{ applyAvatarFrameToImage(document.getElementById('nova-pA-photo'), data.avatarFrame || 'default'); }catch(_){}
      if (data.name)  setNameWithFrame(document.getElementById('nova-pA-name'), data.name, data.nameFrame || 'default');
      try{ if (typeof getStars==='function' && document.getElementById('nova-pA-stars')) document.getElementById('nova-pA-stars').innerHTML = getStars((data.cups != null ? Number(data.cups) : 0) || 0); }catch(e){}
      try{ if (typeof getRankHTML==='function') document.getElementById('nova-pA-rank').innerHTML = getRankHTML((data.cups != null ? Number(data.cups) : 0) || 0); else if (data.rank) setText('nova-pA-rank', data.rank);}catch(e){ if (data.rank) setText('nova-pA-rank', data.rank); }
      showCup('nova-pA-cups-wrap','nova-pA-cups', data.cups);
    } else {
      if (data.photo) setSrc('nova-pB-photo', data.photo);
      try{ applyAvatarFrameToImage(document.getElementById('nova-pB-photo'), data.avatarFrame || 'default'); }catch(_){}
      if (data.name)  setNameWithFrame(document.getElementById('nova-pB-name'), data.name, data.nameFrame || 'default');
      try{ if (typeof getStars==='function' && document.getElementById('nova-pB-stars')) document.getElementById('nova-pB-stars').innerHTML = getStars((data.cups != null ? Number(data.cups) : 0) || 0); }catch(e){}
      try{ if (typeof getRankHTML==='function') document.getElementById('nova-pB-rank').innerHTML = getRankHTML((data.cups != null ? Number(data.cups) : 0) || 0); else if (data.rank) setText('nova-pB-rank', data.rank);}catch(e){ if (data.rank) setText('nova-pB-rank', data.rank); }
      showCup('nova-pB-cups-wrap','nova-pB-cups', data.cups);
    }
  }

  async function enrichFromFirebase(domData){
  // Step 0: If duel data already exists under currentDuelRef, use it directly (no heavy lookups).
  try {
    if (typeof currentDuelRef !== 'undefined' && currentDuelRef) {
      const snap = await currentDuelRef.once('value');
      const d = snap && snap.val ? snap.val() : null;
      if (d && d.inviter && d.invited) {
        const a = d.inviter || {};
        const b = d.invited || {};
        updateSide('a', {
          name: a.name || '',
          nameFrame: a.nameFrame || 'default',
          avatarFrame: a.avatarFrame || 'default',
          photo: a.photo || '',
          cups: (typeof a.gameCup === 'number') ? a.gameCup : (typeof a.cups === 'number' ? a.cups : null),
          duelCredits: (typeof a.duelCredits === 'number') ? a.duelCredits : undefined,
          rank: a.rank || undefined,
          classId: a.classId, studentId: a.studentId
        });
        updateSide('b', {
          name: b.name || '',
          nameFrame: b.nameFrame || 'default',
          avatarFrame: b.avatarFrame || 'default',
          photo: b.photo || '',
          cups: (typeof b.gameCup === 'number') ? b.gameCup : (typeof b.cups === 'number' ? b.cups : null),
          duelCredits: (typeof b.duelCredits === 'number') ? b.duelCredits : undefined,
          rank: b.rank || undefined,
          classId: b.classId, studentId: b.studentId
        });
        return; // ✅ We are done; keep rest of logic as fallback only.
      }
    }
  } catch(e) { console && console.warn && console.warn('Intro prefill from duel failed:', e); }

    const result = { a:null, b:null };
    // 1) if IDs present in DOM, use them
    if (domData){
      if (domData.a && domData.a.studentId && domData.a.classId) result.a = await fetchStudent({classId:domData.a.classId, studentId:domData.a.studentId});
      if (domData.b && domData.b.studentId && domData.b.classId) result.b = await fetchStudent({classId:domData.b.classId, studentId:domData.b.studentId});
    }
    // 2) globals used elsewhere in app
    try{
      const A = (window.selectedStudent && window.selectedStudent.studentId && window.selectedStudent.classId)
                ? {classId: window.selectedStudent.classId, studentId: window.selectedStudent.studentId} : null;
      const B = (window.opponentStudent && window.opponentStudent.studentId && window.opponentStudent.classId)
                ? {classId: window.opponentStudent.classId, studentId: window.opponentStudent.studentId} : null;
      if (!result.a && A) result.a = await fetchStudent(A);
      if (!result.b && B) result.b = await fetchStudent(B);
    }catch(e){}
    // 3) still missing? resolve by photo/name
    try{
      const aName = (domData && domData.a && domData.a.name) || document.getElementById('nova-pA-name')?.textContent || '';
      const bName = (domData && domData.b && domData.b.name) || document.getElementById('nova-pB-name')?.textContent || '';
      const aPhoto = document.getElementById('nova-pA-photo')?.src || (domData && domData.a && domData.a.photo) || '';
      const bPhoto = document.getElementById('nova-pB-photo')?.src || (domData && domData.b && domData.b.photo) || '';
      if (!result.a){ const hitA = await lookupStudentByPhotoOrName(aPhoto, aName); if (hitA) result.a = await fetchStudent(hitA); }
      if (!result.b){ const hitB = await lookupStudentByPhotoOrName(bPhoto, bName); if (hitB) result.b = await fetchStudent(hitB); }
    }catch(e){ console && console.warn && console.warn('NOVA: fallback photo/name lookup failed', e); }
    // Apply
    if (result.a) updateSide('a', result.a);
    if (result.b) updateSide('b', result.b);
  }

  // ---- Unwanted selection panel hide ----
  function hideLegacySelectionPanel(){
    const nodes = Array.from(document.querySelectorAll('.duel-selection-container, .duel-start, .duel-setup, .duel-start-content, .duel-panel, section, div'));
    nodes.forEach(el=>{
      if (!(el instanceof HTMLElement)) return;
      if (el.id==='duel-intro-overlay') return;
      if (el.hasAttribute('data-nova-hide')) return;
      const txt = (el.textContent||'').toLowerCase();
      const head = txt.includes('düello başlıyor');
      const fields = (txt.includes('sınıfınız') || txt.includes('düello dersi') || txt.includes('düello konusu'));
      if (head && fields) el.setAttribute('data-nova-hide','');
    });
  }

  function populateFromDOM(domData){
    if (!domData) return;
    const a = domData.a || {}; const b = domData.b || {};
    if (a.photo) setSrc('nova-pA-photo', a.photo);
    if (b.photo) setSrc('nova-pB-photo', b.photo);
    try{
      applyAvatarFrameToImage(document.getElementById('nova-pA-photo'), a.avatarFrame || (document.getElementById('duel-player-inviter-photo')?.dataset?.avatarFrame) || 'default');
      applyAvatarFrameToImage(document.getElementById('nova-pB-photo'), b.avatarFrame || (document.getElementById('duel-player-invited-photo')?.dataset?.avatarFrame) || 'default');
    }catch(_){}
    setNameWithFrame(document.getElementById('nova-pA-name'), a.name || 'Oyuncu A', a.nameFrame || 'default');
    setNameWithFrame(document.getElementById('nova-pB-name'), b.name || 'Oyuncu B', b.nameFrame || 'default');
    if (a.rank) setText('nova-pA-rank', a.rank);
    if (b.rank) setText('nova-pB-rank', b.rank);
    showCup('nova-pA-cups-wrap','nova-pA-cups', (typeof a.cups==='number') ? a.cups : null);
    showCup('nova-pB-cups-wrap','nova-pB-cups', (typeof b.cups==='number') ? b.cups : null);
  }

  function showIntro(seconds=10){
    if (window.__novaSkipDuelIntro039 || window.__novaAutoMatchFlow) return;
    if (novaIntroShown) return;
    const domData = collectPlayersFromDOM();
    populateFromDOM(domData);
    const overlay = document.getElementById('duel-intro-overlay');
    if (!overlay) return;
    overlay.classList.add('show');
    novaIntroShown = true;
    hideLegacySelectionPanel();
    enrichFromFirebase(domData); // async fetch true data from DB and update UI
    startCountdown(seconds);
  }

  function hideIntro(){
    const overlay = document.getElementById('duel-intro-overlay');
    overlay && overlay.classList.remove('show');
  }

  function startCountdown(seconds){
    const ring = document.getElementById('nova-ring');
    const label = document.getElementById('nova-count');
    const total = Math.max(1, Math.floor(seconds)) * 1000;
    const t0 = performance.now();
    const raf = (now)=>{
      const el = Math.min(total, now - t0);
      const pct = (el/total)*100;
      if (ring) ring.style.setProperty('--pct', pct + '%');
      const remain = Math.ceil((total - el)/1000);
      if (label) label.textContent = String(remain);
      if (el >= total){ startNow(); } else { novaTimer = requestAnimationFrame(raf); }
    };
    if (novaTimer) cancelAnimationFrame(novaTimer);
    novaTimer = requestAnimationFrame(raf);
  }

  function startNow(){
    if (novaTimer) cancelAnimationFrame(novaTimer);
    try{ hideWaitOverlay(); }catch(e){}
    hideIntro();
    const btn = findStartButton();
    if (btn && btn.classList.contains('active') && !btn.disabled) {
      btn.click();
    } else if (typeof window.novaNudgeInviterStartDuel === 'function') {
      window.novaNudgeInviterStartDuel();
    }
    document.dispatchEvent(new CustomEvent('nova:duelIntroDone'));
  }

  function interceptStartButton(){
    const btn = findStartButton();
    if (!btn) return;
    btn.addEventListener('click', function(ev){
      if (window.__novaSkipDuelIntro039 || window.__novaAutoMatchFlow) return;
      if (!novaIntroShown && btn.classList.contains('active')){
        ev.preventDefault(); ev.stopPropagation();
        showIntro(10);
        return false;
      }
    }, true);
  }

  function observeActivation(){
    const btn = findStartButton();
    if (!btn) return;
    const obs = new MutationObserver(()=>{
      if (!btn.classList.contains('active') || novaIntroShown) return;
      if (window.__novaSkipDuelIntro039 || window.__novaAutoMatchFlow) {
        if (!window.__novaDuelPrepBlocking && typeof window.novaNudgeInviterStartDuel === 'function') {
          window.novaNudgeInviterStartDuel();
        }
        return;
      }
      showIntro(10);
    });
    obs.observe(btn, {attributes:true, attributeFilter:['class']});
  }

  function observeSelection(){
    const c = document.querySelector('.duel-selection-container');
    if (!c) return;
    const obs = new MutationObserver(()=>{
      const style = getComputedStyle(c);
      if (style.display !== 'none'){
        const infos = document.querySelectorAll('.duel-bottom-info .duel-player-info');
        if (
          infos.length >= 2 &&
          !novaIntroShown &&
          !window.__novaAutoDuelSelecting &&
          !window.__novaSkipDuelIntro039 &&
          !window.__novaAutoMatchFlow
        ) {
          setTimeout(()=> showIntro(10), 300);
        }
      }
      hideLegacySelectionPanel();
    });
    obs.observe(c, {attributes:true, childList:true, subtree:true});
  }

  function globalObserver(){
    // NOTE: body subtree observer single-player ekranlarında da aşırı tetiklenip pahalı olabiliyor.
    // Sadece duel seçim konteynerini izle.
    const c = document.querySelector('.duel-selection-container') || document.getElementById('duel-selection-screen');
    if (!c) return;
    const obs = new MutationObserver(()=> hideLegacySelectionPanel());
    obs.observe(c, {childList:true, subtree:true});
  }

  function init(){
    interceptStartButton();
    observeActivation();
    observeSelection();
    globalObserver();
    hideLegacySelectionPanel();
    window.novaShowDuelIntro = showIntro;
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
