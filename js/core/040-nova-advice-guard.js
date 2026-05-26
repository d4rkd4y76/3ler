(function(){
  if (window.__novaAdviceGuardInstalledV2) return;
  window.__novaAdviceGuardInstalledV2 = true;

  var enforceTimer = null;

  function isVisible(el){
    if(!el) return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    if ((el.offsetWidth|0) === 0 && (el.offsetHeight|0) === 0) return false;
    return true;
  }

  function resultVisible(){
    var sc = document.getElementById('score-container') ||
             document.querySelector('.score-container, .result-screen, #resultScreen');
    return isVisible(sc);
  }

  function hideAdvice(){
    try{
      var byId = document.getElementById('teacher-advice-card');
      if (byId) byId.remove();
      document.querySelectorAll('.teacher-advice-card').forEach(function(el){ el.remove(); });
    }catch(e){}
  }

  function enforce(){
    if (!resultVisible()) hideAdvice();
  }

  function scheduleEnforce(){
    if (enforceTimer) return;
    enforceTimer = setTimeout(function(){
      enforceTimer = null;
      enforce();
    }, 150);
  }

  function observeRoots(){
    // Sadece sonuç konteyneri — document.body + subtree her DOM değişiminde
    // tarayıcıyı kilitleyebiliyordu.
    var sc = document.getElementById('score-container');
    if (!sc) return;
    try{
      var obs = new MutationObserver(scheduleEnforce);
      obs.observe(sc, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true
      });
    }catch(_){}
  }

  function hook(name){
    try{
      var fn = window[name];
      if (typeof fn === 'function' && !fn.__novaAdviceV2){
        var orig = fn;
        window[name] = function(){
          var r = orig.apply(this, arguments);
          scheduleEnforce();
          return r;
        };
        window[name].__novaAdviceV2 = true;
      }
    }catch(_){}
  }

  function boot(){
    enforce();
    observeRoots();
    [
      'displayCurrentQuestion','proceedToNextQuestion','startNow','startTimer','findStartButton',
      'startGame','startSinglePlayer','startCountdown','startDuelGame','endGame','showResults'
    ].forEach(hook);

    document.addEventListener('click', function(e){
      var t = e.target;
      if (t && (t.closest ? t.closest('.option-button, .option-btn, .answer-button, .next-question-button, .question-container, #start-game-button') : null)){
        scheduleEnforce();
      }
    }, true);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
