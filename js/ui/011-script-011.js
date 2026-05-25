function safeShowAlert(msg){
  try{
    if (typeof showAlert === 'function') { showAlert(msg); }
    else { window.alert(msg); }
  }catch(e){ try{ window.alert(msg); }catch(_){} }
}

function updateExchangePreview(){
  try{
    const typeEl = document.getElementById('exchange-type-select');
    const qtyEl = document.getElementById('exchange-count-input');
    const costEl = document.getElementById('exchange-preview-cost');
    const gainEl = document.getElementById('exchange-preview-gain');
    if (!costEl || !gainEl) return;
    const type = (typeEl && typeEl.value) ? typeEl.value : 'diamond_to_cup';
    let qty = parseInt(qtyEl && qtyEl.value ? qtyEl.value : '1', 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    const cost = qty * 100;
    const gain = type === 'diamond_to_cup' ? (qty * 5) + ' 🏆' : (qty * 30) + ' düello kredisi';
    costEl.textContent = cost + ' 💎';
    gainEl.textContent = gain;
  }catch(e){ console.warn('updateExchangePreview', e); }
}

function openDiamondExchangeModal(){
  try{
    const m = document.getElementById('diamondExchangeModal');
    if(!m){ safeShowAlert('Takas penceresi yüklenemedi.'); return; }
    m.style.display = 'flex';
    m.setAttribute('aria-hidden', 'false');
    refreshExchangeModalStats();
    updateExchangePreview();
  }catch(e){ console.error(e); }
}
function closeDiamondExchangeModal(){
  const m = document.getElementById('diamondExchangeModal');
  if(m){
    m.style.display = 'none';
    m.setAttribute('aria-hidden', 'true');
  }
}

const DIAMOND_EXCHANGE_DAILY_ADET_LIMIT = 3;
function __exchangeLocalDayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function __parseStudentNumber(v){
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function __getDiamondExchangeUsedToday(obj, todayKey){
  const ex = obj && obj.diamondExchangeDaily;
  if (!ex || typeof ex !== 'object') return 0;
  if (ex.day !== todayKey) return 0;
  return Math.max(0, Math.floor(__parseStudentNumber(ex.used)));
}

async function refreshExchangeModalStats(){
  try{
    if(!window.selectedStudent || !window.database) return;
    const data = await getStoreStudentData(true);
    if(!data) return;
    const el = document.getElementById('exchange-current-credits');
    if(el) el.textContent = `Mevcut Kredin: ${data.duelCredits || 0}`;
    const elD = document.getElementById('exchange-current-diamonds');
    if(elD) elD.textContent = `Mevcut Elmasın: ${data.diamond || 0}`;
    const elC = document.getElementById('exchange-current-cups');
    if(elC) elC.textContent = `Mevcut Kupan: ${data.gameCup || 0}`;
    const todayKey = __exchangeLocalDayKey();
    const usedToday = __getDiamondExchangeUsedToday(data, todayKey);
    const remaining = Math.max(0, DIAMOND_EXCHANGE_DAILY_ADET_LIMIT - usedToday);
    const dailyEl = document.getElementById('exchange-daily-takas');
    if (dailyEl){
      dailyEl.textContent = remaining < 1
        ? `Bugün takas: ${usedToday} / ${DIAMOND_EXCHANGE_DAILY_ADET_LIMIT} adet (bugünkü hak bitti)`
        : `Bugün takas: ${usedToday} / ${DIAMOND_EXCHANGE_DAILY_ADET_LIMIT} adet · Kalan: ${remaining}`;
    }
    const qtyIn = document.getElementById('exchange-count-input');
    if (qtyIn){
      qtyIn.min = '1';
      if (remaining < 1){
        qtyIn.removeAttribute('max');
      } else {
        qtyIn.max = String(remaining);
        const cur = parseInt(qtyIn.value, 10);
        if (Number.isFinite(cur) && cur > remaining) qtyIn.value = String(remaining);
      }
    }
    const exBtn = document.getElementById('diamond_exchange_btn');
    if (exBtn){
      exBtn.disabled = remaining < 1;
      exBtn.style.opacity = remaining < 1 ? '0.55' : '1';
      exBtn.style.cursor = remaining < 1 ? 'not-allowed' : 'pointer';
    }
    updateExchangePreview();
  }catch(e){ console.error('refreshExchangeModalStats:', e); }
}

document.addEventListener('DOMContentLoaded', function(){
  const typeEl = document.getElementById('exchange-type-select');
  const qtyEl = document.getElementById('exchange-count-input');
  if (typeEl) typeEl.addEventListener('change', updateExchangePreview);
  if (qtyEl) qtyEl.addEventListener('input', updateExchangePreview);
  document.querySelectorAll('[data-exchange-delta]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const d = parseInt(btn.getAttribute('data-exchange-delta'), 10);
      if (!qtyEl || !Number.isFinite(d)) return;
      let v = parseInt(qtyEl.value, 10);
      if (!Number.isFinite(v)) v = 1;
      const max = qtyEl.max ? parseInt(qtyEl.max, 10) : null;
      v = Math.max(1, v + d);
      if (Number.isFinite(max) && max > 0) v = Math.min(v, max);
      qtyEl.value = String(v);
      updateExchangePreview();
    });
  });
});

// showAlert tarzı onay penceresi: showAlertConfirm varsa onu kullan, yoksa Nova modal
async function safeShowConfirm(msg){
  try{
    if (typeof showAlertConfirm === 'function'){
      return await showAlertConfirm(msg);
    }
  }catch(e){}
  return await new Promise((resolve)=>{
    try{
      let ov = document.getElementById('novaConfirmOverlay');
      if(!ov){
        // Dinamik olarak oluştur (ilk kullanımda)
        const tpl = document.createElement('div');
        tpl.innerHTML = `
<div id="novaConfirmOverlay" style="position:fixed;inset:0;z-index:100200;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;">
  <div style="max-width:420px;margin:12vh auto;background:#0b1220;border:2px solid #1f2a44;border-radius:16px;box-shadow: 0 6px 18px rgba(0,0,0,.5);padding:18px;width:calc(100% - 40px);">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:18px;font-weight:800;color:#e5e7eb;">Onay Gerekli</div>
      <button id="novaConfirmClose" aria-label="Kapat"
              style="background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">✖</button>
    </div>
    <div id="novaConfirmMessage" style="margin:12px 0 16px;font-size:14px;line-height:1.4;color:#cbd5e1;white-space:pre-line;"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button id="novaConfirmCancel" style="background:#1f2937;color:#e5e7eb;border:1px solid #334155;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;">
        Vazgeç
      </button>
      <button id="novaConfirmOk" style="background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-weight:800;cursor:pointer;">
        Onayla
      </button>
    </div>
  </div>
</div>`;
        document.body.appendChild(tpl.firstElementChild);
      }
      ov = document.getElementById('novaConfirmOverlay');
      const msgEl = document.getElementById('novaConfirmMessage');
      const okBtn = document.getElementById('novaConfirmOk');
      const cancelBtn = document.getElementById('novaConfirmCancel');
      const closeBtn = document.getElementById('novaConfirmClose');
      msgEl.textContent = msg;
      ov.style.zIndex = '100200';
      ov.style.display = 'flex';
      try{hideWaitOverlay();}catch(e){}; const cleanup = () => {
        ov.style.display = 'none';
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        closeBtn.onclick = null;
        window.removeEventListener('keydown', onKey);
        ov.onclick = null;
      };
      const onKey = (e) => { if (e.key === 'Escape'){ cleanup(); resolve(false); } };
      okBtn.onclick = () => { cleanup(); resolve(true); };
      cancelBtn.onclick = () => { cleanup(); resolve(false); };
      closeBtn.onclick = () => { cleanup(); resolve(false); };
      ov.onclick = (e) => { if (e.target === ov){ cleanup(); resolve(false); } };
      window.addEventListener('keydown', onKey);
    }catch(e){ resolve(window.confirm(msg)); }
  });
}

async function handleDiamondExchangeModal(){
  try{
    const typeEl = document.getElementById('exchange-type-select');
    const exchangeType = (typeEl && typeEl.value) ? typeEl.value : 'diamond_to_cup';
    const qtyEl = document.getElementById('exchange-count-input');
    let qty = parseInt(qtyEl && qtyEl.value ? qtyEl.value : '0', 10);
    if(!Number.isFinite(qty) || qty < 1){
      safeShowAlert('Lütfen geçerli bir adet giriniz (>=1).');
      return;
    }
    if (exchangeType !== 'diamond_to_cup' && exchangeType !== 'diamond_to_credits'){
      safeShowAlert('Geçersiz takas türü.');
      return;
    }
    const todayKey = __exchangeLocalDayKey();
    const ref = database.ref(`classes/${selectedStudent.classId}/students/${selectedStudent.studentId}`);
    const beforeSnap = await ref.once('value');
    const before = beforeSnap.val() || {};
    const usedBefore = __getDiamondExchangeUsedToday(before, todayKey);
    if (usedBefore + qty > DIAMOND_EXCHANGE_DAILY_ADET_LIMIT){
      safeShowAlert(`Günlük takas limiti: günde en fazla ${DIAMOND_EXCHANGE_DAILY_ADET_LIMIT} adet. Kalan: ${Math.max(0, DIAMOND_EXCHANGE_DAILY_ADET_LIMIT - usedBefore)}`);
      refreshExchangeModalStats();
      return;
    }
    const haveDiamonds = __parseStudentNumber(before.diamond);
    const costDiamonds = qty * 100;
    const gainCups = qty * 5;
    const gainCredits = qty * 30;

    if (haveDiamonds < costDiamonds){
      safeShowAlert('Yetersiz elmas.');
      return;
    }

    const confirmText = (exchangeType === 'diamond_to_cup')
      ? `Seçilen: ${costDiamonds} 💎 → ${gainCups} 🏆\nEmin misiniz?`
      : `Seçilen: ${costDiamonds} 💎 → ${gainCredits} düello kredisi\nEmin misiniz?`;
    const ok = await safeShowConfirm(confirmText);
    if(!ok) return;

    await ref.transaction((user)=>{
      user = user || {};
      let usedTx = __getDiamondExchangeUsedToday(user, todayKey);
      if (usedTx + qty > DIAMOND_EXCHANGE_DAILY_ADET_LIMIT) return undefined;
      const currentDiamond = __parseStudentNumber(
        (user.diamond == null || user.diamond === '') ? haveDiamonds : user.diamond
      );
      if(currentDiamond < costDiamonds) return undefined;
      user.diamond = currentDiamond - costDiamonds;
      user.lastDiamondUpdate = Date.now();
      if (exchangeType === 'diamond_to_cup'){
        user.gameCup = __parseStudentNumber(user.gameCup) + gainCups;
      } else {
        user.duelCredits = __parseStudentNumber(user.duelCredits) + gainCredits;
      }
      user.diamondExchangeDaily = { day: todayKey, used: usedTx + qty };
      return user;
    }, function(err, committed, snap){
      if(err){ safeShowAlert('Bir hata oluştu.'); console.error(err); return; }
      if(!committed){
        ref.once('value').then(function(latestSnap){
          const latest = latestSnap && latestSnap.val ? (latestSnap.val() || {}) : {};
          const latestDiamond = __parseStudentNumber(latest.diamond);
          const usedL = __getDiamondExchangeUsedToday(latest, todayKey);
          if (usedL + qty > DIAMOND_EXCHANGE_DAILY_ADET_LIMIT){
            safeShowAlert(`Günlük takas limiti: günde en fazla ${DIAMOND_EXCHANGE_DAILY_ADET_LIMIT} adet.`);
          } else if (latestDiamond < costDiamonds) safeShowAlert('Yetersiz elmas.');
          else safeShowAlert('İşlem tamamlanamadı. Lütfen tekrar deneyin.');
        }).catch(function(){
          safeShowAlert('İşlem tamamlanamadı. Lütfen tekrar deneyin.');
        });
        return;
      }
      const after = snap && snap.val ? snap.val() : null;
      if(!after){ safeShowAlert('Bir hata oluştu.'); return; }
      try{
        const key = `${selectedStudent.classId}:${selectedStudent.studentId}`;
        __storeStudentCache = { key, ts: Date.now(), data: after };
      }catch(_){}
      const diamondValueEl = document.getElementById('diamond-value');
      const diamondHeaderEl = document.getElementById('currentDiamonds');
      const creditsUIEl = document.getElementById('duel-credits-value');
      const cupUIEl = document.getElementById('game-cup-score');
      if (diamondValueEl) diamondValueEl.textContent = after.diamond || 0;
      if (diamondHeaderEl) diamondHeaderEl.textContent = after.diamond || 0;
      if (creditsUIEl) creditsUIEl.textContent = after.unlimitedCreditsUntil && after.unlimitedCreditsUntil > Date.now()
        ? `${Math.ceil((after.unlimitedCreditsUntil - Date.now()) / (1000*60*60*24))}Gün`
        : (after.duelCredits || 0);
      if (cupUIEl) cupUIEl.textContent = after.gameCup || 0;
      refreshExchangeModalStats();
      const doneMsg = exchangeType === 'diamond_to_cup'
        ? 'Takas tamamlandı! Kupa eklendi 🏆'
        : 'Takas tamamlandı! Düello kredisi eklendi ⚔️';
      setTimeout(()=>{ safeShowAlert(doneMsg); }, 30);
    });
  }catch(e){
    console.error('handleDiamondExchangeModal error:', e);
    safeShowAlert('Beklenmeyen bir hata oluştu.');
  }
}
