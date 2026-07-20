(function(){
  function ensureBackWiring(){
    var btn = document.getElementById('result-back-btn');
    if(!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function(){
      // Try to simulate "Tek Kişilik Oyun" button click
      try {
        var single = document.querySelector('.single-player');
        if (single) { single.click(); return; }
      } catch(e){}
      // Fallback: navigate to main screen if app exposes api
      try { window.dispatchEvent(new CustomEvent('nova:go-single')); } catch(_) {}
    });
  }

  function toggleBackByScore(){
    var sc = document.querySelector('.score-container, #score-container');
    var backBtn = document.getElementById('result-back-btn');
    if(!backBtn) return;
    var visible = sc && ((getComputedStyle(sc).display!=='none' && sc.offsetParent!==null) || sc.classList.contains('show') || sc.classList.contains('active'));
    backBtn.style.display = visible ? 'inline-flex' : 'none';
  }

  // Observe score container if MutationObserver wasn't already wired elsewhere
  var sc = document.querySelector('.score-container, #score-container');
  if (sc && typeof MutationObserver !== 'undefined'){
    var obs = new MutationObserver(toggleBackByScore);
    obs.observe(sc, {attributes:true, attributeFilter:['style','class']});
  }

  // Initial
  document.addEventListener('DOMContentLoaded', function(){
    ensureBackWiring();
    toggleBackByScore();
  });
  window.addEventListener('load', function(){
    ensureBackWiring();
    toggleBackByScore();
  });
})();
