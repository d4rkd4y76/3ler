/* Bağlantı kalitesi — yavaş / kesik internet uyarısı */
(function () {
  'use strict';

  var banner = null;
  var hideTimer = 0;
  var lastShown = '';

  function ensureBanner() {
    if (banner) return banner;
    banner = document.createElement('div');
    banner.id = 'nova_network_watch_banner';
    banner.className = 'nova-network-watch-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.hidden = true;
    document.body.appendChild(banner);
    return banner;
  }

  function hideBanner() {
    if (!banner) return;
    banner.hidden = true;
    banner.setAttribute('hidden', '');
    document.body.classList.remove('nova-network-watch-visible');
    lastShown = '';
  }

  function showBanner(message) {
    if (!message || message === lastShown) return;
    lastShown = message;
    var el = ensureBanner();
    el.textContent = message;
    el.hidden = false;
    el.removeAttribute('hidden');
    document.body.classList.add('nova-network-watch-visible');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideBanner, 12000);
  }

  function connectionInfo() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return null;
    return {
      effectiveType: c.effectiveType || '',
      downlink: typeof c.downlink === 'number' ? c.downlink : null,
      saveData: !!c.saveData,
      rtt: typeof c.rtt === 'number' ? c.rtt : null
    };
  }

  function isSlowConnection() {
    if (!navigator.onLine) return true;
    var info = connectionInfo();
    if (!info) return false;
    if (info.saveData) return true;
    if (info.effectiveType === 'slow-2g' || info.effectiveType === '2g') return true;
    if (info.downlink != null && info.downlink > 0 && info.downlink < 0.45) return true;
    if (info.rtt != null && info.rtt > 900) return true;
    return false;
  }

  function evaluateNetwork() {
    if (!navigator.onLine) {
      showBanner('İnternet bağlantınız yok. Uygulamanın düzgün çalışması için bağlantınızı kontrol edin.');
      return;
    }
    if (isSlowConnection()) {
      showBanner('İnternet hızınız düşük. Uygulamanın akıcı çalışması için daha iyi çeken bir yere geçiniz.');
      return;
    }
    hideBanner();
  }

  window.novaEvaluateNetworkQuality = evaluateNetwork;

  window.addEventListener('online', function () {
    hideBanner();
    setTimeout(evaluateNetwork, 400);
  });
  window.addEventListener('offline', evaluateNetwork);

  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', evaluateNetwork);
    }
  } catch (_) {}

  document.addEventListener('nova:sprite-boot-complete', evaluateNetwork, { once: true });
  document.addEventListener('nova:main-screen-visible', evaluateNetwork);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluateNetwork, { once: true });
  } else {
    setTimeout(evaluateNetwork, 800);
  }
})();
