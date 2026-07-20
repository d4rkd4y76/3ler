(function(){
  try{
    var container = document.querySelector('.duel-selection-container');
    if(!container) return;
    // VS badge
    if(!container.querySelector('.nova-vs-badge')){
      var vs = document.createElement('div');
      vs.className = 'nova-vs-badge';
      container.appendChild(vs);
    }
    // Corner orbs (behind UI)
    if(!container.querySelector('.nova-corner-orb.a')){
      var oa = document.createElement('div'); oa.className = 'nova-corner-orb a';
      var ob = document.createElement('div'); ob.className = 'nova-corner-orb b';
      container.appendChild(oa); container.appendChild(ob);
    }
  }catch(e){ /* silent */ }
})();
