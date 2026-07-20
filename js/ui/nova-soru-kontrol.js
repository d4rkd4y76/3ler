/* Yönetici — konu bazlı tüm soruları tek kişilik oyun arayüzünde inceleme */
(function () {
  'use strict';

  function isAdminPortalUser() {
    try {
      var s = typeof selectedStudent !== 'undefined' ? selectedStudent : window.selectedStudent;
      return !!(s && s.classId && s.studentId && s.adminPortal);
    } catch (_) {
      return false;
    }
  }

  function applyReviewSelectUi(on) {
    var sp = document.getElementById('single-player-screen');
    var title = sp && sp.querySelector('.nova-sp-screen-title');
    var startBtn = document.getElementById('start-game-button');
    if (title) title.textContent = on ? 'SORU KONTROL' : 'TEK KİŞİLİK OYUN';
    if (startBtn) startBtn.textContent = on ? 'Soruları Görüntüle' : 'Oyuna Başla';
    if (sp) sp.classList.toggle('nova-sp-review-mode', !!on);
    var game = document.getElementById('single-player-game-screen');
    if (game) game.classList.toggle('nova-sp-review-mode', !!on);
  }

  function enterReviewMode() {
    window.NOVA_SP_REVIEW_MODE = true;
    applyReviewSelectUi(true);
  }

  function exitReviewMode() {
    window.NOVA_SP_REVIEW_MODE = false;
    window.NOVA_SP_REVIEW_CTX = null;
    try {
      if (typeof window.novaCloseSpReviewQuestionEditor === 'function') {
        window.novaCloseSpReviewQuestionEditor();
      }
    } catch (_) {}
    try {
      if (window.NOVA_Q_LIMIT_REVIEW_BACKUP != null) {
        window.NOVA_Q_LIMIT = window.NOVA_Q_LIMIT_REVIEW_BACKUP;
      } else {
        window.NOVA_Q_LIMIT = null;
      }
    } catch (_) {}
    window.NOVA_Q_LIMIT_REVIEW_BACKUP = null;
    applyReviewSelectUi(false);
  }

  function updateSoruKontrolBtn() {
    var slot = document.getElementById('nova_soru_kontrol_slot');
    var btn = document.getElementById('nova_soru_kontrol_btn');
    var ok = isAdminPortalUser();
    if (slot) slot.hidden = !ok;
    if (btn) btn.hidden = !ok;
  }

  function bindSoruKontrolBtnOnce() {
    var btn = document.getElementById('nova_soru_kontrol_btn');
    if (!btn || btn.dataset.novaBound) return;
    btn.dataset.novaBound = '1';
    btn.addEventListener('click', function () {
      if (!isAdminPortalUser()) return;
      openSoruKontrolSelectScreen();
    });
  }

  function resetReviewSelectForm() {
    if (typeof window.novaUnlockSpReviewClassSelect === 'function') {
      window.novaUnlockSpReviewClassSelect();
    }
    var classSelect = document.getElementById('class-select');
    var subjectSelect = document.getElementById('subject-select');
    var topicSelect = document.getElementById('topic-select');
    if (classSelect) {
      classSelect.innerHTML = '<option value="">Seçiniz</option>';
      classSelect.value = '';
      classSelect.disabled = false;
      delete classSelect.dataset.novaSpClassLocked;
      delete classSelect.dataset.novaLockedHeadingId;
      delete classSelect.dataset.novaLockedLabel;
      var classWrap = classSelect.closest('.nova-game-select');
      if (classWrap) {
        classWrap.classList.remove('nova-game-select--locked', 'nova-game-select--filled');
        classWrap.classList.add('nova-game-select--empty');
      }
    }
    if (subjectSelect) {
      subjectSelect.innerHTML = '<option value="">Seçiniz</option>';
      subjectSelect.value = '';
      var subjectWrap = subjectSelect.closest('.nova-game-select');
      if (subjectWrap) {
        subjectWrap.classList.remove('nova-game-select--filled', 'nova-game-select--curriculum-value');
        subjectWrap.classList.add('nova-game-select--empty');
      }
    }
    if (topicSelect) {
      topicSelect.innerHTML = '<option value="">Seçiniz</option>';
      topicSelect.value = '';
      var topicWrap = topicSelect.closest('.nova-game-select');
      if (topicWrap) {
        topicWrap.classList.remove('nova-game-select--filled', 'nova-game-select--curriculum-value');
        topicWrap.classList.add('nova-game-select--empty');
      }
    }
    ['class-select', 'subject-select', 'topic-select'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && typeof window.novaRefreshGameSelectMenu === 'function') {
        window.novaRefreshGameSelectMenu(el);
      }
    });
    var startBtn = document.getElementById('start-game-button');
    if (startBtn) {
      startBtn.classList.remove('active');
      startBtn.disabled = true;
    }
  }

  async function openSoruKontrolSelectScreen() {
    if (!isAdminPortalUser()) return;
    enterReviewMode();
    resetReviewSelectForm();
    if (window.NovaCurriculumSort && typeof window.NovaCurriculumSort.clearChampionUiCaches === 'function') {
      window.NovaCurriculumSort.clearChampionUiCaches();
    }
    try {
      if (typeof window.fetchChampionData === 'function') await window.fetchChampionData();
    } catch (_) {}
    if (typeof window.novaUnlockSpReviewClassSelect === 'function') {
      window.novaUnlockSpReviewClassSelect();
    }
    try {
      if (typeof window.novaCheckSinglePlayerSelections === 'function') {
        window.novaCheckSinglePlayerSelections();
      }
    } catch (_) {}
    if (typeof window.novaOpenSinglePlayerSelectScreen === 'function') {
      window.novaOpenSinglePlayerSelectScreen();
    } else {
      var main = document.getElementById('main-screen');
      var sp = document.getElementById('single-player-screen');
      if (main) main.style.setProperty('display', 'none', 'important');
      if (sp) sp.style.display = 'flex';
    }
    try {
      if (typeof window.novaEnhanceGameSelects === 'function') {
        window.novaEnhanceGameSelects(document.getElementById('single-player-screen'));
      }
    } catch (_) {}
    try {
      var list = window.__novaChampionHeadingsList;
      if (list && list.length && typeof window.fetchChampionData === 'function') {
        await window.fetchChampionData();
      }
    } catch (_) {}
    if (typeof window.novaUnlockSpReviewClassSelect === 'function') {
      window.novaUnlockSpReviewClassSelect();
    }
    ['class-select', 'subject-select', 'topic-select'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && typeof window.novaRefreshGameSelectMenu === 'function') {
        window.novaRefreshGameSelectMenu(el);
      }
    });
    try {
      if (typeof window.novaCheckSinglePlayerSelections === 'function') {
        window.novaCheckSinglePlayerSelections();
      }
    } catch (_) {}
  }

  window.novaIsAdminPortalUser = isAdminPortalUser;
  window.novaEnterSpReviewMode = enterReviewMode;
  window.novaExitSpReviewMode = exitReviewMode;
  window.novaUpdateSoruKontrolBtn = updateSoruKontrolBtn;
  window.novaBindSoruKontrolBtnOnce = bindSoruKontrolBtnOnce;
  window.novaOpenSoruKontrolSelectScreen = openSoruKontrolSelectScreen;

  var origUpdateAdmin = window.novaUpdateAdminPortalBtn;
  window.novaUpdateAdminPortalBtn = function () {
    if (typeof origUpdateAdmin === 'function') origUpdateAdmin();
    updateSoruKontrolBtn();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindSoruKontrolBtnOnce();
      updateSoruKontrolBtn();
    });
  } else {
    bindSoruKontrolBtnOnce();
    updateSoruKontrolBtn();
  }
})();
