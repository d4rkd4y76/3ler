/* Mağaza ürün detayı — vitrin tıklanınca büyük önizleme + açıklama + işlem */
(function () {
  var Z = 101350;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureOverlay() {
    if (document.getElementById('nova-store-detail-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'nova-store-detail-overlay';
    ov.className = 'nova-store-detail-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
      '<div class="nova-store-detail-panel" role="dialog" aria-modal="true" aria-labelledby="nova_store_detail_title">'
      + '<button type="button" class="nova-store-detail-close" id="nova_store_detail_close" aria-label="Kapat">✕</button>'
      + '<div class="nova-store-detail-preview" id="nova_store_detail_preview"></div>'
      + '<div class="nova-store-detail-body">'
      + '<p class="nova-store-detail-kicker" id="nova_store_detail_kicker" hidden></p>'
      + '<h2 class="nova-store-detail-title" id="nova_store_detail_title"></h2>'
      + '<p class="nova-store-detail-meta" id="nova_store_detail_meta"></p>'
      + '<p class="nova-store-detail-desc" id="nova_store_detail_desc"></p>'
      + '<div class="nova-store-detail-extra" id="nova_store_detail_extra"></div>'
      + '<div class="nova-store-detail-price" id="nova_store_detail_price"></div>'
      + '<div class="nova-store-detail-actions">'
      + '<span class="nova-store-in-use nova-store-detail-in-use" id="nova_store_detail_inuse" hidden role="status">Kullanımda</span>'
      + '<button type="button" class="nova-store-detail-action nova-store-detail-action--secondary profile-photo-button buy-button" id="nova_store_detail_action_secondary" hidden></button>'
      + '<button type="button" class="nova-store-detail-action" id="nova_store_detail_action"></button>'
      + '</div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closeStoreDetail();
    });
    document.getElementById('nova_store_detail_close').addEventListener('click', closeStoreDetail);
    document.getElementById('nova_store_detail_action').addEventListener('click', onDetailAction);
    var sec = document.getElementById('nova_store_detail_action_secondary');
    if (sec) sec.addEventListener('click', onDetailSecondaryAction);
  }

  function ensureSecondaryButton() {
    var actions = document.querySelector('#nova-store-detail-overlay .nova-store-detail-actions');
    if (!actions || document.getElementById('nova_store_detail_action_secondary')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'nova_store_detail_action_secondary';
    btn.className = 'nova-store-detail-action nova-store-detail-action--secondary profile-photo-button buy-button';
    btn.hidden = true;
    var primary = document.getElementById('nova_store_detail_action');
    if (primary) actions.insertBefore(btn, primary);
    else actions.appendChild(btn);
    btn.addEventListener('click', onDetailSecondaryAction);
  }

  var state = { onAction: null, onSecondaryAction: null, closing: false };

  function closeStoreDetail() {
    var ov = document.getElementById('nova-store-detail-overlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    ov.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nova-store-detail-open');
    document.body.style.overflow = '';
    state.onAction = null;
    state.onSecondaryAction = null;
    var prev = document.getElementById('nova_store_detail_preview');
    if (prev) {
      var h = prev.querySelector('[data-nova-hero-host]');
      if (h && typeof window.novaSpriteUnmountHost === 'function') {
        window.novaSpriteUnmountHost(h, h.getAttribute('data-hero-id') || '');
      } else if (prev) {
        prev.innerHTML = '';
      }
    }
  }

  async function onDetailAction() {
    var btn = document.getElementById('nova_store_detail_action');
    if (!btn || btn.disabled || typeof state.onAction !== 'function') return;
    btn.disabled = true;
    var sec = document.getElementById('nova_store_detail_action_secondary');
    if (sec) sec.disabled = true;
    try {
      await state.onAction();
    } catch (e) {
      console.error('store detail action', e);
    }
    btn.disabled = false;
    if (sec) sec.disabled = !!sec.getAttribute('data-nova-sec-disabled');
  }

  async function onDetailSecondaryAction() {
    var btn = document.getElementById('nova_store_detail_action_secondary');
    if (!btn || btn.hidden || btn.disabled || typeof state.onSecondaryAction !== 'function') return;
    btn.disabled = true;
    var primary = document.getElementById('nova_store_detail_action');
    if (primary) primary.disabled = true;
    try {
      await state.onSecondaryAction();
    } catch (e) {
      console.error('store detail secondary', e);
    }
    btn.disabled = !!btn.getAttribute('data-nova-sec-disabled');
    if (primary) primary.disabled = !!primary.getAttribute('data-nova-primary-disabled');
  }

  function applyButton(btnType, text, disabled, inUse) {
    var btn = document.getElementById('nova_store_detail_action');
    var label = document.getElementById('nova_store_detail_inuse');
    if (!btn) return;
    if (label) {
      label.hidden = true;
      label.style.display = 'none';
    }
    if (inUse) {
      btn.hidden = false;
      btn.style.display = '';
      btn.className = 'nova-store-detail-action profile-photo-button use-button nova-store-in-use-btn';
      btn.textContent = 'Kullanılıyor';
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      state.onAction = null;
      return;
    }
    btn.hidden = false;
    btn.style.display = '';
    btn.removeAttribute('aria-disabled');
    btn.className = 'nova-store-detail-action profile-photo-button ' + (btnType || 'buy-button');
    btn.textContent = text || 'Tamam';
    btn.disabled = !!disabled;
    if (disabled) btn.setAttribute('data-nova-primary-disabled', '1');
    else btn.removeAttribute('data-nova-primary-disabled');
  }

  function applySecondaryButton(btnType, text, disabled) {
    ensureSecondaryButton();
    var btn = document.getElementById('nova_store_detail_action_secondary');
    if (!btn) return;
    if (!text) {
      btn.hidden = true;
      btn.style.display = 'none';
      state.onSecondaryAction = null;
      return;
    }
    btn.hidden = false;
    btn.style.display = '';
    btn.className = 'nova-store-detail-action nova-store-detail-action--secondary profile-photo-button ' + (btnType || 'buy-button');
    btn.textContent = text;
    btn.disabled = !!disabled;
    if (disabled) btn.setAttribute('data-nova-sec-disabled', '1');
    else btn.removeAttribute('data-nova-sec-disabled');
  }

  function openStoreDetail(opts) {
    opts = opts || {};
    ensureOverlay();
    ensureSecondaryButton();
    state.onAction = opts.onAction || null;
    state.onSecondaryAction = opts.onSecondaryAction || null;

    var resetBtn = document.getElementById('nova_store_detail_action');
    var resetLabel = document.getElementById('nova_store_detail_inuse');
    if (resetLabel) {
      resetLabel.hidden = true;
      resetLabel.style.display = 'none';
    }
    if (resetBtn) {
      resetBtn.hidden = false;
      resetBtn.style.display = '';
    }

    var ov = document.getElementById('nova-store-detail-overlay');
    var preview = document.getElementById('nova_store_detail_preview');
    var kicker = document.getElementById('nova_store_detail_kicker');
    var title = document.getElementById('nova_store_detail_title');
    var meta = document.getElementById('nova_store_detail_meta');
    var desc = document.getElementById('nova_store_detail_desc');
    var extra = document.getElementById('nova_store_detail_extra');
    var price = document.getElementById('nova_store_detail_price');

    if (preview) {
      preview.className = 'nova-store-detail-preview' + (opts.previewClass ? ' ' + opts.previewClass : '');
      preview.innerHTML = opts.previewHtml || '';
      if (typeof opts.mountPreview === 'function') {
        var mountFn = opts.mountPreview;
        requestAnimationFrame(function () {
          var box = document.getElementById('nova_store_detail_preview');
          if (box) mountFn(box);
        });
      }
    }

    if (kicker) {
      if (opts.kicker) {
        kicker.textContent = opts.kicker;
        kicker.hidden = false;
      } else kicker.hidden = true;
    }
    if (title) title.textContent = opts.title || 'Ürün';
    if (meta) {
      meta.textContent = opts.meta || '';
      meta.hidden = !opts.meta;
    }
    if (desc) {
      desc.textContent = opts.desc || '';
      desc.hidden = !opts.desc;
    }
    if (extra) {
      extra.innerHTML = opts.extraHtml || '';
      extra.hidden = !opts.extraHtml;
    }
    if (price) {
      price.innerHTML = opts.priceHtml || '';
      price.hidden = !opts.priceHtml;
    }

    applyButton(opts.btnClass, opts.btnText, opts.btnDisabled, !!opts.inUse);
    applySecondaryButton(opts.secondaryBtnClass, opts.secondaryBtnText, opts.secondaryBtnDisabled);

    document.body.appendChild(ov);
    ov.style.zIndex = String(Z);
    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nova-store-detail-open');
    document.body.style.overflow = 'hidden';
    if (typeof opts.onOpened === 'function') {
      requestAnimationFrame(function () {
        try { opts.onOpened(); } catch (_) {}
      });
    }
  }

  function bindCardOpenDetail(card, openFn) {
    if (!card || card.__novaDetailBound) return;
    card.__novaDetailBound = true;
    card.classList.add('nova-store-card--tappable');
    card.addEventListener('click', function (e) {
      if (e.target.closest('.profile-photo-button')) return;
      openFn();
    });
  }

  function patchPhotoCards() {
    if (typeof createPhotoCard !== 'function' || createPhotoCard.__novaDetailPatched) return;
    var orig = createPhotoCard;
    window.createPhotoCard = function (photo, purchasedPhotos, category, container, index) {
      var div = orig.apply(this, arguments);
      if (!div || !photo) return div;
      var encodedUrl = btoa(photo.url);
      var isPurchased = !!purchasedPhotos[encodedUrl];
      bindCardOpenDetail(div, function () {
        var livePurchased = isPurchased;
        try {
          if (typeof purchasedPhotos === 'object' && photo && photo.url) {
            livePurchased = !!purchasedPhotos[btoa(photo.url)];
          }
        } catch (_) {}
        var isActive = !!(livePurchased && typeof isStoreAvatarActive === 'function' && isStoreAvatarActive(photo.url));
        openStoreDetail({
          kicker: (typeof window.novaAvatarCategoryLabel === 'function' ? window.novaAvatarCategoryLabel(category) : category) || 'Avatar',
          title: photo.name || 'Avatar',
          desc: photo.desc || 'Profilinde kullanabileceğin özel avatar.',
          priceHtml: livePurchased ? '' : (photo.price + ' <span class="diamond-icon">💎</span>'),
          previewClass: 'nova-store-detail-preview--avatar',
          previewHtml: '<div class="nova-store-preview nova-store-preview--avatar nova-store-detail-vitrine">'
            + '<img src="' + esc(photo.url) + '" class="profile-photo nova-store-avatar-img" alt="">'
            + '</div>',
          btnClass: livePurchased ? 'use-button' : 'buy-button',
          btnText: livePurchased ? 'Kullan' : 'Satın Al',
          btnDisabled: !!(livePurchased && isActive),
          inUse: isActive,
          onAction: async function () {
            if (isActive) {
              closeStoreDetail();
              return;
            }
            if (livePurchased) await useProfilePhoto(photo.url);
            else await buyProfilePhoto(photo);
            closeStoreDetail();
            if (typeof window.novaRefreshStoreInPlace === 'function') {
              window.novaRefreshStoreInPlace();
            } else if (typeof loadProfilePhotos === 'function') {
              loadProfilePhotos(category);
            }
          }
        });
      });
      return div;
    };
    window.createPhotoCard.__novaDetailPatched = true;
  }

  function patchCharInvTabs() {
    if (document.body.__novaCharHeroTabBound) return;
    document.body.__novaCharHeroTabBound = true;
    document.querySelectorAll('[data-char-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-char-tab');
        var pPhotos = document.getElementById('char_inv_panel_photos');
        var pFrames = document.getElementById('char_inv_panel_frames');
        var pHeroes = document.getElementById('char_inv_panel_heroes');
        if (pPhotos) pPhotos.hidden = tab !== 'photos';
        if (pFrames) pFrames.hidden = tab !== 'frames';
        if (pHeroes) pHeroes.hidden = tab !== 'heroes';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    patchPhotoCards();
    patchCharInvTabs();
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var ov = document.getElementById('nova-store-detail-overlay');
      if (ov && ov.classList.contains('is-open')) closeStoreDetail();
    });
  });

  window.novaOpenStoreDetail = openStoreDetail;
  window.novaCloseStoreDetail = closeStoreDetail;
  window.novaBindStoreCardDetail = bindCardOpenDetail;
})();
