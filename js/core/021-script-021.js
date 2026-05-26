/* ==== NOVA PREMIUM v3 (yalnızca ek JS) ==== */
(function(){
  'use strict';
  function save(k,v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(_){ } }
  function load(k,f){ try{ var s=sessionStorage.getItem(k); return s?JSON.parse(s):f; }catch(_){ return f; } }
  var WRONG_KEY='wrongAnswers', MAX_LIST=8;

  document.addEventListener('click', function(ev){
    try{
      var t=ev.target;
      if (t && !(t.classList&&t.classList.contains('option-button'))){ t=t.closest?t.closest('.option-button'):null; }
      if (!t) return;
      setTimeout(function(){
        try{
          var container=document.querySelector('.single-player-game-container, .duel-game-container')||document;
          var qEl=container.querySelector('.question-text');
          var expEl=document.querySelector('#explanation-container, .explanation-container');
          var chosenText=(t.textContent||'').trim();
          var correctBtn=null, btns=container.querySelectorAll('.option-button');
          for (var i=0;i<btns.length;i++){ var b=btns[i]; if (b.classList.contains('correct') || b.getAttribute('data-correct')==='true'){ correctBtn=b; break; } }
          var isWrong=t.classList.contains('wrong') || t.getAttribute('data-correct')==='false';
          if (isWrong && correctBtn){
            var item={ q:qEl?(qEl.textContent||'').trim():'', chosen:chosenText, correct:(correctBtn.textContent||'').trim(), exp: expEl?(expEl.textContent||'').trim():'' };
            var list=load(WRONG_KEY,[]);
            var dup=false; for (var j=0;j<list.length;j++){ if(list[j].q===item.q && list[j].chosen===item.chosen){ dup=true; break; } }
            if (!dup){ list.push(item); save(WRONG_KEY,list); }
          }
        }catch(_){}
      },300);
    }catch(_){}
  }, true);

  function bindReset(){
    try{
      var startBtn=document.querySelector('#start-game-button');
      if (startBtn && !startBtn.__novaBound){ startBtn.__novaBound=true; startBtn.addEventListener('click', function(){ try{ sessionStorage.removeItem(WRONG_KEY);}catch(_){}}); }
    }catch(_){}
  }
  // NOTE: documentElement subtree observer bazı cihazlarda sonuç ekranına geçişte
  // aşırı tetiklenip tarayıcıyı kilitleyebiliyordu. Tek sefer + kısa retry yeterli.
  bindReset();
  setTimeout(bindReset, 600);
  window.addEventListener('load', function(){ setTimeout(bindReset, 0); });

  function isVisible(el){ if(!el) return false; var s=window.getComputedStyle(el); return s && s.display!=='none' && s.visibility!=='hidden' && (el.offsetParent!==null || s.position==='fixed'); }
  function numberOr(s,f){ var m=(s||'').match(/(\d+[.,]?\d*)/g); if(!m) return f; var n=parseFloat(m[m.length-1].replace(',','.')); return isFinite(n)?n:f; }

  function extractMetrics(){
    var total=0, correct=0, pct=0;
    try{ var scEl=document.querySelector('#score'); if(scEl){ var t=(scEl.textContent||'').trim(); var frac=t.match(/(\d+)\s*\/\s*(\d+)/); if(frac){ correct=parseInt(frac[1],10); total=parseInt(frac[2],10);} var per=t.match(/%?\s*(\d{1,3})(?:[.,](\d+))?\s*%/); if(per){ pct=parseFloat(per[1]+(per[2]?'.'+per[2]:'')); } } }catch(_){}
    try{ if(!total){ var qn=document.querySelector('#question-number, .question-number'); if(qn){ var f=(qn.textContent||'').match(/(\d+)\s*\/\s*(\d+)/); if(f){ total=parseInt(f[2],10);} } } }catch(_){}
    try{ if(!pct){ var sm=document.querySelector('#score-message, .score-message'); if(sm){ pct=numberOr(sm.textContent,0);} } }catch(_){}
    if(!pct && total){ pct=Math.round((correct/Math.max(1,total))*100); }
    if(!correct && pct && total){ correct=Math.round((pct/100)*total); }
    if(!total||total<0) total=Math.max(total,correct,0);
    if(total && correct>total) correct=total;
    if(!isFinite(pct)) pct=0;
    return {total:total||0, correct:correct||0, pct:Math.max(0,Math.min(100,Math.round(pct)))};
  }

  function computeBadge(p){ if(p>=90) return {name:'ELMAS',emoji:'💎'}; if(p>=75) return {name:'ALTIN',emoji:'🥇'}; if(p>=50) return {name:'GÜMÜŞ',emoji:'🥈'}; return {name:'BRONZ',emoji:'🥉'}; }

  function ensurePremiumUI(scoreBox){
    if (!document.getElementById('premium-summary')){
      var host=document.createElement('div'); host.id='premium-summary';
      host.innerHTML='' +
        '<div class="metric-grid" aria-label="Öğrenme Özeti Metrikleri">'+
          '<div class="metric" role="group" aria-label="Doğru"><div class="label">Doğru</div><div class="value" id="metric-correct">0</div></div>'+
          '<div class="metric" role="group" aria-label="Toplam"><div class="label">Toplam</div><div class="value" id="metric-total">0</div></div>'+
          '<div class="metric" role="group" aria-label="Yüzde"><div class="label">Yüzde</div><div class="value" id="metric-pct">0%</div></div>'+
        '</div>'+
        '<div class="viz" aria-label="Görsel Özet">'+
          '<div class="gauge" aria-hidden="false">'+
            '<svg viewBox="0 0 120 120" aria-label="Başarı göstergesi">'+
              '<circle cx="60" cy="60" r="54" stroke="#e5e7eb" stroke-width="12" fill="none"></circle>'+
              '<circle id="gauge-bar" cx="60" cy="60" r="54" stroke="#111827" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="339.292" stroke-dashoffset="339.292" transform="rotate(-90 60 60)"></circle>'+
            '</svg>'+
            '<div class="pct" id="gauge-pct">0%</div>'+
          '</div>'+
          '<div class="badge" id="badge-box"><div class="badge-title">Rozet</div><div class="badge-value" id="badge-value">—</div></div>'+
        '</div>'+
        '<div class="wrong-block" aria-live="polite"><h4>Yanlış Soru Özeti</h4><div class="wrong-list" id="wrong-list"></div></div>'+
        '<div class="actions">'+
          '<button class="btn btn-primary" id="act-restart" title="Yeniden başlat">Tekrar Oyna</button>'+
          '<button class="btn btn-accent" id="act-review" title="Yanlışları incele">Yanlışları Tekrarla</button>'+
          '<button class="btn btn-outline" id="act-lesson" title="Ders videosunu aç">Ders Videosu</button>'+
          '<button class="btn btn-outline" id="act-print" title="Yazdır veya PDF kaydet">Yazdır/PDF</button>'+
        '</div>';
      scoreBox.appendChild(host);

      var modal=document.createElement('div'); modal.id='premium-modal';
      modal.innerHTML=''+'<div class="box" role="dialog" aria-modal="true" aria-labelledby="pm-title">'+
        '<button class="close" id="pm-close" aria-label="Kapat">Kapat</button>'+
        '<h3 id="pm-title">Yanlışların İncelemesi</h3>'+
        '<div id="pm-body"></div></div>';
      document.body.appendChild(modal);

      var restart=document.getElementById('act-restart');
      if (restart){ restart.addEventListener('click', function(){ try{ var back=document.querySelector('#final-back-button'); if(back) back.click(); else { var start=document.querySelector('#start-game-button'); if(start) start.click(); } }catch(_){ } }); }
      var review=document.getElementById('act-review');
      if (review){ review.addEventListener('click', function(){ try{ var list=load(WRONG_KEY,[]), body=document.getElementById('pm-body'); body.innerHTML=''; for (var i=0;i<list.length;i++){ var it=list[i]; var card=document.createElement('div'); card.className='wrong-card'; card.innerHTML='' + '<div class="q"><span class="qid">'+(i+1)+'</span><span>Soru:</span>&nbsp;'+(it.q||'')+'</div>' + '<div class="divider"></div>' + '<div class="row"><span class="k">Seçimin:</span>'+(it.chosen||'')+'</div>' + '<div class="row"><span class="k">Doğru Cevap:</span>'+(it.correct||'')+'</div>' + '<div class="row"><span class="k">Açıklama:</span>'+(it.exp||'')+'</div>'; body.appendChild(card);} document.getElementById('premium-modal').style.display='flex'; }catch(_){} }); }
      var pmc=document.getElementById('pm-close'); if (pmc){ pmc.addEventListener('click', function(){ document.getElementById('premium-modal').style.display='none'; }); }
      var lesson=document.getElementById('act-lesson'); if (lesson){ lesson.addEventListener('click', function(){ try{ var btn=document.querySelector('#lesson-video-button'); if(btn) btn.click(); }catch(_){} }); }
      var printBtn=document.getElementById('act-print'); if (printBtn){ printBtn.addEventListener('click', function(){ try{ window.print(); }catch(_){} }); }
    }
  }

  // NOTE: Confetti bazı cihazlarda sonuç ekranında ciddi kasma/donma yapabiliyor.
  // Donma problemi çözülene kadar kapalı.
  function confettiBurst(){ /* disabled */ }

  function animateGauge(pct){ try{ var circ=2*Math.PI*54; var bar=document.getElementById('gauge-bar'); var txt=document.getElementById('gauge-pct'); var start=0,end=Math.max(0,Math.min(100,pct)); var t0=performance.now(); function step(now){ var k=Math.min(1,(now-t0)/800); var val=Math.round(start+(end-start)*k); if(bar) bar.style.strokeDashoffset=(circ*(1-val/100)).toFixed(3); if(txt) txt.textContent=val+'%'; if(k<1) requestAnimationFrame(step); } requestAnimationFrame(step);}catch(_){} }

  function fillWrongPreview(){ try{ var list=load(WRONG_KEY,[]); var box=document.getElementById('wrong-list'); if(!box) return; box.innerHTML=''; var lim=Math.min(MAX_LIST,list.length); for (var i=0;i<lim;i++){ var it=list[i]; var card=document.createElement('div'); card.className='wrong-card'; card.innerHTML='' + '<div class="q"><span class="qid">'+(i+1)+'</span><span>Soru:</span>&nbsp;'+(it.q||'')+'</div>' + '<div class="divider"></div>' + '<div class="row"><span class="k">Seçimin:</span>'+(it.chosen||'')+'</div>' + '<div class="row"><span class="k">Doğru Cevap:</span>'+(it.correct||'')+'</div>' + '<div class="row"><span class="k">Açıklama:</span>'+(it.exp||'')+'</div>'; box.appendChild(card);} }catch(_){} }

  function hideLegacyResultChrome(){
    try{
      var nova=document.getElementById('nova-summary');
      if (nova){ nova.classList.remove('nz-show'); nova.style.display='none'; }
      var ring=document.getElementById('novaCircular');
      if (ring) ring.style.display='none';
      var si=document.getElementById('score-image');
      var sm=document.getElementById('score-message');
      if (si){ si.style.display='none'; si.removeAttribute('src'); }
      if (sm){ sm.style.display='none'; sm.textContent=''; }
    }catch(_){}
  }

  function renderPremium(){
    try{
      var sc=document.querySelector('#score-container, .score-container'); if(!sc) return;
      ensurePremiumUI(sc);
      hideLegacyResultChrome();
      var M=extractMetrics();
      var mc=document.getElementById('metric-correct'); if(mc) mc.textContent=M.correct;
      var mt=document.getElementById('metric-total'); if(mt) mt.textContent=M.total || (M.correct>0?M.correct:0);
      var mp=document.getElementById('metric-pct'); if(mp) mp.textContent=M.pct+'%';
      animateGauge(M.pct);
      var badge=computeBadge(M.pct); var bv=document.getElementById('badge-value'); if(bv) bv.textContent=badge.emoji+' '+badge.name;
      fillWrongPreview();
      var host=document.getElementById('premium-summary'); if(host){ host.style.display='flex'; }
      try{
        var tekrar=document.getElementById('btnTekrar');
        var lv=document.getElementById('lesson-video-button');
        if (tekrar) tekrar.style.display='none';
        if (lv) lv.style.display='none';
      }catch(_){}
      window.__novaPremiumRenderedOnce = true;
    }catch(_){}
  }

  // Tek kişilik sonuç: #nova-summary (023). Bu dosyanın premium inject'i SP'de kullanılmıyor.
  window.novaResetPremiumResultSession = function(){
    try{ sessionStorage.removeItem(WRONG_KEY); }catch(_){}
    try{
      var prem = document.getElementById('premium-summary');
      if (prem) prem.style.display = 'none';
    }catch(_){}
  };
})();
