(function(){
  function byId(id){ return document.getElementById(id); }
  const mm = byId('matchmakingScreen');
  if (mm && !mm.classList.contains('nova-duel-arena')){
    mm.classList.add('nova-duel-arena');
  }
  // Ensure content card has proper class (not strictly necessary but future-proof)
  try{
    const card = mm.querySelector('.matchmaking-content');
    if (card) card.classList.add('nova-matchmaking-card');
  }catch(_){}
  // ESC to cancel
  document.addEventListener('keydown', function(ev){
    if (ev.key === 'Escape'){
      const mm = byId('matchmakingScreen');
      if (mm && getComputedStyle(mm).display !== 'none'){
        const btn = byId('cancelSearchButton');
        if (btn) btn.click();
      }
    }
  });
})();
