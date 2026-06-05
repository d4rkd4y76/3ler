/* Ana ekran — öğe slotlarında hafif "yükleniyor…" (layout bozulmaz) */
(function () {
  'use strict';

  var pollTimer = 0;
  var pollCount = 0;
  var MAX_POLL = 48;

  var SLOT_LABELS = {
    hero: 'kahraman yükleniyor…',
    photo: 'yükleniyor…',
    name: 'yükleniyor…',
    rank: 'yükleniyor…',
    cup: 'yükleniyor…',
    credits: 'yükleniyor…',
    diamond: 'yükleniyor…'
  };

  function getStatus() {
    if (typeof window.novaMainScreenSlotStatus === 'function') {
      try {
        return window.novaMainScreenSlotStatus();
      } catch (_) {}
    }
    return {};
  }

  function ensureLabel(host, text) {
    if (!host) return;
    var lbl = host.querySelector('.nova-slot-loading-label');
    if (!lbl) {
      lbl = document.createElement('span');
      lbl.className = 'nova-slot-loading-label';
      lbl.setAttribute('aria-hidden', 'true');
      host.appendChild(lbl);
    }
    lbl.textContent = text || 'yükleniyor…';
  }

  function clearLabel(host) {
    if (!host) return;
    host.classList.remove('nova-slot-pending', 'nova-slot-pending--hero');
    var lbl = host.querySelector('.nova-slot-loading-label');
    if (lbl) lbl.remove();
  }

  function syncHost(host, ready, labelText, heroSlot) {
    if (!host) return;
    if (ready) {
      clearLabel(host);
      return;
    }
    host.classList.add('nova-slot-pending');
    if (heroSlot) host.classList.add('nova-slot-pending--hero');
    ensureLabel(host, labelText);
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
    syncHost(photoHost(), !!st.photo, SLOT_LABELS.photo);
    syncHost(document.getElementById('student-name-stage'), !!st.name, SLOT_LABELS.name);
    syncHost(document.getElementById('student-rank'), !!st.rank, SLOT_LABELS.rank);
    syncHost(document.getElementById('nova-main-hero-slot'), !!st.hero, SLOT_LABELS.hero, true);
    syncHost(document.querySelector('.trophy-stats'), !!st.cup, SLOT_LABELS.cup);
    syncHost(document.querySelector('.credits-stats'), !!st.credits, SLOT_LABELS.credits);
    syncHost(document.querySelector('.diamond-stats'), !!st.diamond, SLOT_LABELS.diamond);
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
      if (typeof window.novaBonusDrawerSetOpen === 'function') {
        try {
          window.novaBonusDrawerSetOpen(false);
        } catch (_) {}
      }
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
