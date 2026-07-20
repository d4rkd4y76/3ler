// === Nova: Ders Videosu Akışı ===
(function(){
  /** YouTube gömme Hata 153 (player configuration): Referer + nocookie embed — bkz. YouTube dokümantasyonu */
  window.novaNormalizeYouTubeEmbed = function(url){
    if (!url || typeof url !== 'string') return url;
    var s = url.trim();
    var base = 'https://www.youtube-nocookie.com/embed/';
    if (/youtube-nocookie\.com\/embed\//i.test(s)) return s;
    var id = null;
    if (/[?&]v=([A-Za-z0-9_-]{6,})/.test(s) && /youtube\.com\/watch/i.test(s)) {
      id = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/)[1];
    } else if (/youtu\.be\//i.test(s)) {
      id = s.split(/youtu\.be\//i)[1].split(/[?&#]/)[0];
    } else if (/\/shorts\//i.test(s)) {
      var m = s.match(/\/shorts\/([A-Za-z0-9_-]{6,})/i);
      id = m ? m[1] : null;
    } else {
      var me = s.match(/\/embed\/([A-Za-z0-9_-]{6,})/i);
      if (me) id = me[1];
    }
    if (id && /^[A-Za-z0-9_-]+$/.test(id)) return base + id;
    s = s.replace(/^https?:\/\/(www\.)?youtube\.com\/embed\//i, base);
    return s;
  };

  window.novaYouTubeVideoIdFromUrl = function(url){
    if (!url || typeof url !== 'string') return '';
    var s = url.trim();
    var m;
    if (/youtube\.com\/watch/i.test(s) && (m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/))) return m[1];
    if (/youtu\.be\//i.test(s)) return s.split(/youtu\.be\//i)[1].split(/[?&#]/)[0];
    if ((m = s.match(/\/embed\/([A-Za-z0-9_-]{6,})/i))) return m[1];
    if ((m = s.match(/\/shorts\/([A-Za-z0-9_-]{6,})/i))) return m[1];
    return '';
  };

  const byId = (id)=>document.getElementById(id);
  const screenSinglePlayer = byId('single-player-game-screen') || byId('single-player-screen');
  const scoreContainer = byId('score-container');
  const videoScreen = byId('lesson-video-screen');
  const videoIframe = byId('lesson-video-iframe');
  const btnOpen = byId('lesson-video-button');
  const btnBack = byId('lesson-video-back');

  function syncLessonVideoYoutubeFallback(embedUrl){
    var wrap = byId('lesson-video-fallback-wrap');
    var a = byId('lesson-video-open-youtube');
    if (!wrap || !a) return;
    var id = window.novaYouTubeVideoIdFromUrl ? window.novaYouTubeVideoIdFromUrl(embedUrl) : '';
    if (id) {
      a.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
      wrap.hidden = false;
    } else {
      a.removeAttribute('href');
      wrap.hidden = true;
    }
  }
  try { window.novaSetLessonVideoYoutubeFallback = syncLessonVideoYoutubeFallback; } catch(_){}

  // Persist the selected class/subject/topic at game start (non-invasive, additive)
  const startBtn = byId('start-game-button');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      try {
        const cls = byId('class-select'); const sub = byId('subject-select'); const top = byId('topic-select');
        window.__novaSelection__ = {
          classId: cls && cls.value || '',
          subjectId: sub && sub.value || '',
          topicId: top && top.value || '',
          classText: cls && cls.options && cls.selectedIndex >= 0 ? cls.options[cls.selectedIndex].textContent.trim() : '',
          subjectText: sub && sub.options && sub.selectedIndex >= 0 ? sub.options[sub.selectedIndex].textContent.trim() : '',
          topicText: top && top.options && top.selectedIndex >= 0 ? top.options[top.selectedIndex].textContent.trim() : ''
        };
      } catch(e){ /* noop */ }
    }, { passive: true });
  }

  // Demo resolver — replace with DB integration later
  async function resolveLessonVideoUrl() {
    // 1) If an external DB adapter exists, prefer it
    if (window.DB && typeof window.DB.getLessonVideoUrl === 'function') {
      try {
        const s = window.__novaSelection__ || {};
        const url = await window.DB.getLessonVideoUrl(s.classId, s.subjectId, s.topicId);
        if (url) return url;
      } catch(e){ console.warn('DB.getLessonVideoUrl error:', e); }
    }
    // 2) Optional: look for a data attribute on topic-select option (e.g., data-video)
    try {
      const top = byId('topic-select');
      if (top && top.selectedIndex >= 0) {
        const opt = top.options[top.selectedIndex];
        const dataUrl = opt ? (opt.getAttribute('data-video') || opt.dataset.video) : '';
        if (dataUrl) return dataUrl;
      }
    } catch(e){ /* ignore */ }

    // 3) Demo static mapping (placeholder). Update/remove when DB is ready.
    const s = window.__novaSelection__ || {};
    const key = [s.classText, s.subjectText, s.topicText].map(v => (v||'').trim()).join(' | ');
    const DEMO = {
      "3. Sınıf | Matematik | Kesirler": "https://www.youtube.com/embed/AF8sDRXk2eY",
      "3. Sınıf | Türkçe | Noktalama İşaretleri": "https://www.youtube.com/embed/0B6l8yJqVnA"
    };
    return DEMO[key] || null;
  }

  function showOnly(el){
    // Hide main containers we might be in
    const ids = [
      'single-player-screen','single-player-game-screen',
      'duel-selection-screen','duel-game-screen','rankingPanel'
    ];
    ids.forEach(i => { const e = byId(i); if (e) e.style.display = 'none'; });
    if (el) el.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeVideoScreen(){
    // Return user back to the results (score) screen if available, else main single-player screen
    try {
      var w = byId('lesson-video-fallback-wrap');
      var la = byId('lesson-video-open-youtube');
      if (w) w.hidden = true;
      if (la) la.removeAttribute('href');
    } catch(_){}
    if (videoIframe) videoIframe.src = '';
    if (scoreContainer && screenSinglePlayer) {
      // Show results container within the single player game screen
      const sp = byId('single-player-game-screen');
      if (sp) sp.style.display = 'flex';
      if (scoreContainer) scoreContainer.style.display = 'flex';
    } else {
      const spScreen = byId('single-player-screen');
      if (spScreen) spScreen.style.display = 'flex';
    }
    if (videoScreen) videoScreen.style.display = 'none';
  }

  async function openVideo(){
    try{
      const sel = window.__novaSelection__ || {};
      if (typeof window.novaOpenKaptanKabukForChampionTopic === 'function') {
        const ok = await window.novaOpenKaptanKabukForChampionTopic({
          headingId: sel.classId,
          lessonId: sel.subjectId,
          topicId: sel.topicId,
          onClose: closeVideoScreen
        });
        if (ok) return;
      }
      if (typeof window.showAlert === 'function') {
        window.showAlert('Bu konu için Kaptan Kabuk anlatımı henüz bağlanmamış. Öğretmenin admin panelinden müfredat konusuna Kaptan Kabuk ilişkilendirmesi yapması gerekir.');
      } else {
        alert('Bu konu için Kaptan Kabuk anlatımı henüz bağlanmamış.');
      }
    }catch(err){
      console.error(err);
      if (typeof window.showAlert === 'function') window.showAlert('Anlatım açılırken bir hata oluştu.');
      else alert('Anlatım açılırken bir hata oluştu.');
    }
  }

  if (btnOpen) btnOpen.addEventListener('click', openVideo);
  if (btnBack) btnBack.addEventListener('click', closeVideoScreen);

  // Expose minimal API for future DB wiring
  window.NovaLessonVideo = {
    open: openVideo,
    close: closeVideoScreen,
    setUrl: (url)=>{
      const u = (window.novaNormalizeYouTubeEmbed && url) ? window.novaNormalizeYouTubeEmbed(url) : url;
      if (videoIframe) {
        try { videoIframe.referrerPolicy = 'strict-origin-when-cross-origin'; } catch(_){}
        videoIframe.src = u || '';
      }
      try { syncLessonVideoYoutubeFallback(u || ''); } catch(_){}
    }
  };
  try{ window.addEventListener('nova:open-lesson-video', function(){ try{ openVideo(); }catch(_){} }); }catch(_){}
})();
// === End Nova ===
