(function(){
  function tuneFabLabels(){
    try{
      var pz = document.getElementById('puzzle_fab');
      if (pz){
        pz.textContent = 'BULMACA';
      }
      var fb = document.getElementById('fillblank_fab');
      if (fb){
        var lbl = fb.querySelector('.fb-fab-label');
        if (lbl) lbl.textContent = 'BOŞLUK';
      }
      var mt = document.getElementById('match_fab');
      if (mt){
        var sp = mt.querySelector('span');
        if (sp) sp.textContent = 'EŞLEŞTİR';
      }
    }catch(_){}
  }

  function moveFab(){
    try{
      var ms = document.getElementById('main-screen');
      if(!ms) return false;
      var odevSlot = document.getElementById('main-screen-odev-slot');
      var denemeSlot = document.getElementById('main-screen-deneme-slot');
      var hudL = document.getElementById('main-screen-hud-left');
      var questSlot = document.getElementById('main-screen-quest-slot');
      var legacyRow = document.getElementById('homework_above_photo_row');
      if(legacyRow && legacyRow.parentNode){ legacyRow.parentNode.removeChild(legacyRow); }
      var hw = document.getElementById('homework_fab');
      var dnw = document.getElementById('deneme_fab_wrap');
      var qw = document.getElementById('quest_fab_wrap');
      var fbw = document.getElementById('fillblank_fab_wrap');
      var pzw = document.getElementById('puzzle_fab_wrap');
      if(dnw && denemeSlot && dnw.parentNode !== denemeSlot){ denemeSlot.appendChild(dnw); }
      if(hw && questSlot && hw.parentNode !== questSlot){ questSlot.appendChild(hw); }
      if(qw && questSlot){
        if(qw.parentNode !== questSlot){ questSlot.appendChild(qw); }
      } else if(qw && hudL && qw.parentNode !== hudL){
        hudL.appendChild(qw);
      }
      if(pzw && hudL && pzw.parentNode !== hudL){ hudL.appendChild(pzw); }
      if(fbw && hudL && fbw.parentNode !== hudL){ hudL.appendChild(fbw); }
      if(hudL){
        var orderL = [pzw, fbw].filter(function(x){ return !!x; });
        orderL.forEach(function(el){ try{ hudL.appendChild(el); }catch(_){ } });
      }
      if(questSlot){
        var orderR = [hw, qw, sb].filter(function(x){ return !!x; });
        orderR.forEach(function(el){ try{ questSlot.appendChild(el); }catch(_){ } });
      }
      if(hw){
        hw.style.position = 'static';
        hw.style.inset = 'auto';
        hw.style.right = 'auto';
        hw.style.bottom = 'auto';
        hw.style.top = 'auto';
        hw.style.margin = '0';
      }
      if(dnw){
        dnw.style.position = 'static';
        dnw.style.margin = '0';
      }
      if(qw){
        qw.style.position = 'relative';
        qw.style.left = 'auto';
        qw.style.top = 'auto';
        qw.style.margin = '0';
        qw.style.transform = 'none';
      }
      var qbtn = document.getElementById('quest_fab');
      if(qbtn){
        var w = Math.round(qbtn.offsetWidth);
        var h = Math.round(qbtn.offsetHeight);
        if(w > 20 && h > 20){
          if(hw){ hw.style.width = w + 'px'; hw.style.height = h + 'px'; }
          if(fbw){
            var fbb = document.getElementById('fillblank_fab');
            if(fbb){ fbb.style.width = w + 'px'; fbb.style.height = h + 'px'; }
          }
          var pzb = document.getElementById('puzzle_fab');
          if(pzb){ pzb.style.width = w + 'px'; pzb.style.height = h + 'px'; }
        }
      }
      if(fbw){
        fbw.style.position = 'relative';
        fbw.style.left = 'auto';
        fbw.style.top = 'auto';
        fbw.style.margin = '0';
        fbw.style.transform = 'none';
      }
      if(pzw){
        pzw.style.position = 'relative';
        pzw.style.left = 'auto';
        pzw.style.top = 'auto';
        pzw.style.margin = '0';
      }
      tuneFabLabels();
      return !!(hw || dnw || qw || fbw || pzw || sb);
    }catch(e){ return false; }
  }
  // Dışarıdan çağrılabilir layout düzeltici (özellikle ilk login sonrası).
  window.novaFixHudFabLayout = function(){
    moveFab();
    setTimeout(moveFab, 80);
    setTimeout(moveFab, 260);
    setTimeout(moveFab, 700);
  };
  // Try a few times during initial load (in case the button/photo render later)
  window.novaFixHudFabLayout();
  // Safety: do not observe full DOM here (can cause feedback loops).
  // Run only on load/resize and a delayed retry.
  window.addEventListener('resize', moveFab);
  window.addEventListener('load', moveFab, {once:true});
  setTimeout(moveFab, 1200);
})();
