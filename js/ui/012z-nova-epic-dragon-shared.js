/* Epik ejder kahramanları — ortak yardımcılar (Buz + Alev + Gece) */
(function () {
  'use strict';

  function isEpic(id) {
    return id === 'buz_ejder' || id === 'alev_ejder' || id === 'gece_ejder';
  }

  function mountSprite(host, id, opts) {
    if (id === 'buz_ejder' && typeof window.novaBuzEjderMountSprite === 'function') {
      return window.novaBuzEjderMountSprite(host, opts);
    }
    if (id === 'alev_ejder' && typeof window.novaAlevEjderMountSprite === 'function') {
      return window.novaAlevEjderMountSprite(host, opts);
    }
    if (id === 'gece_ejder' && typeof window.novaGeceEjderMountSprite === 'function') {
      return window.novaGeceEjderMountSprite(host, opts);
    }
    return null;
  }

  function unmountSprite(host, id) {
    if (id === 'buz_ejder' && typeof window.novaBuzEjderUnmountSprite === 'function') {
      window.novaBuzEjderUnmountSprite(host);
    } else if (id === 'alev_ejder' && typeof window.novaAlevEjderUnmountSprite === 'function') {
      window.novaAlevEjderUnmountSprite(host);
    } else if (id === 'gece_ejder' && typeof window.novaGeceEjderUnmountSprite === 'function') {
      window.novaGeceEjderUnmountSprite(host);
    }
  }

  function mountBadge(parent, id, mod) {
    if (id === 'buz_ejder' && typeof window.novaBuzEjderMountEpicBadge === 'function') {
      return window.novaBuzEjderMountEpicBadge(parent, mod);
    }
    if (id === 'alev_ejder' && typeof window.novaAlevEjderMountEpicBadge === 'function') {
      return window.novaAlevEjderMountEpicBadge(parent, mod);
    }
    if (id === 'gece_ejder' && typeof window.novaGeceEjderMountEpicBadge === 'function') {
      return window.novaGeceEjderMountEpicBadge(parent, mod);
    }
    return null;
  }

  function unmountBadge(parent) {
    if (typeof window.novaBuzEjderUnmountEpicBadge === 'function') {
      window.novaBuzEjderUnmountEpicBadge(parent);
    }
    if (typeof window.novaAlevEjderUnmountEpicBadge === 'function') {
      window.novaAlevEjderUnmountEpicBadge(parent);
    }
    if (typeof window.novaGeceEjderUnmountEpicBadge === 'function') {
      window.novaGeceEjderUnmountEpicBadge(parent);
    }
  }

  function refreshMainBadge(heroId, visible) {
    if (typeof window.novaBuzEjderRefreshMainEpicBadge === 'function') {
      window.novaBuzEjderRefreshMainEpicBadge(heroId === 'buz_ejder', visible);
    }
    if (typeof window.novaAlevEjderRefreshMainEpicBadge === 'function') {
      window.novaAlevEjderRefreshMainEpicBadge(heroId === 'alev_ejder', visible);
    }
    if (typeof window.novaGeceEjderRefreshMainEpicBadge === 'function') {
      window.novaGeceEjderRefreshMainEpicBadge(heroId === 'gece_ejder', visible);
    }
  }

  window.novaIsEpicDragonHero = isEpic;
  window.novaEpicDragonMountSprite = mountSprite;
  window.novaEpicDragonUnmountSprite = unmountSprite;
  window.novaEpicDragonMountBadge = mountBadge;
  window.novaEpicDragonUnmountBadge = unmountBadge;
  window.novaEpicDragonRefreshMainBadge = refreshMainBadge;
})();
