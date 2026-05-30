(function(){
  // Helper: once dom ready
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    const $ = s=>document.querySelector(s);
    const $$ = s=>Array.from(document.querySelectorAll(s));
    const gameScreen = $('#duel-game-screen');
    const perfMode = (window.__novaPerfMode || 'normal');
    const lowFxMode = !!(perfMode !== 'normal' || (navigator && navigator.deviceMemory && navigator.deviceMemory <= 4) || window.matchMedia('(pointer: coarse)').matches);
    const isDuelGameVisible = () => {
      if (!gameScreen) return false;
      const cs = window.getComputedStyle(gameScreen);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };

    // Topbar add (non-breaking)
    function ensureTopbar(){
      if(!gameScreen) return;
      if($('#nova-duel-topbar')) return;
      const top = document.createElement('div');
      top.className = 'duel-topbar';
      top.id = 'nova-duel-topbar';
      top.innerHTML = '<div class="duel-topbar-inner">        <div class="pname" id="tb-left">-</div>        <div class="vs">⚔️</div>        <div class="pname" id="tb-right">-</div>      </div>';
      gameScreen.prepend(top);
      top.style.display = 'block';
    }

    // Intro overlay create once
    function ensureIntro(){
      if($('#nova-duel-intro')) return $('#nova-duel-intro');
      const ov = document.createElement('div');
      ov.className = 'duel-intro-overlay';
      ov.id = 'nova-duel-intro';
      ov.innerHTML = `
       <div class="duel-intro-stage">
        <div class="duel-countdown">DÜELLO BAŞLIYOR: <span class="count-num" id="introCount">3</span></div>
        <svg class="swords" viewBox="0 0 512 512" aria-hidden="true">
          <path d="M352 16l-64 64 32 32 64-64-32-32zm-96 96L80 288l-32 96 96-32 176-176-64-64zM96 368l48-16-32-32-16 48zm224-144l64 64 128-128-64-64-128 128z" fill="#f5f5f5"/>
          <path d="M184 296l32 32 16-16-32-32-16 16z" fill="#e5e7eb"/>
        </svg>
        <div class="duel-side left">
          <img class="duel-intro-photo" id="introLPhoto" src=""/>
          <div class="duel-intro-name" id="introLName">Oyuncu 1</div>
        </div>
        <div class="duel-side right">
          <img class="duel-intro-photo" id="introRPhoto" src=""/>
          <div class="duel-intro-name" id="introRName">Oyuncu 2</div>
        </div>
        <div class="duel-vs-wrap"><div class="duel-vs-badge">VS</div></div>
       </div>`;
      document.body.appendChild(ov);
      return ov;
    }

    // Mutation observer: when duel screen becomes visible -> run intro once
    let introPlayedThisRound = false;
    async function playIntroIfNeeded(){
      if(introPlayedThisRound) return;
      if(window.__novaSkipDuelIntro032) {
        introPlayedThisRound = true;
        return;
      }
      if(!gameScreen) return;
      const visible = window.getComputedStyle(gameScreen).display !== 'none';
      if(!visible) return;

      ensureTopbar(); const ov = ensureIntro(); // Pull names/photos from existing DOM (fallback safe)
      const lNameEl = $('#duel-player-inviter-name') || $('#duel-inviter-name');
      const rNameEl = $('#duel-player-invited-name') || $('#duel-invited-name');
      const lName = ((lNameEl && (lNameEl.dataset.playerNameRaw || lNameEl.textContent)) || 'Oyuncu 1').trim();
      const rName = ((rNameEl && (rNameEl.dataset.playerNameRaw || rNameEl.textContent)) || 'Oyuncu 2').trim();
      const lFrame = (lNameEl && lNameEl.dataset && lNameEl.dataset.nameFrame) ? lNameEl.dataset.nameFrame : 'default';
      const rFrame = (rNameEl && rNameEl.dataset && rNameEl.dataset.nameFrame) ? rNameEl.dataset.nameFrame : 'default';
      const lPhoto = ($('#duel-player-inviter-photo') || $('#duel-inviter-photo'))?.getAttribute('src') || '';
      const rPhoto = ($('#duel-player-invited-photo') || $('#duel-invited-photo'))?.getAttribute('src') || '';
      const lFrameSrc = ($('#duel-player-inviter-photo') || $('#duel-inviter-photo'));
      const rFrameSrc = ($('#duel-player-invited-photo') || $('#duel-invited-photo'));
      const lAvatarFrame = (lFrameSrc && lFrameSrc.dataset && lFrameSrc.dataset.avatarFrame) ? lFrameSrc.dataset.avatarFrame : 'default';
      const rAvatarFrame = (rFrameSrc && rFrameSrc.dataset && rFrameSrc.dataset.avatarFrame) ? rFrameSrc.dataset.avatarFrame : 'default';

      setNameWithFrame($('#introLName'), lName || 'Oyuncu 1', lFrame);
      setNameWithFrame($('#introRName'), rName || 'Oyuncu 2', rFrame);
      if(lPhoto) $('#introLPhoto').src = lPhoto;
      if(rPhoto) $('#introRPhoto').src = rPhoto;
      try{
        applyAvatarFrameToImage($('#introLPhoto'), lAvatarFrame);
        applyAvatarFrameToImage($('#introRPhoto'), rAvatarFrame);
      }catch(_){}
      setNameWithFrame($('#tb-left'), lName || 'Oyuncu 1', lFrame);
      setNameWithFrame($('#tb-right'), rName || 'Oyuncu 2', rFrame);

      ov.style.display = 'flex';
      try{hideWaitOverlay();}catch(e){}; // countdown 3-2-1
      const cnt = $('#introCount');
      let n = 3;
      const tick = setInterval(()=>{
        n -= 1;
        if(n<=0){
          clearInterval(tick);
          // dismiss overlay and start
          ov.classList.add('dismissed');
          ov.style.display = 'none'; try{hideWaitOverlay();}catch(e){};
          introPlayedThisRound = true;
          animateQuestionNow();
        } else {
          cnt.textContent = String(n);
          cnt.classList.remove('count-num'); void cnt.offsetWidth; cnt.classList.add('count-num');
        }
      }, 800);
    }

    // Observe gameScreen display change
    if(gameScreen){
      const obs = new MutationObserver(()=>playIntroIfNeeded());
      obs.observe(gameScreen, { attributes:true, attributeFilter:['style','class'] });
      // Also run on initial
      setTimeout(playIntroIfNeeded, 300);
    }

    // Animate question when text changes
    let __qAnimQueued = false;
    function animateQuestionNow(){
      if (__qAnimQueued) return;
      __qAnimQueued = true;
      requestAnimationFrame(() => {
        __qAnimQueued = false;
        if (!isDuelGameVisible()) return;
        const qc = $('#duel-game-screen .question-container');
        if(qc){ qc.classList.remove('duel-animate'); void qc.offsetWidth; qc.classList.add('duel-animate'); }

        // add subtle ring on options
        $$('#duel-options-container .option-button').forEach(btn=>{
          if(!btn.querySelector('.ring')){
            const r = document.createElement('span'); r.className='ring'; btn.appendChild(r);
          }
        });
      });
    }

    const qText = $('#duel-question-text');
    if(qText){
      const mo = new MutationObserver(()=>animateQuestionNow());
      mo.observe(qText, { childList:true, subtree:true });
    }

    // Enhance click feedback without breaking existing logic
    document.addEventListener('click', function(e){
      const t = e.target.closest('.option-button');
      if(!t || !isDuelGameVisible()) return;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // particles
      const particleCount = lowFxMode ? 6 : 12;
      for(let i=0;i<particleCount;i++){
        const p = document.createElement('div');
        p.className='tap-pop';
        document.body.appendChild(p);
        const x = (e.clientX||0), y=(e.clientY||0);
        const ang = Math.random()*Math.PI*2, dist = 40+Math.random()*60;
        const tx = Math.cos(ang)*dist, ty = Math.sin(ang)*dist;
        const dur = 450 + Math.random()*400;
        p.style.left = (x-4)+'px'; p.style.top = (y-4)+'px';
        p.animate([
          { transform:`translate(0,0) scale(1)`, opacity:1 },
          { transform:`translate(${tx}px,${ty}px) scale(.6)`, opacity:0 }
        ], { duration: dur, easing:'cubic-bezier(.22,.61,.36,1)' }).onfinish = ()=>p.remove();
      }
    }, true);

    // Winner confetti when final container shows
    const finalC = $('#duel-final-container');
    function spawnConfetti(){
      const confettiCount = lowFxMode ? 60 : 120;
      for(let i=0;i<confettiCount;i++){
        const c = document.createElement('div');
        c.className='confetti';
        const hue = Math.floor(Math.random()*360);
        c.style.background = `hsl(${hue} 80% 55%)`;
        c.style.left = Math.floor(Math.random()*100)+'vw';
        c.style.setProperty('--tx', (Math.random()*60-30)+'vw');
        c.style.setProperty('--rot', (Math.random()*720-360)+'deg');
        c.style.setProperty('--dur', (1200+Math.random()*2200)+'ms');
        document.body.appendChild(c);
        setTimeout(()=>c.remove(), 4000);
      }
    }
    if(finalC){
      let __finalVisible = false;
      const fo = new MutationObserver(()=>{
        const visible = window.getComputedStyle(finalC).display !== 'none';
        if(visible && !__finalVisible){
          var dg = document.getElementById('duel-game-screen');
          if (dg && dg.classList.contains('ndg-duel-finished')) { __finalVisible = visible; return; }
          spawnConfetti();
        }
        __finalVisible = visible;
      });
      fo.observe(finalC, { attributes:true, attributeFilter:['style','class'] });
    }

    // Public API for your code (optional, safe no-op if unused)
    window.NovaDuelFX = {
      resetRound:function(){ introPlayedThisRound=false; },
      playIntroNow: function(){ playIntroIfNeeded(); },
      animateQuestion: function(){ animateQuestionNow(); }
    };
  });
})();
