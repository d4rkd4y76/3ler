// Fallback binding: Sezon Sıralaması button always opens panel
(function(){
  let __rankPanelOpenTs = 0;
  let __rankInfoShownTs = 0;

  function rankingBodyReady() {
    var tbody = document.getElementById('ranking-table-body');
    if (!tbody) return false;
    var txt = String(tbody.textContent || '');
    if (/Yükleniyor/i.test(txt)) return false;
    return !!tbody.querySelector('tr');
  }

  window.openSeasonRankingPanel = async function(){
    var panel = document.getElementById('rankingPanel');
    if(!panel) return;
    var now = Date.now();
    if ((now - __rankPanelOpenTs) < 300) return;
    __rankPanelOpenTs = now;

    var loaderShown = false;
    try {
      if (typeof window.novaShowScreenLoader === 'function') {
        window.novaShowScreenLoader('ranking');
        loaderShown = true;
      }
    } catch (_) {}

    /* Panel DOM’da hazırlansın ama loader kalkana kadar gizlensin */
    panel.style.display = 'flex';
    panel.classList.add('open');
    panel.style.visibility = 'hidden';
    panel.style.pointerEvents = 'none';
    panel.setAttribute('aria-hidden', 'true');
    panel.style.transform = 'translate3d(0,0,0)';

    try {
      if (typeof window.loadRanking === 'function') {
        await window.loadRanking({ force: true });
      } else if (typeof loadRanking === 'function') {
        await loadRanking({ force: true });
      }
    } catch (e) {
      console.warn('openSeasonRankingPanel loadRanking', e);
    }

    panel.style.visibility = 'visible';
    panel.style.pointerEvents = 'auto';
    panel.setAttribute('aria-hidden', 'false');

    try {
      if (loaderShown && typeof window.novaHideScreenLoaderWhenReady === 'function') {
        await window.novaHideScreenLoaderWhenReady(function () {
          return panel.classList.contains('open') && rankingBodyReady();
        }, { maxMs: 10000, minVisibleMs: 300 });
        loaderShown = false;
      } else if (typeof window.novaWaitNextPaint === 'function') {
        await window.novaWaitNextPaint();
      }
    } catch (_) {}

    if (loaderShown && typeof window.novaHideScreenLoader === 'function') {
      window.novaHideScreenLoader();
      loaderShown = false;
    }

    if ((now - __rankInfoShownTs) > (5 * 60 * 1000)){
      __rankInfoShownTs = Date.now();
      try{
        if (typeof showAlert === 'function') {
          await showAlert("Sıralamalar her gün saat 00:00'da güncellenmektedir.");
        } else {
          alert("Sıralamalar her gün saat 00:00'da güncellenmektedir.");
        }
      }catch(_){}
    }
  };

  window.closeSeasonRankingPanel = function(){
    var panel = document.getElementById('rankingPanel');
    if (typeof window.novaForceHideScreenLoader === 'function') {
      try { window.novaForceHideScreenLoader(); } catch (_) {}
    }
    if(!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    panel.style.display = 'none';
    panel.style.visibility = '';
    panel.style.pointerEvents = '';
    panel.style.transform = '';
  };
  function bindSeasonRankingButton(){
    var btn = document.getElementById('kupa-siralama-button');
    var panel = document.getElementById('rankingPanel');
    var back = document.getElementById('rankingBackButton');
    if(!btn || !panel) return;

    if(!btn.dataset.novaRankBound){
      btn.dataset.novaRankBound = '1';
      btn.addEventListener('click', function(ev){
        try{ ev.preventDefault(); ev.stopPropagation(); }catch(_){}
        window.openSeasonRankingPanel();
      }, true);
    }

    if(back && !back.dataset.novaRankBound){
      back.dataset.novaRankBound = '1';
      back.addEventListener('click', function(){
        window.closeSeasonRankingPanel();
      }, true);
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindSeasonRankingButton, { once:true });
  } else {
    bindSeasonRankingButton();
  }
  window.addEventListener('load', bindSeasonRankingButton, { once:true });
})();
