(function(){
  // Create FAB once main screen is visible
  const ensureFab = ()=>{
    const ms = document.getElementById('main-screen');
    const questSlot = document.getElementById('main-screen-quest-slot');
    if(!questSlot) return;
    if(!ms) return;
    if(!document.getElementById('homework_fab')){
      const btn = document.createElement('button');
      btn.id = 'homework_fab';
      btn.className = 'homework-fab';
      btn.innerHTML = '<span class="hw-emoji" aria-hidden="true">🚀</span> ÖDEV<span id="homework_badge" class="hw-badge" hidden>0</span>';
      btn.addEventListener('click', openHomeworkScreen);
      // Place directly in right column to avoid first-load jump.
      questSlot.appendChild(btn);
      btn.style.position = 'relative';
      btn.style.top = 'auto';
      btn.style.right = 'auto';
      btn.style.left = 'auto';
      btn.style.bottom = 'auto';
      try{ subscribeHomeworkBadge(); }catch(_){}
    }
  };

  // Subscribe badge: önce tek sayı (studentHomeworkSummary/.../pendingCount), yoksa tam ödev ağacı + bir kez seed
  function subscribeHomeworkBadge(){
    const badge = document.getElementById('homework_badge');
    function db(){ try{ return firebase.database(); }catch(_){ return null; } }
    function sid(){ try{ return selectedStudent && selectedStudent.studentId; }catch(_){ return null; } }
    const d = db(); const s = sid();
    if (!badge || !d || !s) return;
    const fullRef = d.ref('studentHomework/'+s);
    const sumRef = d.ref('studentHomeworkSummary/'+s+'/pendingCount');
    fullRef.off('value');
    sumRef.off('value');

    function applyPendingCount(pending){
      try{
        const n = Math.max(0, Math.floor(Number(pending) || 0));
        if (n > 0){
          badge.textContent = n > 99 ? '99+' : String(n);
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      }catch(_){}
    }

    let fullAttached = false;
    let didSeedSummary = false;
    function attachFullListener(){
      if (fullAttached) return;
      fullAttached = true;
      fullRef.on('value', (snap)=>{
        try{
          const val = snap.exists() ? snap.val() : {};
          const items = Object.values(val||{});
          const pending = items.filter(it => (it && it.status)!=='completed').length;
          applyPendingCount(pending);
          if (!didSeedSummary){
            didSeedSummary = true;
            sumRef.once('value').then(function(chk){
              if (chk && chk.exists && chk.exists()) return;
              return sumRef.set(pending);
            }).catch(function(){});
          }
        }catch(_){}
      });
    }

    sumRef.on('value', (snap)=>{
      try{
        if (snap && snap.exists && snap.exists()){
          const raw = snap.val();
          if (raw !== null && raw !== '' && Number.isFinite(Number(raw))){
            if (fullAttached){
              fullRef.off('value');
              fullAttached = false;
            }
            applyPendingCount(Number(raw));
            return;
          }
        }
        attachFullListener();
      }catch(_){
        attachFullListener();
      }
    }, (err)=>{
      try{
        console.warn('studentHomeworkSummary dinlenemedi (kurallar?), tam ödev ağacına geçiliyor:', err && err.message ? err.message : err);
        sumRef.off('value');
      }catch(_){}
      attachFullListener();
    });
  }
  // Observe main-screen visibility toggles
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      const fab = document.getElementById('homework_fab');
      if(!fab) return;
      // Show FAB only when main-screen is visible
      fab.style.display = e.isIntersecting ? 'inline-flex' : 'none';
    });
  }, {threshold: .1});
  function bootHomeworkFab() {
    ensureFab();
    try {
      if (typeof window.novaUpgradeHubGameButtons === 'function') window.novaUpgradeHubGameButtons();
      if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
    } catch (_) {}
    const ms = document.getElementById('main-screen');
    if (ms) io.observe(ms);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHomeworkFab, { once: true });
  } else {
    bootHomeworkFab();
  }
  window.addEventListener('load', bootHomeworkFab);

  const hwListEl = document.getElementById('hw_list');
  const hwTitleEl = document.getElementById('hw_title');
  const hwDescEl = document.getElementById('hw_desc');
  const hwMetaEl = document.getElementById('hw_meta');
  const hwVideoBtn = document.getElementById('hw_video');
  const hwStartBtn = document.getElementById('hw_start');
  const hwScreen = document.getElementById('homework-screen');
  const hwClose = document.getElementById('hw_close');
  let selectedHw = null;
  let hwCache = {};
  let hwStatusById = {};

  function db(){ try{ return firebase.database(); }catch(_){ return null; } }
  function sid(){ try{ return selectedStudent && selectedStudent.studentId; }catch(_){ return null; } }

  function openHomeworkScreen(){
    hwScreen.style.display = 'block';
    document.body.style.overflow='hidden';
    loadStudentHomeworks();
  }
  hwClose.addEventListener('click', ()=>{
    hwScreen.style.display = 'none';
    document.body.style.overflow = '';
    try{
      if (typeof window.novaEnsureLoggedInUi === 'function') window.novaEnsureLoggedInUi();
      if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
    }catch(_){}
  });

  async function loadStudentHomeworks(){
    try{
      hwListEl.innerHTML = '<li>Yükleniyor…</li>';
      const s = sid(); const d = db(); if(!s||!d){ hwListEl.innerHTML='<li>Giriş yapınız.</li>'; return; }
      const snap = await d.ref('studentHomework/'+s).get();
      const list = snap.exists()? snap.val() : {};
      const rawItems = Object.entries(list).map(([hwId, info])=>({hwId, status: info?.status||'assigned', assignedAt: info?.assignedAt||0}));
      if(!rawItems.length){
        hwCache = {};
        hwStatusById = {};
        hwListEl.innerHTML = '<li>Şu an ödev yok.</li>';
        hwTitleEl.textContent='Ödev yok';
        hwDescEl.textContent='Yeni ödev verildiğinde burada göreceksiniz.';
        return;
      }

      const details = {};
      const items = [];
      const resolved = await Promise.all(rawItems.map(async function(it){
        const hwSnap = await d.ref('homeworks/'+it.hwId).get();
        if (!hwSnap.exists()) {
          try {
            await d.ref('studentHomework/'+s+'/'+it.hwId).remove();
            if (it.status !== 'completed') {
              await d.ref('studentHomeworkSummary/'+s+'/pendingCount').transaction(function (curr) {
                return Math.max(0, Math.floor(Number(curr) || 0) - 1);
              });
            }
          } catch (err) {
            console.warn('Ödev yetimi temizlenemedi:', it.hwId, err);
          }
          return null;
        }
        return { it: it, detail: hwSnap.val() };
      }));
      resolved.filter(Boolean).forEach(function(row){
        details[row.it.hwId] = row.detail;
        items.push(row.it);
      });
      hwCache = details;
      hwStatusById = items.reduce(function(acc, it){
        acc[it.hwId] = it.status || 'assigned';
        return acc;
      }, {});

      if (!items.length) {
        hwListEl.innerHTML = '<li>Şu an ödev yok.</li>';
        hwTitleEl.textContent = 'Ödev yok';
        hwDescEl.textContent = 'Yeni ödev verildiğinde burada göreceksiniz.';
        return;
      }

      hwListEl.innerHTML = '';
      items.forEach(it=>{
        const hw = details[it.hwId]||{};
        const li = document.createElement('li');
        li.setAttribute('data-id', it.hwId);
        const badge = it.status==='completed' ? '✅' : (it.status==='assigned' ? '🟡' : '⏳');
        li.innerHTML = '<div><div style="font-weight:700">'+(hw.title||'Ödev')+'</div><div class="hw-meta">'+(new Date(hw.createdAt||Date.now())).toLocaleString('tr-TR')+'</div></div><div>'+badge+'</div>';
        li.addEventListener('click', ()=> selectHw(it.hwId, it.status));
        hwListEl.appendChild(li);
      });

      const firstPending = items.find(x=>x.status!=='completed') || items[0];
      selectHw(firstPending.hwId, firstPending.status);
    }catch(e){
      console.warn('loadStudentHomeworks', e);
      hwListEl.innerHTML = '<li>Ödevler alınamadı.</li>';
    }
  }

  function selectHw(hwId, status){
    const effectiveStatus = status || hwStatusById[hwId] || 'assigned';
    selectedHw = { id: hwId, detail: hwCache[hwId]||{}, status: effectiveStatus };
    const d = selectedHw.detail;
    hwTitleEl.textContent = d.title || 'Ödev';
    hwDescEl.textContent = d.description || '';
    const qMeta = (function () {
      const ids = d.questionIds;
      if (ids && typeof ids === 'object') {
        const n = Array.isArray(ids) ? ids.length : Object.keys(ids).length;
        if (n > 0) return n;
      }
      return d.questionCount || 10;
    })();
    hwMetaEl.textContent = 'Soru sayısı: ' + qMeta + (d.questionIds ? ' (sabit set)' : '');
    document.querySelectorAll('#hw_list li').forEach(li=> li.classList.toggle('active', li.getAttribute('data-id')===hwId));

    // Reuse already-loaded status to avoid an extra DB read on every selection.
    const btn = hwStartBtn;
    if (btn){
      if (effectiveStatus === 'completed'){
        btn.textContent = 'Ödev Tamamlandı';
        btn.disabled = false; // keep click to show warning
      }else{
        btn.textContent = 'Ödevi Başlat';
        btn.disabled = false;
      }
    }

  }

  // Video open
  
hwVideoBtn.addEventListener('click', async ()=>{
  if(!selectedHw) return;
  const d = selectedHw.detail||{};

  // Helper: normalize to YouTube /embed/ URL if possible
  function toEmbed(u){
    if (!u || typeof u !== 'string') return null;
    let s = u.trim();
    if (s.includes('watch?v=')) s = s.replace('watch?v=', 'embed/');
    else if (s.includes('youtu.be/')) {
      const vid = s.split('youtu.be/')[1].split(/[?&#]/)[0];
      s = 'https://www.youtube.com/embed/' + vid;
    }
    if (!/^https:\/\/(www\.)?youtube\.com\/embed\//.test(s) && !/^https:\/\/youtube\.com\/embed\//.test(s) &&
        !/^https:\/\/(www\.)?youtube-nocookie\.com\/embed\//.test(s)) return null;
    if (typeof window.novaNormalizeYouTubeEmbed === 'function') s = window.novaNormalizeYouTubeEmbed(s) || s;
    return s;
  }

  // Helper: ensure we have an in-app viewer; prefer existing "lesson video screen", otherwise build overlay
  function openInApp(embedUrl, breadcrumbParts){
    // Try the shared lesson video screen first (same UI as single player)
    try {
      const title = document.getElementById('lesson-video-title');
      if (title) title.textContent = 'Ders Videosu';
      const crumb = document.getElementById('lesson-video-breadcrumb');
      if (crumb) crumb.textContent = (breadcrumbParts && breadcrumbParts.length) ? breadcrumbParts.join(' • ') : 'Ders & Konu';

      if (typeof videoIframe !== 'undefined' && videoIframe && typeof showOnly === 'function' && typeof videoScreen !== 'undefined') {
        try { videoIframe.referrerPolicy = 'strict-origin-when-cross-origin'; } catch(_){}
        videoIframe.src = embedUrl;
        try { if (typeof window.novaSetLessonVideoYoutubeFallback === 'function') window.novaSetLessonVideoYoutubeFallback(embedUrl); } catch(_){}
        try { window.scrollTo({top:0, behavior:'auto'}); } catch(_){}
        showOnly(videoScreen);
        return true;
      }
    } catch(_) {}

    // If shared screen infra isn't present, build a lightweight overlay viewer inside the app
    let overlay = document.getElementById('nova-video-overlay');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.id = 'nova-video-overlay';
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(0,0,0,.8)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '2rem';

      const wrap = document.createElement('div');
      wrap.style.width = 'min(92vw, 1200px)';
      wrap.style.aspectRatio = '16 / 9';
      wrap.style.background = '#000';
      wrap.style.position = 'relative';
      wrap.style.borderRadius = '12px';
      wrap.style.boxShadow = '0 10px 40px rgba(0,0,0,.5)';
      wrap.style.overflow = 'hidden';

      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.setAttribute('aria-label','Kapat');
      btn.style.position = 'absolute';
      btn.style.top = '8px';
      btn.style.right = '10px';
      btn.style.fontSize = '20px';
      btn.style.lineHeight = '1';
      btn.style.padding = '6px 10px';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.style.background = 'rgba(255,255,255,.85)';
      btn.style.backdropFilter = 'blur(6px)';
      btn.addEventListener('click', ()=>{
        try { overlay.remove(); } catch(_){}
      });

      const iframe = document.createElement('iframe');
      iframe.id = 'nova-video-iframe';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';

      wrap.appendChild(iframe);
      wrap.appendChild(btn);
      overlay.appendChild(wrap);
      document.body.appendChild(overlay);
    }
    const iframe = overlay.querySelector('iframe#nova-video-iframe');
    if (iframe) iframe.src = embedUrl;
    overlay.style.display = 'flex';
    try { window.scrollTo({top:0, behavior:'auto'}); } catch(_){}
    return true;
  }

  // 1) Prefer admin override
  if (d.videoOverride){
    const embed = toEmbed(d.videoOverride);
    if (embed){
      const parts = [];
      if (d.headingName) parts.push(d.headingName);
      if (d.lessonName) parts.push(d.lessonName);
      if (d.topicName) parts.push(d.topicName);
      openInApp(embed, parts);
      return;
    }
    console.warn('videoOverride provided but not a valid YouTube URL; falling back to resolver.');
  }

  // 2) Fallback to the same resolver as single-player (stays in-app)
  try{
    window.__novaSelection__ = Object.assign({}, window.__novaSelection__||{}, {
      classId: d.headingId||'',
      subjectId: d.lessonId||'',
      topicId: d.topicId||'',
    });
    if (typeof openVideo === 'function') {
      openVideo(); // expected to use shared video screen
    } else {
      // minimal in-app fallback: if resolver publishes a custom event with a URL, capture it
      const handler = (ev)=>{
        if (!ev || !ev.detail || !ev.detail.url) return;
        const embed = toEmbed(ev.detail.url);
        if (embed) openInApp(embed, []);
        window.removeEventListener('nova:resolved-lesson-video', handler);
      };
      window.addEventListener('nova:resolved-lesson-video', handler, {once:true});
      try{ window.dispatchEvent(new Event('nova:open-lesson-video')); }catch(_){}
    }
  }catch(e){
    console.warn('Video open error', e);
  }
}); // Start homework game

  function novaCoerceHomeworkPaths(d) {
    const raw = d || {};
    const h = raw.headingId || raw.heading_id || raw.classHeadingId || raw.heading;
    const l = raw.lessonId || raw.lesson_id || raw.subjectId || raw.lesson;
    const t = raw.topicId || raw.topic_id || raw.topic;
    return {
      h: (h != null && h !== '') ? String(h) : '',
      l: (l != null && l !== '') ? String(l) : '',
      t: (t != null && t !== '') ? String(t) : ''
    };
  }

  hwStartBtn.addEventListener('click', async ()=>{
    if(!selectedHw) return;
    const d = selectedHw.detail||{};
    const paths = novaCoerceHomeworkPaths(d);
    
    // NOVA_HW_LOCK: prevent re-playing a completed homework
    if (typeof database !== 'undefined' && selectedStudent && selectedStudent.studentId){
      try{
        const s = selectedStudent.studentId;
        const ref = database.ref('studentHomework/'+s+'/'+selectedHw.id+'/status');
        const snap = await ref.get();
        const st = snap && snap.val ? snap.val() : null;
        if (st === 'completed'){
          // Soft modal/toast
          try{
            await showAlert('Ödev tamamlandı. Bu ödevi tekrar yapamazsın.');
          }catch(_){ showAlert('Ödev tamamlandı. Bu ödevi tekrar yapamazsın.'); }
          return; // block start
        }
      }catch(_){ /* fail-open to avoid blocking in error */ }
    }
    if (!paths.h || !paths.l || !paths.t) {
      try {
        await showAlert('Bu ödev kaydında sınıf/ders/konu bilgisi yok veya okunamıyor. Lütfen yöneticiden ödevi yeniden oluşturmasını isteyin.');
      } catch (_) {}
      return;
    }
const hwIds = (typeof window.novaNormalizeHomeworkQuestionIds === 'function')
      ? window.novaNormalizeHomeworkQuestionIds(d.questionIds)
      : null;
    if (hwIds && hwIds.length) {
      window.NOVA_Q_LIMIT = hwIds.length;
    } else {
      window.NOVA_Q_LIMIT = Number(d.questionCount||10);
    }
    window.NOVA_ACTIVE_HOMEWORK = { hwId: selectedHw.id, selection: { headingId: paths.h, lessonId: paths.l, topicId: paths.t } };
    window.NOVA_HW_STARTED_AT = Date.now();
    try{
      // Hide homework UI and kick off the single‑player flow with predefined selection
      const h = paths.h, l = paths.l, t = paths.t;
      if (typeof fetchQuestions === 'function'){
        
        // Hide all multi-screen panels and open the question screen as a new full screen
        try{
          ['main-screen','duel-selection-screen','duel-game-screen','rankingPanel','lesson-video-screen','single-player-screen'].forEach(id=>{
            const el = document.getElementById(id); if (el) el.style.display='none';
          });
          const game = document.getElementById('single-player-game-screen');
          if (game){ game.style.display='flex'; window.scrollTo({top:0, behavior:'auto'}); }
        }catch(_){}
    document.getElementById('single-player-screen').style.display = 'none';
        document.getElementById('homework-screen').style.display = 'none';
        document.body.style.overflow='';
        if (hwIds && hwIds.length && typeof window.fetchHomeworkQuestionsByIds === 'function') {
          await window.fetchHomeworkQuestionsByIds(h, l, t, hwIds);
        } else if (typeof fetchQuestions === 'function') {
          fetchQuestions(h, l, t);
        }
      }
    }catch(e){ console.warn('start hw', e); }
  });
})();
