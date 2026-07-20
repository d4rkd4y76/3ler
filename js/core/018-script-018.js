(function(){
  function db(){ try{ if (window.database && database.ref) return database; }catch(_){}
                 try{ if (window.firebase && firebase.database) return firebase.database(); }catch(_){}
                 return null; }
  function sid(){
    try{
      if (typeof selectedStudent !== 'undefined' && selectedStudent && selectedStudent.studentId) return selectedStudent.studentId;
    }catch(_){}
    try{
      if (window.selectedStudent && window.selectedStudent.studentId) return window.selectedStudent.studentId;
    }catch(_){}
    try{
      const raw = localStorage.getItem('selectedStudent');
      if(raw){
        const s = JSON.parse(raw);
        if(s && s.studentId) return s.studentId;
      }
    }catch(_){}
    return null;
  }
  async function pushTopicPerf(topic, total, wrong){
    try{
      const d=db(), s=sid(); if(!d||!s) return;
      const rec = { at: Date.now(), topic: topic||'-', total: Number(total||0), wrong: Number(wrong||0) };
      const refBase = d.ref('analytics/topicPerf/'+s);
      const key = (await refBase.push(rec)).key;
      refBase.orderByChild('at').limitToLast(26).once('value').then(snap=>{
        try{
          const list = [];
          snap.forEach(ch => list.push({k: ch.key, at: ch.val()?.at || 0}));
          list.sort((a,b)=>a.at-b.at);
          while(list.length>25){
            const del = list.shift();
            d.ref('analytics/topicPerf/'+s+'/'+del.k).remove();
          }
        }catch(_){}
      });
    }catch(e){ console.warn('topic perf write fail', e); }
  }
  window.novaLogTopicPerf = function(topicKey, totalAsked, correctCount){
    try{
      const total = Number(totalAsked||0), correct = Number(correctCount||0);
      const wrong = Math.max(0, total - correct);
      if (total > 0) pushTopicPerf(topicKey||'-', total, wrong);
    }catch(_){}
  };
  var iv = setInterval(function(){
    if (typeof window.updateDuelScore !== 'function') return;
    clearInterval(iv);
    const orig = window.updateDuelScore;
    window.updateDuelScore = async function(type, data){
      const res = await orig.apply(this, arguments);
      try{
        const topic = data?.topicKey || data?.topicName || data?.topic || data?.lessonTopic || null;
        let total = data?.totalQuestions ?? data?.questionCount ?? data?.stats?.asked ?? null;
        let correct = data?.correct ?? data?.correctCount ?? data?.stats?.correct ?? null;
        if ((total!=null && correct!=null) && Number(total) > 0){
          const wrong = Math.max(0, Number(total)-Number(correct));
          pushTopicPerf(topic, total, wrong);
        }
      }catch(_){}
      return res;
    };
  }, 300);
})();
