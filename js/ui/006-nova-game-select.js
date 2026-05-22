(function(){
  const ROOT_SELECTOR = [
    '#single-player-screen',
    '#duel-selection-screen',
    '#student-selection-screen',
    '#registrationOverlay',
    '.registration-form'
  ].join(',');

  function labelTextForSelect(sel){
    const id = sel.id;
    if (id){
      const lbl = document.querySelector('label[for="' + id + '"]');
      if (lbl) return (lbl.textContent || '').replace(/:\s*$/, '').trim();
    }
    const prev = sel.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return (prev.textContent || '').replace(/:\s*$/, '').trim();
    return sel.getAttribute('aria-label') || 'Seçim';
  }

  function gradeFromClassLabel(text){
    const s = String(text || '').trim();
    const m = s.match(/([1-4])\s*\.?\s*SINIF/i);
    if (m) return parseInt(m[1], 10);
    const m2 = s.match(/([1-4])(?:\.|\s|$)/);
    return m2 ? parseInt(m2[1], 10) : 99;
  }

  function sortClassRows(rows){
    return (rows || []).slice().sort(function(a, b){
      const ga = gradeFromClassLabel(a.name || a.textContent || '');
      const gb = gradeFromClassLabel(b.name || b.textContent || '');
      if (ga !== gb) return ga - gb;
      return String(a.name || a.textContent || '').localeCompare(
        String(b.name || b.textContent || ''), 'tr'
      );
    });
  }

  function isClassGradeSelect(sel){
    return sel && (sel.id === 'selection-class-select' || sel.id === 'registerClassSelect' || sel.id === 'class-select');
  }

  function sortNativeClassSelect(sel){
    if (!sel || !sel.options || sel.dataset.novaClassSortLock === '1') return;
    sel.dataset.novaClassSortLock = '1';
    try {
      const opts = Array.from(sel.options);
      const placeholders = opts.filter(function(o){ return !String(o.value || '').trim(); });
      const rest = opts.filter(function(o){ return String(o.value || '').trim(); });
      rest.sort(function(a, b){
        const ga = gradeFromClassLabel(a.textContent || '');
        const gb = gradeFromClassLabel(b.textContent || '');
        if (ga !== gb) return ga - gb;
        return (a.textContent || '').localeCompare(b.textContent || '', 'tr');
      });
      const prev = sel.value;
      sel.innerHTML = '';
      placeholders.forEach(function(o){ sel.appendChild(o); });
      rest.forEach(function(o){ sel.appendChild(o); });
      if (prev) sel.value = prev;
    } finally {
      sel.dataset.novaClassSortLock = '0';
    }
  }

  var NOVA_MENU_Z = 101200;

  function usesFixedMenu(wrap){
    return wrap && (wrap.dataset.tone === 'arena' || wrap.dataset.tone === 'login' || wrap.dataset.tone === 'register');
  }

  function syncMenuToneClass(menu, wrap){
    if (!menu || !wrap) return;
    menu.classList.remove(
      'nova-game-select__menu--arena',
      'nova-game-select__menu--login',
      'nova-game-select__menu--register'
    );
    var tone = wrap.dataset.tone || 'arena';
    menu.classList.add('nova-game-select__menu--' + tone);
  }

  function dropdownHostScreen(wrap){
    return wrap && wrap.closest(
      '#single-player-screen, #duel-selection-screen, #student-selection-screen, #registrationOverlay'
    );
  }

  function getMenu(wrap){
    return wrap && (wrap.__novaMenuEl || wrap.querySelector('.nova-game-select__menu'));
  }

  function clearMenuPosition(wrap){
    if (!wrap) return;
    const menu = getMenu(wrap);
    const trigger = wrap.querySelector('.nova-game-select__trigger');
    if (!menu) return;
    menu.classList.remove(
      'nova-game-select__menu--fixed',
      'nova-game-select__menu--arena',
      'nova-game-select__menu--login',
      'nova-game-select__menu--register'
    );
    menu.style.position = '';
    menu.style.left = '';
    menu.style.top = '';
    menu.style.width = '';
    menu.style.maxHeight = '';
    menu.style.zIndex = '';
    if (menu.parentNode === document.body && wrap.__novaMenuHome) {
      wrap.__novaMenuHome.appendChild(menu);
    }
    wrap.__novaMenuEl = null;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    const screen = dropdownHostScreen(wrap);
    if (screen) screen.classList.remove('nova-game-form-dropdown-open');
  }

  function positionFixedMenu(wrap){
    const menu = getMenu(wrap);
    const trigger = wrap.querySelector('.nova-game-select__trigger');
    if (!menu || !trigger) return;
    if (menu.parentNode !== document.body) {
      wrap.__novaMenuHome = wrap;
      wrap.__novaMenuEl = menu;
      document.body.appendChild(menu);
    }
    const r = trigger.getBoundingClientRect();
    const gap = 6;
    const maxH = Math.min(280, Math.max(120, window.innerHeight - r.bottom - gap - 16));
    syncMenuToneClass(menu, wrap);
    menu.classList.add('nova-game-select__menu--fixed');
    menu.style.position = 'fixed';
    menu.style.left = Math.max(8, r.left) + 'px';
    menu.style.top = (r.bottom + gap) + 'px';
    menu.style.width = Math.min(r.width, window.innerWidth - 16) + 'px';
    menu.style.maxHeight = maxH + 'px';
    menu.style.zIndex = String(NOVA_MENU_Z);
    const screen = dropdownHostScreen(wrap);
    if (screen) screen.classList.add('nova-game-form-dropdown-open');
  }

  function closeAllMenus(except){
    document.querySelectorAll('.nova-game-select--open').forEach(function(w){
      if (except && w === except) return;
      w.classList.remove('nova-game-select--open');
      const menu = getMenu(w);
      if (menu) menu.hidden = true;
      clearMenuPosition(w);
    });
    if (!except) {
      document.querySelectorAll(
        '#single-player-screen, #duel-selection-screen, #student-selection-screen, #registrationOverlay'
      ).forEach(function(s){
        s.classList.remove('nova-game-form-dropdown-open');
      });
    }
  }

  function syncTrigger(wrap, sel){
    const valEl = wrap.querySelector('.nova-game-select__value');
    const opt = sel.options[sel.selectedIndex];
    const text = opt ? (opt.textContent || '').trim() : 'Seçiniz';
    if (valEl) valEl.textContent = text || 'Seçiniz';
    wrap.classList.toggle('nova-game-select--empty', !sel.value);
    wrap.classList.toggle('nova-game-select--filled', !!sel.value);
  }

  function buildMenu(wrap, sel, skipNativeSort){
    const menu = getMenu(wrap);
    if (!menu || wrap.__novaMenuSyncing) return;
    wrap.__novaMenuSyncing = true;
    try {
      if (!skipNativeSort && isClassGradeSelect(sel)) {
        sortNativeClassSelect(sel);
      }
      menu.innerHTML = '';
      const sorted = Array.from(sel.options).slice().sort(function(a, b){
        if (!a.value) return -1;
        if (!b.value) return 1;
        if (isClassGradeSelect(sel)) {
          const ga = gradeFromClassLabel(a.textContent || '');
          const gb = gradeFromClassLabel(b.textContent || '');
          if (ga !== gb) return ga - gb;
        }
        return (a.textContent || '').localeCompare(b.textContent || '', 'tr');
      });
      sorted.forEach(function(opt){
        const idx = Array.prototype.indexOf.call(sel.options, opt);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nova-game-select__option';
        btn.setAttribute('role', 'option');
        btn.dataset.index = String(idx);
        btn.dataset.value = opt.value;
        btn.textContent = (opt.textContent || '').trim() || '—';
        if (opt.value === sel.value) btn.setAttribute('aria-selected', 'true');
        if (!opt.value) btn.classList.add('nova-game-select__option--placeholder');
        btn.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          sel.value = opt.value;
          sel.selectedIndex = idx;
          syncTrigger(wrap, sel);
          menu.querySelectorAll('.nova-game-select__option').forEach(function(o){
            o.removeAttribute('aria-selected');
          });
          btn.setAttribute('aria-selected', 'true');
          wrap.classList.remove('nova-game-select--open');
          menu.hidden = true;
          clearMenuPosition(wrap);
          try{
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }catch(_){
            const ev = document.createEvent('Event');
            ev.initEvent('change', true, true);
            sel.dispatchEvent(ev);
          }
        });
        menu.appendChild(btn);
      });
    } finally {
      wrap.__novaMenuSyncing = false;
    }
  }

  function enhanceSelect(sel){
    if (!sel || sel.tagName !== 'SELECT' || sel.dataset.novaGameSelectDone === '1') return;
    if (sel.multiple || sel.size > 1) return;

    const tone = sel.closest('#single-player-screen') || sel.closest('#duel-selection-screen')
      ? 'arena'
      : 'login';

    const wrap = document.createElement('div');
    wrap.className = 'nova-game-select nova-game-select--' + tone;
    wrap.dataset.tone = tone;

    const label = labelTextForSelect(sel);
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nova-game-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML =
      '<span class="nova-game-select__icon" aria-hidden="true"></span>'
      + '<span class="nova-game-select__text">'
      + '<span class="nova-game-select__label">' + label + '</span>'
      + '<span class="nova-game-select__value">Seçiniz</span>'
      + '</span>'
      + '<span class="nova-game-select__chev" aria-hidden="true"></span>';

    const menu = document.createElement('div');
    menu.className = 'nova-game-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    sel.classList.add('nova-game-select__native');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');

    const parent = sel.parentNode;
    parent.insertBefore(wrap, sel);
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    wrap.appendChild(sel);

    const lbl = document.querySelector('label[for="' + sel.id + '"]');
    if (lbl) lbl.classList.add('nova-game-select__sr-label');

    trigger.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      const open = wrap.classList.contains('nova-game-select--open');
      closeAllMenus();
      if (!open){
        buildMenu(wrap, sel, false);
        wrap.classList.add('nova-game-select--open');
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        if (usesFixedMenu(wrap)) positionFixedMenu(wrap);
        const picked = menu.querySelector('.nova-game-select__option[aria-selected="true"]')
          || menu.querySelector('.nova-game-select__option');
        if (picked) picked.focus();
      }
    });

    sel.addEventListener('change', function(){
      if (wrap.__novaMenuSyncing) return;
      syncTrigger(wrap, sel);
      buildMenu(wrap, sel, true);
    });

    sel.dataset.novaGameSelectDone = '1';
    buildMenu(wrap, sel, false);
    syncTrigger(wrap, sel);

    try {
      var moTimer = null;
      var mo = new MutationObserver(function(){
        if (wrap.__novaMenuSyncing || sel.dataset.novaClassSortLock === '1') return;
        if (moTimer) clearTimeout(moTimer);
        moTimer = setTimeout(function(){
          moTimer = null;
          if (wrap.__novaMenuSyncing || sel.dataset.novaClassSortLock === '1') return;
          buildMenu(wrap, sel, true);
          syncTrigger(wrap, sel);
        }, 80);
      });
      mo.observe(sel, { childList: true });
      wrap.__novaSelectMo = mo;
    } catch (_) {}
  }

  function enhanceRoot(root){
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(ROOT_SELECTOR).forEach(function(container){
      container.querySelectorAll('select').forEach(enhanceSelect);
    });
  }

  document.addEventListener('click', function(e){
    if (!e.target.closest('.nova-game-select') && !e.target.closest('.nova-game-select__menu')) {
      closeAllMenus();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeAllMenus();
  });
  window.addEventListener('resize', function(){
    document.querySelectorAll('.nova-game-select--open').forEach(function(w){
      if (usesFixedMenu(w)) positionFixedMenu(w);
    });
  });

  window.novaEnhanceGameSelects = enhanceRoot;
  window.novaSortClassGradeRows = sortClassRows;
  window.novaSortNativeClassSelect = sortNativeClassSelect;

  function boot(){
    try { enhanceRoot(document); } catch (e) { console.warn('novaEnhanceGameSelects boot', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
