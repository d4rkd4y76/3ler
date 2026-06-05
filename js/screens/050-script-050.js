/* -------------------- NOVA: Güvenli kategori oluşturucu --------------------
   Hedefler:
   1) 'EFSANE' butonu DOM'da MUTLAKA en sonda yer alacak.
   2) 'EFSANE' butonu alevli/özel animasyonlu olacak.
   3) 'duel' kategorisi varsa açılışta ona geçiş desteklenecek.
   4) Mevcut loadProfilePhotos ve DOM yapını bozmadan çalışır.
---------------------------------------------------------------------------- */
(function(){
  function unique(arr){ const s = new Set(); return arr.filter(x => (x && !s.has(x) && s.add(x))); }

  function labelForKey(k){
    if (k === '__nameFrames') return 'İsim Çerçevesi';
    if (k === '__avatarFrames') return 'Avatar Çerçevesi';
    if (typeof window.novaAvatarCategoryLabel === 'function') {
      return window.novaAvatarCategoryLabel(k);
    }
    try{
      const m = window.storeCategoryMeta && window.storeCategoryMeta[k];
      if (m && m.label) return String(m.label);
    }catch(_){}
    return k;
  }

  function sortKeys(keys){
    keys = unique(keys);
    if (typeof window.novaFilterAvatarStoreKeys === 'function') {
      keys = window.novaFilterAvatarStoreKeys(keys);
    }
    if (typeof window.novaSortAvatarStoreKeys === 'function') {
      return window.novaSortAvatarStoreKeys(keys);
    }
    const meta = window.storeCategoryMeta || {};
    const hasDuel = keys.includes('duel');
    const hasEfsane = keys.includes('EFSANE');
    let rest = keys.filter(k => k !== 'duel' && k !== 'EFSANE');
    rest.sort((a,b) => {
      const oa = (meta[a] && meta[a].order != null) ? Number(meta[a].order) : 1e12;
      const ob = (meta[b] && meta[b].order != null) ? Number(meta[b].order) : 1e12;
      if (oa !== ob) return oa - ob;
      return labelForKey(a).localeCompare(labelForKey(b), 'tr');
    });
    const out = [];
    if (hasDuel) out.push('duel');
    out.push(...rest);
    if (hasEfsane) out.push('EFSANE');
    return out;
  }

  /* Mağaza sekmeleri: js/ui/012-nova-store-hub.js */
  if (typeof window.renderStoreCategoryButtons !== 'function') {
    window.renderStoreCategoryButtons = function renderStoreCategoryButtons(){
      const main = document.getElementById('novaStoreMainTabs');
      if (main && typeof window.novaStoreHubInit === 'function') return;
      const area = document.querySelector('.profile-categories');
      if(!area) return;
      area.style.display = 'flex';
      area.innerHTML = '';
      let keys = sortKeys(
        (typeof window.novaGetDefaultAvatarCategoryKeys === 'function' && window.novaGetDefaultAvatarCategoryKeys()) ||
        ['bilim_kosesi', 'liderler_kosesi', 'padisahlar_kosesi']
      );
      keys.forEach((k, i) => {
        const btn = document.createElement('button');
        btn.className = 'category-button' + (i===0 ? ' active' : '');
        btn.dataset.category = k;
        btn.textContent = labelForKey(k);
        btn.addEventListener('click', () => {
          if (typeof loadProfilePhotos === 'function') loadProfilePhotos(k);
        });
        area.appendChild(btn);
      });
    };
  }

  // Mağaza üst başlık hizalama (varsa uygula)
  document.addEventListener('DOMContentLoaded', function(){
    // Olası başlık-seçenek yapılarının kapsayıcısını yakala
    var title = document.querySelector('.store-title, .magaza-title, .shop-title');
    var diamond = document.querySelector('.diamond-value, .diamond-display, #diamondDisplay');

    if (title || diamond){
      var host = (title && title.parentElement) || (diamond && diamond.parentElement);
      if (host && !host.classList.contains('store-header-grid')){
        host.classList.add('store-header-grid');
        if (title) title.classList.add('store-title');
        if (diamond){
          var wrap = document.createElement('div');
          wrap.className = 'diamond-wrap';
          diamond.parentElement.insertBefore(wrap, diamond);
          wrap.appendChild(diamond);
        }
      }
    }

    // Sayfa açılışında kategorileri güvenle çiz
    try { window.renderStoreCategoryButtons(); } catch(e){ console.warn('Kategori çizimi hatası:', e); }
  });
})();
