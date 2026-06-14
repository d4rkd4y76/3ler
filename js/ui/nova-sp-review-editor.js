/* Soru kontrol modu — tek soru düzenleme (admin panel editörü ile aynı araçlar) */
(function () {
  'use strict';

  var activeOverlay = null;

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function questionEditorHtml(q) {
    if (window.NovaAdminQuestionEditor) {
      return (
        window.NovaAdminQuestionEditor.enhancedEditorHtml(q, 'q', { explanation: true }) +
        '<div class="nova-sp-review-editor-actions sticky-actions">' +
        '<button type="button" class="btn" id="novaSpReviewCancel">İptal</button>' +
        '<button type="button" class="btn ok" id="novaSpReviewSave">💾 Kaydet</button>' +
        '</div>'
      );
    }
    var questionText =
      typeof q.question === 'object' ? q.question.text || '' : q.question || '';
    var questionInfo =
      typeof q.question === 'object' ? q.question.info || '' : q.info || '';
    return (
      '<div class="grid cols-2">' +
      '<div class="col" style="flex-basis:100%"><label>Soru Metni</label><textarea id="q_text">' +
      escHtml(questionText) +
      '</textarea></div>' +
      '<div class="col" style="flex-basis:100%"><label>Öncül (ops.)</label><textarea id="q_info">' +
      escHtml(questionInfo) +
      '</textarea></div>' +
      '<div><label>Doğru</label><input id="q_correct" type="text" value="' +
      escHtml(q.correct || '') +
      '"></div>' +
      '<div><label>Yanlış 1</label><input id="q_wrong1" type="text" value="' +
      escHtml(q.wrong1 || '') +
      '"></div>' +
      '<div><label>Yanlış 2</label><input id="q_wrong2" type="text" value="' +
      escHtml(q.wrong2 || '') +
      '"></div>' +
      '<div class="col" style="flex-basis:100%"><label>Açıklama</label><textarea id="q_exp">' +
      escHtml(q.explanation || '') +
      '</textarea></div>' +
      '</div>' +
      '<div class="nova-sp-review-editor-actions sticky-actions">' +
      '<button type="button" class="btn" id="novaSpReviewCancel">İptal</button>' +
      '<button type="button" class="btn ok" id="novaSpReviewSave">💾 Kaydet</button>' +
      '</div>'
    );
  }

  function readPayload(dlg) {
    if (window.NovaAdminQuestionEditor) {
      return window.NovaAdminQuestionEditor.readQuestionPayload(dlg, 'q', { explanation: true });
    }
    return {
      question: {
        text: dlg.querySelector('#q_text').value.trim(),
        info: dlg.querySelector('#q_info').value.trim() || null,
      },
      correct: dlg.querySelector('#q_correct').value.trim(),
      wrong1: dlg.querySelector('#q_wrong1').value.trim(),
      wrong2: dlg.querySelector('#q_wrong2').value.trim(),
      explanation: dlg.querySelector('#q_exp').value.trim() || null,
    };
  }

  function wireEditor(dlg) {
    if (window.NovaAdminQuestionEditor) {
      window.NovaAdminQuestionEditor.wireEditor(dlg, 'q', { explanation: true });
    }
  }

  function closeOverlay() {
    if (activeOverlay && activeOverlay.parentNode) {
      activeOverlay.parentNode.removeChild(activeOverlay);
    }
    activeOverlay = null;
    document.body.classList.remove('nova-sp-review-editor-open');
  }

  function applyQuestionToGame(index, raw, qid) {
    var fmt = window.__novaFormatHwQuestionFromRaw;
    if (typeof fmt !== 'function' || !raw) return false;
    var fq = fmt(raw);
    if (!fq) return false;
    fq.__qid = qid;
    var list = window.gameQuestions;
    if (!Array.isArray(list)) return false;
    list[index] = fq;
    window.gameQuestions = list;
    return true;
  }

  async function openNovaSpReviewQuestionEditor(qid, questionIndex) {
    if (!window.NOVA_SP_REVIEW_MODE) return;
    var ctx = window.NOVA_SP_REVIEW_CTX;
    if (!ctx || !ctx.headingId || !ctx.lessonId || !ctx.topicId) {
      if (typeof showAlert === 'function') showAlert('Konu bilgisi eksik.');
      return;
    }
    if (!qid && Array.isArray(ctx.questionIds)) {
      qid = ctx.questionIds[questionIndex];
    }
    if (!qid) {
      if (typeof showAlert === 'function') showAlert('Soru kimliği bulunamadı.');
      return;
    }
    var db = typeof database !== 'undefined' ? database : null;
    if (!db || !db.ref) {
      try { db = firebase.database(); } catch (_) {}
    }
    if (!db || !db.ref) {
      if (typeof showAlert === 'function') showAlert('Veritabanı bağlantısı yok.');
      return;
    }

    closeOverlay();
    document.body.classList.add('nova-sp-review-editor-open');

    var overlay = document.createElement('div');
    overlay.className = 'nova-sp-review-editor-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Soru düzenle');

    var panel = document.createElement('div');
    panel.className = 'nova-sp-review-editor-panel card';
    panel.innerHTML =
      '<button type="button" class="nova-sp-review-editor-close dlg-x" title="Kapat" aria-label="Kapat">✕</button>' +
      '<header class="nova-sp-review-editor-head">' +
      '<h3>Soru Düzenle</h3>' +
      '<p class="nova-sp-review-editor-meta">Soru ' +
      (Number(questionIndex) + 1) +
      ' · <span class="mono">' +
      escHtml(qid) +
      '</span></p>' +
      '</header>' +
      '<div class="nova-sp-review-editor-body"><p class="nova-sp-review-editor-loading">Yükleniyor…</p></div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    activeOverlay = overlay;

    var path =
      'championData/headings/' +
      ctx.headingId +
      '/lessons/' +
      ctx.lessonId +
      '/topics/' +
      ctx.topicId +
      '/questions/' +
      qid;

    var body = panel.querySelector('.nova-sp-review-editor-body');
    var data = null;
    try {
      var snap = await db.ref(path).once('value');
      data = snap.exists()
        ? snap.val()
        : { question: '', correct: '', wrong1: '', wrong2: '', explanation: '' };
    } catch (err) {
      console.error('[soru-kontrol] soru okunamadı:', err);
      if (typeof showAlert === 'function') showAlert('Soru yüklenemedi.');
      closeOverlay();
      return;
    }

    body.innerHTML = questionEditorHtml(data);
    wireEditor(panel);

    function onCancel() {
      closeOverlay();
    }

    panel.querySelector('.nova-sp-review-editor-close').addEventListener('click', onCancel);
    panel.querySelector('#novaSpReviewCancel').addEventListener('click', onCancel);
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) onCancel();
    });

    panel.querySelector('#novaSpReviewSave').addEventListener('click', async function () {
      var payload = readPayload(panel);
      var qText =
        payload.question && payload.question.text
          ? payload.question.text
          : typeof payload.question === 'string'
            ? payload.question
            : '';
      if (!String(qText || '').trim()) {
        if (typeof showAlert === 'function') showAlert('Soru metnini yazınız.');
        return;
      }

      var saveBtn = panel.querySelector('#novaSpReviewSave');
      var prevLabel = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Kaydediliyor…';

      try {
        await db.ref(path).update(payload);
        if (typeof window.novaInvalidateReadValCache === 'function') {
          window.novaInvalidateReadValCache(path);
        }
        var freshSnap = await db.ref(path).once('value');
        var freshRaw = freshSnap.exists() ? freshSnap.val() : payload;
        applyQuestionToGame(questionIndex, freshRaw, qid);
        closeOverlay();
        if (typeof window.displayCurrentQuestion === 'function') {
          window.displayCurrentQuestion();
        }
        if (typeof showAlert === 'function') showAlert('Soru kaydedildi.');
      } catch (saveErr) {
        console.error('[soru-kontrol] kayıt hatası:', saveErr);
        if (typeof showAlert === 'function') showAlert('Kayıt sırasında hata oluştu.');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = prevLabel;
      }
    });
  }

  window.novaOpenSpReviewQuestionEditor = openNovaSpReviewQuestionEditor;
  window.novaCloseSpReviewQuestionEditor = closeOverlay;
})();
