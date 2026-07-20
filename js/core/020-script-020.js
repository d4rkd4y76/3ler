// === Nova Audio Guard v1 ===
(function(){
  try{
    window.__novaAudios = window.__novaAudios || new Set();

    const _Audio = window.Audio;
    if (_Audio && !_Audio.__novaWrapped){
      const NovaAudio = function(...args){
        const inst = new _Audio(...args);
        try { window.__novaAudios.add(inst); } catch(_){}
        return inst;
      };
      NovaAudio.prototype = _Audio.prototype;
      Object.setPrototypeOf(NovaAudio, _Audio);
      window.Audio = NovaAudio;
      window.Audio.__novaWrapped = true;
    }

    // Track <audio> elements too
    function collectTagAudios(){
      document.querySelectorAll('audio').forEach(a=>{ try{ window.__novaAudios.add(a); }catch(_){} });
    }
    collectTagAudios();
    const obs = new MutationObserver(collectTagAudios);
    obs.observe(document.documentElement, {subtree:true, childList:true});

    window.stopAllGameAudio = function(){
      collectTagAudios();
      (window.__novaAudios ? Array.from(window.__novaAudios) : []).forEach(a=>{
        try{ a.pause(); a.currentTime = 0; }catch(_){}
      });
    };

    // When single player "score-container" is shown, stop audio
    function installResultObserver(){
      const target = document.querySelector('.single-player-game-container') || document.body;
      const mo = new MutationObserver(()=>{
        document.querySelectorAll('.score-container').forEach(el=>{
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && el.offsetParent !== null){
            window.stopAllGameAudio();
          }
        });
      });
      mo.observe(target, {subtree:true, attributes:true, attributeFilter:['style','class'], childList:true});
    }
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', installResultObserver);
    } else {
      installResultObserver();
    }
  }catch(e){ console.warn('Nova Audio Guard init error', e); }
})();
// === End Nova Audio Guard v1 ===
