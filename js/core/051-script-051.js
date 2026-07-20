(function(){
  // Nova fix v2: back button should only appear on result screen and
  // should behave like the in-result "Geri Dön" (id=final-back-button).
  function isVisible(el){
    if(!el) return false;
    const cs = getComputedStyle(el);
    if(cs.visibility==='hidden' || cs.display==='none') return false;
    if(el.offsetParent===null && cs.position!=='fixed') return false;
    return true;
  }

  function toggleBackStrict(){
    var sc = document.getElementById('score-container');
    var endBtn = document.getElementById('final-back-button');
    var backBtn = document.getElementById('result-back-btn');
    if(!backBtn) return;
    var show = isVisible(sc);
    backBtn.style.display = show ? 'inline-flex' : 'none';
  }

  function wireBackStrict(){
    var backBtn = document.getElementById('result-back-btn');
    if(!backBtn || backBtn.dataset.wired2) return;
    backBtn.dataset.wired2='1';
    backBtn.addEventListener('click', function(){
      var endBtn = document.getElementById('final-back-button');
      if(endBtn && isVisible(endBtn)){
        endBtn.click(); // this replaces the result panel in-place
        return;
      }
      // Fallbacks
      var singleNav = document.querySelector('.single-player');
      if(singleNav){ singleNav.click(); }
    });
  }

  // Observe only result container changes (avoid global observer loops)
  var scRoot = document.getElementById('score-container');
  if (scRoot){
    var mo = new MutationObserver(function(){ toggleBackStrict(); });
    mo.observe(scRoot, {attributes:true, attributeFilter:['style','class'], childList:true, subtree:true});
  }

  document.addEventListener('DOMContentLoaded', function(){
    wireBackStrict(); toggleBackStrict();
  });
  window.addEventListener('load', function(){
    wireBackStrict(); toggleBackStrict();
  });
})();
