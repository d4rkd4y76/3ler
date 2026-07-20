(function(){
  // Helper: escape HTML
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, m=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }
  function cleanupExplanation(s){
    s = String(s || '');
    // Remove repeated headers/labels coming from UI
    s = s.replace(/^\s*AÇIKLAMA\s*/ig, '');
    s = s.replace(/^\s*Açıklama[:：]?\s*/i, '');
    // Remove common summary labels accidentally captured
    s = s.replace(/^\s*(✅\s*)?DOĞRU\s*$/gim, '');
    s = s.replace(/^\s*(❌\s*)?YANLIŞ\s*$/gim, '');
    s = s.replace(/^\s*SENİN\s+CEVABIN\s*$/gim, '');
    s = s.replace(/^\s*DOĞRU\s+CEVAP\s*$/gim, '');
    s = s.replace(/^\s*YANLIŞ\s+CEVAP\s*$/gim, '');
    // If UI included "Doğru cevap: ..." lines, strip those too
    s = s.replace(/^\s*Doğru\s+cevap\s*:.*$/gim, '');
    s = s.replace(/^\s*Senin\s+cevabın\s*:.*$/gim, '');
    // Collapse extra blank lines
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
  }

  function sanitizeExplanation(raw, chosen, correct){
    var s = cleanupExplanation(raw || '');
    if (!s) return '';
    var c = String(chosen || '').trim();
    var t = String(correct || '').trim();

    // Some UIs include chosen/correct as plain lines without labels.
    // Remove leading lines that exactly match chosen/correct.
    var lines = s.split(/\r?\n/).map(function (l) { return String(l || '').trim(); });
    // drop empty at start
    while (lines.length && !lines[0]) lines.shift();
    // remove up to 4 leading lines matching chosen/correct (order can vary)
    for (var i = 0; i < 4 && lines.length; i++){
      var head = lines[0];
      if (!head) { lines.shift(); i--; continue; }
      if (c && head === c) { lines.shift(); i--; continue; }
      if (t && head === t) { lines.shift(); i--; continue; }
      // Also handle prefixed bullets/markers
      if (c && head.replace(/^[-•\u2022]\s+/, '') === c) { lines.shift(); i--; continue; }
      if (t && head.replace(/^[-•\u2022]\s+/, '') === t) { lines.shift(); i--; continue; }
      break;
    }
    // drop empties again
    while (lines.length && !lines[0]) lines.shift();
    return lines.join('\n').trim();
  }
  // Robust question finder
  function findQuestionText(){
    const root = document.querySelector('.question-container, #question-container, .soru-container, .quiz-question, .game-question, .question-area, .questionWrap, .question-wrapper') || document;
    const selectors = [
  '.question-actual-text',
  '.question-text', '.question-title', '.question', '#question', '#question-text',
  '.soru-text', '.soruMetni', '.soru', '.prompt', '.quiz-question h2', '.quiz-question h3'
];
    for (const sel of selectors){
      const el = root.querySelector(sel);
      if (el && (el.innerText||el.textContent||'').trim().length>8){
        return (el.innerText||el.textContent).trim();
      }
    }
    // Fallback: take the longest textual node inside root but not within options
    const options = new Set(Array.from(root.querySelectorAll('.options, .choices, .answers, .option, .option-button, button, .answer-option, .choice, .secenek'))
      .map(e=>e));
    function isInsideInfo(node){
  try { return node && node.closest && node.closest('.question-info-text'); }
  catch(_) { return null; }
}
function isInsideOptions(node){
      let p=node; while(p){ if(options.has(p)) return true; p=p.parentNode; }
      return false;
    }
    let longest='';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()){
      const txt = (walker.currentNode.nodeValue||'').trim();
      if (txt.length>8 && txt.length<400 && !isInsideOptions(walker.currentNode.parentNode)){
        if (txt.length>longest.length) longest=txt;
      }
    }
    return longest || 'Soru metni bulunamadı';
  }

  // ====== Data tracker ======
  const NovaTracker = (function(){
    const state = { items: [], total:0, correctCount:0, finished:false };
    // === Nova: Reset wrong-answers tracker for each NEW game ===
    function resetTrackerState(){
      state.items = [];
      state.total = 0;
      state.correctCount = 0;
      state.finished = false;
    }
    // Capture clicks on start buttons to reset before a new game begins
    document.addEventListener('click', function(ev){
      var t = ev.target && (ev.target.closest ? ev.target.closest('#start-game-button, .start-game-button, .single-start-button, #startSinglePlayerButton, .start-button, #startButton') : null);
      if (t) { try{ resetTrackerState(); }catch(_){} }
    }, true);
    // Wrap common start functions as extra safety
    ;(function wrapStarts(names){
      (names||[]).forEach(function(name){
        try{
          var fn = window[name];
          if (typeof fn === 'function' && !fn.__novaResetWrap){
            var orig = fn;
            window[name] = function(){
              try{ resetTrackerState(); }catch(_){}
              return orig.apply(this, arguments);
            };
            window[name].__novaResetWrap = true;
          }
        }catch(_){}
      });
    })(['startGame','startSinglePlayer','startCountdown','startNow']);

    function recordAnswer(payload) {
      var p = payload || {};
      if (p.isCorrect) {
        state.total += 1;
        state.correctCount += 1;
        return;
      }
      state.total += 1;
      var infoVal = String(p.info || '').trim();
      var hasInfoImage = /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(infoVal);
      state.items.push({
        q: String(p.q || '').trim(),
        chosen: String(p.chosen || '').trim(),
        correct: String(p.correct || '').trim(),
        explanation: String(p.explanation || '').trim(),
        infoImage: hasInfoImage ? infoVal : (String(p.infoImage || '').trim()),
        infoText: hasInfoImage ? '' : (String(p.infoText || infoVal || '').trim()),
        isCorrect: false,
        questionIndex: typeof p.questionIndex === 'number' ? p.questionIndex : -1,
      });
    }

    function getBadge(rate){ if(rate>=90) return 'ELMAS'; if(rate>=75) return 'ALTIN'; if(rate>=60) return 'GÜMÜŞ'; return 'BRONZ'; }

    function drawGauge(rate){
      const canvas = document.getElementById('nzGauge'); if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 14;
      const pct = Math.max(0, Math.min(100, Number(rate) || 0));
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(0.5, '#a78bfa');
      grad.addColorStop(1, '#38bdf8');
      ctx.strokeStyle = grad;
      const start = -Math.PI / 2;
      const end = start + (pct / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, end);
      ctx.stroke();
      ctx.fillStyle = '#111827';
      ctx.font = '800 26px system-ui, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(pct)}%`, cx, cy);
    }

    function renderSummary(){
      const wrap=document.getElementById('nova-summary'); if(!wrap) return;
      try{
        var prem=document.getElementById('premium-summary');
        if (prem) prem.style.display='none';
        document.querySelectorAll('.nova-end-wrapper').forEach(function(n){ n.remove(); });
      }catch(_){}
      const {total, correctCount, items}=state; const rate= total>0 ? (correctCount/total)*100 : 0;
      const rateEl=document.getElementById('nz-kpi-rate');
      document.getElementById('nz-kpi-correct').textContent=String(correctCount);
      document.getElementById('nz-kpi-total').textContent=String(total);
      rateEl.textContent=`${Math.round(rate)}%`;
      rateEl.className = rate>=75 ? 'value ok' : (rate>=60 ? 'value warn' : 'value bad');
      if (document.querySelector('.nova-result-panel')) {
        document.getElementById('nzBadge').textContent = getBadge(rate);
      } else {
        drawGauge(rate);
        document.getElementById('nzBadge').textContent = getBadge(rate);
      }

      const list=document.getElementById('nzWrongList'); list.innerHTML='';
      items.slice(0,8).forEach((it,idx)=>{
        const div=document.createElement('div'); div.className='nz-item';
        div.innerHTML=`
          ${it.infoImage ? `<div class="nz-info"><div class="nz-info-label">Öncül</div><img class="nz-info-img" src="${escapeHtml(it.infoImage)}" alt="Öncül"/></div>` : (it.infoText ? `<div class="nz-info nz-info-text"><div class="nz-info-label">Öncül</div><div class="nz-info-body">${escapeHtml(it.infoText)}</div></div>` : ``)}
          <div class="nz-head">
            <span class="nz-qid">${idx+1}</span>
            <div class="nz-head-text">
              <div class="nz-head-title">Yanlış soru</div>
              <div class="nz-q">${escapeHtml(it.q)}</div>
            </div>
            <span class="nz-badge">❌ YANLIŞ</span>
          </div>
          <div class="nz-rows">
            <div class="nz-row nz-row--chosen">
              <span class="nz-pill nz-you">Senin cevabın</span>
              <span class="nz-val">${escapeHtml(it.chosen||'-')}</span>
            </div>
            <div class="nz-row nz-row--correct">
              <span class="nz-pill nz-true">Doğru cevap</span>
              <span class="nz-val">${escapeHtml(it.correct||'-')}</span>
            </div>
          </div>
          ${it.explanation?`<div class="nz-exp"><div class="nz-exp-body">${escapeHtml(sanitizeExplanation(it.explanation, it.chosen, it.correct))}</div></div>`:''}
        `;
        list.appendChild(div);
      });
      wrap.classList.add('nz-show');
      try {
        var rptBtn = document.getElementById('nzRepeatBtn');
        if (rptBtn) {
          rptBtn.disabled = items.length === 0;
          rptBtn.classList.toggle('is-disabled', items.length === 0);
        }
      } catch (_) {}
      try {
        if (typeof window.novaPolishSpResultScreen === 'function') {
          setTimeout(window.novaPolishSpResultScreen, 80);
          setTimeout(window.novaPolishSpResultScreen, 320);
        } else if (typeof window.novaPlayResultArena === 'function') {
          setTimeout(function () {
            var m = window.novaGetSpResultMetrics ? window.novaGetSpResultMetrics() : null;
            if (m) window.novaPlayResultArena(m.rate, m.correct, m.total);
          }, 120);
        }
      } catch (_) {}
    }

    function startWrongReview(){
      if (!state.items.length) {
        try {
          if (typeof showAlert === 'function') showAlert('Listelenecek yanlış cevap yok. Harika iş!');
        } catch (_) {}
        return;
      }
      if (typeof window.novaEnterWrongAnswersReview === 'function') {
        window.novaEnterWrongAnswersReview(state.items.slice());
        return;
      }
      openModal();
    }

    function openModal(){
      const modal=document.getElementById('nova-modal'); const list=document.getElementById('nzModalList');
      list.innerHTML='';
      state.items.forEach((it,idx)=>{
        const div=document.createElement('div'); div.className='nz-item';
        div.innerHTML=`
          ${it.infoImage ? `<div class="nz-info"><div class="nz-info-label">Öncül</div><img class="nz-info-img" src="${escapeHtml(it.infoImage)}" alt="Öncül"/></div>` : (it.infoText ? `<div class="nz-info nz-info-text"><div class="nz-info-label">Öncül</div><div class="nz-info-body">${escapeHtml(it.infoText)}</div></div>` : ``)}
          <div class="nz-head">
            <span class="nz-qid">${idx+1}</span>
            <div class="nz-head-text">
              <div class="nz-head-title">Yanlış soru</div>
              <div class="nz-q">${escapeHtml(it.q)}</div>
            </div>
            <span class="nz-badge">❌ YANLIŞ</span>
          </div>
          <div class="nz-rows">
            <div class="nz-row nz-row--chosen">
              <span class="nz-pill nz-you">Senin cevabın</span>
              <span class="nz-val">${escapeHtml(it.chosen||'-')}</span>
            </div>
            <div class="nz-row nz-row--correct">
              <span class="nz-pill nz-true">Doğru cevap</span>
              <span class="nz-val">${escapeHtml(it.correct||'-')}</span>
            </div>
          </div>
          ${it.explanation?`<div class="nz-exp"><div class="nz-exp-body">${escapeHtml(sanitizeExplanation(it.explanation, it.chosen, it.correct))}</div></div>`:''}
        `;
        list.appendChild(div);
      });
      modal.style.display='flex';
    }

    return { state, renderSummary, openModal, startWrongReview, recordAnswer };
  })();

  window.NovaTracker = NovaTracker;

  // Observe score container visibility
  function observeScoreContainer(){
    const sc=document.querySelector('.score-container, #score-container');
    if(!sc) return;
    const obs=new MutationObserver(()=>{
      const visible=(getComputedStyle(sc).display!=='none' && sc.offsetParent!==null) || sc.classList.contains('show') || sc.classList.contains('active');
      if(visible && !NovaTracker.state.finished){
        NovaTracker.state.finished=true;
        try {
          var backBtn = document.getElementById('result-back-btn');
          if (backBtn) { backBtn.style.display = 'inline-flex'; }
        } catch(_) {}
        mountSummary(sc);
        NovaTracker.renderSummary();
      }
    });
    obs.observe(sc,{attributes:true,attributeFilter:['style','class']});
  }

  function hookEndGameRender(){
    if (typeof window.endGame !== 'function' || window.endGame.__novaTrackerHook) return;
    var orig = window.endGame;
    window.endGame = function(){
      var r = orig.apply(this, arguments);
      setTimeout(function(){
        try{
          var sc = document.getElementById('score-container');
          if (!sc || !window.NovaTracker) return;
          var prem = document.getElementById('premium-summary');
          if (prem) prem.style.display = 'none';
          mountSummary(sc);
          NovaTracker.renderSummary();
          if (typeof window.novaPolishSpResultScreen === 'function') {
            setTimeout(window.novaPolishSpResultScreen, 180);
          } else if (typeof window.novaPlayResultArena === 'function') {
            setTimeout(function () {
              var st = window.NovaTracker.state;
              var t = Number(st.total) || 0;
              var c = Number(st.correctCount) || 0;
              window.novaPlayResultArena(t > 0 ? (c / t) * 100 : 0, c, t);
            }, 180);
          }
        }catch(_){}
      }, 160);
      return r;
    };
    window.endGame.__novaTrackerHook = true;
  }
  function mountSummary(sc){
    const nova=document.getElementById('nova-summary');
    if(!nova || !sc) return;
    if (nova.parentElement === sc) {
      sc.classList.add('nova-final-wrap');
      return;
    }
    try {
      if (nova.parentElement) nova.parentElement.removeChild(nova);
    } catch (_) {}
    sc.appendChild(nova);
    sc.classList.add('nova-final-wrap');
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    observeScoreContainer();
    hookEndGameRender();

    const rpt=document.getElementById('nzRepeatBtn');
    const vid=document.getElementById('nzVideoBtn');
    if(rpt) rpt.addEventListener('click', NovaTracker.startWrongReview);
    if(vid) vid.addEventListener('click', ()=>{
      // Prefer native lesson video action if present
      try{ document.getElementById('lesson-video-button')?.click(); }catch(_){}
      // Direct Nova fallback (NEW clears legacy btn)
      try{ if (window.NovaLessonVideo && typeof window.NovaLessonVideo.open==='function'){ window.NovaLessonVideo.open(); } }catch(_){}
      // Fire integration event with analysis payload
      try{ window.dispatchEvent(new CustomEvent('nova:open-lesson-video', { detail: { tracker: 'nova', data: (window.NovaTracker && window.NovaTracker.state) || null } })); }catch(_){}
    });
  });
})();
