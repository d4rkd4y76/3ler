(function(){
  // Config
  const TTL = {
    headingsMs: 24 * 60 * 60 * 1000,  // ana readValCached ile aynı: championData/headings
    storeIndexMs: 12 * 60 * 60 * 1000, // 12h cache for store/profilePhotosIndex
  };

  // Safe localStorage helpers
  const cache = {
    get(k){
      try {
        const raw = localStorage.getItem(k);
        if(!raw) return null;
        const o = JSON.parse(raw);
        if (o.exp && Date.now() > o.exp) { localStorage.removeItem(k); return null; }
        return o.val;
      } catch(_) { return null; }
    },
    set(k, v, ttlMs){
      try {
        localStorage.setItem(k, JSON.stringify({exp: ttlMs ? (Date.now()+ttlMs) : 0, val: v}));
      } catch(_) {}
    }
  };

  // NetMeter (debug only) — shows approx bytes downloaded per path
  const NetMeter = (() => {
    let total = 0, byPath = {};
    function sizeOf(v){ try { return new Blob([JSON.stringify(v??null)]).size } catch(_) { return 0; } }
    function add(path, val){
      const b = sizeOf(val);
      total += b;
      byPath[path] = (byPath[path]||0) + b;
      // update HUD
      const hud = document.getElementById('nova-net-hud');
      if (hud){
        const best = Object.entries(byPath).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>{
          const mb=(v/1024/1024).toFixed(2);
          return `<div class="row"><span class="path">${k}</span><span class="bytes">${mb} MB</span></div>`;
        }).join("");
        hud.querySelector('.total').textContent = (total/1024/1024).toFixed(2)+' MB';
        hud.querySelector('.list').innerHTML = best || '<em>no data yet</em>';
      }
    }
    function mountHud(){
      if (document.getElementById('nova-net-hud')) return;
      const box = document.createElement('div'); box.id='nova-net-hud';
      box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:999999;background:rgba(0,0,0,.7);color:#d9f99d;padding:8px 10px;border:1px solid #84cc16;border-radius:12px;font:12px/1.3 ui-monospace,monospace;box-shadow:0 6px 18px rgba(0,0,0,.4)';
      box.innerHTML = '<div style="font-weight:700;margin-bottom:6px">NET ⬇ <span class="total">0 MB</span></div><div class="list"></div><div style="margin-top:6px;color:#a3e635">Nova NetMeter</div>';
      document.body.appendChild(box);
    }
    return { add, mountHud };
  })();
  // Uncomment to view HUD
  // requestAnimationFrame(NetMeter.mountHud);

  // Firebase helpers (assumes v9 modular or compat available globally)
  function dbRef(path){
    try{
      if (window.firebase && window.firebase.database) {
        return window.firebase.database().ref(path); // compat
      }
      if (window.getDatabase && window.ref) {
        return window.ref(window.getDatabase(), path); // modular
      }
    }catch(_){}
    throw new Error('Firebase Database not detected');
  }
  async function dbGet(path){
    // Compat
    if (window.firebase && window.firebase.database){
      const snap = await dbRef(path).once('value');
      NetMeter.add(path, snap.val());
      return snap;
    }
    // Modular
    if (window.get && window.getDatabase && window.ref){
      const snap = await window.get(window.ref(window.getDatabase(), path));
      NetMeter.add(path, snap.val());
      return snap;
    }
    throw new Error('Firebase get() not found');
  }
  function dbOnValue(path, cb){
    if (window.firebase && window.firebase.database){
      return dbRef(path).on('value', s => { NetMeter.add(path, s.val()); cb(s); });
    }
    if (window.onValue && window.getDatabase && window.ref){
      return window.onValue(window.ref(window.getDatabase(), path), s => { NetMeter.add(path, s.val()); cb(s); });
    }
    throw new Error('Firebase onValue() not found');
  }
  function dbOff(path){
    try {
      if (window.firebase && window.firebase.database){
        dbRef(path).off();
      } else if (window.off && window.getDatabase && window.ref){
        window.off(window.ref(window.getDatabase(), path));
      }
    } catch(_){}
  }

  // 1) SMART VIDEO URL LOOKUP (cheap first)
  async function getTopicVideoUrlSmart({topicId, lessonName, topicName}){
    // A) Direct index: /topicVideoUrls/{topicId}
    try {
      if (topicId){
        const a = await dbGet('topicVideoUrls/'+topicId);
        if (a && a.val && a.val()) return a.val();
      }
    } catch(_){}
    // B) Per-topic field: önce ana uygulama RTDB önbelleği (readValCached), yoksa localStorage + tek çekim
    try {
      const cacheKey='nova_headings_cache_v1';
      let tree = cache.get(cacheKey);
      if (!tree && typeof window.novaReadValCached === 'function' && typeof window.NOVA_CHAMPION_HEADINGS_TTL_MS === 'number'){
        try{
          tree = await window.novaReadValCached('championData/headings', window.NOVA_CHAMPION_HEADINGS_TTL_MS);
        }catch(_){ tree = null; }
        if (tree) cache.set(cacheKey, tree, TTL.headingsMs);
      }
      if (!tree){
        const s = await dbGet('championData/headings');
        tree = s.val() || null;
        if (tree) cache.set(cacheKey, tree, TTL.headingsMs);
      }
      if (tree && topicId){
        // Traverse to find topicId once
        for (const hid in tree){
          const lessons = tree[hid]?.lessons||{};
          for (const lid in lessons){
            const topics = lessons[lid]?.topics||{};
            if (topics[topicId] && topics[topicId].videoUrl){
              return topics[topicId].videoUrl;
            }
          }
        }
      }
    } catch(_){}
    // C) Fallback name based lookup: /lessonVideoLookup/{lessonName}/{topicName}
    try {
      if (lessonName && topicName){
        const s = await dbGet(`lessonVideoLookup/${lessonName}/${topicName}`);
        if (s && s.val && s.val()) return s.val();
      }
    } catch(_){}
    return '';
  }
  // Expose to global + override old if present
  try { window.getTopicVideoUrlSmart = getTopicVideoUrlSmart; } catch(_){}

  // 2) STORE CATEGORIES: INDEX-FIRST + LAZY LOAD
  async function getStoreCategories(){
    // A) light index path
    try{
      const key='nova_store_index_v1';
      let idx = cache.get(key);
      if (!idx){
        const s = await dbGet('store/profilePhotosIndex'); // {cat: {count, updatedAt}}
        idx = s.val() || null;
        if (idx) cache.set(key, idx, TTL.storeIndexMs);
      }
      if (idx) return Object.keys(idx);
    }catch(_){}
    // B) fallback: yeni avatar köşeleri (legacy gizlenir — tam liste hub’dan gelir)
    if (typeof window.novaGetDefaultAvatarCategoryKeys === 'function') {
      return window.novaGetDefaultAvatarCategoryKeys().slice();
    }
    return ['bilim_kosesi', 'liderler_kosesi', 'padisahlar_kosesi'];
  }
  async function loadProfilePhotos(category){
    // Called after user chooses category; fetch only that branch
    const s = await dbGet('store/profilePhotos/'+category);
    const obj = s.val()||{};
    // Render area if exists
    const container = document.getElementById('profilePhotosContainer');
    if (container){
      container.innerHTML = '';
      Object.keys(obj).filter(k=>k!=='_meta').forEach(photoId=>{
        const ph = obj[photoId];
        const el = document.createElement('div');
        el.className='photo';
        el.innerHTML = `<img src="${ph.url}" alt=""><div class="price">${ph.price||0}</div>`;
        container.appendChild(el);
      });
    }
    return obj;
  }
  async function renderStoreCategoryButtons_optimized(){
    if (typeof window.novaStoreHubInit === 'function') return;
    const area = document.querySelector('.profile-categories');
    if (!area) return;
    area.style.display='flex'; area.innerHTML='';
    let cats = await getStoreCategories();
    if (typeof window.novaFilterAvatarStoreKeys === 'function') {
      cats = window.novaFilterAvatarStoreKeys(cats);
    }
    if (typeof window.novaSortAvatarStoreKeys === 'function') {
      cats = window.novaSortAvatarStoreKeys(cats);
    }
    cats = (cats || []).filter(function (k) { return k && k !== 'duel'; });
    const labelFor = (k) => {
      if (typeof window.novaAvatarCategoryLabel === 'function') return window.novaAvatarCategoryLabel(k);
      try {
        const m = window.storeCategoryMeta && window.storeCategoryMeta[k];
        if (m && m.label) return String(m.label);
      } catch(_){}
      return k;
    };
    cats.forEach((k,i)=>{
      const btn = document.createElement('button');
      btn.className = 'category-button'+(i===0?' active':'');
      btn.dataset.category=k;
      btn.textContent = labelFor(k);
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.category-button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const photosContainer = document.getElementById('profilePhotosContainer');
        if (photosContainer) photosContainer.style.display='grid';
        loadProfilePhotos(k);
      });
      area.appendChild(btn);
    });
    const first = cats[0]; if (first) loadProfilePhotos(first);
  }
  // Try to override existing renderer if available
  try { window.renderStoreCategoryButtons = renderStoreCategoryButtons_optimized; } catch(_){}

  // 3) LISTENER HYGIENE HELPERS
  const NovaListeners = new Set();
  function trackOnValue(path, cb){
    const offFn = dbOnValue(path, cb) || (()=>dbOff(path));
    NovaListeners.add({path, off: offFn});
    return offFn;
  }
  function offAllNova(){
    NovaListeners.forEach(o=>{ try{o.off()}catch(_){ dbOff(o.path); } });
    NovaListeners.clear();
  }
  window.novaOffAllListeners = offAllNova;

  // 4) DUELS: Prefer /duelsByUser/{uid} if exists, fallback to costly queries
  async function subscribeDuelsForUser(uid, onList){
    try{
      const s = await dbGet('duelsByUser/'+uid);
      if (s.exists()){
        // light path
        trackOnValue('duelsByUser/'+uid, async ss=>{
          const ids = Object.keys(ss.val()||{});
          const out = [];
          for (const id of ids.slice(0,50)){
            const d = await dbGet('duels/'+id);
            out.push({id, ...(d.val()||{})});
          }
          onList(out);
        });
        return;
      }
    }catch(_){}
    // fallback: keep old behavior but limit range (needs indexes)
    const pathA = 'duels';
    trackOnValue(pathA, s=>{
      const all=s.val()||{};
      const arr = Object.entries(all).map(([id,d])=>({id,...d})).filter(d=>(d.inviter?.studentId===uid || d.invited?.studentId===uid)).slice(-50);
      onList(arr);
    });
  }
  window.subscribeDuelsForUser = subscribeDuelsForUser;

  // 5) MATCHMAKING: prefer user-only queue if exists; else limit by status/timestamp
  async function subscribeOwnQueue(uid, classId, onItem){
    try{
      const p = 'matchmakingByUser/'+uid;
      const s = await dbGet(p);
      if (s.exists()){
        trackOnValue(p, ss=>onItem(ss.val()));
        return;
      }
    }catch(_){}
    // Fallback limited
    trackOnValue(`matchmaking/${classId}`, ss=>{
      const all=ss.val()||{};
      // filter locally; expected small class queues
      const mine = Object.values(all).find(x=>x.studentId===uid);
      onItem(mine||null);
    });
  }
  window.subscribeOwnQueue = subscribeOwnQueue;

  console.log('%cNova Optimizer active','background:#0ea5e9;color:#fff;padding:2px 6px;border-radius:6px');
})();
