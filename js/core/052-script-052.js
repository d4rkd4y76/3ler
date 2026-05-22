(function(){
  function hardBack(){
    try{
      // stop all music if function exists
      if (typeof stopAllMusic === 'function') stopAllMusic();
    }catch(_){}
    try{
      var singlePlayerGameScreen = document.getElementById('single-player-game-screen');
      var mainScreen = document.getElementById('main-screen');
      var scoreContainer = document.getElementById('score-container');
      if (scoreContainer) scoreContainer.style.display='none';
      if (typeof window.novaCloseSinglePlayerGameScreen === 'function') {
        window.novaCloseSinglePlayerGameScreen();
      } else {
        if (singlePlayerGameScreen) singlePlayerGameScreen.style.display='none';
        if (mainScreen) mainScreen.style.removeProperty('display');
      }
      try{ if (window.novaSyncPerfRuntime) window.novaSyncPerfRuntime(); }catch(_){}
      if (typeof resetGameScreens === 'function') resetGameScreens();
    }catch(_){}
  }

  var backBtn = document.getElementById('result-back-btn');
  if (backBtn && !backBtn.dataset.hardbound){
    backBtn.dataset.hardbound='1';
    backBtn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      // Try the native final-back-button first (if visible)
      var endBtn = document.getElementById('final-back-button');
      if (endBtn && getComputedStyle(endBtn).display!=='none') {
        endBtn.click();
        setTimeout(hardBack, 20); // ensure consistency
      } else {
        hardBack();
      }
    }, true);
  }
})();
