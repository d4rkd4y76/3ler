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
    if (typeof window.novaEpicDragonBadgeMount === 'function') {
      return window.novaEpicDragonBadgeMount(parent, id, mod);
    }
    return null;
  }

  function unmountBadge(parent) {
    if (typeof window.novaEpicDragonBadgeUnmount === 'function') {
      window.novaEpicDragonBadgeUnmount(parent);
    }
  }

  function refreshMainBadge(heroId, visible) {
    if (typeof window.novaEpicDragonBadgeRefreshMain === 'function') {
      window.novaEpicDragonBadgeRefreshMain(heroId, visible);
    }
  }

  window.novaIsEpicDragonHero = isEpic;
  window.novaEpicDragonMountSprite = mountSprite;
  window.novaEpicDragonUnmountSprite = unmountSprite;
  window.novaEpicDragonMountBadge = mountBadge;
  window.novaEpicDragonUnmountBadge = unmountBadge;
  window.novaEpicDragonRefreshMainBadge = refreshMainBadge;
})();
