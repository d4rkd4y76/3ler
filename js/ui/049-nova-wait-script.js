(function(){
  if (window.__novaWaitInstalled) return; window.__novaWaitInstalled = true;
  const ov = ()=> document.getElementById('duel-wait-overlay');
  window.showWaitOverlay = function(){ try{ const el = ov(); if(el) el.style.display = 'flex'; }catch(e){ console.warn(e);} };
  window.hideWaitOverlay = function(){ try{ const el = ov(); if(el) el.style.display = 'none'; }catch(e){ console.warn(e);} };
  window.addEventListener('nova:duelIntroDone', ()=>{ setTimeout(()=>hideWaitOverlay(), 400); }, { once:false });

  function watchGameScreen(){
    var gs = document.getElementById('duel-game-screen');
    if (!gs) return;
    var hideIfPlaying = function(){
      try{
        var st = window.getComputedStyle(gs);
        if (st.display !== 'none' && st.visibility !== 'hidden') hideWaitOverlay();
      }catch(_){}
    };
    var obs = new MutationObserver(hideIfPlaying);
    obs.observe(gs, { attributes: true, attributeFilter: ['style', 'class'] });
    hideIfPlaying();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchGameScreen);
  else watchGameScreen();
})();
