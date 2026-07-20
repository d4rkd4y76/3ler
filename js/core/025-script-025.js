(function(){
  // Extend findQuestionText to include stem/öncül
  function _getText(el){ return (el && (el.innerText||el.textContent)||'').trim(); }
  window.__novaFindQuestionText = function(){
    const root = document.querySelector('.question-container, #question-container, .soru-container, .quiz-question, .game-question, .question-area, .questionWrap, .question-wrapper') || document;
    const qSelectors = [
      '.question-text', '.question-title', '.question', '#question', '#question-text',
      '.soru-text', '.soruMetni', '.soru', '.prompt', '.quiz-question h2', '.quiz-question h3'
    ];
    const stemSelectors = [
      '.question-stem', '.question-preamble', '.question-desc', '.stem', '.preamble',
      '.oncul', '.öncül', '.soru-oncul', '.soru-öncül', '.kok', '.kök', '.soru-koku', '.soru-kök'
    ];
    let stem='';
    for(const sel of stemSelectors){
      const el = root.querySelector(sel);
      if(el && _getText(el).length>3){ stem = _getText(el); break; }
    }
    let q='';
    for(const sel of qSelectors){
      const el = root.querySelector(sel);
      if(el && _getText(el).length>5){ q=_getText(el); break; }
    }
    if(!q){
      // Fallback longest text (excluding options)
      const options = new Set(Array.from(root.querySelectorAll('.options, .choices, .answers, .option, .option-button, button, .answer-option, .choice, .secenek')));
      function isInsideOptions(node){ let p=node; while(p){ if(options.has(p)) return true; p=p.parentNode; } return false; }
      let longest=''; const walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      while(walker.nextNode()){
        const txt=(walker.currentNode.nodeValue||'').trim();
        if(txt.length>8 && txt.length<400 && !isInsideOptions(walker.currentNode.parentNode)){ if(txt.length>longest.length) longest=txt; }
      }
      q = longest;
    }
    return (stem ? (stem + ' — ' + q) : q) || 'Soru metni bulunamadı';
  };

  // Use safer canvas size based on container width
  function _sizeGauge(){
    const cvs=document.getElementById('nzGauge');
    if(!cvs) return;
    const box=cvs.parentElement;
    const w=Math.min(480, Math.max(260, Math.floor(box.clientWidth*0.9)));
    cvs.width=w; cvs.height=w;
  }
  window.addEventListener('resize', _sizeGauge);

  // Patch tracker to call new finder and resizer
  const oldInit = window.addEventListener;
  window.addEventListener = function(type, listener, opts){
    if(type==='DOMContentLoaded'){
      const wrapped = function(e){
        try{ _sizeGauge(); }catch(_){}
        return listener && listener(e);
      };
      return oldInit.call(window, type, wrapped, opts);
    }
    return oldInit.call(window, type, listener, opts);
  };

  // Monkey-patch global NovaTracker if exists to use new finder
  const patchInterval = setInterval(()=>{
    try{
      if(typeof window.NovaTracker!=='undefined' && window.NovaTracker._useNewFinder!==true){
        const NT = window.NovaTracker;
        const orig = NT;
        // Replace only the text finder via closure trick
        document.addEventListener('click', function(e){
          const btn = e.target.closest('.option-button, .answer-option, .option, .choice');
          if(!btn) return;
          setTimeout(()=>{
            try{
              const qText = window.__novaFindQuestionText();
              // We won't duplicate; original listener already pushes item.
              // This is just to ensure when original fails; we could store last question globally
              window.__novaLastQuestion = qText;
            }catch(_){}
          }, 150);
        }, true);
        NT._useNewFinder = true;
        clearInterval(patchInterval);
      }
    }catch(_){}
  }, 200);
})();
