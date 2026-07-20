(function(){
  function getDb(){ try{ if (window.database && database.ref) return database; }catch(_){}
                   try{ if (window.firebase && firebase.database) return firebase.database(); }catch(_){}
                   return null; }
  function sid(){ try{ return selectedStudent && selectedStudent.studentId; }catch(_){ return null; } }
  function writeSession(d, s){
    try{
      var sessId = localStorage.getItem('novaSessId');
      if(!sessId){ sessId = Math.random().toString(36).slice(2); localStorage.setItem('novaSessId', sessId); }
      if(!localStorage.getItem('novaSessStarted_'+sessId)){
        d.ref('analytics/sessions/'+s+'/'+sessId).set({ startedAt: Date.now(), userAgent: navigator.userAgent||'' });
        localStorage.setItem('novaSessStarted_'+sessId,'1');
        window.addEventListener('beforeunload', function(){ try{ d.ref('analytics/sessions/'+s+'/'+sessId).update({ endedAt: Date.now() }); }catch(_){}});
      }
    }catch(_){}
  }
  function logDuel(d, s, won, opp){
    const base = d.ref('analytics/duels/'+s);
    base.child('played').transaction(c => (c||0)+1);
    (won ? base.child('wins') : base.child('losses')).transaction(c => (c||0)+1);
    base.child('last').set({ at: Date.now(), winner: (won ? s : (opp||null)), loser: (won ? (opp||null) : s) });
  }
  // run once when available
  var iv = setInterval(function(){
    var d=getDb(), s=sid();
    if(!d||!s) return;
    clearInterval(iv);
    writeSession(d,s);

    if (typeof window.updateDuelScore === 'function' && !window.__novaPatchedUpdateDuelScore){
      const orig = window.updateDuelScore;
      window.updateDuelScore = async function(type, data){
        const res = await orig.apply(this, arguments);
        try{
          const d2=getDb(), s2=sid(); if(!d2||!s2) return res;
          let meWon = null, opp = null;
          if (type === 'GAME_END'){
            meWon = (data && data.winnerId === s2) ? true : (data && data.loserId === s2) ? false : null;
            opp = (data && (data.winnerId === s2 ? data.loserId : data.winnerId)) || null;
          } else if (type === 'TIME_OUT'){
            meWon = (data && data.invitedId === s2) ? true : (data && data.inviterId === s2) ? false : null;
            opp = (data && (data.invitedId === s2 ? data.inviterId : data.invitedId)) || null;
          } else if (type === 'DISCONNECTED'){
            const leftId = data && (data.leftStudentId || data.leftId || data.disconnectedStudentId);
            if (leftId){ meWon = (leftId !== s2); opp = leftId; }
          }
          if (meWon !== null){ logDuel(d2, s2, meWon, opp); }
        }catch(e){ console.warn('nova duel hook fail', e); }
        return res;
      };
      window.__novaPatchedUpdateDuelScore = true;
    }
  }, 400);
})();
