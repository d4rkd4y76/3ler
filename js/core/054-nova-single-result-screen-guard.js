(function(){
  function isVisible(el){
    if(!el) return false;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return false;
    if(el.offsetParent === null && cs.position !== 'fixed') return false;
    return true;
  }
  function enforce(){
    const main = document.getElementById('main-screen');
    const game = document.getElementById('single-player-game-screen');
    const score = document.getElementById('score-container');
    if(!main || !game || !score) return;
    const resultOpen = isVisible(game) && isVisible(score);
    if(resultOpen){
      if(main.style.display !== 'none') main.style.display = 'none';
    }
  }
  function boot(){
    const score = document.getElementById('score-container');
    const game = document.getElementById('single-player-game-screen');
    const main = document.getElementById('main-screen');
    if(score){
      const o1 = new MutationObserver(enforce);
      o1.observe(score, {attributes:true, attributeFilter:['style','class']});
    }
    if(game){
      const o2 = new MutationObserver(enforce);
      o2.observe(game, {attributes:true, attributeFilter:['style','class']});
    }
    if(main){
      const o3 = new MutationObserver(enforce);
      o3.observe(main, {attributes:true, attributeFilter:['style','class']});
    }
    window.addEventListener('load', enforce);
    document.addEventListener('visibilitychange', enforce);
    // NOTE: interval kaldırıldı (gereksiz ve bazı cihazlarda pahalı).
    setTimeout(enforce, 0);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
