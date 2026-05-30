function safeShowAlert(msg){
  try{
    if (typeof showAlert === 'function') { showAlert(msg); }
    else { window.alert(msg); }
  }catch(e){ try{ window.alert(msg); }catch(_){} }
}

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
      try{hideWaitOverlay();}catch(e){}
      const cleanup = () => {
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
