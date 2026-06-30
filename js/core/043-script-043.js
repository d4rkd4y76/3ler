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
    let hwPollId = null;

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

    function refreshHomeworkBadge(){
      sumRef.once('value').then(function(snap){
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
      }).catch(function(err){
        try{
          console.warn('studentHomeworkSummary okunamadı (kurallar?), tam ödev ağacına geçiliyor:', err && err.message ? err.message : err);
        }catch(_){}
        attachFullListener();
      });
    }

    function startHomeworkPoll(){
      if (hwPollId) return;
      refreshHomeworkBadge();
      hwPollId = setInterval(function(){
        try{
          const ms = document.getElementById('main-screen');
          if (!ms || ms.getAttribute('hidden') !== null) return;
          const d = window.getComputedStyle(ms).display;
          if (d === 'none' || d === '') return;
        }catch(_){ return; }
        if (fullAttached) return;
        refreshHomeworkBadge();
      }, 90000);
    }

    startHomeworkPoll();
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
  const hwDateEl = document.getElementById('hw_date');
  const hwTopicCard = document.getElementById('hw_topic_card');
  const hwTopicEl = document.getElementById('hw_topic');
  const hwStatsEl = document.getElementById('hw_stats');
  const hwSubtitleEl = document.getElementById('hw_subtitle');
  const hwSubjectIconEl = document.getElementById('hw_subject_icon');
  const hwStatusChip = document.getElementById('hw_status_chip');
  const hwTipBox = document.getElementById('hw_tip');
  const hwTipEl = document.querySelector('#hw_tip .hw-studio__tip-text');
  const hwVideoBtn = document.getElementById('hw_video');
  const hwStartBtn = document.getElementById('hw_start');
  const hwStartLabel = hwStartBtn ? hwStartBtn.querySelector('.hw-btn__label') : null;
  const hwScreen = document.getElementById('homework-screen');
  const hwClose = document.getElementById('hw_close');
  let selectedHw = null;
  let hwCache = {};
  let hwStatusById = {};
  const hwLabelCache = {};

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

  async function hwFetchChampionName(type, h, l, t){
    const key = type + '|' + h + '|' + l + '|' + (t || '');
    if (Object.prototype.hasOwnProperty.call(hwLabelCache, key)) return hwLabelCache[key];
    const d = db();
    if (!d || !h || !l) { hwLabelCache[key] = ''; return ''; }
    let path = '';
    if (type === 'lesson') path = 'championData/headings/' + h + '/lessons/' + l + '/name';
    else if (type === 'topic' && t) path = 'championData/headings/' + h + '/lessons/' + l + '/topics/' + t + '/name';
    else { hwLabelCache[key] = ''; return ''; }
    try {
      const snap = await d.ref(path).get();
      const val = snap.exists() ? String(snap.val() || '').trim() : '';
      hwLabelCache[key] = val;
      return val;
    } catch (_) {
      hwLabelCache[key] = '';
      return '';
    }
  }

  async function hwEnrichDetail(d){
    if (!d || typeof d !== 'object') return d || {};
    const paths = novaCoerceHomeworkPaths(d);
    if (!paths.h || !paths.l || !paths.t) return d;
    const lessonName = d.lessonName || await hwFetchChampionName('lesson', paths.h, paths.l);
    const topicName = d.topicName || await hwFetchChampionName('topic', paths.h, paths.l, paths.t);
    return Object.assign({}, d, { lessonName: lessonName, topicName: topicName });
  }

  function hwTeacherNote(d){
    return String((d && d.description) || '').trim();
  }

  function hwSetTeacherNote(note){
    const text = String(note || '').trim();
    if (hwTipBox) hwTipBox.hidden = !text;
    if (hwTipEl) hwTipEl.textContent = text;
  }

  function hwEsc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function hwSubjectIcon(d){
    const t = ((d && d.lessonName) || '') + ' ' + ((d && d.title) || '') + ' ' + ((d && d.topicName) || '');
    const x = t.toLocaleLowerCase('tr-TR');
    if (/fen|bilim|ışık|isik|ses|madde|canl/.test(x)) return '🔬';
    if (/matemat|sayı|sayi|kesir|ölç|olc|geometri/.test(x)) return '🔢';
    if (/türk|turk|okuma|yazma|dil|metin|anlama/.test(x)) return '📖';
    if (/sosyal|tarih|harita|vatandaş|vatandas|coğraf|cograf/.test(x)) return '🌍';
    if (/ingiliz|english|foreign/.test(x)) return '🇬🇧';
    if (/müzik|muzik|resim|sanat/.test(x)) return '🎨';
    return '📝';
  }

  function hwFormatDate(ts){
    try{
      return new Date(Number(ts) || Date.now()).toLocaleString('tr-TR', {
        day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
      });
    }catch(_){
      return '—';
    }
  }

  function hwListMessage(text){
    hwListEl.innerHTML = '';
    const li = document.createElement('li');
    li.className = 'hw-studio__item hw-studio__item--message';
    li.textContent = text;
    hwListEl.appendChild(li);
    if (hwStatsEl) hwStatsEl.hidden = true;
  }

  function hwRenderStats(items){
    if (!hwStatsEl) return;
    const pending = items.filter(function(x){ return x.status !== 'completed'; }).length;
    const done = items.filter(function(x){ return x.status === 'completed'; }).length;
    hwStatsEl.hidden = false;
    hwStatsEl.innerHTML =
      '<div class="hw-studio__stat hw-studio__stat--pending"><strong>' + pending + '</strong><span>Bekleyen</span></div>' +
      '<div class="hw-studio__stat hw-studio__stat--done"><strong>' + done + '</strong><span>Tamamlanan</span></div>';
    if (hwSubtitleEl){
      hwSubtitleEl.textContent = pending
        ? (pending + ' ödev seni bekliyor')
        : (done ? 'Tüm ödevlerin tamamlandı 🎉' : 'Öğretmeninin verdiği görevler burada');
    }
  }

  function hwSetStartLabel(text, doneMode){
    if (hwStartLabel) hwStartLabel.textContent = text;
    else if (hwStartBtn) hwStartBtn.textContent = text;
    if (hwStartBtn){
      hwStartBtn.classList.toggle('is-done', !!doneMode);
    }
  }

  function hwShowEmptyDetail(){
    if (hwSubjectIconEl) hwSubjectIconEl.textContent = '📭';
    if (hwStatusChip){
      hwStatusChip.textContent = 'Boş';
      hwStatusChip.className = 'hw-studio__status-chip hw-studio__status-chip--pending';
    }
    hwTitleEl.textContent = 'Henüz ödev yok';
    hwDescEl.textContent = 'Öğretmenin yeni ödev verdiğinde burada görünecek. Beklerken ders tekrarı yapabilirsin.';
    if (hwMetaEl) hwMetaEl.textContent = '—';
    if (hwDateEl) hwDateEl.textContent = '—';
    if (hwTopicCard) hwTopicCard.hidden = true;
    hwSetTeacherNote('');
    if (hwDescEl) hwDescEl.hidden = true;
    hwSetStartLabel('Ödev yok', false);
    if (hwStartBtn) hwStartBtn.disabled = true;
    if (hwVideoBtn) hwVideoBtn.disabled = true;
  }

  function db(){ try{ return firebase.database(); }catch(_){ return null; } }
  function sid(){ try{ return selectedStudent && selectedStudent.studentId; }catch(_){ return null; } }

  function openHomeworkScreen(){
    hwScreen.style.display = 'block';
    document.body.style.overflow='hidden';
    loadStudentHomeworks();
  }
  hwClose.addEventListener('click', ()=>{
    try {
      if (typeof window.novaDismissKaptanKabukOverlays === 'function') {
        window.novaDismissKaptanKabukOverlays();
      }
    } catch (_) {}
    hwScreen.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('roborox-reader-open');
    try { document.documentElement.classList.remove('roborox-reader-open'); } catch (_) {}
    try{
      if (typeof window.novaReturnToMainScreen === 'function') {
        window.novaReturnToMainScreen({ light: true, skipPerf: true });
      } else if (typeof window.novaEnsureLoggedInUi === 'function') {
        window.novaEnsureLoggedInUi();
      }
      if (typeof window.novaFixHudFabLayout === 'function') window.novaFixHudFabLayout();
    }catch(_){}
  });

  async function loadStudentHomeworks(){
    try{
      hwListMessage('Yükleniyor…');
      const s = sid(); const d = db();
      if(!s||!d){
        hwListMessage('Giriş yapınız.');
        hwShowEmptyDetail();
        return;
      }
      const snap = await d.ref('studentHomework/'+s).get();
      const list = snap.exists()? snap.val() : {};
      const rawItems = Object.entries(list).map(([hwId, info])=>({hwId, status: info?.status||'assigned', assignedAt: info?.assignedAt||0}));
      if(!rawItems.length){
        hwCache = {};
        hwStatusById = {};
        hwListMessage('Şu an ödev yok 🎈');
        hwShowEmptyDetail();
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

      await Promise.all(items.map(async function(it){
        details[it.hwId] = await hwEnrichDetail(details[it.hwId]);
      }));
      hwCache = details;

      if (!items.length) {
        hwListMessage('Şu an ödev yok 🎈');
        hwShowEmptyDetail();
        return;
      }

      items.sort(function(a, b){
        const ac = a.status === 'completed' ? 1 : 0;
        const bc = b.status === 'completed' ? 1 : 0;
        if (ac !== bc) return ac - bc;
        return Number(b.assignedAt || 0) - Number(a.assignedAt || 0);
      });

      hwRenderStats(items);
      hwListEl.innerHTML = '';
      items.forEach(function(it){
        const hw = details[it.hwId] || {};
        const done = it.status === 'completed';
        const li = document.createElement('li');
        li.setAttribute('data-id', it.hwId);
        li.className = 'hw-studio__item' + (done ? ' is-done' : '');
        li.innerHTML =
          '<span class="hw-studio__item-icon" aria-hidden="true">' + hwSubjectIcon(hw) + '</span>' +
          '<span class="hw-studio__item-body">' +
            '<span class="hw-studio__item-title">' + hwEsc(hw.title || 'Ödev') + '</span>' +
            '<span class="hw-studio__item-meta">' + hwEsc(hwFormatDate(hw.createdAt || it.assignedAt)) + '</span>' +
          '</span>' +
          '<span class="hw-studio__item-badge ' + (done ? 'hw-studio__item-badge--done' : 'hw-studio__item-badge--pending') + '">' +
            (done ? 'Bitti' : 'Bekliyor') +
          '</span>';
        li.addEventListener('click', function(){ selectHw(it.hwId, it.status); });
        hwListEl.appendChild(li);
      });

      const firstPending = items.find(function(x){ return x.status !== 'completed'; }) || items[0];
      selectHw(firstPending.hwId, firstPending.status);
    }catch(e){
      console.warn('loadStudentHomeworks', e);
      hwListMessage('Ödevler alınamadı.');
    }
  }

  function selectHw(hwId, status){
    const effectiveStatus = status || hwStatusById[hwId] || 'assigned';
    selectedHw = { id: hwId, detail: hwCache[hwId]||{}, status: effectiveStatus };
    const d = selectedHw.detail;
    const done = effectiveStatus === 'completed';

    if (hwSubjectIconEl) hwSubjectIconEl.textContent = hwSubjectIcon(d);
    if (hwStatusChip){
      hwStatusChip.textContent = done ? 'Tamamlandı ✓' : 'Yapılacak';
      hwStatusChip.className = 'hw-studio__status-chip ' + (done ? 'hw-studio__status-chip--done' : 'hw-studio__status-chip--pending');
    }

    hwTitleEl.textContent = d.title || 'Ödev';
    if (hwDescEl) hwDescEl.hidden = true;

    const qMeta = (function () {
      const ids = d.questionIds;
      if (ids && typeof ids === 'object') {
        const n = Array.isArray(ids) ? ids.length : Object.keys(ids).length;
        if (n > 0) return n;
      }
      return d.questionCount || 10;
    })();
    if (hwMetaEl) hwMetaEl.textContent = String(qMeta) + ' soru';
    if (hwDateEl) hwDateEl.textContent = hwFormatDate(d.createdAt);

    const topicParts = [d.lessonName, d.topicName].filter(Boolean);
    if (hwTopicCard && hwTopicEl){
      if (topicParts.length){
        hwTopicCard.hidden = false;
        hwTopicEl.textContent = topicParts.join(' · ');
      } else {
        hwTopicCard.hidden = true;
      }
    }

    hwSetTeacherNote(hwTeacherNote(d));

    document.querySelectorAll('#hw_list .hw-studio__item').forEach(function(li){
      li.classList.toggle('is-active', li.getAttribute('data-id') === hwId);
    });

    if (hwVideoBtn) hwVideoBtn.disabled = false;
    if (hwStartBtn) hwStartBtn.disabled = false;
    if (done){
      hwSetStartLabel('Tamamlandı', true);
    } else {
      hwSetStartLabel('Ödevi Başlat', false);
    }
  }

  // Kaptan Kabuk anlatım
hwVideoBtn.addEventListener('click', async ()=>{
  try {
    if(!selectedHw) return;
    const d = selectedHw.detail||{};
    const paths = novaCoerceHomeworkPaths(d);
    if (!paths.h || !paths.l || !paths.t) {
      await showAlert('Bu ödev kaydında sınıf/ders/konu bilgisi eksik.');
      return;
    }
    if (typeof window.novaOpenKaptanKabukForChampionTopic !== 'function') {
      await showAlert('Kaptan Kabuk modülü henüz yüklenmedi. Sayfayı yenileyip tekrar deneyin.');
      return;
    }
    const ok = await window.novaOpenKaptanKabukForChampionTopic({
      headingId: paths.h,
      lessonId: paths.l,
      topicId: paths.t,
      onClose: function(){
        if (hwScreen) {
          hwScreen.style.display = 'block';
          document.body.style.overflow = 'hidden';
        }
      }
    });
    if (!ok) {
      await showAlert('Bu konu için Kaptan Kabuk anlatımı henüz bağlanmamış. Admin panelinde müfredat konusuna Kaptan Kabuk ders/konusu ilişkilendirin.');
    }
  } catch (e) {
    console.warn('hw kaptan kabuk', e);
    try { await showAlert('Anlatım açılırken hata oluştu. Sayfayı yenileyip tekrar deneyin.'); } catch (_) {}
  }
});

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
