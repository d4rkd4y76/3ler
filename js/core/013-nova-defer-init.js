(function(){
  var idle = window.requestIdleCallback || function(cb){ return setTimeout(cb,0); };
  idle(function(){});
  // Prevent audio fetching until first user gesture
  function primeAudio(){
    ['duelBackgroundMusic','winnerMusic','singlePlayerQuestionMusic'].forEach(function(id){
      var el = document.getElementById(id);
      if(el){ try{ el.load(); }catch(e){} }
    });
    document.removeEventListener('click', primeAudio);
    document.removeEventListener('touchstart', primeAudio);
  }
  document.addEventListener('click', primeAudio, {once:true});
  document.addEventListener('touchstart', primeAudio, {once:true});
})();
