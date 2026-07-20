(function(){
  if (window.__novaImageCapInstalledV3) return;
  window.__novaImageCapInstalledV3 = true;

  function capImage(img){
    try{
      if (!img || !img.naturalWidth || img.classList.contains('nz-info-img')) return;
      // Baseline = min(natural, 250px); cap = 2× baseline
      var baseW = Math.min(img.naturalWidth, 250);
      var baseH = Math.min(img.naturalHeight, 250);
      var maxW = baseW * 2;
      var maxH = baseH * 2;

      // Also respect viewport (keep fully visible)
      var vpW = Math.floor(window.innerWidth * 0.95);
      var vpH = Math.floor(window.innerHeight * 0.75);

      // If inside a question container, don't exceed its width too much
      var container = img.closest('.question-container');
      var cw = container ? Math.max(1, container.clientWidth) : vpW;

      img.style.width = 'auto';
      img.style.height = 'auto';
      img.style.maxWidth  = Math.min(maxW, cw, vpW) + 'px';
      img.style.maxHeight = Math.min(maxH, vpH) + 'px';
      img.style.objectFit = 'contain';
      // center (safety)
      img.style.display = 'block';
      img.style.marginLeft = 'auto';
      img.style.marginRight = 'auto';
    }catch(_){}
  }

  function hook(img){
    if (!img) return;
    if (img.complete && img.naturalWidth) {
      capImage(img);
    } else {
      img.addEventListener('load', function onload(){
        img.removeEventListener('load', onload);
        capImage(img);
      });
    }
  }

  function scan(){
    var sel = '#question-image, .question-image, #duel-question-image, .duel-question-image, .question-media img, .question-info-image';
    document.querySelectorAll(sel).forEach(hook);
  }

  // Observe DOM changes (questions change dynamically)
  var scanTimer = null;
  function scheduleScan(){
    if (scanTimer) return;
    scanTimer = setTimeout(function(){
      scanTimer = null;
      scan();
    }, 120);
  }

  function getObserveRoot(){
    return document.querySelector('.question-container')
      || document.getElementById('single-player-game-screen')
      || document.body;
  }

  // NOTE: body subtree observer bazı cihazlarda hâlâ ağır olabiliyor.
  // Önce soru alanını izlemeyi dene.
  var mo = new MutationObserver(scheduleScan);
  try{
    mo.observe(getObserveRoot(), { childList:true, subtree:true });
  }catch(_){
    mo.observe(document.body, { childList:true, subtree:true });
  }
  window.addEventListener('resize', scan, { passive:true });

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', scan, { once:true });
  } else {
    scan();
  }
})();
