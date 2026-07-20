(function(){
  // Guard: don't overwrite if exists
  if (window.DB && typeof window.DB.getLessonVideoUrl === 'function') return;

  // helper to safely get selection texts
  function getSel(){
    var s = window.__novaSelection__ || {};
    return {
      classText: (s.classText || '').trim(),
      subjectText: (s.subjectText || '').trim(),
      topicText: (s.topicText || '').trim(),
      topicId: (s.topicId || '').trim()
    };
  }

  async function readWithV9(){
    try{
      if (!window.firebaseV9DatabaseLoaded) return null; // sentinel set below
      const db = window.firebaseV9DatabaseLoaded;
      const { get, ref } = window.firebaseV9DatabaseAPI;
      const sel = getSel();

      // 0) Hafif indeks (tam headings indirmeden)
      if (sel.topicId){
        try{
          const idxSnap = await get(ref(db, 'topicVideoUrls/' + sel.topicId));
          if (idxSnap.exists() && typeof idxSnap.val() === 'string' && idxSnap.val()) return idxSnap.val();
        }catch(_){}
      }

      // 1) topicId araması: championData/headings/*/lessons/*/topics/$topicId/videoUrl (ana uygulama önbelleği ile)
      if (sel.topicId){
        let headings = null;
        if (typeof window.novaReadValCached === 'function' && typeof window.NOVA_CHAMPION_HEADINGS_TTL_MS === 'number'){
          try{
            headings = await window.novaReadValCached('championData/headings', window.NOVA_CHAMPION_HEADINGS_TTL_MS);
          }catch(_){ headings = null; }
        }
        if (!headings){
          const hSnap = await get(ref(db, 'championData/headings'));
          if (hSnap.exists()) headings = hSnap.val();
        }
        if (headings){
          for (const hId in headings){
            const lessons = (headings[hId] && headings[hId].lessons) || {};
            for (const lId in lessons){
              const topics = (lessons[lId] && lessons[lId].topics) || {};
              if (topics[sel.topicId] && typeof topics[sel.topicId].videoUrl === 'string' && topics[sel.topicId].videoUrl){
                return topics[sel.topicId].videoUrl;
              }
            }
          }
        }
      }

      // 2) isim tabanlı lookup
      if (sel.subjectText && sel.topicText){
        const p = `lessonVideoLookup/${sel.subjectText}/${sel.topicText}`;
        const urlSnap = await get(ref(db, p));
        if (urlSnap.exists() && typeof urlSnap.val() === 'string' && urlSnap.val()){
          return urlSnap.val();
        }
      }
      return null;
    }catch(e){ console.warn('V9 adapter error:', e); return null; }
  }

  async function readWithV8(){
    try{
      if (!(window.firebase && firebase.database)) return null;
      var rdb = firebase.database();
      var sel = getSel();

      if (sel.topicId){
        try{
          var idxSnap = await rdb.ref('topicVideoUrls/' + sel.topicId).get();
          if (idxSnap.exists() && typeof idxSnap.val() === 'string' && idxSnap.val()) return idxSnap.val();
        }catch(_){}
      }

      if (sel.topicId){
        var headings = null;
        if (typeof window.novaReadValCached === 'function' && typeof window.NOVA_CHAMPION_HEADINGS_TTL_MS === 'number'){
          try{
            headings = await window.novaReadValCached('championData/headings', window.NOVA_CHAMPION_HEADINGS_TTL_MS);
          }catch(_){ headings = null; }
        }
        if (!headings){
          var hSnap = await rdb.ref('championData/headings').get();
          if (hSnap.exists()) headings = hSnap.val();
        }
        if (headings){
          for (var hId in headings){
            var lessons = (headings[hId] && headings[hId].lessons) || {};
            for (var lId in lessons){
              var topics = (lessons[lId] && lessons[lId].topics) || {};
              if (topics[sel.topicId] && typeof topics[sel.topicId].videoUrl === 'string' && topics[sel.topicId].videoUrl){
                return topics[sel.topicId].videoUrl;
              }
            }
          }
        }
      }

      if (sel.subjectText && sel.topicText){
        var urlSnap = await rdb.ref('lessonVideoLookup/' + sel.subjectText + '/' + sel.topicText).get();
        if (urlSnap.exists() && typeof urlSnap.val() === 'string' && urlSnap.val()){
          return urlSnap.val();
        }
      }
      return null;
    }catch(e){ console.warn('V8 adapter error:', e); return null; }
  }

  // Expose adapter
  window.DB = window.DB || {};
  window.DB.getLessonVideoUrl = async function(classId, subjectId, topicId){
    // try v9 then v8
    var url = await readWithV9();
    if (url) return url;
    url = await readWithV8();
    return url;
  };

  // Try to detect Firebase v9 Database from existing scripts (if imported as module elsewhere)
  // Allow external code to set these globals:
  //   window.firebaseV9DatabaseLoaded = getDatabase()
  //   window.firebaseV9DatabaseAPI = { get, ref }
})();
