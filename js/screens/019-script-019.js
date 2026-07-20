// === Nova Patch: Store Category Ordering (avatar köşeleri) ===
(function () {
  function labelFor(item) {
    if (typeof window.novaAvatarCategoryLabel === 'function') {
      return window.novaAvatarCategoryLabel(item.key || item.display);
    }
    return item.display || item.key || '';
  }

  window.renderStoreCategoryButtons = function renderStoreCategoryButtons() {
    var area = document.querySelector('.profile-categories');
    if (!area) return;

    var keys = [];
    try {
      if (window.photoCategories && typeof window.photoCategories === 'object') {
        keys = keys.concat(Object.keys(window.photoCategories));
      }
    } catch (_) {}
    try {
      if (window.storeCategoryMeta) {
        keys = keys.concat(Object.keys(window.storeCategoryMeta));
      }
    } catch (_) {}

    if (typeof window.novaFilterAvatarStoreKeys === 'function') {
      keys = window.novaFilterAvatarStoreKeys(keys);
    }
    if (!keys.length && typeof window.novaGetDefaultAvatarCategoryKeys === 'function') {
      keys = window.novaGetDefaultAvatarCategoryKeys();
    }
    if (typeof window.novaSortAvatarStoreKeys === 'function') {
      keys = window.novaSortAvatarStoreKeys(keys);
    }
    keys = (keys || []).filter(function (k) { return k && k !== 'duel'; });

    area.style.display = 'flex';
    area.innerHTML = '';

    keys.forEach(function (key, idx) {
      var btn = document.createElement('button');
      btn.className = 'category-button' + (idx === 0 ? ' active' : '');
      btn.dataset.categoryRaw = key;
      btn.dataset.category = key;
      btn.textContent = labelFor({ key: key });
      btn.addEventListener('click', function () {
        if (btn.classList.contains('active')) return;
        document.querySelectorAll('.category-button').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        var photosContainer = document.getElementById('profilePhotosContainer');
        var target = btn.dataset.categoryRaw || btn.dataset.category;
        if (photosContainer) photosContainer.style.display = 'grid';
        if (typeof window.loadProfilePhotos === 'function') {
          window.loadProfilePhotos(target);
        }
      });
      area.appendChild(btn);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    try {
      window.renderStoreCategoryButtons();
    } catch (_) {}
  });
})();
