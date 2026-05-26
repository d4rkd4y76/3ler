// === Nova: Single-player Explanation Feature (v2) ===
function escapeHTML(str){
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function getTextIfNotUrl(s){
  if(!s || typeof s !== 'string') return '';
  if(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)$/i.test(s)) return '';
  return s;
}
function showExplanationAndNext(){
  try{
    const currentQuestion = gameQuestions[currentQuestionIndex];
    const expl = document.getElementById('explanation-container');
    if(!expl){ proceedToNextQuestion(); return; }
    const isLast = Array.isArray(gameQuestions) && (currentQuestionIndex >= (gameQuestions.length - 1));
    const correctText = currentQuestion && currentQuestion.correct ? String(currentQuestion.correct) : '';
    const maybeExplanation = getTextIfNotUrl(currentQuestion && (currentQuestion.explanation || currentQuestion.aciklama || currentQuestion["açıklama"] || currentQuestion.info));
    expl.innerHTML = `
      <div class="explanation-card">
        <div class="explanation-title">Açıklama</div>
        <div class="explanation-correct">✅ <strong>Doğru Cevap:</strong> ${escapeHTML(correctText)}</div>
        ${maybeExplanation ? `<div class="explanation-text">${escapeHTML(maybeExplanation)}</div>` : ``}
        <button id="next-question-button" class="next-question-button">${isLast ? 'Sonuçları Gör' : 'Sonraki Soru'}</button>
      </div>`;
    expl.style.display = 'block';
    const nxt = document.getElementById('next-question-button');
    if(nxt){
      nxt.onclick = function(){
        try{ nxt.disabled = true; }catch(_){}
        expl.style.display='none';
        expl.innerHTML='';
        try{
          if (isLast){
            setTimeout(function(){
              try { proceedToNextQuestion(); }
              catch (e1) {
                console.error('Son soru sonuç geçişi', e1);
                try {
                  if (typeof window.endGame === 'function') window.endGame();
                  else if (typeof endGame === 'function') endGame();
                } catch (e2) { console.error('endGame', e2); }
              }
            }, 0);
          } else {
            proceedToNextQuestion();
          }
        }catch(_){
          try{ proceedToNextQuestion(); }catch(__){}
        }
      };
    }
  }catch(e){
    console.error('showExplanationAndNext error', e);
    proceedToNextQuestion();
  }
}
