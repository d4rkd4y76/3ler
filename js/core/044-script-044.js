(function(){
  function getDb(){
    try{ if (typeof firebase !== 'undefined' && firebase.database) return firebase.database(); }catch(_){}
    return null;
  }
  function getSelStudent(){
    try{ var raw = localStorage.getItem('selectedStudent'); if(raw) return JSON.parse(raw); }catch(_){}
    return null;
  }

  function shuffleArr(a){
    const arr = a.slice();
    for(let i=arr.length;i>0;){
      const j = Math.floor(Math.random()*i);
      i--; [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  var denemeUiMode = 'off'; // off | exam | result

  function denemeFabMarkup(){
    if (denemeUiMode === 'result') {
      return '<span class="deneme-fab-shine" aria-hidden="true"></span><span class="deneme-fab-content"><span class="deneme-fab-ico" aria-hidden="true">🏆</span><span class="deneme-fab-txt">SONUÇ</span></span>';
    }
    return '<span class="deneme-fab-shine" aria-hidden="true"></span><span class="deneme-fab-content"><span class="deneme-fab-ico" aria-hidden="true">✏️</span><span class="deneme-fab-txt">DENEME</span></span>';
  }

  function applyDenemeFabState(btn, meta){
    var isEnded = !!(meta && meta.ended);
    var isEnabled = !!(meta && meta.enabled) && !isEnded;
    denemeUiMode = isEnded ? 'result' : (isEnabled ? 'exam' : 'off');
    btn.classList.toggle('deneme-fab--result', denemeUiMode === 'result');
    btn.classList.toggle('deneme-fab--on', denemeUiMode === 'exam');
    btn.classList.toggle('deneme-fab--off', denemeUiMode === 'off');
    var wrap = document.getElementById('deneme_fab_wrap');
    if (wrap) {
      wrap.classList.remove('deneme-fab-wrap--result', 'deneme-fab-wrap--on', 'deneme-fab-wrap--off');
      wrap.classList.add(denemeUiMode === 'result' ? 'deneme-fab-wrap--result' : denemeUiMode === 'exam' ? 'deneme-fab-wrap--on' : 'deneme-fab-wrap--off');
    }
    btn.innerHTML = denemeFabMarkup();
    btn.setAttribute('aria-label', denemeUiMode === 'result' ? 'Sonuç' : 'Deneme');
  }

  function ensureDenemeFab(){
    const ms = document.getElementById('main-screen');
    if(!ms || document.getElementById('deneme_fab_wrap')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'deneme_fab';
    btn.className = 'deneme-fab deneme-fab--off';
    btn.setAttribute('aria-label','Deneme');
    btn.innerHTML = '<span class="deneme-fab-shine" aria-hidden="true"></span><span class="deneme-fab-content"><span class="deneme-fab-ico" aria-hidden="true">✏️</span><span class="deneme-fab-txt">DENEME</span></span>';
    const wrap = document.createElement('span');
    wrap.id = 'deneme_fab_wrap';
    wrap.className = 'deneme-fab-wrap deneme-fab-wrap--off';
    wrap.appendChild(btn);
    ms.appendChild(wrap);

    btn.addEventListener('click', function(){
      if(denemeUiMode === 'off'){
        try{ if(typeof window.showAlert === 'function') window.showAlert('Deneme şu an kapalı. Öğretmenin açmasını bekleyebilirsin.'); else alert('Deneme kapalı.'); }catch(_){ alert('Deneme kapalı.'); }
        return;
      }
      if(denemeUiMode === 'result'){
        if(typeof window.novaOpenDenemeResult === 'function') window.novaOpenDenemeResult();
        return;
      }
      if(typeof window.novaOpenDenemeExam === 'function') window.novaOpenDenemeExam();
    });

    try{
      var d0 = getDb();
      if(d0 && d0.ref){
        d0.ref('denemeMeta').off('value');
        d0.ref('denemeMeta').on('value', function(snap){
          var meta = snap && snap.exists ? (snap.exists() ? (snap.val() || {}) : {}) : {};
          applyDenemeFabState(btn, meta);
        });
      }
    }catch(_){}

    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        const w = document.getElementById('deneme_fab_wrap');
        if(!w) return;
        w.style.display = e.isIntersecting ? 'inline-flex' : 'none';
      });
    }, {threshold: .1});
    if(ms) io.observe(ms);
  }

  let denemeState = null;

  function fmtClock(ms){
    const s = Math.floor((ms||0)/1000);
    const m = Math.floor(s/60);
    const r = s % 60;
    return m + ':' + (r<10?'0':'') + r;
  }
  function escHtml(v){
    return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function saveDenemeProgress(){
    try{
      if(!denemeState) return;
      var dbs = getDb();
      var stu = getSelStudent();
      if(!dbs || !stu || !stu.studentId) return;
      var payload = {
        studentId: stu.studentId,
        studentName: stu.studentName || '',
        classId: stu.classId || '',
        startedAt: denemeState.startedAt || Date.now(),
        index: Number(denemeState.index || 0),
        score: Number(denemeState.score || 0),
        wrong: Number(denemeState.wrong || 0),
        awayCount: Number(denemeState.awayCount || 0),
        bySubject: denemeState.bySubject || {},
        answers: Array.isArray(denemeState.answers) ? denemeState.answers : [],
        questions: denemeState.questions || [],
        updatedAt: Date.now()
      };
      await dbs.ref('denemeProgress/'+stu.studentId).set(payload);
    }catch(e){ console.warn('saveDenemeProgress', e); }
  }

  async function clearDenemeProgress(){
    try{
      var dbs = getDb();
      var stu = getSelStudent();
      if(!dbs || !stu || !stu.studentId) return;
      await dbs.ref('denemeProgress/'+stu.studentId).remove();
    }catch(e){ console.warn('clearDenemeProgress', e); }
  }

  function hideMainStacks(){
    try{
      ['main-screen','duel-selection-screen','duel-game-screen','rankingPanel','lesson-video-screen','single-player-screen','single-player-game-screen','homework-screen'].forEach(function(id){
        const el = document.getElementById(id); if(el) el.style.display = 'none';
      });
    }catch(_){}
  }

  function closeDenemeExam(){
    saveDenemeProgress();
    const scr = document.getElementById('deneme-exam-screen');
    if(scr){ scr.style.display = 'none'; scr.setAttribute('aria-hidden','true'); }
    closeOptikPanel();
    document.body.style.overflow = '';
    try{
      if(denemeState && denemeState.timerId) clearInterval(denemeState.timerId);
    }catch(_){}
    denemeState = null;
    const ms = document.getElementById('main-screen');
    if(ms) ms.style.removeProperty('display');
  }

  async function writeDeniedAttemptByResumeLimit(stu, dbs, progress){
    try{
      if(!stu || !stu.studentId || !dbs || !dbs.ref) return;
      const finishedAt = Date.now();
      const startedAt = Number(progress && progress.startedAt ? progress.startedAt : finishedAt);
      const payload = {
        studentId: stu.studentId,
        studentName: stu.studentName || '',
        classId: stu.classId || '',
        className: '',
        startedAt: startedAt,
        finishedAt: finishedAt,
        durationMs: Math.max(0, finishedAt - startedAt),
        correctCount: Number(progress && progress.score ? progress.score : 0),
        wrongCount: Number(progress && progress.wrong ? progress.wrong : 0),
        total: Array.isArray(progress && progress.questions) ? progress.questions.length : 0,
        bySubject: (progress && progress.bySubject) || {},
        awayCount: 3,
        answers: Array.isArray(progress && progress.answers) ? progress.answers : [],
        disqualified: true,
        note: 'resume_limit_exceeded'
      };
      const attemptId = dbs.ref().push().key;
      const upd = {};
      upd['denemeAttempts/'+attemptId] = payload;
      upd['denemeResults/'+stu.studentId+'/'+attemptId] = payload;
      upd['denemeProgress/'+stu.studentId] = null;
      await dbs.ref().update(upd);
    }catch(e){ console.warn('writeDeniedAttemptByResumeLimit', e); }
  }

  function showOptikWarn(msg){
    const w = document.getElementById('deneme_optik_warn');
    if(!w) return;
    w.textContent = msg || 'Lutfen optik forma isleyin.';
    w.classList.remove('show');
    void w.offsetWidth;
    w.classList.add('show');
    setTimeout(()=> w.classList.remove('show'), 900);
  }

  function openOptikPanel(){
    const p = document.getElementById('deneme_optik_panel');
    if(!p) return;
    p.classList.add('open');
    p.setAttribute('aria-hidden', 'false');
  }
  function closeOptikPanel(){
    const p = document.getElementById('deneme_optik_panel');
    if(!p) return;
    p.classList.remove('open');
    p.setAttribute('aria-hidden', 'true');
  }
  function renderOptikForCurrentQuestion(){
    const st = denemeState;
    const qEl = document.getElementById('deneme_optik_q');
    const chEl = document.getElementById('deneme_optik_choices');
    if(!st || !qEl || !chEl) return;
    const idx = Number(st.index || 0);
    const total = Array.isArray(st.questions) ? st.questions.length : 0;
    qEl.textContent = 'Optik Form';
    const labels = ['A','B','C','D'];
    const rows = [];
    rows.push('<div class="deneme-optik-head"><div>Soru</div><div>A</div><div>B</div><div>C</div><div>D</div></div>');
    for(let r=0; r<total; r++){
      const stateCls = r < idx ? 'done' : (r === idx ? 'active' : 'future');
      const saved = Array.isArray(st.answers) && st.answers[r] ? String(st.answers[r].chosenLabel || '') : '';
      const ans = (r === idx && String(st.optikDraftLabel || '').trim()) ? String(st.optikDraftLabel || '') : saved;
      let cells = '';
      labels.forEach((lab)=>{
        const filled = ans === lab ? 'filled' : '';
        const disabled = (r !== idx) ? 'disabled' : '';
        cells += `<button type="button" class="deneme-optik-bubble ${filled} ${disabled}" data-row="${r}" data-l="${lab}">${lab}</button>`;
      });
      rows.push(`<div class="deneme-optik-row ${stateCls}"><div class="deneme-optik-no">${r+1}</div>${cells}</div>`);
    }
    chEl.innerHTML = rows.join('');
    chEl.querySelectorAll('.deneme-optik-bubble').forEach((b)=>{
      b.addEventListener('click', function(){
        const row = Number(b.getAttribute('data-row'));
        const lab = String(b.getAttribute('data-l') || '').trim().toUpperCase();
        if(!denemeState) return;
        if(row !== Number(denemeState.index || 0)){
          showOptikWarn('Su an sadece aktif soruyu optige isaretleyebilirsin.');
          return;
        }
        denemeState.optikDraftLabel = lab;
        const li = labels.indexOf(lab);
        if(li < 0 || li > 3){
          showOptikWarn('Gecersiz secim. A, B, C veya D sec.');
          return;
        }
        const opt = denemeState.currentOptions && denemeState.currentOptions[li];
        if(!opt) return;
        const gridEl = document.getElementById('deneme_options_grid');
        const optionBtns = gridEl ? Array.from(gridEl.querySelectorAll('.deneme-opt-btn')) : [];
        const selectedBtn = optionBtns[li] || null;
        onPick(selectedBtn, denemeState.questions[denemeState.index], !!opt.ok, String(opt.text||''), lab);
        renderOptikForCurrentQuestion();
      });
    });
  }

  function recalcDenemeStats(){
    if(!denemeState) return;
    const st = denemeState;
    let score = 0, wrong = 0;
    const by = {};
    (st.questions || []).forEach(function(q, i){
      const a = Array.isArray(st.answers) ? st.answers[i] : null;
      if(!a) return;
      const sub = (q.subject || 'GENEL').trim() || 'GENEL';
      if(!by[sub]) by[sub] = { correct:0, wrong:0 };
      if(a.isCorrect){ score++; by[sub].correct++; }
      else { wrong++; by[sub].wrong++; }
    });
    st.score = score;
    st.wrong = wrong;
    st.bySubject = by;
  }

  function syncDenemeNav(){
    const st = denemeState; if(!st) return;
    const prev = document.getElementById('deneme_prev_btn');
    const next = document.getElementById('deneme_next_btn2');
    const mid = document.getElementById('deneme_nav_mid');
    const fin = document.getElementById('deneme_finish_early_btn');
    const total = Array.isArray(st.questions) ? st.questions.length : 0;
    const answered = Array.isArray(st.answers) ? st.answers.filter(Boolean).length : 0;
    if(mid) mid.textContent = 'Cevaplanan: ' + answered + '/' + total;
    if(prev) prev.disabled = Number(st.index || 0) <= 0;
    if(next) next.disabled = Number(st.index || 0) >= (total - 1);
    if(fin) fin.disabled = false;
  }

  function renderDenemeQuestion(){
    const st = denemeState; if(!st) return;
    const list = st.questions;
    const idx = st.index;
    if(idx >= list.length){ finishDeneme(); return; }

    const q = list[idx];
    const total = list.length;
    document.getElementById('deneme_prog_label').textContent = 'Soru '+(idx+1)+' / '+total;
    const pct = total ? (idx/total)*100 : 0;
    const bar = document.getElementById('deneme_prog_bar');
    if(bar) bar.style.width = pct+'%';

    const wrap = document.getElementById('deneme_question_wrap');
    const grid = document.getElementById('deneme_options_grid');
    const ex = document.getElementById('deneme_explain');
    const fin = document.getElementById('deneme_finish');
    const optikBtn = document.getElementById('deneme_optik_btn');
    const nav = document.getElementById('deneme_nav');
    const early = document.getElementById('deneme_finish_early_btn');
    fin.style.display = 'none';
    if(optikBtn) optikBtn.style.display = 'block';
    if(nav) nav.style.display = 'flex';
    if(early) early.style.display = 'block';
    ex.style.display = 'none';
    ex.innerHTML = '';

    wrap.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'deneme-q-card';

    const info = q.info || '';
    const infoItems = q.infoItems || null;
    const mq = window.NovaQuestionMarkup;
    if (mq) {
      mq.mountDenemePreamble(card, info, infoItems);
    } else {
    const isInfoImg = info && /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i.test(info);
    if(isInfoImg){
      const pre = document.createElement('div');
      pre.className = 'deneme-q-pre';
      const im = document.createElement('img');
      im.src = info; im.alt = 'Öncül';
      pre.appendChild(im);
      card.appendChild(pre);
    } else if(info){
      const pre = document.createElement('div');
      pre.className = 'deneme-q-pre';
      pre.textContent = info;
      card.appendChild(pre);
    }
    }

    if(q.imageUrl){
      const im = document.createElement('img');
      im.className = 'deneme-q-img';
      im.src = q.imageUrl;
      im.alt = 'Soru görseli';
      card.appendChild(im);
    }

    const qt = document.createElement('div');
    qt.className = 'deneme-q-text q-markup';
    const stemHtml = mq ? mq.renderMarkupHtml(q.questionText || '') : escHtml(q.questionText || '');
    qt.innerHTML = '<div style="font-size:.88rem;font-weight:900;color:#0ea5e9;letter-spacing:.03em;margin-bottom:6px">SORU</div>' + stemHtml;
    card.appendChild(qt);
    wrap.appendChild(card);

    const opts = [
      { text: q.correct, ok: true },
      { text: q.wrong1, ok: false },
      { text: q.wrong2, ok: false },
      { text: q.wrong3, ok: false }
    ];
    const sh = shuffleArr(opts);
    st.currentOptions = sh.slice();
    st.locked = false;
    const existing = Array.isArray(st.answers) ? st.answers[idx] : null;
    st.optikDraftLabel = existing ? String(existing.chosenLabel || '') : '';
    grid.innerHTML = '';
    sh.forEach(function(opt, si){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'deneme-opt-btn';
      b.dataset.correct = opt.ok ? '1' : '0';
      b.dataset.i = String(si % 4);
      const lab = ['A','B','C','D'][si] || '?';
      const optHtml = mq ? mq.renderMarkupHtml(opt.text || '') : escHtml(String(opt.text || ''));
      b.innerHTML = '<span class="deneme-opt-lbl">'+lab+'</span><span style="flex:1">'+optHtml+'</span>';
      if(existing && String(existing.chosenLabel || '') === lab){
        b.classList.add('deneme-selected');
      }
      b.addEventListener('click', function(){ showOptikWarn('Lutfen optik forma isleyin.'); openOptikPanel(); });
      grid.appendChild(b);
    });
    renderOptikForCurrentQuestion();
    syncDenemeNav();
  }

  function onPick(btn, q, isCorrect, chosenText, chosenLabel){
    const grid = document.getElementById('deneme_options_grid');
    const ex = document.getElementById('deneme_explain');
    if(!denemeState) return;
    denemeState.locked = false;
    const idx = Number(denemeState.index || 0);
    grid.querySelectorAll('button').forEach(function(b){
      b.disabled = false;
      b.classList.remove('deneme-correct','deneme-wrong','deneme-selected');
    });
    if(btn && btn.dataset){
      btn.classList.add('deneme-selected');
    }
    if(!Array.isArray(denemeState.answers)) denemeState.answers = [];
    denemeState.answers[idx] = {
      qid: q.qid || '',
      question: q.questionText || '',
      info: q.info || '',
      imageUrl: (q.imageUrl || '').trim(),
      chosen: String(chosenText || (btn ? String(btn.textContent || '').replace(/^[A-D]\s*/,'').trim() : '')),
      chosenLabel: String(chosenLabel || ''),
      correct: q.correct || '',
      isCorrect: !!isCorrect
    };
    recalcDenemeStats();
    renderOptikForCurrentQuestion();
    syncDenemeNav();
    saveDenemeProgress();

    ex.style.display = 'none';
    ex.innerHTML = '';
  }

  function finishDeneme(){
    const st = denemeState; if(!st) return;
    recalcDenemeStats();
    try{ if(st.timerId) clearInterval(st.timerId); }catch(_){}
    const finishedAt = Date.now();
    const durationMs = Math.max(0, finishedAt - st.startedAt);

    document.getElementById('deneme_question_wrap').innerHTML = '';
    document.getElementById('deneme_options_grid').innerHTML = '';
    document.getElementById('deneme_explain').style.display = 'none';
    var o1 = document.getElementById('deneme_optik_btn'); if(o1) o1.style.display = 'none';
    var n1 = document.getElementById('deneme_nav'); if(n1) n1.style.display = 'none';
    var e1 = document.getElementById('deneme_finish_early_btn'); if(e1) e1.style.display = 'none';

    const fin = document.getElementById('deneme_finish');
    fin.style.display = 'block';
    const total = st.questions.length;
    const bar = document.getElementById('deneme_prog_bar');
    if(bar) bar.style.width = '100%';
    document.getElementById('deneme_finish_title').textContent = total ? 'Deneme bitti!' : 'Deneme yoktu';

    var lines = [];
    lines.push('✅ Doğru: <b>'+st.score+'</b> &nbsp; · &nbsp; ❌ Yanlış: <b>'+st.wrong+'</b>');
    lines.push('⏱ Süre: <b>'+fmtClock(durationMs)+'</b>');
    document.getElementById('deneme_finish_stats').innerHTML = lines.join('<br/>');

    try{
      var stu = getSelStudent();
      var dbs = getDb();
      if(dbs && dbs.ref && stu && stu.studentId){
        var sid = stu.studentId;
        var attemptId = dbs.ref().push().key;
        var payload = {
          studentId: sid,
          studentName: stu.studentName || '',
          classId: stu.classId || '',
          className: '',
          startedAt: st.startedAt,
          finishedAt: finishedAt,
          durationMs: durationMs,
          correctCount: st.score,
          wrongCount: st.wrong,
          total: total,
          bySubject: st.bySubject,
          awayCount: Number(st.awayCount || 0),
          answers: enrichDenemeAnswersWithQuestions(Array.isArray(st.answers) ? st.answers : [], st.questions)
        };
        var upd = {};
        upd['denemeAttempts/'+attemptId] = payload;
        upd['denemeResults/'+sid+'/'+attemptId] = payload;
        // Lightweight leaderboard index (best correct, tie: shorter duration)
        var lbRef = dbs.ref('denemeLeaderboard/'+sid);
        lbRef.transaction(function(cur){
          var next = Object.assign({}, cur || {});
          var curCorrect = Number(cur && cur.bestCorrect || 0);
          var curDur = Number(cur && cur.bestDurationMs || Number.MAX_SAFE_INTEGER);
          var newCorrect = Number(payload.correctCount || 0);
          var newDur = Number(payload.durationMs || Number.MAX_SAFE_INTEGER);
          if(!cur || newCorrect > curCorrect || (newCorrect === curCorrect && newDur < curDur)){
            next.bestCorrect = newCorrect;
            next.bestDurationMs = Number(payload.durationMs || 0);
            next.finishedAt = Number(payload.finishedAt || Date.now());
          }
          next.studentId = sid;
          next.studentName = payload.studentName || '';
          next.classId = payload.classId || '';
          next.photo = (typeof studentPhoto !== 'undefined' && studentPhoto && studentPhoto.src) ? String(studentPhoto.src) : (next.photo || '');
          next.updatedAt = Date.now();
          return next;
        });
        // Subject aggregate index for cheap admin percentage view
        Object.keys(payload.bySubject || {}).forEach(function(sub){
          var o = payload.bySubject[sub] || {};
          var addC = Number(o.correct || 0);
          var addW = Number(o.wrong || 0);
          var sref = dbs.ref('denemeAgg/subjects/'+sub);
          sref.transaction(function(cur){
            cur = cur || {};
            return {
              correct: Number(cur.correct || 0) + addC,
              wrong: Number(cur.wrong || 0) + addW,
              updatedAt: Date.now()
            };
          });
        });
        dbs.ref().update(upd);
        try{
          if(typeof window.novaQuestRecord === 'function'){
            window.novaQuestRecord('deneme_completed', { correct: st.score, total: total, durationMs: durationMs });
          }
        }catch(_){}
      }
    }catch(e){ console.warn('deneme save', e); }

    clearDenemeProgress();
    denemeState = null;
  }

  function enrichDenemeAnswersWithQuestions(answers, questions){
    if(!Array.isArray(answers)) return [];
    var list = Array.isArray(questions) ? questions : [];
    return answers.map(function(a, i){
      if(!a) return a;
      var q = list[i];
      if(!q || String(q.qid || '') !== String(a.qid || '')){
        q = list.find(function(x){ return String(x.qid || '') === String(a.qid || ''); });
      }
      if(!q) return a;
      var inf = (a.info != null && String(a.info) !== '') ? String(a.info) : String(q.info || '');
      var iu = (a.imageUrl != null && String(a.imageUrl).trim() !== '') ? String(a.imageUrl).trim() : String(q.imageUrl || '').trim();
      if(inf === String(a.info || '') && iu === String(a.imageUrl || '').trim()) return a;
      return Object.assign({}, a, { info: inf, imageUrl: iu });
    });
  }

  async function enrichDenemePayloadAnswersFromQuestionBank(payload){
    try{
      var p = payload || {};
      var arr = Array.isArray(p.answers) ? p.answers : [];
      var need = arr.some(function(a){
        if(!a) return false;
        var missInfo = !a.info || String(a.info).trim() === '';
        var missImg = !a.imageUrl || String(a.imageUrl).trim() === '';
        return missInfo || missImg;
      });
      if(!need) return p;
      var raw = await readValCached('denemeQuestions', NOVA_DENEME_QUESTIONS_TTL_MS) || {};
      var byQid = {};
      Object.keys(raw).forEach(function(k){
        var d = raw[k] || {};
        var qinfo = (typeof d.question === 'object') ? (d.question.info || '') : (d.info || '');
        var imgUrl = (d.url || d.image || '').trim();
        byQid[k] = { info: qinfo || '', imageUrl: imgUrl };
      });
      var nextAnswers = arr.map(function(a){
        if(!a) return a;
        var meta = byQid[a.qid];
        if(!meta) return a;
        var o = Object.assign({}, a);
        if(!a.info || String(a.info).trim() === '') o.info = meta.info || '';
        if(!a.imageUrl || String(a.imageUrl).trim() === '') o.imageUrl = meta.imageUrl || '';
        return o;
      });
      return Object.assign({}, p, { answers: nextAnswers });
    }catch(_){
      return payload;
    }
  }

  function buildDenemeAnswerPremiseHtml(a){
    var info = a.info || '';
    var isInfoImg = info && /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i.test(info);
    var parts = [];
    if(isInfoImg){
      parts.push('<div class="deneme-ans-pre"><img class="deneme-ans-pre-img" src="'+escHtml(info)+'" alt="Öncül"/></div>');
    } else if(info){
      parts.push('<div class="deneme-ans-pre deneme-ans-pre-text">'+escHtml(info)+'</div>');
    }
    var imgUrl = String(a.imageUrl || '').trim();
    if(imgUrl && /^https?:\/\//i.test(imgUrl)){
      parts.push('<div class="deneme-ans-pre"><img class="deneme-ans-pre-img" src="'+escHtml(imgUrl)+'" alt="Soru görseli"/></div>');
    }
    return parts.join('');
  }


  function isDenemeAnswerEntry(a){
    return !!(a && (a.qid || a.chosen != null || String(a.chosenLabel || '') !== '' || a.question));
  }

  function denemeAnswerIsCorrect(a){
    if(!a) return false;
    if(a.isCorrect === true || a.isCorrect === 1 || a.isCorrect === '1' || a.isCorrect === 'true') return true;
    if(a.isCorrect === false || a.isCorrect === 0 || a.isCorrect === '0' || a.isCorrect === 'false') return false;
    var ch = String(a.chosen || '').trim();
    var co = String(a.correct || '').trim();
    if(ch && co) return ch === co;
    return false;
  }

  function buildAnswersPanelHtml(payload){
    const raw = Array.isArray(payload.answers) ? payload.answers : [];
    const items = [];
    raw.forEach(function(a, i){
      if(isDenemeAnswerEntry(a)) items.push({ a: a, num: i + 1 });
    });
    if(!items.length){
      return '<div class="deneme-answers-panel deneme-answers-panel--empty"><p>Bu deneme için cevap kaydı bulunamadı.</p></div>';
    }
    var correctN = Number(payload.correctCount);
    var wrongN = Number(payload.wrongCount);
    if(!Number.isFinite(correctN) || !Number.isFinite(wrongN)){
      correctN = 0;
      wrongN = 0;
      items.forEach(function(it){
        if(denemeAnswerIsCorrect(it.a)) correctN++;
        else wrongN++;
      });
    }
    var wrongBadge = wrongN > 0
      ? '<span class="deneme-answers-stat deneme-answers-stat--bad">'+wrongN+' yanlış</span>'
      : '';
    const head =
      '<div class="deneme-answers-head">' +
        '<p class="deneme-answers-head__title">Cevap incelemesi</p>' +
        '<div class="deneme-answers-head__stats">' +
          '<span class="deneme-answers-stat deneme-answers-stat--ok">'+correctN+' doğru</span>' +
          wrongBadge +
        '</div>' +
      '</div>';
    const rows = items.map(function(it){
      const a = it.a;
      const q = escHtml(a.question || ('Soru '+it.num));
      const chosen = escHtml(a.chosen || '—');
      const correct = escHtml(a.correct || '—');
      const ok = denemeAnswerIsCorrect(a);
      const pre = buildDenemeAnswerPremiseHtml(a);
      const badge = ok
        ? '<span class="deneme-ans-badge deneme-ans-badge--ok">Doğru</span>'
        : '<span class="deneme-ans-badge deneme-ans-badge--bad">Yanlış</span>';
      var answersBlock;
      if(ok){
        answersBlock =
          '<div class="deneme-ans-compare deneme-ans-compare--single">' +
            '<div class="deneme-ans-box deneme-ans-box--match">' +
              '<span class="deneme-ans-box__label">Cevabın</span>' +
              '<span class="deneme-ans-box__value">'+chosen+'</span>' +
            '</div>' +
          '</div>';
      } else {
        answersBlock =
          '<div class="deneme-ans-compare">' +
            '<div class="deneme-ans-box deneme-ans-box--yours">' +
              '<span class="deneme-ans-box__label">Senin cevabın</span>' +
              '<span class="deneme-ans-box__value">'+chosen+'</span>' +
            '</div>' +
            '<div class="deneme-ans-box deneme-ans-box--right">' +
              '<span class="deneme-ans-box__label">Doğru cevap</span>' +
              '<span class="deneme-ans-box__value">'+correct+'</span>' +
            '</div>' +
          '</div>';
      }
      return '<article class="deneme-ans-card deneme-ans-card--'+(ok?'ok':'bad')+'">' +
        '<header class="deneme-ans-card__head">' +
          '<span class="deneme-ans-card__num">S'+it.num+'</span>' +
          badge +
        '</header>' +
        pre +
        '<div class="deneme-ans-card__q">'+q+'</div>' +
        answersBlock +
      '</article>';
    });
    return '<div class="deneme-answers-panel">'+head+rows.join('')+'</div>';
  }

  function renderDenemeResultCard(payload, headingText, podiumHtml){
    hideMainStacks();
    const scr = document.getElementById('deneme-exam-screen');
    scr.style.display = 'block';
    scr.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    document.getElementById('deneme_question_wrap').innerHTML = '';
    document.getElementById('deneme_options_grid').innerHTML = '';
    document.getElementById('deneme_explain').style.display = 'none';
    var o2 = document.getElementById('deneme_optik_btn'); if(o2) o2.style.display = 'none';
    var n2 = document.getElementById('deneme_nav'); if(n2) n2.style.display = 'none';
    var e2 = document.getElementById('deneme_finish_early_btn'); if(e2) e2.style.display = 'none';
    document.getElementById('deneme_prog_label').textContent = headingText || 'Sonucun';
    document.getElementById('deneme_time_label').textContent = '';
    var bar = document.getElementById('deneme_prog_bar');
    if(bar) bar.style.width = '100%';

    const fin = document.getElementById('deneme_finish');
    fin.style.display = 'block';
    const correct = Number(payload.correctCount || 0);
    const wrong = Number(payload.wrongCount || 0);
    const total = Number(payload.total || (correct + wrong));
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const finishedAt = payload.finishedAt ? new Date(payload.finishedAt).toLocaleString('tr-TR') : '-';
    const awayCount = Number(payload.awayCount || 0);

    var subjectRows = '';
    var bs = payload.bySubject || {};
    Object.keys(bs).sort(function(a,b){ return a.localeCompare(b,'tr'); }).forEach(function(k){
      var o = bs[k] || {};
      var c = Number(o.correct || 0);
      var w = Number(o.wrong || 0);
      var t = c + w;
      var p = t ? Math.round((c / t) * 100) : 0;
      subjectRows += '<tr><td>'+String(k)+'</td><td>'+c+'</td><td>'+w+'</td><td>%'+p+'</td></tr>';
    });
    if(!subjectRows){
      subjectRows = '<tr><td colspan="4">Ders kırılımı yok</td></tr>';
    }

    document.getElementById('deneme_finish_title').textContent = '📌 Deneme Sonucun';
    document.getElementById('deneme_finish_stats').innerHTML =
      '<div class="deneme-result-sections">' +
        ((podiumHtml && podiumHtml.trim()) ? '<div class="deneme-result-card"><div class="deneme-result-title">🏆 İlk 3 Öğrenci</div>'+podiumHtml+'</div>' : '') +
        '<div class="deneme-result-card">' +
          '<div class="deneme-result-head">' +
            '<span>✅ Doğru: <b>'+correct+'</b></span>' +
            '<span>❌ Yanlış: <b>'+wrong+'</b></span>' +
            '<span>🎯 Başarı: <b>%'+pct+'</b></span>' +
          '</div>' +
          '<div class="deneme-result-sub">⏱ Süre: <b>'+fmtClock(payload.durationMs || 0)+'</b> &nbsp; · &nbsp; 🗓 '+finishedAt+' &nbsp; · &nbsp; 🔁 Dönüş: <b>'+awayCount+'/3</b></div>' +
          '<div style="text-align:center"><button type="button" class="deneme-my-answers-btn" id="deneme_my_answers_btn">📄 Cevaplarım</button></div>' +
        '</div>' +
        '<div class="deneme-result-card">' +
          '<div class="deneme-result-title">📚 Ders Performansı</div>' +
          '<table class="deneme-result-table"><thead><tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Başarı</th></tr></thead><tbody>'+subjectRows+'</tbody></table>' +
        '</div>' +
      '</div>';
    const ansWrap = document.getElementById('deneme_answers_wrap');
    if(ansWrap){
      ansWrap.style.display = 'none';
      ansWrap.innerHTML = buildAnswersPanelHtml(payload);
    }
    const ansBtn = document.getElementById('deneme_my_answers_btn');
    if(ansBtn && ansWrap){
      ansBtn.onclick = function(){
        const isOpen = ansWrap.style.display !== 'none';
        ansWrap.style.display = isOpen ? 'none' : 'block';
        ansBtn.textContent = isOpen ? '📄 Cevaplarım' : '📄 Cevapları Gizle';
      };
    }
  }

  async function buildTopThreePodiumHtml(dbs){
    try{
      const lbObj = await readValCached('denemeLeaderboard', NOVA_DENEME_LEADERBOARD_TTL_MS);
      if(!lbObj || typeof lbObj !== 'object') return '';
      const arr = [];
      Object.keys(lbObj).forEach(function(k){
        const v = lbObj[k] || {};
        arr.push(v);
      });
      arr.sort(function(a,b){
        const dc = Number(b.bestCorrect||0) - Number(a.bestCorrect||0);
        if(dc !== 0) return dc;
        return Number(a.bestDurationMs||Number.MAX_SAFE_INTEGER) - Number(b.bestDurationMs||Number.MAX_SAFE_INTEGER);
      }).slice(0,3);
      if(!arr.length) return '';

      const medals = ['🥇','🥈','🥉'];
      const fallback = 'https://via.placeholder.com/64?text=%F0%9F%91%A4';
      const cards = await Promise.all(arr.map(async function(v, i){
        let photo = v.photo ? String(v.photo) : fallback;
        const name = String(v.studentName || v.studentId || 'Öğrenci');
        const safeName = name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const rankBadge = medals[i] || String(i + 1);
        return '<div class=\"deneme-podium-item rank-'+String(i+1)+'\">' +
          '<div class=\"deneme-podium-medal\">'+rankBadge+'</div>' +
          '<img class=\"deneme-podium-photo\" alt=\"'+safeName+'\" src=\"'+photo+'\" />' +
          '<div class=\"deneme-podium-name\" title=\"'+safeName+'\">'+safeName+'</div>' +
          '<div class=\"deneme-podium-score\">'+String(Number(v.bestCorrect||0))+' doğru</div>' +
        '</div>';
      }));
      return '<div class=\"deneme-podium\">'+cards.join('')+'</div>';
    }catch(_){
      return '';
    }
  }

  window.novaOpenDenemeResult = async function(){
    try{
      var dbs = getDb();
      var stu = getSelStudent();
      if(!dbs || !stu || !stu.studentId){
        if(typeof window.showAlert === 'function') window.showAlert('Öğrenci bilgisi bulunamadı.');
        return;
      }
      const snap = await dbs.ref('denemeResults/'+stu.studentId).limitToLast(1).once('value');
      if(!snap.exists()){
        if(typeof window.showAlert === 'function') window.showAlert('Henüz sana ait deneme sonucu bulunmuyor.');
        return;
      }
      var latest = null;
      snap.forEach(function(ch){
        var v = ch.val() || {};
        if(!latest || Number(v.finishedAt || 0) > Number(latest.finishedAt || 0)) latest = v;
      });
      if(!latest){
        if(typeof window.showAlert === 'function') window.showAlert('Henüz sonuç bulunmuyor.');
        return;
      }
      try{
        await showDenemeIntroSequence({
          videoSrc: 'https://res.cloudinary.com/dxwzorapp/video/upload/q_auto/f_auto/v1775833101/11111111_tutpok.mp4',
          countMessage: 'Sonuç ekranı açılıyor'
        });
      }catch(_e){}
      latest = await enrichDenemePayloadAnswersFromQuestionBank(latest);
      var podiumHtml = await buildTopThreePodiumHtml(dbs);
      renderDenemeResultCard(latest, 'Kendi Sonucun', podiumHtml);
    }catch(e){
      console.warn('novaOpenDenemeResult', e);
      if(typeof window.showAlert === 'function') window.showAlert('Sonuç ekranı açılamadı.');
    }
  };

  function showDenemeIntroSequence(opts){
    return new Promise(function(resolve){
      var rules = document.getElementById('deneme-intro-rules');
      var cd = document.getElementById('deneme-intro-countdown');
      var numEl = document.getElementById('deneme-intro-count-num');
      var imgEl = document.getElementById('deneme-intro-rules-img');
      var vidEl = document.getElementById('deneme-intro-rules-video');
      var msgEl = document.getElementById('deneme-intro-count-msg');
      var closeBtn = document.getElementById('deneme-intro-rules-close');
      if(!rules || !cd || !numEl || !closeBtn){ resolve(); return; }
      var imageSrc = (opts && opts.imageSrc) ? String(opts.imageSrc) : '';
      var videoSrc = (opts && opts.videoSrc) ? String(opts.videoSrc) : '';
      var countMessage = (opts && opts.countMessage) ? String(opts.countMessage) : 'Denemeniz başlıyor';
      if(imgEl) imgEl.style.display = videoSrc ? 'none' : 'block';
      if(vidEl) vidEl.style.display = videoSrc ? 'block' : 'none';
      if(imgEl && imageSrc) imgEl.src = imageSrc;
      if(vidEl){
        try{
          vidEl.pause();
          vidEl.currentTime = 0;
          vidEl.onended = null;
          vidEl.controls = false;
          vidEl.muted = false;
          vidEl.volume = 1;
        }catch(_){}
        if(videoSrc){
          vidEl.src = videoSrc;
          vidEl.onended = function(){ startCountdown(); };
        }else{
          vidEl.removeAttribute('src');
          try{ vidEl.load(); }catch(_){}
        }
      }
      if(msgEl) msgEl.textContent = countMessage;
      var finished = false;
      function done(){
        if(finished) return;
        finished = true;
        rules.classList.remove('open');
        rules.setAttribute('aria-hidden','true');
        cd.classList.remove('open');
        cd.setAttribute('aria-hidden','true');
        document.body.removeEventListener('keydown', onKey);
        closeBtn.onclick = null;
        rules.onclick = null;
        if(vidEl){
          try{ vidEl.pause(); vidEl.currentTime = 0; vidEl.onended = null; }catch(_){}
        }
        resolve();
      }
      function onKey(ev){
        if(ev.key === 'Escape'){ ev.preventDefault(); startCountdown(); }
      }
      var countdownRunning = false;
      function startCountdown(){
        if(countdownRunning || finished) return;
        countdownRunning = true;
        rules.classList.remove('open');
        rules.setAttribute('aria-hidden','true');
        cd.classList.add('open');
        cd.setAttribute('aria-hidden','false');
        numEl.textContent = '3';
        setTimeout(function(){
          numEl.textContent = '2';
          setTimeout(function(){
            numEl.textContent = '1';
            setTimeout(done, 1000);
          }, 1000);
        }, 1000);
      }
      rules.onclick = function(ev){
        if(ev.target === rules) startCountdown();
      };
      closeBtn.onclick = function(){ startCountdown(); };
      document.body.addEventListener('keydown', onKey);
      rules.classList.add('open');
      rules.setAttribute('aria-hidden','false');
      if(vidEl && videoSrc){
        try{
          var p = vidEl.play();
          if(p && typeof p.catch === 'function'){
            p.catch(function(){
              try{
                vidEl.controls = true;
                if(typeof window.showAlert === 'function'){
                  window.showAlert('Video sesi için ekrana dokunup oynatın.');
                }
                var unlock = function(){
                  try{
                    vidEl.muted = false;
                    vidEl.volume = 1;
                    var p2 = vidEl.play();
                    if(p2 && typeof p2.catch === 'function'){ p2.catch(function(){}); }
                  }catch(_){}
                  rules.removeEventListener('click', unlock);
                };
                rules.addEventListener('click', unlock, { once:true });
              }catch(_){}
            });
          }
        }catch(_){}
      }
    });
  }

  window.novaOpenDenemeExam = async function(){
    try{
      var dbs = getDb();
      if(!dbs){ alert('Bağlantı yok.'); return; }
      var stu = getSelStudent();
      if(!stu || !stu.studentId){
        if(typeof window.showAlert === 'function') window.showAlert('Öğrenci bilgisi bulunamadı.');
        return;
      }

      const completedSnap = await dbs.ref('denemeResults/'+stu.studentId).limitToLast(1).once('value');
      if(completedSnap.exists()){
        if(typeof window.showAlert === 'function') window.showAlert('Deneme hakkını kullandın. Tekrar giremezsin.');
        return;
      }

      const progressSnap = await dbs.ref('denemeProgress/'+stu.studentId).once('value');
      var progress = progressSnap.exists() ? (progressSnap.val() || null) : null;
      const raw = await readValCached('denemeQuestions', NOVA_DENEME_QUESTIONS_TTL_MS) || {};
      if(!Object.keys(raw).length){ try{ if(typeof window.showAlert === 'function') window.showAlert('Henüz deneme sorusu eklenmemiş.'); }catch(_){} return; }
      const keys = Object.keys(raw);
      if(!keys.length){ try{ if(typeof window.showAlert === 'function') window.showAlert('Henüz deneme sorusu yok.'); }catch(_){} return; }

      const built = keys.map(function(k){
        var d = raw[k] || {};
        var qtext = (typeof d.question === 'object') ? (d.question.text||'') : (d.question||'');
        var qinfo = (typeof d.question === 'object') ? (d.question.info||'') : (d.info||'');
        var qinfoItems = (typeof d.question === 'object' && Array.isArray(d.question.infoItems)) ? d.question.infoItems : null;
        return {
          qid: k,
          questionText: qtext,
          info: qinfo || '',
          infoItems: qinfoItems,
          imageUrl: (d.url || d.image || '').trim(),
          correct: d.correct || '',
          wrong1: d.wrong1 || '',
          wrong2: d.wrong2 || '',
          wrong3: d.wrong3 || '',
          explanation: d.explanation || '',
          subject: (d.subject || 'GENEL').trim() || 'GENEL'
        };
      }).filter(function(x){
        return (x.questionText || x.imageUrl) && x.correct && x.wrong1 && x.wrong2 && x.wrong3;
      });

      if(!built.length){ try{ if(typeof window.showAlert === 'function') window.showAlert('Sorular eksik (4 şık ve metin/görsel gerekli).'); }catch(_){} return; }

      try{
        await showDenemeIntroSequence({
          imageSrc: 'https://i.ibb.co/5xXcDxRR/Gemini-Generated-mage-drdxbodrdxbodrdx.jpg',
          countMessage: 'Denemeniz başlıyor'
        });
      }catch(_e){}

      hideMainStacks();
      const scr = document.getElementById('deneme-exam-screen');
      scr.style.display = 'block';
      scr.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      document.getElementById('deneme_finish').style.display = 'none';

      if(progress && Array.isArray(progress.questions) && progress.questions.length){
        const usedResume = Number(progress.awayCount || 0);
        if(usedResume >= 2){
          await writeDeniedAttemptByResumeLimit(stu, dbs, progress);
          if(typeof window.showAlert === 'function') window.showAlert('Denemeye girme hakkınız kalmamıştır.');
          return;
        }
        denemeState = {
          questions: progress.questions,
          index: Math.max(0, Number(progress.index || 0)),
          score: Number(progress.score || 0),
          wrong: Number(progress.wrong || 0),
          bySubject: progress.bySubject || {},
          answers: Array.isArray(progress.answers) ? progress.answers : [],
          awayCount: usedResume + 1,
          startedAt: Number(progress.startedAt || Date.now()),
          timerId: null
        };
        recalcDenemeStats();
        saveDenemeProgress();
        if(typeof window.showAlert === 'function'){
          const left = Math.max(0, 2 - Number(denemeState.awayCount || 0));
          window.showAlert('Denemene kaldığın yerden devam ediyorsun. Kalan devam hakkı: '+left);
        }
      }else{
        denemeState = {
          questions: shuffleArr(built),
          index: 0,
          score: 0,
          wrong: 0,
          bySubject: {},
          answers: [],
          awayCount: 0,
          startedAt: Date.now(),
          timerId: null
        };
        recalcDenemeStats();
        saveDenemeProgress();
      }

      denemeState.timerId = setInterval(function(){
        if(!denemeState) return;
        var el = document.getElementById('deneme_time_label');
        if(el) el.textContent = '⏱ ' + fmtClock(Date.now() - denemeState.startedAt);
      }, 500);

      renderDenemeQuestion();
    }catch(e){
      console.warn('novaOpenDenemeExam', e);
      try{ if(typeof window.showAlert === 'function') window.showAlert('Deneme açılamadı.'); }catch(_){}
    }
  };

  document.getElementById('deneme_finish_back').addEventListener('click', function(){
    closeDenemeExam();
  });
  document.getElementById('deneme_prev_btn').addEventListener('click', function(){
    if(!denemeState) return;
    if(Number(denemeState.index || 0) <= 0) return;
    denemeState.index = Number(denemeState.index || 0) - 1;
    saveDenemeProgress();
    renderDenemeQuestion();
  });
  document.getElementById('deneme_next_btn2').addEventListener('click', function(){
    if(!denemeState) return;
    const total = Array.isArray(denemeState.questions) ? denemeState.questions.length : 0;
    if(Number(denemeState.index || 0) >= total - 1) return;
    denemeState.index = Number(denemeState.index || 0) + 1;
    saveDenemeProgress();
    renderDenemeQuestion();
  });
  document.getElementById('deneme_finish_early_btn').addEventListener('click', async function(){
    if(!denemeState) return;
    const ok = (typeof safeShowConfirm === 'function')
      ? await safeShowConfirm('Denemeyi şimdi bitirmek istediğine emin misin?\nCevaplamadığın sorular boş kalacak ve sonuç ekranına geçeceksin.')
      : confirm('Denemeyi şimdi bitirmek istediğine emin misin?');
    if(!ok) return;
    finishDeneme();
  });
  document.getElementById('deneme_optik_btn').addEventListener('click', function(){
    if(!denemeState) return;
    renderOptikForCurrentQuestion();
    openOptikPanel();
  });
  document.getElementById('deneme_optik_close').addEventListener('click', closeOptikPanel);
  document.getElementById('deneme_optik_panel').addEventListener('click', function(e){
    if(e.target && e.target.id === 'deneme_optik_panel') closeOptikPanel();
  });

  window.addEventListener('load', function(){
    ensureDenemeFab();
  });
})();
