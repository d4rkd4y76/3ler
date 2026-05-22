(function(){
  const COPY = {
    character: {
      title: 'Karakterleriniz Yükleniyor',
      sub: 'Lütfen Bekleyiniz',
      icon: '🎭'
    },
    store: {
      title: 'Mağazanız Yükleniyor',
      sub: 'Lütfen Bekleyiniz',
      icon: '💎'
    }
  };

  let root = null;
  let openCount = 0;
  let hideTimer = null;

  function buildParticles(host){
    if (!host || host.childElementCount) return;
    const glyphs = ['✦', '✧', '◇', '❖', '•'];
    for (let i = 0; i < 28; i++){
      const p = document.createElement('span');
      p.className = 'nova-screen-loader__particle';
      p.setAttribute('aria-hidden', 'true');
      p.textContent = glyphs[i % glyphs.length];
      p.style.setProperty('--x', (8 + Math.random() * 84).toFixed(1) + '%');
      p.style.setProperty('--y', (6 + Math.random() * 88).toFixed(1) + '%');
      p.style.setProperty('--dur', (3.2 + Math.random() * 4.5).toFixed(2) + 's');
      p.style.setProperty('--delay', (Math.random() * 3.5).toFixed(2) + 's');
      p.style.setProperty('--scale', (0.45 + Math.random() * 0.9).toFixed(2));
      host.appendChild(p);
    }
  }

  function ensureRoot(){
    if (root) return root;
    root = document.createElement('div');
    root.id = 'nova_screen_loader';
    root.className = 'nova-screen-loader';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.innerHTML =
      '<div class="nova-screen-loader__backdrop" aria-hidden="true">'
      + '<div class="nova-screen-loader__mesh"></div>'
      + '<div class="nova-screen-loader__aurora"></div>'
      + '<div class="nova-screen-loader__grid"></div>'
      + '<div class="nova-screen-loader__vignette"></div>'
      + '<div class="nova-screen-loader__particles"></div>'
      + '<div class="nova-screen-loader__scanlines"></div>'
      + '</div>'
      + '<div class="nova-screen-loader__stage">'
      + '<div class="nova-screen-loader__flare nova-screen-loader__flare--l" aria-hidden="true"></div>'
      + '<div class="nova-screen-loader__flare nova-screen-loader__flare--r" aria-hidden="true"></div>'
      + '<p class="nova-screen-loader__brand" aria-hidden="true">NASK <span>GAMES</span></p>'
      + '<div class="nova-screen-loader__emblem" aria-hidden="true">'
      + '<div class="nova-screen-loader__ring nova-screen-loader__ring--outer"></div>'
      + '<div class="nova-screen-loader__ring nova-screen-loader__ring--mid"></div>'
      + '<div class="nova-screen-loader__ring nova-screen-loader__ring--inner"></div>'
      + '<div class="nova-screen-loader__core">'
      + '<span class="nova-screen-loader__icon" id="nova_screen_loader_icon">⚔</span>'
      + '</div>'
      + '<span class="nova-screen-loader__spark nova-screen-loader__spark--a"></span>'
      + '<span class="nova-screen-loader__spark nova-screen-loader__spark--b"></span>'
      + '<span class="nova-screen-loader__spark nova-screen-loader__spark--c"></span>'
      + '</div>'
      + '<h2 class="nova-screen-loader__title" id="nova_screen_loader_title"></h2>'
      + '<p class="nova-screen-loader__sub"><span id="nova_screen_loader_sub"></span><span class="nova-screen-loader__dots" aria-hidden="true"></span></p>'
      + '<div class="nova-screen-loader__progress" aria-hidden="true">'
      + '<div class="nova-screen-loader__progress-track">'
      + '<div class="nova-screen-loader__progress-fill"></div>'
      + '<div class="nova-screen-loader__progress-shine"></div>'
      + '</div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(root);
    buildParticles(root.querySelector('.nova-screen-loader__particles'));
    return root;
  }

  function setCopy(kind){
    const c = COPY[kind] || COPY.character;
    const t = document.getElementById('nova_screen_loader_title');
    const s = document.getElementById('nova_screen_loader_sub');
    const icon = document.getElementById('nova_screen_loader_icon');
    if (t) t.textContent = c.title;
    if (s) s.textContent = c.sub;
    if (icon) icon.textContent = c.icon;
    if (root) root.setAttribute('data-loader-kind', kind || 'character');
  }

  function finishHide(){
    if (!root) return;
    root.classList.remove('nova-screen-loader--open', 'nova-screen-loader--closing');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nova-screen-loader-active');
    hideTimer = null;
  }

  window.novaShowScreenLoader = function(kind){
    const el = ensureRoot();
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    setCopy(kind || 'character');
    openCount++;
    el.classList.remove('nova-screen-loader--closing');
    el.classList.add('nova-screen-loader--open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nova-screen-loader-active');
  };

  window.novaHideScreenLoader = function(){
    openCount = Math.max(0, openCount - 1);
    if (openCount > 0 || !root) return;
    root.classList.add('nova-screen-loader--closing');
    root.classList.remove('nova-screen-loader--open');
    hideTimer = setTimeout(finishHide, 520);
  };

  window.novaForceHideScreenLoader = function(){
    openCount = 0;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    finishHide();
  };
})();
