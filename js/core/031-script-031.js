(function(){
  function clamp(x){ return Math.max(0, Math.min(100, Math.round(x))); }

  function inferPercent(){
    var s = (typeof window.singleScore === 'number') ? window.singleScore : (typeof window.score === 'number' ? window.score : null);
    var t = (typeof window.totalQuestions === 'number') ? window.totalQuestions : (typeof window.toplamSoru === 'number' ? window.toplamSoru : null);
    if (typeof s === 'number' && typeof t === 'number' && t > 0) return clamp(100 * s / t);

    var el = document.getElementById('score');
    if (el){
      var ds = el.getAttribute('data-score');
      var dt = el.getAttribute('data-total') || el.getAttribute('data-toplam');
      if (ds && !isNaN(ds)){
        var v = Number(ds);
        if (dt && !isNaN(dt) && Number(dt) > 0) return clamp(100 * v / Number(dt));
        if (v <= 100) return clamp(v);
      }
      var txt = (el.textContent || '').trim();
      var m01 = txt.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
      if (m01){ return clamp(100 * Number(m01[1]) / Number(m01[2]||1)); }
      var m02 = txt.match(/(\d{1,3})\s*%/);
      if (m02){ return clamp(Number(m02[1])); }
    }

    var pNode = document.querySelector('#score-container .percent, #score-container .nova-percent-text');
    if (pNode){
      var m = (pNode.textContent||'').match(/(\d{1,3})\s*%/);
      if (m) return clamp(Number(m[1]));
    }

    var sc = document.getElementById('score-container');
    if (sc){
      var walker = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT, null, false);
      var texts = [];
      while (walker.nextNode()) { texts.push(walker.currentNode.nodeValue); }
      var joined = texts.join(' ');
      var m2 = joined.match(/(\d{1,3})\s*%/);
      if (m2) return clamp(Number(m2[1]));
    }
    return null;
  }

  function getAdvice(p){
    if (p >= 0 && p < 30) {
      return "Bu sonuç hedefinin çok altında. Şimdi odaklanıp düzenli çalışmaya başlıyoruz; toparlayacağına güveniyorum. İlk işin yukarıdaki ders videosu butonuna basarak  dersimizin videosunu seyretmek, daha sonra da yanlış yaptığın soruları dikkatlice inceleyi unutma.";
    } else if (p >= 30 && p < 60) {
      return "Orta seviyenin altındasın. Eksikleri kapatmak için düzenli çalışman şart. Yukarıdan dersin videosunu seyredip yanlışlara bakman faydalı olacaktır.";
    } else if (p >= 60 && p < 90) {
      return "İyi bir seviye; dikkatini koruyup çalışmayı sürdürürsen daha yukarı çıkarsın. Yanlış yaptığın sorulara bakmayı ihmal etme.";
    } else if (p >= 90 && p <= 100) {
      return "Şampiyon sen harikasın ; çalışmanı bırakma, seviyeni sabitle , bu konuda gerçekten şahanesin.";
    }
    return "";
  }

  function ensureCard(){
    var sc = document.getElementById('score-container');
    if (!sc || getComputedStyle(sc).display === 'none') return null;
    var card = document.getElementById('teacher-advice-card');
    if (!card){
      card = document.createElement('div');
      card.id = 'teacher-advice-card';
      card.className = 'advice-card';
      card.innerHTML = '<div class="advice-title">ÖĞRETMENİNDEN TAVSİYE 😊</div><div class="advice-text" id="teacher-advice-text"></div>';
      var game = document.getElementById('single-player-game-screen');
      var summary = document.getElementById('nova-summary');
      if (game && summary && summary.classList.contains('nz-show')) {
        game.appendChild(card);
      } else if (sc) {
        sc.appendChild(card);
      }
    }
    return card;
  }

  function render(){
    var card = ensureCard();
    if (!card) return;
    var p = inferPercent();
    if (p == null) return;
    var text = document.getElementById('teacher-advice-text');
    if (text) text.textContent = getAdvice(p);
  }

  function boot(){
    render();
    setTimeout(render, 250);
  }

  try{
    if (typeof window.endGame === 'function' && !window.endGame.__adviceV5b){
      var orig = window.endGame;
      window.endGame = function(){
        var r = orig.apply(this, arguments);
        setTimeout(boot, 50);
        return r;
      };
      window.endGame.__adviceV5b = true;
    }
  }catch(e){}

})();

// === Nova Duel Result Decorator v2 ===
(function(){
  function launchConfetti(durationMs){
    if (window.__novaDuelNoConfetti) return;
    try{
      const old = document.getElementById('duel-confetti');
      if (old) old.remove();
      const c = document.createElement('canvas');
      c.id = 'duel-confetti';
      document.body.appendChild(c);
      const ctx = c.getContext('2d');
      let W= c.width = window.innerWidth, H = c.height = window.innerHeight;
      const pieces = Array.from({length: Math.min(220, Math.floor(W/6))}, (_,i)=> ({
        x: Math.random()*W, y: -20 - Math.random()*H*0.6,
        r: 4+Math.random()*6, // radius
        vx: -1+Math.random()*2, vy: 1+Math.random()*2.5 + 2,
        rot: Math.random()*Math.PI, vr: -0.1+Math.random()*0.2,
        s: Math.random()>.5?1:-1 // spin dir
      }));
      const colors = [[34,197,94],[16,185,129],[132,204,22],[250,204,21]];
      let rafId, start=performance.now();
      function loop(t){
        ctx.clearRect(0,0,W,H);
        for(const p of pieces){
          p.x += p.vx; p.y += p.vy; p.rot += p.vr;
          if (p.y - p.r > H){ p.y = -20; p.x = Math.random()*W; }
          const cidx = (p.r%colors.length)|0; const col = colors[cidx];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.9})`;
          ctx.fillRect(-p.r, -p.r*0.6, p.r*2, p.r*1.2);
          ctx.restore();
        }
        if (t - start < durationMs) rafId = requestAnimationFrame(loop);
        else { cancelAnimationFrame(rafId); c.remove(); }
      }
      rafId = requestAnimationFrame(loop);
      window.addEventListener('resize', ()=>{ W= c.width = innerWidth; H = c.height = innerHeight; });
    }catch(e){ console.warn('Confetti failed', e); }
  }

  window.novaDecorateDuelResult = function(outcome){
    try{
      const inviterBox = document.getElementById('duel-player-inviter-score');
      const invitedBox = document.getElementById('duel-player-invited-score');
      inviterBox && inviterBox.classList.remove('winner','loser','tie');
      invitedBox && invitedBox.classList.remove('winner','loser','tie');

      const root = document.getElementById('duel-game-screen');
      root && root.classList.remove('duel-final-theme-win','duel-final-theme-lose','duel-final-theme-tie');

      if (outcome === 'inviterWin'){
        inviterBox && inviterBox.classList.add('winner');
        invitedBox && invitedBox.classList.add('loser');
        root && root.classList.add('duel-final-theme-win');
        launchConfetti(3500);
      } else if (outcome === 'invitedWin'){
        invitedBox && invitedBox.classList.add('winner');
        inviterBox && inviterBox.classList.add('loser');
        root && root.classList.add('duel-final-theme-win');
        launchConfetti(3500);
      } else {
        inviterBox && inviterBox.classList.add('tie');
        invitedBox && invitedBox.classList.add('tie');
        root && root.classList.add('duel-final-theme-tie');
      }
    }catch(e){ console.warn(e); }
  };
})();
// === End Nova ===
