(function () {
  function tuneFabLabels() {
    try {
      var pz = document.getElementById('puzzle_fab');
      if (pz) pz.textContent = 'BULMACA';
      var fb = document.getElementById('fillblank_fab');
      if (fb) {
        var lbl = fb.querySelector('.fb-fab-label');
        if (lbl) lbl.textContent = 'BOŞLUK';
      }
      var mt = document.getElementById('match_fab');
      if (mt) {
        var sp = mt.querySelector('span');
        if (sp) sp.textContent = 'EŞLEŞTİR';
      }
    } catch (_) {}
  }

  function getBonusPanel() {
    return document.getElementById('nova_bonus_drawer_panel');
  }

  function moveFab() {
    try {
      var ms = document.getElementById('main-screen');
      if (!ms) return false;
      var denemeSlot = document.getElementById('main-screen-deneme-slot');
      var questSlot = document.getElementById('main-screen-quest-slot');
      var hudLeft = document.getElementById('main-screen-hud-left');
      var bonusPanel = getBonusPanel();
      var bonusDrawer = document.getElementById('nova-bonus-drawer');
      var legacyRow = document.getElementById('homework_above_photo_row');
      if (legacyRow && legacyRow.parentNode) legacyRow.parentNode.removeChild(legacyRow);

      var hw = document.getElementById('homework_fab');
      var dnw = document.getElementById('deneme_fab_wrap');
      var qw = document.getElementById('quest_fab_wrap');
      var fbw = document.getElementById('fillblank_fab_wrap');
      var pzw = document.getElementById('puzzle_fab_wrap');
      var mfw = document.getElementById('match_fab_wrap');
      var sb = questSlot ? questSlot.querySelector('.surprise-box') : null;

      if (dnw && denemeSlot && dnw.parentNode !== denemeSlot) denemeSlot.appendChild(dnw);
      if (hw && questSlot && hw.parentNode !== questSlot) questSlot.appendChild(hw);
      if (qw && questSlot && qw.parentNode !== questSlot) questSlot.appendChild(qw);
      if (bonusDrawer && questSlot && bonusDrawer.parentNode !== questSlot) questSlot.appendChild(bonusDrawer);

      if (bonusPanel) {
        [pzw, fbw, mfw].filter(Boolean).forEach(function (el) {
          if (el.parentNode !== bonusPanel) bonusPanel.appendChild(el);
        });
      }

      if (hudLeft) {
        [pzw, fbw, mfw, hw, qw].filter(Boolean).forEach(function (el) {
          if (el.parentNode === hudLeft && bonusPanel) bonusPanel.appendChild(el);
        });
      }

      if (questSlot) {
        var toolsBtn = document.getElementById('tools-open-button');
        [toolsBtn, hw, qw, bonusDrawer, sb].filter(Boolean).forEach(function (el) {
          try { questSlot.appendChild(el); } catch (_) {}
        });
      }

      [hw, qw, fbw, pzw, mfw].forEach(function (el) {
        if (!el) return;
        el.style.position = 'relative';
        el.style.inset = 'auto';
        el.style.left = 'auto';
        el.style.right = 'auto';
        el.style.top = 'auto';
        el.style.bottom = 'auto';
        el.style.margin = '0';
        el.style.transform = 'none';
      });

      if (hw) {
        hw.style.position = 'static';
      }
      if (dnw) {
        dnw.style.position = 'static';
        dnw.style.margin = '0';
      }

      var qbtn = document.getElementById('quest_fab');
      if (qbtn && !bonusPanel) {
        var w = Math.round(qbtn.offsetWidth);
        var h = Math.round(qbtn.offsetHeight);
        if (w > 20 && h > 20) {
          if (hw) { hw.style.width = w + 'px'; hw.style.height = h + 'px'; }
          if (fbw) {
            var fbb = document.getElementById('fillblank_fab');
            if (fbb) { fbb.style.width = w + 'px'; fbb.style.height = h + 'px'; }
          }
          var pzb = document.getElementById('puzzle_fab');
          if (pzb) { pzb.style.width = w + 'px'; pzb.style.height = h + 'px'; }
        }
      }

      tuneFabLabels();
      if (typeof window.novaEnsureBonusFabsInPanel === 'function') {
        window.novaEnsureBonusFabsInPanel();
      }
      if (typeof window.novaForceBonusDrawerClosed === 'function') {
        window.novaForceBonusDrawerClosed();
      }
      return !!(hw || dnw || qw || fbw || pzw || mfw || sb);
    } catch (e) {
      return false;
    }
  }

  window.novaFixHudFabLayout = function () {
    moveFab();
    setTimeout(moveFab, 80);
    setTimeout(moveFab, 260);
    setTimeout(moveFab, 700);
  };

  window.novaFixHudFabLayout();
  window.addEventListener('resize', moveFab);
  window.addEventListener('load', moveFab, { once: true });
  setTimeout(moveFab, 1200);
})();
