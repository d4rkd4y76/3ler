/**
 * Admin soru editörü — sade düzen, tek kesir çubuğu, serbest öncül + isteğe bağlı maddeler
 */
(function (global) {
  const NQM = function () {
    return global.NovaQuestionMarkup;
  };

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function splitPreambleForEdit(info, infoItems) {
    const mq = NQM();
    const raw = String(info || "").trim();
    if (!mq) return { freeText: raw, multiRows: [], useMulti: false };

    const items = mq.parsePreambleItems(info, infoItems);
    const useMulti =
      items.length > 1 || (items.length === 1 && !!items[0].label && /^[IVX]+\.$|^\(\d+\)$/.test(items[0].label));

    if (useMulti) {
      return {
        freeText: "",
        multiRows: items.map(function (it, i) {
          return {
            label: it.label || (["I", "II", "III", "IV", "V"][i] || String(i + 1)) + ".",
            text: it.text || "",
          };
        }),
        useMulti: true,
      };
    }

    const freeText = items.length === 1 ? items[0].text : raw;
    return { freeText: freeText, multiRows: [], useMulti: false };
  }

  function enhancedEditorHtml(q, prefix, opts) {
    opts = opts || {};
    const questionText =
      typeof q.question === "object" ? q.question.text || "" : q.question || "";
    const questionInfo =
      typeof q.question === "object" ? q.question.info || "" : q.info || "";
    const infoItems =
      typeof q.question === "object" && Array.isArray(q.question.infoItems)
        ? q.question.infoItems
        : Array.isArray(q.infoItems)
          ? q.infoItems
          : null;

    const preamble = splitPreambleForEdit(questionInfo, infoItems);
    const multiHidden = preamble.useMulti ? "" : ' hidden style="display:none"';

    const optionsBlock =
      '<div class="q-editor-options">' +
      '<label class="q-field-label">Doğru cevap</label>' +
      '<input class="q-field-input" id="' +
      prefix +
      '_correct" type="text" value="' +
      escAttr(q.correct || "") +
      '" placeholder="Doğru şık metni">' +
      '<label class="q-field-label">Yanlış şık 1</label>' +
      '<input class="q-field-input" id="' +
      prefix +
      '_wrong1" type="text" value="' +
      escAttr(q.wrong1 || "") +
      '">' +
      '<label class="q-field-label">Yanlış şık 2</label>' +
      '<input class="q-field-input" id="' +
      prefix +
      '_wrong2" type="text" value="' +
      escAttr(q.wrong2 || "") +
      '">' +
      (opts.wrong3
        ? '<label class="q-field-label">Yanlış şık 3</label><input class="q-field-input" id="' +
          prefix +
          '_wrong3" type="text" value="' +
          escAttr(q.wrong3 || "") +
          '">'
        : "") +
      (opts.subject
        ? '<label class="q-field-label">Ders etiketi</label><input class="q-field-input" id="' +
          prefix +
          '_subject" type="text" value="' +
          escAttr(q.subject || "") +
          '" placeholder="MATEMATİK">'
        : "") +
      "</div>";

    return (
      '<div class="q-editor-root" data-prefix="' +
      escAttr(prefix) +
      '">' +
      '<div class="q-editor-math-bar">' +
      '<span class="q-editor-math-bar__title">Kesir ekle</span>' +
      '<div class="q-math-toolbar q-math-toolbar--global">' +
      '<button type="button" class="btn small q-insert-frac" data-num="1" data-den="2">½</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="1" data-den="3">⅓</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="1" data-den="4">¼</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="2" data-den="3">⅔</button>' +
      '<button type="button" class="btn small q-insert-frac" data-num="3" data-den="4">¾</button>' +
      '<button type="button" class="btn small q-insert-frac-custom">Özel…</button>' +
      "</div>" +
      '<p class="q-editor-hint q-editor-hint--inline">İmlecin olduğu kutuya eklenir. Yazım: <code>[[1/3]]</code></p>' +
      "</div>" +
      '<div class="q-editor-columns">' +
      '<div class="q-editor-col q-editor-col--main">' +
      '<section class="q-editor-section">' +
      '<label class="q-field-label" for="' +
      prefix +
      '_text">Soru metni</label>' +
      '<textarea class="q-field-textarea q-field-textarea--stem" id="' +
      prefix +
      '_text" rows="3" placeholder="Öğrencinin cevaplayacağı asıl soru…">' +
      escAttr(questionText) +
      "</textarea>" +
      "</section>" +
      '<section class="q-editor-section q-editor-section--preamble">' +
      '<label class="q-field-label" for="' +
      prefix +
      '_info_free">Öncül / açıklayıcı metin <span class="q-optional">(isteğe bağlı)</span></label>' +
      '<textarea class="q-field-textarea" id="' +
      prefix +
      '_info_free" rows="4" placeholder="Paragraf, kısa metin veya yönerge yazabilirsiniz. Boş bırakırsanız öncül gösterilmez.">' +
      escAttr(preamble.freeText) +
      "</textarea>" +
      '<button type="button" class="btn small q-toggle-multi" id="' +
      prefix +
      '_toggle_multi">' +
      (preamble.useMulti ? "Madde listesini gizle" : "Madde madde yaz (I., II., …)") +
      "</button>" +
      '<div class="q-info-multi" id="' +
      prefix +
      '_info_multi"' +
      multiHidden +
      ">" +
      '<p class="q-editor-hint">Sınav sorularındaki gibi her madde ayrı kutuda görünür.</p>' +
      '<div class="q-info-items" id="' +
      prefix +
      '_info_items">' +
      buildMultiRowsHtml(preamble.multiRows) +
      "</div>" +
      '<button type="button" class="btn small" id="' +
      prefix +
      '_add_info">+ Madde ekle</button>' +
      "</div>" +
      "</section>" +
      (opts.explanation !== false
        ? '<section class="q-editor-section">' +
          '<label class="q-field-label" for="' +
          prefix +
          '_exp">Açıklama <span class="q-optional">(isteğe bağlı)</span></label>' +
          '<textarea class="q-field-textarea" id="' +
          prefix +
          '_exp" rows="2" placeholder="Yanlış cevaptan sonra gösterilebilir…">' +
          escAttr(q.explanation || "") +
          "</textarea></section>"
        : "") +
      "</div>" +
      '<div class="q-editor-col q-editor-col--side">' +
      optionsBlock +
      '<section class="q-editor-section q-editor-section--preview">' +
      '<div class="q-live-preview" id="' +
      prefix +
      '_preview">' +
      '<div class="q-live-preview__title">Öğrenci önizlemesi</div>' +
      '<div class="q-live-preview__body"></div>' +
      "</div></section>" +
      "</div></div></div>"
    );
  }

  function buildMultiRowsHtml(rows) {
    if (!rows || !rows.length) return "";
    return rows
      .map(function (row, i) {
        return (
          '<div class="q-info-item-row" data-idx="' +
          i +
          '">' +
          '<span class="q-info-item-label">' +
          escAttr(row.label) +
          "</span>" +
          '<textarea class="q-info-item-text" rows="2" placeholder="Madde metni…">' +
          escAttr(row.text) +
          "</textarea>" +
          '<button type="button" class="btn small err q-info-del" title="Sil">✕</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function nextRomanLabel(count) {
    const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return (romans[count] || String(count + 1)) + ".";
  }

  function readMultiItems(dlg, prefix) {
    const list = dlg.querySelector("#" + prefix + "_info_items");
    if (!list) return [];
    return Array.from(list.querySelectorAll(".q-info-item-row"))
      .map(function (row) {
        const label = row.querySelector(".q-info-item-label");
        const ta = row.querySelector(".q-info-item-text");
        const text = (ta && ta.value.trim()) || "";
        if (!text) return null;
        return { label: (label && label.textContent.trim()) || "", text: text };
      })
      .filter(Boolean);
  }

  function readPreambleFromForm(dlg, prefix) {
    const mq = NQM();
    const multiEl = dlg.querySelector("#" + prefix + "_info_multi");
    const multiVisible = multiEl && multiEl.style.display !== "none" && !multiEl.hidden;
    const freeEl = dlg.querySelector("#" + prefix + "_info_free");
    const freeText = freeEl ? freeEl.value.trim() : "";

    if (multiVisible) {
      const items = readMultiItems(dlg, prefix);
      if (items.length) {
        const infoItems = items.map(function (it) {
          return (it.label ? it.label + " " : "") + it.text;
        });
        const info = mq ? mq.serializePreambleItems(items) : infoItems.join("\n\n");
        return { info: info, infoItems: infoItems };
      }
    }

    if (freeText) {
      return { info: freeText, infoItems: null };
    }
    return { info: null, infoItems: null };
  }

  function readQuestionPayload(dlg, prefix, opts) {
    opts = opts || {};
    const preamble = readPreambleFromForm(dlg, prefix);

    const payload = {
      question: {
        text: (dlg.querySelector("#" + prefix + "_text") || {}).value.trim(),
        info: preamble.info,
        infoItems: preamble.infoItems,
      },
      correct: (dlg.querySelector("#" + prefix + "_correct") || {}).value.trim(),
      wrong1: (dlg.querySelector("#" + prefix + "_wrong1") || {}).value.trim(),
      wrong2: (dlg.querySelector("#" + prefix + "_wrong2") || {}).value.trim(),
    };

    if (opts.wrong3) {
      payload.wrong3 = (dlg.querySelector("#" + prefix + "_wrong3") || {}).value.trim();
    }
    if (opts.explanation !== false) {
      payload.explanation =
        (dlg.querySelector("#" + prefix + "_exp") || {}).value.trim() || null;
    }
    if (opts.subject) {
      payload.subject =
        (dlg.querySelector("#" + prefix + "_subject") || {}).value.trim() || "GENEL";
    }
    return payload;
  }

  function updatePreview(dlg, prefix) {
    const mq = NQM();
    const box = dlg.querySelector("#" + prefix + "_preview .q-live-preview__body");
    if (!mq || !box) return;

    const preamble = readPreambleFromForm(dlg, prefix);
    const stem = (dlg.querySelector("#" + prefix + "_text") || {}).value || "";

    let html = "";
    if (preamble.info) {
      html += mq.preambleHtml(preamble.info, preamble.infoItems);
      html +=
        '<div class="question-divider" style="height:1px;background:#cbd5e1;margin:12px 0"></div>';
    }
    html +=
      '<div class="question-actual-text q-markup" style="font-weight:700">' +
      mq.renderMarkupHtml(stem) +
      "</div>";
    box.innerHTML =
      html || '<span class="q-preview-empty">Önizleme için soru metni yazın…</span>';
  }

  function wireEditor(dlg, prefix, opts) {
    opts = opts || {};
    const mq = NQM();
    if (!mq) return;

    function activeField() {
      return (
        dlg.querySelector(".q-field-focus") ||
        dlg.querySelector("#" + prefix + "_text")
      );
    }

    dlg.querySelectorAll("textarea, input.q-field-input").forEach(function (el) {
      el.addEventListener("focus", function () {
        dlg.querySelectorAll(".q-field-focus").forEach(function (x) {
          x.classList.remove("q-field-focus");
        });
        el.classList.add("q-field-focus");
      });
      el.addEventListener("input", function () {
        updatePreview(dlg, prefix);
      });
    });

    dlg.querySelectorAll(".q-insert-frac").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mq.insertFraction(
          activeField(),
          btn.getAttribute("data-num"),
          btn.getAttribute("data-den")
        );
        updatePreview(dlg, prefix);
      });
    });

    const custom = dlg.querySelector(".q-insert-frac-custom");
    if (custom) {
      custom.addEventListener("click", function () {
        const a = prompt("Pay (üstteki sayı):", "1");
        if (a == null) return;
        const b = prompt("Payda (alttaki sayı):", "3");
        if (b == null) return;
        if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || Number(b) === 0) {
          alert("Geçerli pozitif tam sayı girin.");
          return;
        }
        mq.insertFraction(activeField(), a, b);
        updatePreview(dlg, prefix);
      });
    }

    const multiPanel = dlg.querySelector("#" + prefix + "_info_multi");
    const toggleBtn = dlg.querySelector("#" + prefix + "_toggle_multi");
    const list = dlg.querySelector("#" + prefix + "_info_items");
    const addBtn = dlg.querySelector("#" + prefix + "_add_info");

    function showMulti(show) {
      if (!multiPanel || !toggleBtn) return;
      if (show) {
        multiPanel.hidden = false;
        multiPanel.style.display = "";
        toggleBtn.textContent = "Madde listesini gizle";
        if (list && !list.querySelector(".q-info-item-row")) {
          addEmptyRow();
        }
      } else {
        multiPanel.hidden = true;
        multiPanel.style.display = "none";
        toggleBtn.textContent = "Madde madde yaz (I., II., …)";
      }
      updatePreview(dlg, prefix);
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        const isOpen = multiPanel && !multiPanel.hidden;
        showMulti(!isOpen);
      });
    }

    function renumberLabels() {
      if (!list) return;
      Array.from(list.querySelectorAll(".q-info-item-row")).forEach(function (row, i) {
        const lab = row.querySelector(".q-info-item-label");
        if (lab) lab.textContent = nextRomanLabel(i);
      });
    }

    function wireInfoRow(row) {
      const del = row.querySelector(".q-info-del");
      const ta = row.querySelector(".q-info-item-text");
      if (ta) {
        ta.addEventListener("input", function () {
          updatePreview(dlg, prefix);
        });
      }
      if (del) {
        del.addEventListener("click", function () {
          row.remove();
          renumberLabels();
          updatePreview(dlg, prefix);
        });
      }
    }

    function addEmptyRow() {
      if (!list) return;
      const i = list.querySelectorAll(".q-info-item-row").length;
      const row = document.createElement("div");
      row.className = "q-info-item-row";
      row.innerHTML =
        '<span class="q-info-item-label">' +
        nextRomanLabel(i) +
        '</span><textarea class="q-info-item-text" rows="2" placeholder="Madde metni…"></textarea>' +
        '<button type="button" class="btn small err q-info-del" title="Sil">✕</button>';
      list.appendChild(row);
      wireInfoRow(row);
      renumberLabels();
    }

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        addEmptyRow();
        updatePreview(dlg, prefix);
      });
    }

    if (list) {
      list.querySelectorAll(".q-info-item-row").forEach(wireInfoRow);
    }

    updatePreview(dlg, prefix);
  }

  global.NovaAdminQuestionEditor = {
    enhancedEditorHtml: enhancedEditorHtml,
    wireEditor: wireEditor,
    readQuestionPayload: readQuestionPayload,
  };
})(typeof window !== "undefined" ? window : globalThis);
