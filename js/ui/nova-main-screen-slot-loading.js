/* Ana ekran — öğe slotlarında hafif "yükleniyor…" (layout bozulmaz) */
(function () {
  'use strict';

  var pollTimer = 0;
  var pollCount = 0;
  var MAX_POLL = 48;

  function getStatus() {
    if (typeof window.novaMainScreenSlotStatus === 'function') {
      try {
        return window.novaMainScreenSlotStatus();
      } catch (_) {}
    }
    return {};
  }

  function ensureLabel(host) {
    if (!host || host.querySelector('.nova-slot-loading-label')) return;
    var span = document.createElement('span');
    span.className = 'nova-slot-loading-label';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = 'yükleniyor…';
    host.appendChild(span);
  }

  function clearLabel(host) {
    if (!host) return;
    host.classList.remove('nova-slot-pending');
    var lbl = host.querySelector('.nova-slot-loading-label');
    if (lbl) lbl.remove();
  }

  function syncHost(host, ready) {
    if (!host) return;
    if (ready) {
      clearLabel(host);
      return;
    }
    host.classList.add('nova-slot-pending');
    ensureLabel(host);
  }

  function photoHost() {
    var photo = document.getElementById('student-photo');
    if (!photo || !photo.parentElement) return null;
    var parent = photo.parentElement;
    parent.classList.add('nova-slot-photo-host');
    return parent;
  }

  window.novaSyncMainSlotPlaceholders = function () {
    var st = getStatus();
    syncHost(photoHost(), !!st.photo);
    syncHost(document.getElementById('student-name-stage'), !!st.name);
    syncHost(document.getElementById('student-rank'), !!st.rank);
    syncHost(document.getElementById('nova-main-hero-slot'), !!st.hero);
    syncHost(document.querySelector('.trophy-stats'), !!st.cup);
    syncHost(document.querySelector('.credits-stats'), !!st.credits);
    syncHost(document.querySelector('.diamond-stats'), !!st.diamond);
    return st;
  };

  window.novaActivateMainSlotPlaceholders = function () {
    window.novaSyncMainSlotPlaceholders();
    window.__novaMainSlotPlaceholdersActive = true;
    try {
      document.body.classList.add('nova-main-slots-loading');
    } catch (_) {}
    startLightPoll();
  };

  window.novaDeactivateMainSlotPlaceholders = function () {
    window.__novaMainSlotPlaceholdersActive = false;
    stopLightPoll();
    var hosts = document.querySelectorAll('.nova-slot-pending');
    for (var i = 0; i < hosts.length; i++) clearLabel(hosts[i]);
    try {
      document.body.classList.remove('nova-main-slots-loading');
    } catch (_) {}
  };

  function stopLightPoll() {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = 0;
    pollCount = 0;
  }

  function startLightPoll() {
    stopLightPoll();
    pollCount = 0;
    function tick() {
      if (!window.__novaMainSlotPlaceholdersActive) return;
      var st = window.novaSyncMainSlotPlaceholders();
      var allReady = true;
      if (st) {
        var keys = ['photo', 'name', 'rank', 'cup', 'credits', 'hero'];
        for (var i = 0; i < keys.length; i++) {
          if (st[keys[i]] === false) {
            allReady = false;
            break;
          }
        }
      }
      if (allReady || pollCount >= MAX_POLL) {
        window.novaDeactivateMainSlotPlaceholders();
        return;
      }
      pollCount += 1;
      pollTimer = setTimeout(tick, 520);
    }
    pollTimer = setTimeout(tick, 520);
  }

  document.addEventListener(
    'nova:sprite-boot-complete',
    function () {
      if (!window.__novaMainSlotPlaceholdersActive) {
        window.novaActivateMainSlotPlaceholders();
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'nova:main-screen-ready',
    function () {
      window.novaDeactivateMainSlotPlaceholders();
    },
    { passive: true }
  );
})();
